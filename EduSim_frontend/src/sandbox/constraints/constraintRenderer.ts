import * as PIXI from 'pixi.js';
import type * as Matter from 'matter-js';
import type { RuntimeConstraint } from './constraintFactory';
import type { SandboxRuntime }    from '../engine/runtime';

// ─── Style map ────────────────────────────────────────────────────────────────

const STYLE: Record<string, { color: number; alpha: number; width: number; dash: boolean }> = {
  pivot:  { color: 0x818cf8, alpha: 0.7, width: 2,   dash: false },
  spring: { color: 0x34d399, alpha: 0.8, width: 1.5, dash: true  },
  rope:   { color: 0xfbbf24, alpha: 0.95, width: 3,  dash: false },
};

// ─── ConstraintRenderer ───────────────────────────────────────────────────────

/**
 * Draws live constraint lines on top of the PixiJS scene.
 *
 * Uses a single Graphics object that is cleared and redrawn every afterStep.
 * Registered as a SandboxRuntime hook — zero coupling to React.
 *
 * Lifecycle:
 *   const cr = new ConstraintRenderer(runtime)
 *   cr.enable()     ← attaches hook + graphics layer
 *   cr.disable()    ← detaches hook, hides graphics
 *   cr.destroy()    ← full cleanup
 */
export class ConstraintRenderer {
  private readonly runtime:  SandboxRuntime;
  private readonly graphics: PIXI.Graphics;
  private readonly hookId = 'constraint-renderer';

  private active    = false;
  private rafId:    number | null = null;
  private sourcesFn: (() => RuntimeConstraint[]) | null = null;

  constructor(runtime: SandboxRuntime) {
    this.runtime  = runtime;
    this.graphics = new PIXI.Graphics();
    (this.graphics as any)._isConstraintOverlay = true; // prevent removal by buildScene
    this.graphics.zIndex = 100; // draw on top
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * @param getConstraints  Callback that returns the live constraint list.
   *                        Typically: () => constraintRegistry.getAll()
   */
  enable(getConstraints: () => RuntimeConstraint[]): void {
    if (this.active) return;
    this.sourcesFn = getConstraints;
    this.active    = true;

    const vp = this.runtime.renderer.getViewport();
    vp.addChild(this.graphics);
    vp.sortChildren();

    // Use own RAF loop so lines are visible even when physics is paused
    const loop = () => {
      if (!this.active) return;
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  disable(): void {
    if (!this.active) return;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.graphics.parent?.removeChild(this.graphics);
    this.graphics.clear();
    this.active = false;
  }

  destroy(): void {
    this.disable();
    this.graphics.destroy();
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  private draw(): void {
    if (!this.sourcesFn) return;
    const constraints = this.sourcesFn();

    this.graphics.clear();

    for (const rc of constraints) {
      const c   = rc.constraint;
      const sty = STYLE[rc.type] ?? STYLE['rope'];

      // Resolve endpoints
      const pA = this.resolveEndpoint(c.bodyA, c.pointA);
      const pB = this.resolveEndpoint(c.bodyB, c.pointB);

      if (!pA || !pB) continue;

      if (rc.type === 'spring') {
        this.drawSpring(pA, pB, sty.color, sty.alpha, sty.width);
      } else {
        this.graphics
          .moveTo(pA.x, pA.y)
          .lineTo(pB.x, pB.y)
          .stroke({ color: sty.color, alpha: sty.alpha, width: sty.width });
      }

      // Draw dynamic visual receptors for unconnected sensor bobs
      const isSensorTarget = c.bodyB && c.bodyB.label && c.bodyB.label.startsWith("sensor-target:");
      if (isSensorTarget) {
        const pulse = 11 + Math.sin(Date.now() * 0.008) * 3;
        this.graphics
          .circle(pB.x, pB.y, pulse)
          .stroke({ color: sty.color, width: 1.5, alpha: 0.85 })
          .circle(pB.x, pB.y, 3)
          .fill({ color: sty.color, alpha: 0.9 });
      } else {
        // Draw anchor dot for pivot constraints
        if (rc.type === 'pivot') {
          this.graphics
            .circle(pB.x, pB.y, 5)
            .fill({ color: 0x6366f1, alpha: 0.9 });
        }
      }
    }
  }

  /**
   * Resolve the world-space position of one end of a constraint.
   * A constraint endpoint is either a body (+ optional local offset) or a raw world point.
   */
  private resolveEndpoint(
    body:  Matter.Body | null | null | undefined,
    point: Matter.Vector | null | undefined,
  ): { x: number; y: number } | null {
    if (body) {
      const offset = point ?? { x: 0, y: 0 };
      const cos    = Math.cos(body.angle);
      const sin    = Math.sin(body.angle);
      return {
        x: body.position.x + (cos * offset.x - sin * offset.y),
        y: body.position.y + (sin * offset.x + cos * offset.y),
      };
    }
    if (point) return { x: point.x, y: point.y };
    return null;
  }

  /** Draw a zigzag spring line between two world-space points. */
  private drawSpring(
    pA: { x: number; y: number },
    pB: { x: number; y: number },
    color: number,
    alpha: number,
    width: number,
  ): void {
    const dx      = pB.x - pA.x;
    const dy      = pB.y - pA.y;
    const len     = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const nx     = dx / len;           // unit vector along spring
    const ny     = dy / len;
    const px     = -ny;               // perpendicular
    const py     =  nx;

    const coils  = 8;
    const amp    = Math.min(8, len * 0.08); // coil half-amplitude
    const step   = len / (coils * 2 + 2);

    const path: Array<[number, number]> = [];
    path.push([pA.x, pA.y]);
    path.push([pA.x + nx * step, pA.y + ny * step]);

    for (let i = 0; i < coils * 2; i++) {
      const t    = step + step * (i + 1);
      const side = (i % 2 === 0 ? 1 : -1) * amp;
      path.push([
        pA.x + nx * t + px * side,
        pA.y + ny * t + py * side,
      ]);
    }
    path.push([pB.x - nx * step, pB.y - ny * step]);
    path.push([pB.x, pB.y]);

    const g = this.graphics;
    g.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i][0], path[i][1]);
    g.stroke({ color, alpha, width });
  }
}
