import * as Matter from 'matter-js';

// ─── Config ───────────────────────────────────────────────────────────────────

export interface DragConfig {
    /** How quickly the dragged body tracks the mouse. Range: 0.01 – 1. Default 0.2 */
    stiffness?: number;
    /** How much angular damping to apply while dragging. Range: 0 – 1. Default 0.1 */
    angularStiffness?: number;
    /** Linear damping applied to the constraint. Default 0 */
    damping?: number;
}

// ─── DragController ───────────────────────────────────────────────────────────

/**
 * Attaches a Matter.js MouseConstraint to the PixiJS canvas, enabling
 * physics-accurate drag interactions on any body in the world.
 *
 * Lifecycle:  new DragController(engine, canvas)  →  enable()  →  destroy()
 *
 * The controller knows nothing about PixiJS — it only requires the raw
 * HTMLCanvasElement so that Matter.js can bind its pointer event listeners.
 */
export class DragController {
    private readonly engine: Matter.Engine;
    private readonly canvas: HTMLCanvasElement;

    private mouse: Matter.Mouse | null = null;
    private mouseConstraint: Matter.MouseConstraint | null = null;
    private active = false;

    constructor(engine: Matter.Engine, canvas: HTMLCanvasElement) {
        this.engine = engine;
        this.canvas = canvas;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    /**
     * Activate mouse-drag interaction.
     * Safe to call multiple times — only initialises once.
     */
    enable(config: DragConfig = {}): void {
        if (this.active) return;

        this.mouse = Matter.Mouse.create(this.canvas);

        // Keep physics coordinates aligned with CSS-scaled canvas
        // (PixiJS sets canvas CSS size to 100% which can differ from its pixel resolution)
        const { width: cssW, height: cssH } = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / cssW;
        const scaleY = this.canvas.height / cssH;
        Matter.Mouse.setScale(this.mouse, { x: scaleX, y: scaleY });

        this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
            mouse: this.mouse,
            constraint: {
                stiffness: config.stiffness ?? 0.2,
                damping: config.damping ?? 0,
                render: { visible: false },
            } as any,
        });

        Matter.Composite.add(this.engine.world, this.mouseConstraint);
        this.active = true;
    }

    /**
     * Suspend drag interactions without destroying state.
     * Call `enable()` again to resume.
     */
    disable(): void {
        if (!this.active || !this.mouseConstraint) return;
        Matter.Composite.remove(this.engine.world, this.mouseConstraint);
        this.active = false;
    }

    /**
     * Permanently release all resources.
     * The instance must not be used after this call.
     */
    destroy(): void {
        this.disable();
        this.mouseConstraint = null;
        this.mouse = null;
    }

    // ── Status ────────────────────────────────────────────────────────────────

    isEnabled(): boolean { return this.active; }

    /** Expose the raw mouse for advanced use-cases (e.g. observable inspection). */
    getMouse(): Matter.Mouse | null { return this.mouse; }

    /** Expose the mouse constraint so we can listen to startdrag/enddrag events */
    getMouseConstraint(): Matter.MouseConstraint | null { return this.mouseConstraint; }
}
