import type { RuntimeObject } from '../types/RuntimeObject';

/**
 * Central registry for all active runtime objects in the simulation.
 *
 * This is the canonical source of truth for runtime object references.
 * All systems (selection, observables, constraints, rendering) query this
 * registry to access runtime objects.
 *
 * Lifecycle:
 *   const registry = new ObjectRegistry()
 *   registry.add(runtimeObject)
 *   registry.get(id)
 *   registry.getAll()
 *   registry.remove(id)
 *   registry.clear()
 */
export class ObjectRegistry {
  private readonly objects = new Map<string, RuntimeObject>();

  // ── Add & Remove ──────────────────────────────────────────────────────────

  /**
   * Register a runtime object in the registry.
   * Safe to call multiple times — later calls update the entry.
   */
  add(obj: RuntimeObject): void {
    this.objects.set(obj.id, obj);
  }

  /**
   * Remove a runtime object from the registry by id.
   * Safe to call on non-existent ids — no-op.
   */
  remove(id: string): void {
    this.objects.delete(id);
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  /**
   * Get a single runtime object by id, or null if not found.
   */
  get(id: string): RuntimeObject | null {
    return this.objects.get(id) ?? null;
  }

  /**
   * Get all registered runtime objects as an array.
   */
  getAll(): RuntimeObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Check if a runtime object is registered.
   */
  has(id: string): boolean {
    return this.objects.has(id);
  }

  /**
   * Get the count of registered objects.
   */
  count(): number {
    return this.objects.size;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Clear all registered objects.
   * Usually called during simulation reset.
   */
  clear(): void {
    this.objects.clear();
  }

  /**
   * Get internal map for advanced iteration (use sparingly).
   */
  getInternalMap(): ReadonlyMap<string, RuntimeObject> {
    return this.objects;
  }
}
