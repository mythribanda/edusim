/**
 * LLM Simulation Generation Service
 * Handles communication with backend AI service
 */

import { SimulationConfig, validateSimulationConfig } from "@/types/simulation";
import { fetchJsonWithRetry, logApiEvent } from "@/services/apiClient";
import { joinUrl } from "@/utils/urlUtils";
import { getApiUrl } from "@/config/api";

export interface GenerateSimulationRequest {
  prompt: string;
  educational_context?: string;
}

export interface GenerateSimulationResponse {
  success: boolean;
  simulation?: SimulationConfig;
  error?: string;
  reasoning?: string;
}

class SimulationGeneratorService {
  private apiBaseUrl: string;
  private cache = new Map<string, GenerateSimulationResponse>();
  private readonly cacheStorageKey = "edusim.simulation-generator-cache";

  constructor() {
    // Get API base URL from central config
    this.apiBaseUrl = getApiUrl("");
    this.loadCacheFromStorage();
  }

  private normalizeKey(prompt: string, educationalContext?: string): string {
    return `${prompt.trim().toLowerCase()}::${(educationalContext || "").trim().toLowerCase()}`;
  }

  private loadCacheFromStorage() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.cacheStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, GenerateSimulationResponse>;
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value === "object") {
          this.cache.set(key, value);
        }
      }
    } catch {
      // Ignore storage read failures.
    }
  }

  private persistCacheToStorage() {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const serialized = JSON.stringify(Object.fromEntries(this.cache.entries()));
      window.localStorage.setItem(this.cacheStorageKey, serialized);
    } catch {
      // Ignore storage write failures.
    }
  }

  /**
   * Generate simulation from natural language prompt
   */
  async generateSimulation(
    prompt: string,
    educationalContext?: string,
    signal?: AbortSignal,
  ): Promise<GenerateSimulationResponse> {
    try {
      const cacheKey = this.normalizeKey(prompt, educationalContext);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logApiEvent("simulationGenerator", "cache hit", { cacheKey });
        return cached;
      }

      const request: GenerateSimulationRequest = {
        prompt,
        educational_context: educationalContext,
      };

      const data = await fetchJsonWithRetry<{ success?: boolean; simulation?: SimulationConfig; scene?: any; config?: any; reasoning?: string; detail?: string }>(
        joinUrl(this.apiBaseUrl, "/api/generate"),
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal,
        timeoutMs: 45000,
        retries: 2,
        retryDelayMs: 600,
        scope: "simulationGenerator",
      },
      );

      // Extract and transform simulation data from backend response to match frontend expectations
      const backendScene = data.scene || data.config?.scene || data.simulation || data.config;
      let simulationConfig: any = null;

      if (backendScene) {
        // Transform backend format to frontend SimulationConfig format
        simulationConfig = {
          title: backendScene.title || '',
          description: backendScene.description || '',
          environment: {
            width: backendScene.environment?.world?.width || 800,
            height: backendScene.environment?.world?.height || 600,
            gravity: backendScene.environment?.gravity?.y || 9.8, // Use y-component of gravity
            airResistance: backendScene.environment?.airResistance || 0.005,
            timeScale: backendScene.environment?.timeScale || 1
          },
          objects: (backendScene.objects || []).map((obj: any) => ({
            id: obj.id || '',
            type: obj.type || '',
            position: [obj.position?.x || 0, obj.position?.y || 0],
            velocity: obj.velocity ? [obj.velocity?.x || 0, obj.velocity?.y || 0] : undefined,
            mass: obj.physics?.mass || obj.mass,
            radius: obj.shape?.type === 'circle' ? obj.shape?.radius : undefined,
            width: obj.shape?.type === 'rectangle' ? obj.shape?.width : undefined,
            height: obj.shape?.type === 'rectangle' ? obj.shape?.height : undefined,
            angle: obj.rotation || 0,
            physics: {
              static: obj.physics?.isStatic || false,
              restitution: obj.material?.restitution || 0,
              bounce: obj.material?.restitution > 0
            }
          }))
        };
      }

      // Validate the transformed simulation config
      if (!simulationConfig || !validateSimulationConfig(simulationConfig)) {
        return {
          success: false,
          error: "Invalid simulation configuration returned from API",
          reasoning: data.reasoning,
        };
      }

      this.cache.set(cacheKey, {
        success: true,
        simulation: simulationConfig,
        reasoning: data.reasoning,
      });
      this.persistCacheToStorage();
      logApiEvent("simulationGenerator", "request success", { cacheKey });

      return {
        success: true,
        simulation: simulationConfig,
        reasoning: data.reasoning,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          success: false,
          error: "Request cancelled",
        };
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[simulationGenerator] request failure", { errorMessage });
      return {
        success: false,
        error: `Failed to generate simulation: ${errorMessage}`,
      };
    }
  }

  /**
   * Validate simulation config on the backend
   */
  async validateSimulation(
    config: SimulationConfig,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/validate-simulation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        return { valid: false, errors: ["Validation request failed"] };
      }

      return response.json();
    } catch (error) {
      return { valid: false, errors: ["Validation service unavailable"] };
    }
  }

  /**
   * Get example prompts and simulations
   */
  async getExamples(): Promise<
    {
      prompt: string;
      description: string;
    }[]
  > {
    return [
      {
        prompt: "Create a solar system with a sun and 3 planets orbiting",
        description: "Orbital mechanics simulation",
      },
      {
        prompt: "Show 3 red balls bouncing with low gravity",
        description: "Bouncing balls in low gravity",
      },
      {
        prompt: "Create a pendulum on the moon",
        description: "Pendulum motion with lunar gravity",
      },
      {
        prompt: "Simulate projectile motion with initial velocity 20m/s at 45 degrees",
        description: "Classic projectile motion",
      },
      {
        prompt: "Show a spring-mass system oscillating",
        description: "Spring oscillation",
      },
      {
        prompt: "Create a wave in water",
        description: "Wave simulation",
      },
    ];
  }
}

// Export singleton instance
export const simulationGenerator = new SimulationGeneratorService();

export default simulationGenerator;
