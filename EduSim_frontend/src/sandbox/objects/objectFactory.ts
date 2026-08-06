import { createBody, type BodyConfig } from './bodyFactory';
import { createSprite, type SpriteConfig } from './spriteFactory';
import type { RuntimeObject } from '../types/RuntimeObject';

// ─── Config ───────────────────────────────────────────────────────────────────

/**
 * ObjectConfig is the single, unified descriptor for any runtime entity.
 *
 * It composes:
 *   - physics config  (forwarded to bodyFactory)
 *   - visual config   (forwarded to spriteFactory)
 *   - identity        (id — caller responsibility, must be globally unique)
 *
 * Future additions should be additive (optional fields) to preserve
 * backward-compatibility with existing serialised payloads:
 *   metadata?:  Record<string, unknown>  — educational context
 *   tags?:      string[]                 — categorisation
 *   relations?: ...                      — constraints / joints
 */
export type ObjectConfig = { id: string } & BodyConfig & SpriteConfig;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a fully-assembled RuntimeObject from a declarative config.
 *
 * Responsibilities:
 *   1. Delegate body creation to bodyFactory  (physics, no render knowledge)
 *   2. Delegate sprite creation to spriteFactory (render, no physics knowledge)
 *   3. Set the display object's initial position to match the body centroid
 *   4. Return the canonical { id, body, display } triplet
 *
 * This function deliberately has NO knowledge of:
 *   - SandboxRuntime   (caller adds to engine / viewport / registry)
 *   - SyncRegistry     (caller registers the pair)
 *   - React / DOM      (purely data-level)
 *
 * This loose coupling means objectFactory can be driven by:
 *   - direct React calls
 *   - backend-generated JSON payloads
 *   - test harnesses
 *   - future AI tutoring systems
 */
export function createObject(config: ObjectConfig): RuntimeObject {
  // ── 1. Physics ─────────────────────────────────────────────────────────────
  const bodyConfig: BodyConfig = (() => {
    const base = {
      x:           config.x,
      y:           config.y,
      isStatic:    config.isStatic,
      restitution: config.restitution,
      friction:    config.friction,
      frictionAir: config.frictionAir,
      density:     config.density,
      angle:       config.angle,
      label:       config.label ?? config.id,
      texture:     config.texture,
    };

    if (config.type === 'circle') {
      return { ...base, type: 'circle', radius: config.radius } as BodyConfig;
    }
    return { ...base, type: 'rectangle', width: config.width, height: config.height } as BodyConfig;
  })();

  const body = createBody(bodyConfig);
  (body as any).objectId = config.id;

  // ── 2. Rendering ───────────────────────────────────────────────────────────
  const spriteConfig: SpriteConfig = (() => {
    const base = {
      fillColor:    config.fillColor,
      strokeColor:  config.strokeColor,
      strokeWidth:  config.strokeWidth,
      alpha:        config.alpha,
      cornerRadius: config.cornerRadius,
      texture:      config.texture,
    };

    if (config.type === 'circle') {
      return { ...base, type: 'circle', radius: config.radius } as SpriteConfig;
    }
    return { ...base, type: 'rectangle', width: config.width, height: config.height } as SpriteConfig;
  })();

  const display = createSprite(spriteConfig);

  // ── 3. Initial position sync ───────────────────────────────────────────────
  // Pre-position the display so the first frame renders correctly even before
  // the sync loop runs.
  display.x = body.position.x;
  display.y = body.position.y;

  // ── 4. Assemble RuntimeObject ──────────────────────────────────────────────
  return {
    id: config.id,
    body,
    display,
    editableProperties: {
      mass: true,
      friction: true,
      restitution: true,
      position: true,
      velocity: true,
      angularVelocity: true,
      density: true,
      static: true,
      opacity: true,
      visibility: true,
      scale: true,
      rotation: true,
      color: true,
    },
    metadata: {
      label: config.label ?? config.id,
      educationalTags: config.type === 'circle' ? ['motion', 'rotational'] : ['motion'],
      shapeInfo: {
        type: config.type,
        radius: config.type === 'circle' ? config.radius : undefined,
        width: config.type === 'rectangle' ? config.width : undefined,
        height: config.type === 'rectangle' ? config.height : undefined,
        cornerRadius: config.type === 'rectangle' ? config.cornerRadius : undefined,
        fillColor: config.fillColor,
        strokeColor: config.strokeColor,
        strokeWidth: config.strokeWidth,
      },
    },
  };
}
