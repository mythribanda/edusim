import * as PIXI from 'pixi.js';
import type { SandboxRuntime } from '../engine/runtime';

/**
 * GravityRenderer
 * Pluggable rendering engine for gravity diagnostics.
 * Draws custom orbital trajectories, force vectors, and gravity zones using
 * high-performance PixiJS v8 graphics methods.
 *
 * Operates in its own requestAnimationFrame loop so debug visuals remain fluid
 * and crisp even when the physics simulation state is paused.
 */
export class GravityRenderer {
  private readonly runtime: SandboxRuntime;
  private readonly graphics: PIXI.Graphics;
  private active = false;
  private rafId: number | null = null;

  constructor(runtime: SandboxRuntime) {
    this.runtime = runtime;
    this.graphics = new PIXI.Graphics();
    (this.graphics as any)._isGravityOverlay = true; // prevent cleanup by buildScene
    this.graphics.zIndex = 95; // render on top of shapes, just below constraints (100)
  }

  /**
   * Attaches the graphics context to the viewport and starts the rendering loop.
   */
  enable(): void {
    if (this.active) return;
    this.active = true;

    const vp = this.runtime.renderer.getViewport();
    vp.addChild(this.graphics);
    vp.sortChildren();

    const loop = () => {
      if (!this.active) return;
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Stops rendering and detaches the graphics canvas.
   */
  disable(): void {
    if (!this.active) return;
    this.active = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.graphics.parent?.removeChild(this.graphics);
    this.graphics.clear();
  }

  /**
   * Cleans up all memory and graphics nodes.
   */
  destroy(): void {
    this.disable();
    this.graphics.destroy();
  }

  private draw(): void {
    this.graphics.clear();
    // Render debug shapes using the core gravity system's active debug configurations
    this.runtime.gravitySystem.drawDebug(this.graphics);
  }
}
