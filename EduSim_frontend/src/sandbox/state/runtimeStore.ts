import type { RuntimeObject } from '../types/RuntimeObject';
import type { RuntimeConstraint } from '../constraints/constraintFactory';
import type { ComputedObservables } from '../observables/observableTypes';
import { ObjectRegistry } from './objectRegistry';

export type RuntimeState = 'uninitialized' | 'running' | 'paused' | 'stopped';

export type EventType =
  | 'objectAdded'
  | 'objectRemoved'
  | 'selectionChanged'
  | 'runtimeStateChanged'
  | 'constraintAdded'
  | 'constraintRemoved'
  | 'observableRegistered'
  | 'observableUnregistered';

export interface RuntimeMetadata {
  label?: string;
  selected?: boolean;
  locked?: boolean;
  educationalTags?: string[];
  customData?: Record<string, unknown>;
}

interface SubscriptionCallback {
  (data?: unknown): void;
}

/**
 * Centralized runtime state management system for EduSim.
 *
 * Serves as the single source of truth for:
 *   - Runtime object lifecycle
 *   - Simulation state (running/paused/stopped)
 *   - Selected object tracking
 *   - Constraint registry
 *   - Observable registration
 *   - Event subscriptions
 *
 * Lifecycle:
 *   const store = new RuntimeStore()
 *   store.addObject(obj)
 *   store.setSelectedObject(id)
 *   store.setRuntimeState('running')
 *   store.subscribe('selectionChanged', callback)
 */
export class RuntimeStore {
  private readonly registry = new ObjectRegistry();
  private runtimeState: RuntimeState = 'uninitialized';
  private selectedObjectId: string | null = null;
  private readonly constraints = new Map<string, RuntimeConstraint>();
  private readonly observables = new Map<string, Set<string>>(); // objectId -> observable types
  private readonly subscriptions = new Map<EventType, Set<SubscriptionCallback>>();
  private readonly metadata = new Map<string, RuntimeMetadata>();
  private simulationTime = 0;
  private frameCount = 0;

  constructor() {
    // Initialize all event types with empty subscription sets
    const eventTypes: EventType[] = [
      'objectAdded',
      'objectRemoved',
      'selectionChanged',
      'runtimeStateChanged',
      'constraintAdded',
      'constraintRemoved',
      'observableRegistered',
      'observableUnregistered',
    ];
    eventTypes.forEach((et) => this.subscriptions.set(et, new Set()));
  }

  // ── Object Management ─────────────────────────────────────────────────────

  addObject(obj: RuntimeObject): void {
    this.registry.add(obj);
    // Seed metadata from the object's own metadata so educationalTags survive
    this.metadata.set(obj.id, {
      label: obj.metadata?.label,
      educationalTags: obj.metadata?.educationalTags ?? [],
      customData: obj.metadata?.customData ?? {},
    });
    this.notify('objectAdded', obj);
  }

  removeObject(id: string): void {
    const obj = this.registry.get(id);
    if (obj) {
      this.registry.remove(id);
      this.metadata.delete(id);
      this.observables.delete(id);
      if (this.selectedObjectId === id) {
        this.clearSelection();
      }
      this.notify('objectRemoved', { id });
    }
  }

  getObject(id: string): RuntimeObject | null {
    return this.registry.get(id);
  }

  getAllObjects(): RuntimeObject[] {
    return this.registry.getAll();
  }

  hasObject(id: string): boolean {
    return this.registry.has(id);
  }

  getObjectCount(): number {
    return this.registry.count();
  }

  // ── Selection Management ──────────────────────────────────────────────────

  setSelectedObject(id: string): void {
    if (!this.registry.has(id)) {
      console.warn(`[RuntimeStore] Cannot select non-existent object: ${id}`);
      return;
    }
    const prev = this.selectedObjectId;
    this.selectedObjectId = id;
    if (prev !== id) {
      this.updateMetadata(id, { selected: true });
      if (prev) this.updateMetadata(prev, { selected: false });
      this.notify('selectionChanged', { previous: prev, current: id });
    }
  }

  clearSelection(): void {
    if (this.selectedObjectId) {
      const prev = this.selectedObjectId;
      this.selectedObjectId = null;
      this.updateMetadata(prev, { selected: false });
      this.notify('selectionChanged', { previous: prev, current: null });
    }
  }

  getSelectedObject(): RuntimeObject | null {
    if (!this.selectedObjectId) return null;
    return this.registry.get(this.selectedObjectId);
  }

  getSelectedObjectId(): string | null {
    return this.selectedObjectId;
  }

  isSelected(id: string): boolean {
    return this.selectedObjectId === id;
  }

  // ── Runtime State Management ──────────────────────────────────────────────

