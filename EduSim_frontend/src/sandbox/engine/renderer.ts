import { Application, Container } from 'pixi.js';

// ─── PixiRenderer ────────────────────────────────────────────────────────────

/**
 * Manages a single PixiJS v8 Application instance.
 * Exposes a dedicated `viewport` Container for all scene graphics,
 * keeping the main stage clean for future HUD / overlay layers.
 *
 * Lifecycle:  new PixiRenderer()  →  await init(container)  →  destroy()
 */
export class PixiRenderer {
  private app: Application | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // ── Init ──────────────────────────────────────────────────────────────────

  /**
   * Initialise the PixiJS application and mount its canvas inside `container`.
   * Must be awaited before calling any other method.
   */
  async init(container: HTMLElement): Promise<void> {
    this.app = new Application();

    await this.app.init({
      resizeTo: container,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      backgroundAlpha: 0,          // transparent — host CSS owns the bg colour
      powerPreference: 'high-performance',
    });

    // Style the canvas so it fills the container
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width   = '100%';
    canvas.style.height  = '100%';
    container.appendChild(canvas);

    // Dedicated viewport container — all physics sprites live here.
    // Future zoom / pan / camera work targets this node only.
    const viewport = new Container();
    viewport.label = 'viewport';
    this.app.stage.addChild(viewport);

    // Auto-resize whenever the host element changes dimensions
    this.resizeObserver = new ResizeObserver(() => this.app?.resize());
    this.resizeObserver.observe(container);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getApp(): Application {
    if (!this.app) throw new Error('[PixiRenderer] Not initialised. Call init() first.');
    return this.app;
  }

  /** The scene container where all physics sprites must be added. */
  getViewport(): Container {
    const vp = this.getApp().stage.getChildByLabel('viewport');
    if (!vp) throw new Error('[PixiRenderer] Viewport container missing.');
    return vp as Container;
  }

  getStage(): Container {
    return this.getApp().stage;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.app) {
      const canvas = this.app.canvas as HTMLCanvasElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      try {
        if (this.app.stage) {
          this.app.stage.destroy({ children: true });
        }
        // In PixiJS v8, app.destroy takes ViewSystemDestroyOptions (e.g. removeView)
        this.app.destroy({ removeView: true });
      } catch (err) {
        console.warn('[PixiRenderer] Safe app.destroy caught PixiJS internal error:', err);
      }
      this.app = null;
    }
  }
}
