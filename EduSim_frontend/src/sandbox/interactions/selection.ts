import type { Container } from 'pixi.js';
import type { RuntimeObject } from '../types/RuntimeObject';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectionChangeCallback = (selected: RuntimeObject | null) => void;

// ─── SelectionManager ─────────────────────────────────────────────────────────

/**
 * Tracks which RuntimeObject is currently selected.
 *
 * On registration each object's PixiJS display is made pointer-interactive so
 * that clicks are captured and routed through the selection state machine.
 *
 * Deselection (clicking empty space) is handled externally — call
 * `manager.deselect()` from a pointerdown listener on the stage/viewport
 * background, or from a React onClick on the canvas wrapper.
 *
 * Architecture notes:
 *   - Zero dependency on Matter.js or SandboxRuntime.
 *   - Zero direct DOM manipulation.
 *   - Callbacks make it trivial to bind to React state, observables, or
 *     property-panel components in the future.
 *   - Prepared for multi-select: `selectedId` can trivially become a Set.
 */
export class SelectionManager {
  private readonly registry  = new Map<string, RuntimeObject>();
  private readonly callbacks = new Set<SelectionChangeCallback>();
  private selectedId: string | null = null;

  // ── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a RuntimeObject so it becomes click-selectable.
   * Idempotent — re-registering the same id is a no-op.
   */
  register(obj: RuntimeObject): void {
    if (this.registry.has(obj.id)) return;
    this.registry.set(obj.id, obj);
    this.makeInteractive(obj.display, obj.id);
  }

  /**
   * Unregister a RuntimeObject, removing its event listeners.
   * If it was selected, a deselect event is emitted.
   */
  unregister(id: string): void {
    const obj = this.registry.get(id);
    if (!obj) return;

    this.clearInteractive(obj.display);
    this.registry.delete(id);

    if (this.selectedId === id) {
      this.selectedId = null;
      this.notify(null);
    }
  }

  /** Remove all registered objects. */
  clear(): void {
    this.registry.forEach((obj) => this.clearInteractive(obj.display));
    this.registry.clear();
    this.selectedId = null;
  }

  // ── Selection state ───────────────────────────────────────────────────────

  select(id: string): void {
    if (this.selectedId === id) return;

    // Remove highlight from previous selection
    if (this.selectedId) {
      const prev = this.registry.get(this.selectedId);
      if (prev) this.setHighlight(prev.display, false);
    }

    this.selectedId = id;
    const obj = this.registry.get(id);
    if (obj) this.setHighlight(obj.display, true);

    this.notify(obj ?? null);
  }

  deselect(): void {
    if (!this.selectedId) return;

    const obj = this.registry.get(this.selectedId);
    if (obj) this.setHighlight(obj.display, false);

    this.selectedId = null;
    this.notify(null);
  }

  getSelected(): RuntimeObject | null {
    return this.selectedId ? (this.registry.get(this.selectedId) ?? null) : null;
  }

  isSelected(id: string): boolean {
    return this.selectedId === id;
  }

  getSelectedId(): string | null {
    return this.selectedId;
  }

  // ── Callbacks ─────────────────────────────────────────────────────────────

  /** Subscribe to selection-change events. Returns an unsubscribe function. */
  onChange(cb: SelectionChangeCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private makeInteractive(display: Container, id: string): void {
    display.eventMode = 'static';
    display.cursor    = 'pointer';

    // Use an arrow function stored on the display so we can remove it cleanly
    const handler = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      this.select(id);
    };

    // Attach handler and keep a reference for removal
    (display as Container & { _selHandler?: typeof handler })._selHandler = handler;
    display.on('pointerdown', handler);
  }

  private clearInteractive(display: Container): void {
    const d = display as Container & { _selHandler?: (e: { stopPropagation(): void }) => void };
    if (d._selHandler) {
      display.off('pointerdown', d._selHandler);
      delete d._selHandler;
    }
    display.eventMode = 'none';
    display.cursor    = 'default';
    this.setHighlight(display, false);
  }

  private setHighlight(display: Container, selected: boolean): void {
    // Subtle alpha shift — non-intrusive and reversible.
    // Future: swap for an OutlineFilter or border Graphics overlay.
    display.alpha = selected ? 0.78 : 1.0;
  }

  private notify(obj: RuntimeObject | null): void {
    this.callbacks.forEach((cb) => cb(obj));
  }
}
