import * as Matter from 'matter-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CollisionEvent = Matter.IEventCollision<Matter.Engine>;
export type CollisionCallback = (event: CollisionEvent) => void;

// ─── PhysicsEngine ────────────────────────────────────────────────────────────

/**
 * Wraps Matter.js Engine + World, exposing a clean, scalable API.
 * Simulation-agnostic — no hardcoded bodies or scenarios.
 */
export class PhysicsEngine {
  private readonly engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create({
      // gravity scale is 0: GravitySystem owns all gravity — prevents world gravity
      // from leaking into orbital mode and disrupting circular orbits
      gravity: { x: 0, y: 1, scale: 0 },
    });
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getWorld(): Matter.World {
    return this.engine.world;
  }

  // ── Step ──────────────────────────────────────────────────────────────────

  /** Advance the simulation by deltaTime (ms). */
  step(deltaTime: number): void {
    Matter.Engine.update(this.engine, deltaTime);
  }

  // ── Body management ───────────────────────────────────────────────────────

  addBodies(bodies: Matter.Body | Matter.Body[]): void {
    Matter.Composite.add(this.engine.world, bodies);
  }

  removeBodies(bodies: Matter.Body | Matter.Body[]): void {
    const list = Array.isArray(bodies) ? bodies : [bodies];
    list.forEach((b) => Matter.Composite.remove(this.engine.world, b));
  }

  // ── Constraint management ─────────────────────────────────────────────────

  addConstraints(constraints: Matter.Constraint | Matter.Constraint[]): void {
    Matter.Composite.add(this.engine.world, constraints);
  }

  removeConstraints(constraints: Matter.Constraint | Matter.Constraint[]): void {
    const list = Array.isArray(constraints) ? constraints : [constraints];
    list.forEach((c) => Matter.Composite.remove(this.engine.world, c));
  }

  // ── Gravity ───────────────────────────────────────────────────────────────

  setGravity(y: number, x = 0): void {
    this.engine.gravity.x = x;
    this.engine.gravity.y = y;
  }

  // ── Collision hooks (future-ready) ────────────────────────────────────────

  onCollisionStart(cb: CollisionCallback): void {
    Matter.Events.on(this.engine, 'collisionStart', cb);
  }

  onCollisionActive(cb: CollisionCallback): void {
    Matter.Events.on(this.engine, 'collisionActive', cb);
  }

  onCollisionEnd(cb: CollisionCallback): void {
    Matter.Events.on(this.engine, 'collisionEnd', cb);
  }

  offCollisionStart(cb: CollisionCallback): void {
    Matter.Events.off(this.engine, 'collisionStart', cb);
  }

  offCollisionEnd(cb: CollisionCallback): void {
    Matter.Events.off(this.engine, 'collisionEnd', cb);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Remove all bodies/constraints and reset timing. */
  clear(keepStatics = false): void {
    Matter.World.clear(this.engine.world, keepStatics);
    this.engine.timing.timestamp = 0;
  }

  reset(): void {
    this.clear(false);
    // NOTE: Do NOT restore gravity here — GravitySystem owns gravity state
    // and will apply the correct mode (linear or radial) on the next step.
  }
}