  setRuntimeState(state: RuntimeState): void {
    if (this.runtimeState !== state) {
      this.runtimeState = state;
      this.notify('runtimeStateChanged', { state });
    }
  }

  getRuntimeState(): RuntimeState {
    return this.runtimeState;
  }

  isRunning(): boolean {
    return this.runtimeState === 'running';
  }

  isPaused(): boolean {
    return this.runtimeState === 'paused';
  }

  isStopped(): boolean {
    return this.runtimeState === 'stopped';
  }

  // ── Constraint Management ─────────────────────────────────────────────────

  addConstraint(constraint: RuntimeConstraint): void {
    this.constraints.set(constraint.id, constraint);
    this.notify('constraintAdded', constraint);
  }

  removeConstraint(id: string): void {
    const constraint = this.constraints.get(id);
    if (constraint) {
      this.constraints.delete(id);
      this.notify('constraintRemoved', { id });
    }
  }

  getConstraint(id: string): RuntimeConstraint | null {
    return this.constraints.get(id) ?? null;
  }

  getAllConstraints(): RuntimeConstraint[] {
    return Array.from(this.constraints.values());
  }

  getConstraintCount(): number {
    return this.constraints.size;
  }

  // ── Observable Management ─────────────────────────────────────────────────

  registerObservable(objectId: string, observableType: string): void {
    if (!this.registry.has(objectId)) {
      console.warn(`[RuntimeStore] Cannot register observable for non-existent object: ${objectId}`);
      return;
    }
    if (!this.observables.has(objectId)) {
      this.observables.set(objectId, new Set());
    }
    this.observables.get(objectId)!.add(observableType);
    this.notify('observableRegistered', { objectId, observableType });
  }

  unregisterObservable(objectId: string, observableType: string): void {
    const types = this.observables.get(objectId);
    if (types) {
      types.delete(observableType);
      if (types.size === 0) {
        this.observables.delete(objectId);
      }
      this.notify('observableUnregistered', { objectId, observableType });
    }
  }

  getObservables(objectId: string): string[] {
    const types = this.observables.get(objectId);
    return types ? Array.from(types) : [];
  }

  hasObservable(objectId: string, observableType: string): boolean {
    return this.observables.get(objectId)?.has(observableType) ?? false;
  }

  // ── Metadata Management ────────────────────────────────────────────────────

  updateMetadata(objectId: string, partial: Partial<RuntimeMetadata>): void {
    const current = this.metadata.get(objectId) ?? {};
    this.metadata.set(objectId, { ...current, ...partial });
  }

  getMetadata(objectId: string): RuntimeMetadata {
    return this.metadata.get(objectId) ?? {};
  }

  setObjectLabel(objectId: string, label: string): void {
    this.updateMetadata(objectId, { label });
  }

  getObjectLabel(objectId: string): string | undefined {
    return this.metadata.get(objectId)?.label;
  }

  lockObject(objectId: string): void {
    this.updateMetadata(objectId, { locked: true });
  }

  unlockObject(objectId: string): void {
    this.updateMetadata(objectId, { locked: false });
  }

  isObjectLocked(objectId: string): boolean {
    return this.metadata.get(objectId)?.locked ?? false;
  }

  // ── Time Management ────────────────────────────────────────────────────────

  updateSimulationTime(deltaMs: number): void {
    this.simulationTime += deltaMs;
    this.frameCount += 1;
  }

  getSimulationTime(): number {
    return this.simulationTime;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  resetSimulationTime(): void {
    this.simulationTime = 0;
    this.frameCount = 0;
  }

  // ── Event Subscription ─────────────────────────────────────────────────────

  subscribe(event: EventType, callback: SubscriptionCallback): () => void {
    const callbacks = this.subscriptions.get(event);
    if (!callbacks) {
      console.warn(`[RuntimeStore] Unknown event type: ${event}`);
      return () => {};
    }
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
    };
  }

  private notify(event: EventType, data?: unknown): void {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  // ── Lifecycle Management ───────────────────────────────────────────────────

  /**
   * Reset all runtime state.
   * Clears objects, constraints, observables, and resets to 'uninitialized'.
   */
  reset(): void {
    this.registry.clear();
    this.constraints.clear();
    this.observables.clear();
    this.metadata.clear();
    this.selectedObjectId = null;
    this.runtimeState = 'uninitialized';
    this.resetSimulationTime();
    this.notify('runtimeStateChanged', { state: 'uninitialized' });
  }

  /**
   * Get runtime summary for debugging/inspection.
   */
  getSummary(): Record<string, unknown> {
    return {
      state: this.runtimeState,
      objectCount: this.registry.count(),
      constraintCount: this.constraints.size,
      observableCount: this.observables.size,
      selectedObjectId: this.selectedObjectId,
      simulationTime: this.simulationTime,
      frameCount: this.frameCount,
    };
  }
}
