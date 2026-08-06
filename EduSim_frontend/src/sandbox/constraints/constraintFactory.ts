import * as Matter from 'matter-js';

// ─── Config types ─────────────────────────────────────────────────────────────

interface ConstraintBase {
  /** Optional id — used by ConstraintRegistry for lookup. */
  id?: string;
  /** Label attached to the Matter.Constraint for debugging. */
  label?: string;
}

/**
 * Pivot — one body rotates around a fixed world point.
 * Use for pendulums, rotating levers, swing systems.
 */
export interface PivotConfig extends ConstraintBase {
  type: 'pivot';
  /** The body to anchor. */
  body: Matter.Body;
  /** World-space anchor point (the fixed pin). */
  anchor: { x: number; y: number };
  /** Distance from anchor to body centre. */
  length: number;
  /** Rigidity [0–1]. 1 = perfectly rigid rod. Default 1. */
  stiffness?: number;
  /** Damping coefficient. Default 0 (no energy loss). */
  damping?: number;
}

/**
 * Spring — elastic connection between two bodies (or a body and a world point).
 * Use for Hooke's law demos, SHM, energy transfer.
 */
export interface SpringConfig extends ConstraintBase {
  type: 'spring';
  bodyA: Matter.Body;
  /** Second body, or omit + set pointB for a fixed-point spring. */
  bodyB?: Matter.Body;
  pointB?: { x: number; y: number };
  /** Natural (rest) length of the spring. */
  length: number;
  /** Spring constant — lower = softer. Typical range [0.001 – 0.1]. Default 0.02. */
  stiffness?: number;
  /** Energy damping per step. Default 0.01. */
  damping?: number;
}

/**
 * Rope — fixed-length inextensible link between two bodies.
 * Use for rope chains, suspension, pulley-like systems.
 */
export interface RopeConfig extends ConstraintBase {
  type: 'rope';
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  /** Fixed separation distance. */
  length: number;
  /** Should be close to 1 for rope-like behaviour. Default 0.9. */
  stiffness?: number;
}

export type ConstraintConfig = PivotConfig | SpringConfig | RopeConfig;

// ─── RuntimeConstraint ────────────────────────────────────────────────────────

/** A fully-resolved constraint handle returned by the factory. */
export interface RuntimeConstraint {
  id: string;
  type: ConstraintConfig['type'];
  constraint: Matter.Constraint;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _cid = 0;
const cuid = (prefix: string) => `${prefix}-${++_cid}`;

/**
 * Create a typed Matter.js constraint from a declarative config.
 *
 * All future educational systems (pendulums, oscillators, ropes, chains)
 * should go through this factory rather than calling Matter.Constraint.create()
 * directly — keeping constraint logic decoupled from scene/component code.
 */
export function createConstraint(config: ConstraintConfig): RuntimeConstraint {
  let constraint: Matter.Constraint;
  const id  = config.id ?? cuid(config.type);

  switch (config.type) {

    case 'pivot': {
      constraint = Matter.Constraint.create({
        label:      config.label ?? id,
        bodyA:      config.body,
        pointB:     config.anchor,          // pointB = world anchor (no bodyB)
        length:     config.length,
        stiffness:  config.stiffness ?? 1,
        damping:    config.damping   ?? 0,
        render:     { visible: false },
      });
      break;
    }

    case 'spring': {
      const base: Matter.IConstraintDefinition = {
        label:     config.label ?? id,
        bodyA:     config.bodyA,
        length:    config.length,
        stiffness: config.stiffness ?? 0.02,
        damping:   config.damping   ?? 0.01,
        render:    { visible: false },
      };
      if (config.bodyB)  base.bodyB  = config.bodyB;
      if (config.pointB) base.pointB = config.pointB;
      constraint = Matter.Constraint.create(base);
      break;
    }

    case 'rope': {
      constraint = Matter.Constraint.create({
        label:     config.label ?? id,
        bodyA:     config.bodyA,
        bodyB:     config.bodyB,
        length:    config.length,
        stiffness: config.stiffness ?? 0.9,
        damping:   0,
        render:    { visible: false },
      });
      break;
    }

    default: {
      const _exhaustive: never = config;
      throw new Error(`[constraintFactory] Unknown constraint type: ${(_exhaustive as ConstraintConfig).type}`);
    }
  }

  return { id, type: config.type, constraint };
}
