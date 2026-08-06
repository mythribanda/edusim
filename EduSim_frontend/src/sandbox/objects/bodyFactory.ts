import * as Matter from 'matter-js';

// ─── Config ───────────────────────────────────────────────────────────────────

interface BaseBodyConfig {
  x: number;
  y: number;
  isStatic?:    boolean;
  restitution?: number;   // bounciness  [0 – 1]
  friction?:    number;   // surface friction
  frictionAir?: number;   // air resistance / drag
  density?:     number;   // kg / px²
  angle?:       number;   // radians, initial rotation
  label?:       string;   // debug / query identifier
  texture?:     string;   // SVG/image texture path
}

export interface CircleBodyConfig extends BaseBodyConfig {
  type: 'circle';
  radius: number;
}

export interface RectBodyConfig extends BaseBodyConfig {
  type: 'rectangle';
  width:  number;
  height: number;
}

export type BodyConfig = CircleBodyConfig | RectBodyConfig;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a Matter.js Body from a declarative config.
 *
 * Physics is fully independent from rendering — this function knows nothing
 * about PixiJS and returns a plain Matter.Body.
 */
export function createBody(config: BodyConfig): Matter.Body {
  const {
    x, y,
    isStatic    = false,
    restitution = 0.4,
    friction    = 0.1,
    density     = 0.001,
    angle       = 0,
    label       = config.type,
  } = config;

  // Use nullish coalescing so frictionAir=0 is respected (not treated as falsy like JS default= would do)
  const frictionAir = config.frictionAir ?? 0.01;

  const options: Matter.IChamferableBodyDefinition = {
    isStatic,
    restitution,
    friction,
    frictionAir,
    density,
    angle,
    label,
  };

  if (config.texture) {
    const desiredWidth = config.type === 'circle' ? config.radius * 2 : config.width;
    const desiredHeight = config.type === 'circle' ? config.radius * 2 : config.height;
    options.render = {
      sprite: {
        texture: config.texture,
        xScale: desiredWidth / 900,
        yScale: desiredHeight / 900,
      }
    };
  }

  switch (config.type) {
    case 'circle':
      return Matter.Bodies.circle(x, y, config.radius, options);

    case 'rectangle':
      return Matter.Bodies.rectangle(x, y, config.width, config.height, options);

    default: {
      // TypeScript exhaustiveness guard — will surface at compile time if a
      // new variant is added to BodyConfig without handling it here.
      const _exhaustive: never = config;
      throw new Error(`[bodyFactory] Unsupported body type: "${(_exhaustive as BodyConfig).type}"`);
    }
  }
}
