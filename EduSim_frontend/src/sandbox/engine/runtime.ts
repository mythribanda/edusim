import { PhysicsEngine } from './physics';
import { PixiRenderer } from './renderer';
import { SyncRegistry } from './sync';
import { GravitySystem } from '../gravity/gravitySystem';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RuntimeState = 'idle' | 'running' | 'paused' | 'destroyed';

/** Pluggable hook pair — register to extend the loop without touching core. */
export interface RuntimeHook {
  id: string;
  beforeStep?: (dt: number) => void;
  afterStep?: (dt: number) => void;
}

// ─── SandboxRuntime ───────────────────────────────────────────────────────────

/**
 * Central orchestrator.  Owns the physics engine, PixiJS renderer, and sync
 * registry.  Drives the requestAnimationFrame game-loop and dispatches hooks.
 *
 * Lifecycle:
 *   const rt = new SandboxRuntime()
 *   await rt.init(containerEl)
 *   rt.start()
 *   // … later …
 *   rt.destroy()
 */
export class SandboxRuntime {
  // Public so simulation code can reach sub-systems directly
  readonly physics = new PhysicsEngine();
  readonly renderer = new PixiRenderer();
  readonly sync = new SyncRegistry();
  readonly gravitySystem = new GravitySystem(this.physics.getEngine());

  private state: RuntimeState = 'idle';
  private rafId: number | null = null;
  private lastTs: number = 0;
  private accumulator = 0;
  private readonly hooks = new Map<string, RuntimeHook>();

  constructor() {
    // Add automatic high-performance gravity update hook before each physics step
    this.addHook({
      id: 'gravity-system-hook',
      beforeStep: (dt) => {
        this.gravitySystem.update(dt);
      },
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  async init(container: HTMLElement): Promise<void> {
    if (this.state !== 'idle') {
      console.warn('[SandboxRuntime] init() called on a non-idle runtime — ignored.');
      return;
    }
    await this.renderer.init(container);
    this.state = 'paused';   // ready but not looping
  }

  // ── Loop control ──────────────────────────────────────────────────────────

  start(): void {
    if (this.state === 'running') return;
    if (this.state === 'destroyed') throw new Error('[SandboxRuntime] Cannot start a destroyed runtime.');
    this.state = 'running';
    this.lastTs = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    if (this.state !== 'running') return;
    this.state = 'paused';
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.start();
  }

  // ── Hooks (drag, observables, constraints, etc.) ──────────────────────────

  addHook(hook: RuntimeHook): void { this.hooks.set(hook.id, hook); }
  removeHook(id: string): void { this.hooks.delete(id); }

  // ── Simulation control ────────────────────────────────────────────────────

  reset(): void {
    this.pause();
    this.physics.reset();
    this.sync.clear();
    this.accumulator = 0;

    const vp = this.renderer.getViewport();
    vp.removeChildren();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  destroy(): void {
    this.pause();
    this.hooks.clear();
    this.physics.clear();
    this.sync.clear();
    this.renderer.destroy();
    this.state = 'destroyed';
  }

  getState(): RuntimeState { return this.state; }

  // ── Core loop ─────────────────────────────────────────────────────────────

  private readonly loop = (ts: number): void => {
    if (this.state !== 'running') return;

    // Cap delta to 100 ms — prevents physics explosion on tab-unfocus
    const dt = Math.min(ts - this.lastTs, 100);
    this.lastTs = ts;

    // Fixed timestep accumulator to prevent orbital velocity decay and numerical drift
    this.accumulator += dt;
    const fixedTimeStep = 16.67;
    let stepsRun = 0;

    // Limit maximum steps per frame to avoid "spiral of death" during extreme lag spikes
    while (this.accumulator >= fixedTimeStep && stepsRun < 5) {
      // 1. beforeStep hooks (gravity, drag forces, user input, etc.)
      this.hooks.forEach((h) => h.beforeStep?.(fixedTimeStep));

      // 2. Physics step
      this.physics.step(fixedTimeStep);

      this.accumulator -= fixedTimeStep;
      stepsRun++;
    }

    // 3. Sync sprites → physics positions
    this.sync.flush();

    // 4. afterStep hooks (observables, telemetry, etc.)
    this.hooks.forEach((h) => h.afterStep?.(dt));

    this.rafId = requestAnimationFrame(this.loop);
  };
}
