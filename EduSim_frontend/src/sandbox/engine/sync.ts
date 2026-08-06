import * as Matter from 'matter-js';
import { Container } from 'pixi.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A pair linking one Matter.js Body to one PixiJS display object.
 * Optional `offset` shifts the sprite relative to the physics centroid.
 */
export interface SyncPair {
  body: Matter.Body;
  displayObject: Container;
  offset?: { x: number; y: number };
}

// ─── SyncRegistry ─────────────────────────────────────────────────────────────

/**
 * Maintains a named map of SyncPairs and provides a single
 * `flush()` call to propagate all physics positions to PixiJS
 * in one efficient loop — no per-object allocation per frame.
 */
export class SyncRegistry {
  private readonly pairs = new Map<string, SyncPair>();

  register(id: string, body: Matter.Body, displayObject: Container, offset?: { x: number; y: number }): void {
    this.pairs.set(id, { body, displayObject, offset });
  }

  unregister(id: string): void {
    this.pairs.delete(id);
  }

  has(id: string): boolean {
    return this.pairs.has(id);
  }

  clear(): void {
    this.pairs.clear();
  }

  getPairs(): ReadonlyMap<string, SyncPair> {
    return this.pairs;
  }

  /** Copy physics state → display state for every registered pair. */
  flush(): void {
    this.pairs.forEach(({ body, displayObject, offset }) => {
      displayObject.x        = body.position.x + (offset?.x ?? 0);
      displayObject.y        = body.position.y + (offset?.y ?? 0);
      displayObject.rotation = body.angle;
    });
  }
}

// ─── Standalone utility ───────────────────────────────────────────────────────

/**
 * Stateless helper — useful when you have an ad-hoc iterable of pairs
 * outside of a SyncRegistry (e.g. a single-frame preview render).
 */
export function syncBodies(pairs: Iterable<SyncPair>): void {
  for (const { body, displayObject, offset } of pairs) {
    displayObject.x        = body.position.x + (offset?.x ?? 0);
    displayObject.y        = body.position.y + (offset?.y ?? 0);
    displayObject.rotation = body.angle;
  }
}
