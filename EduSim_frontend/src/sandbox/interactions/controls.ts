import type * as Matter from 'matter-js';
import type { SandboxRuntime } from '../engine/runtime';

// ─── RuntimeControls ─────────────────────────────────────────────────────────

/**
 * Bridges UI panels and runtime systems — no direct DOM manipulation.
 *
 * Every method is pure API: callers (React components, keyboard handlers,
 * AI tutors, etc.) invoke these and the internal runtime state updates.
 *
 * Coupling is intentionally one-directional:
 *   UI  →  RuntimeControls  →  PhysicsEngine / SandboxRuntime
 *
 * Future additions:
 *   - setAllFriction(value)          applied to all dynamic bodies
 *   - setBodyMass(id, mass)          per-object overrides
 *   - applyImpulse(id, force)        programmatic force application
 *   - setAirResistance(value)        engine-level frictionAir global
 */
export class RuntimeControls {
  private readonly runtime: SandboxRuntime;

  constructor(runtime: SandboxRuntime) {
    this.runtime = runtime;
  }

  // ── Gravity ───────────────────────────────────────────────────────────────

  /** Set world gravity. `y` positive = downward. */
  setGravity(y: number, x = 0): void {
    this.runtime.gravitySystem.getLinearGravity().setGravity(x, y);
  }

  /** Preset shorthand methods for common educational scenarios. */
  setGravityEarth():   void { this.setGravity(1);    }
  setGravityMoon():    void { this.setGravity(0.16); }
  setGravityJupiter(): void { this.setGravity(2.53); }
  setZeroGravity():    void { this.setGravity(0);    }

  // ── Simulation speed ──────────────────────────────────────────────────────

  /**
   * Scale the simulation time. 1 = real-time, 0.5 = half speed, 2 = double.
   * Clamped to [0, 10] to prevent physics instability.
   */
  setSimulationSpeed(scale: number): void {
    const engine = this.runtime.physics.getEngine();
    engine.timing.timeScale = Math.max(0, Math.min(scale, 10));
  }

  getSimulationSpeed(): number {
    return this.runtime.physics.getEngine().timing.timeScale;
  }

  // ── Restitution (bounciness) ───────────────────────────────────────────────

  /**
   * Apply a restitution value to a specific set of bodies.
   * Restitution is a per-body property in Matter.js — there is no global setting.
   *
   * @param bodies  The bodies to update. Pass `runtime.physics.getWorld().bodies`
   *                to update all dynamic bodies at once.
   * @param value   Bounciness in range [0, 1]. 0 = no bounce, 1 = perfect elastic.
   */
  setRestitution(bodies: Matter.Body[], value: number): void {
    const clamped = Math.max(0, Math.min(value, 1));
    bodies.forEach((b) => { b.restitution = clamped; });
  }

  /**
   * Apply a friction value to a specific set of bodies.
   *
   * @param bodies  Bodies to update.
   * @param value   Friction coefficient, typically [0, 1]. 0 = frictionless ice.
   */
  setFriction(bodies: Matter.Body[], value: number): void {
    const clamped = Math.max(0, value);
    bodies.forEach((b) => { b.friction = clamped; });
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  pause():  void { this.runtime.pause(); }
  resume(): void { this.runtime.resume(); }
  reset():  void { this.runtime.reset(); }

  getState() { return this.runtime.getState(); }
}
