import * as Matter from 'matter-js';
import type { GravityMode, GravityConfig } from './gravity.types';
import { LinearGravity } from './linearGravity';
import { RadialGravity } from './radialGravity';

/**
 * GravitySystem
 * The central orchestrator for the sandbox gravity physics runtime.
 * Manages switching between linear (standard downward Matter.js gravity) and
 * custom radial (orbital mechanics, Newton's law gravity) modes seamlessly.
 *
 * Exposes a unified API to configure, update, and visualize active physics elements.
 */
export class GravitySystem {
  private mode: GravityMode = 'linear';
  private readonly engine: Matter.Engine;
  private readonly linearGravity: LinearGravity;
  private readonly radialGravity: RadialGravity;

  constructor(engine: Matter.Engine, config: Partial<GravityConfig> = {}) {
    this.engine = engine;
    this.linearGravity = new LinearGravity(engine);
    this.radialGravity = new RadialGravity(config);

    // Initialize in the configured gravity mode
    this.setMode(config.mode ?? 'linear');
  }

  /**
   * Switches the active gravity mode dynamically.
   * Ensures that Matter.js gravity vectors are completely zeroed out when in radial mode.
   */
  setMode(mode: GravityMode): void {
    this.mode = mode;
    if (mode === 'linear') {
      this.linearGravity.enable();
      this.linearGravity.update();
    } else if (mode === 'radial') {
      // Zero out Matter.js native gravity to prevent interference with custom forces
      this.linearGravity.disable();
    }
  }

  /**
   * Retrieves the currently active gravity mode.
   */
  getMode(): GravityMode {
    return this.mode;
  }

  /**
   * Returns the linear gravity sub-system wrapper.
   */
  getLinearGravity(): LinearGravity {
    return this.linearGravity;
  }

  /**
   * Returns the custom radial gravity engine.
   */
  getRadialGravity(): RadialGravity {
    return this.radialGravity;
  }

  /**
   * Central entry point called every step tick inside the Sandbox loop.
   * Synchronizes or applies correct force vectors based on active mode.
   */
  update(delta: number): void {
    if (this.mode === 'linear') {
      this.linearGravity.update();
    } else if (this.mode === 'radial') {
      // Ensure Matter.js built-in gravity is disabled
      this.linearGravity.disable();
      // Auto-sync active bodies from the engine's world before calculations
      this.radialGravity.syncBodiesFromWorld(this.engine.world);
      // Run custom per-body force accumulation loop
      this.radialGravity.update(delta);
    }
  }

  /**
   * Unified debug visualization callback.
   * Delegated down to radial rendering overlays in orbital mode.
   */
  drawDebug(graphics: any): void {
    if (this.mode === 'radial') {
      this.radialGravity.drawDebug(graphics);
    }
  }
}
