import type { SimulationDSL } from "@/types/simulation";
import { buildEnhancedPrompt, analyzeSimulationPrompt } from "@/services/simulationPromptIntelligence";
import { getApiUrl } from "@/config/api";
import { fetchJsonWithRetry, logApiEvent } from "@/services/apiClient";
import { joinUrl } from "@/utils/urlUtils";

export interface SimulationSourceRef {
  source: string;
  page: number | string;
}

export interface SynthesizedSimulation {
  id: string;
  title: string;
  description: string;
  formula: string;
  sources: SimulationSourceRef[];
  topic: string;
  prompt: string;
  timestamp: string;
  html?: string;
  dsl?: SimulationDSL;
  subject?: string;
  formula_explanation?: string;
  intent?: {
    simulation_type: string;
    label: string;
    confidence: number;
    keywords: string[];
  };
}

interface GenerateResponse extends SynthesizedSimulation {
  success: boolean;
}

interface ListResponse {
  success: boolean;
  items: SynthesizedSimulation[];
}

interface GetResponse extends SynthesizedSimulation {
  success: boolean;
}

export interface StreamProgress {
  stage?: string;
  phase?: string;
  state?: string;
  progress?: number;
  id?: string;
  content?: string;
  error?: string;
  type?: string;
}

type StreamCallback = (progress: StreamProgress) => void;
type StreamCompleteCallback = (simulation: SynthesizedSimulation) => void;

class SimulationSynthesisService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiUrl("");
  }

  async generate(prompt: string, topic?: string): Promise<SynthesizedSimulation> {
    const enriched = buildEnhancedPrompt(prompt, topic);
    const data = await fetchJsonWithRetry<GenerateResponse | { detail?: string }>(joinUrl(this.apiBaseUrl, "/api/simulations/synthesis/generate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enriched.enhancedPrompt,
        topic: topic || enriched.analysis.title,
        intent: enriched.analysis,
      }),
      timeoutMs: 45000,
      retries: 2,
      retryDelayMs: 600,
      scope: "simulationSynthesisService",
    });

    return data as SynthesizedSimulation;
  }

  async list(limit = 30): Promise<SynthesizedSimulation[]> {
    const data = await fetchJsonWithRetry<ListResponse | { detail?: string }>(
      joinUrl(this.apiBaseUrl, `/api/simulations/synthesis/list?limit=${limit}`),
      {
        timeoutMs: 15000,
        retries: 1,
        scope: "simulationSynthesisService",
      },
    );

    return (data as ListResponse).items;
  }

  async getById(id: string): Promise<SynthesizedSimulation> {
    const data = await fetchJsonWithRetry<GetResponse | { detail?: string }>(
      joinUrl(this.apiBaseUrl, `/api/simulations/synthesis/${id}`),
      {
        timeoutMs: 15000,
        retries: 1,
        scope: "simulationSynthesisService",
      },
    );

    return data as SynthesizedSimulation;
  }

  getExportUrl(id: string): string {
    return joinUrl(this.apiBaseUrl, `/api/simulations/synthesis/${id}/export`);
  }

  async generateStream(
    prompt: string,
    onProgress: StreamCallback,
    onComplete: StreamCompleteCallback,
    topic?: string,
  ): Promise<void> {
    const enriched = buildEnhancedPrompt(prompt, topic);
    const response = await fetch(joinUrl(this.apiBaseUrl, "/api/simulations/synthesis/generate-stream"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enriched.enhancedPrompt,
        topic: topic || enriched.analysis.title,
        intent: enriched.analysis,
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to start streaming generation");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith("event:")) {
            const eventType = line.replace("event:", "").trim();
            const dataLine = lines[++i];
            if (dataLine?.startsWith("data:")) {
              const dataStr = dataLine.replace("data:", "").trim();
              try {
                const data = JSON.parse(dataStr);

                if (eventType === "progress" || eventType === "started" || eventType === "runtime_state_changed" || eventType === "generation_delta") {
                  onProgress(data as StreamProgress);
                } else if (eventType === "complete") {
                  onComplete(data as SynthesizedSimulation);
                } else if (eventType === "error") {
                  onProgress(data as StreamProgress);
                }
              } catch (e) {
                console.error("[simulationSynthesisService] Failed to parse SSE data:", dataStr);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const simulationSynthesisService = new SimulationSynthesisService();

export { analyzeSimulationPrompt, buildEnhancedPrompt };
