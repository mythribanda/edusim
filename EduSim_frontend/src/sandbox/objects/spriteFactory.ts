import { Graphics, Container, Assets, Sprite } from 'pixi.js';

// ─── Config ───────────────────────────────────────────────────────────────────

interface BaseSpriteConfig {
  fillColor?: number | string;   // hex number or CSS colour string
  strokeColor?: number | string;
  strokeWidth?: number;
  alpha?: number;            // [0 – 1]
  cornerRadius?: number;           // rectangle only — rounds corners
  texture?: string;              // path to SVG asset texture
}

export interface CircleSpriteConfig extends BaseSpriteConfig {
  type: 'circle';
  radius: number;
}

export interface RectSpriteConfig extends BaseSpriteConfig {
  type: 'rectangle';
  width: number;
  height: number;
}

export type SpriteConfig = CircleSpriteConfig | RectSpriteConfig;

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a PixiJS Container (wrapping a Graphics primitive or Sprite) from a config.
 *
 * All geometry is drawn centred on (0, 0) so that the container's position
 * maps directly to the Matter.js body centroid — no offset correction needed
 * in the sync loop.
 *
 * Rendering is fully independent from physics — this function knows nothing
 * about Matter.js and returns a plain PixiJS Container.
 */
export function createSprite(config: SpriteConfig): Container {
  const {
    fillColor = 0x6366f1,
    strokeColor = 0xa5b4fc,
    strokeWidth = 2,
    alpha = 1,
  } = config;

  const gfx = new Graphics();

  switch (config.type) {
    case 'circle': {
      gfx.circle(0, 0, config.radius);
      break;
    }

    case 'rectangle': {
      const { width: w, height: h, cornerRadius = 0 } = config;
      if (cornerRadius > 0) {
        gfx.roundRect(-w / 2, -h / 2, w, h, cornerRadius);
      } else {
        gfx.rect(-w / 2, -h / 2, w, h);
      }
      break;
    }

    default: {
      const _exhaustive: never = config;
      throw new Error(`[spriteFactory] Unsupported sprite type: "${(_exhaustive as SpriteConfig).type}"`);
    }
  }

  gfx.fill({ color: fillColor, alpha });
  if (strokeWidth > 0) {
    gfx.stroke({ width: strokeWidth, color: strokeColor });
  }

  // Wrap in a Container so callers can add children (labels, overlays, etc.)
  // without touching the underlying geometry Graphics.
  const container = new Container();
  container.addChild(gfx);

  // If a texture URL is provided, load asynchronously and swap graphics
  if (config.texture) {
    Assets.load(config.texture)
      .then((texture) => {
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);

        const desiredWidth = config.type === 'circle' ? config.radius * 2 : config.width;
        const desiredHeight = config.type === 'circle' ? config.radius * 2 : config.height;

        const scaleX = desiredWidth / texture.width;
        const scaleY = desiredHeight / texture.height;
        sprite.scale.set(scaleX, scaleY);

        // Safely remove the fallback graphics primitive and add the crisp SVG sprite
        if (container.children.includes(gfx)) {
          container.removeChild(gfx);
          gfx.destroy();
        }
        container.addChild(sprite);
      })
      .catch((err) => {
        console.warn(`[spriteFactory] Failed to load SVG texture "${config.texture}":`, err);
      });
  }

  return container;
}
