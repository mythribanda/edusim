import * as Matter from 'matter-js';
import type { Container } from 'pixi.js';

// ─── RuntimeObject ────────────────────────────────────────────────────────────

/**
 * A complete, self-contained runtime entity that pairs a physics body with a
 * PixiJS display object under a stable identifier.
 *
 * This is the single canonical unit of the EduSim object system.
 * Every body/sprite pair created by the factory layer must conform to this shape.
 *
 * Future extensions (add fields, do NOT remove or rename existing ones):
 *   metadata?:   Record<string, unknown>   — educational labels, units, concepts
 *   observable?: ObservableState           — live data bindings
 *   relations?:  RuntimeRelation[]         — constraints, joints, parent/child
 *   tags?:       string[]                  — categorisation for selection / queries
 */
export interface RuntimeObject {
  /** Stable, globally-unique ID assigned at creation time. */
  readonly id: string;

  /** The Matter.js rigid body that drives this object's physics. */
  readonly body: Matter.Body;

  /**
   * The PixiJS Container (or Graphics sub-class) used to render this object.
   * Always centred on the body's position; rotation is driven by body.angle.
   */
  readonly display: Container;

  /** Dictates which properties are allowed to be edited at runtime. */
  readonly editableProperties?: Record<string, boolean>;

  /** Custom metadata, tags, and cached geometric shape configurations. */
  readonly metadata?: {
    label?: string;
    educationalTags?: string[];
    customData?: Record<string, unknown>;
    shapeInfo?: {
      type: 'circle' | 'rectangle';
      radius?: number;
      width?: number;
      height?: number;
      cornerRadius?: number;
      fillColor?: number | string;
      strokeColor?: number | string;
      strokeWidth?: number;
    };
  };
}
