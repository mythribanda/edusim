import type { RuntimeConstraint } from './constraintFactory';
import type { PhysicsEngine }     from '../engine/physics';
import type { RuntimeStore }      from '../state/runtimeStore';

// ─── ConstraintRegistry ───────────────────────────────────────────────────────

/**
 * Tracks active RuntimeConstraints.
 *
 * Provides a thin coordination layer between the factory and the physics world:
 *   1. add()    — registers + immediately adds to physics world
 *   2. remove() — de-registers + immediately removes from physics world
 *   3. clear()  — full teardown (called on scene reset / runtime destroy)
 *
 * Architecture notes:
 *   - Zero PixiJS dependency — purely physics-side.
 *   - Each constraint retains its id so observables / editors can target it.
 *   - Prepared for future serialization: getAll() returns plain array.
 */
export class ConstraintRegistry {
  private readonly store = new Map<string, RuntimeConstraint>();
  private readonly physics: PhysicsEngine;
  private readonly runtimeStore?: RuntimeStore;

  constructor(physics: PhysicsEngine, runtimeStore?: RuntimeStore) {
    this.physics = physics;
    this.runtimeStore = runtimeStore;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** Register and add to the physics world in one call. */
  add(rc: RuntimeConstraint): void {
    if (this.store.has(rc.id)) {
      console.warn(`[ConstraintRegistry] Duplicate id "${rc.id}" — skipped.`);
      return;
    }
    this.store.set(rc.id, rc);
    this.physics.addConstraints(rc.constraint);
    if (this.runtimeStore) {
      this.runtimeStore.addConstraint(rc);
    }
  }

  /** Remove from registry and physics world. */
  remove(id: string): boolean {
    const rc = this.store.get(id);
    if (!rc) return false;
    this.physics.removeConstraints(rc.constraint);
    this.store.delete(id);
    if (this.runtimeStore) {
      this.runtimeStore.removeConstraint(id);
    }
    return true;
  }

  get(id: string): RuntimeConstraint | undefined {
    return this.store.get(id);
  }

  has(id: string): boolean {
    return this.store.has(id);
  }

  getAll(): RuntimeConstraint[] {
    return Array.from(this.store.values());
  }

  count(): number {
    return this.store.size;
  }

  /** Remove and destroy all tracked constraints. */
  clear(): void {
    this.store.forEach((rc) => {
      this.physics.removeConstraints(rc.constraint);
      if (this.runtimeStore) {
        this.runtimeStore.removeConstraint(rc.id);
      }
    });
    this.store.clear();
  }
}
