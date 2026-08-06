import type { RuntimeStore } from '../state/runtimeStore';
import type { TutorMessageType } from '../ui/TutorOverlay';

// ─── Topic identifiers ────────────────────────────────────────────────────────

export type PhysicsTopic =
  | 'empty'
  | 'free_fall'
  | 'newtons_laws'
  | 'pendulum'
  | 'shm_spring'
  | 'tension_rope'
  | 'collision'
  | 'mixed';

// ─── Topic result ─────────────────────────────────────────────────────────────

export interface TopicResult {
  /** Canonical identifier for the active physics topic. */
  topic: PhysicsTopic;
  /** Short human-readable label, e.g. "Pendulum / Rotational Motion" */
  label: string;
  /** Physics formula to highlight in the TutorOverlay formula box. */
  formula?: string;
  /** Title for the TutorOverlay card. */
  tutorTitle: string;
  /** Body text for the TutorOverlay card. */
  tutorMessage: string;
  /** TutorOverlay message type (controls color / icon). */
  messageType: TutorMessageType;
  /**
   * Observable types that should be shown on newly-spawned objects for this
   * topic. Drives ObservableEngine registrations automatically.
   */
  recommendedObservables: Array<
    'velocity' | 'acceleration' | 'force' | 'momentum' | 'kineticEnergy' | 'angularVelocity'
  >;
}

// ─── Topic library ────────────────────────────────────────────────────────────

const TOPIC_LIBRARY: Record<Exclude<PhysicsTopic, 'empty' | 'mixed'>, TopicResult> = {
  free_fall: {
    topic: 'free_fall',
    label: 'Free Fall / Projectile Motion',
    formula: 'y = ½ g t²',
    tutorTitle: 'Free Fall Detected',
    tutorMessage:
      'Objects in free fall accelerate downward under gravity alone — no other horizontal forces act. ' +
      'Watch the velocity arrow grow steadily as the object speeds up. ' +
      'Drag the shape sideways and observe projectile motion!',
    messageType: 'concept',
    recommendedObservables: ['velocity', 'acceleration'],
  },

  newtons_laws: {
    topic: 'newtons_laws',
    label: "Newton's Laws of Motion",
    formula: 'F = m · a',
    tutorTitle: "Newton's Second Law in Action",
    tutorMessage:
      'You have dynamic objects on the canvas. Apply a force using the Property Panel and watch ' +
      'acceleration scale with it (F = ma). ' +
      'Try changing the mass — a heavier object needs more force for the same acceleration.',
    messageType: 'insight',
    recommendedObservables: ['velocity', 'acceleration', 'force'],
  },

  pendulum: {
    topic: 'pendulum',
    label: 'Pendulum / Rotational Motion',
    formula: 'T = 2π √(L/g)',
    tutorTitle: 'Pendulum System Active',
    tutorMessage:
      'A pivot constraint creates a pendulum. The period depends only on the arm length (L) ' +
      'and gravity (g) — not the mass of the bob. ' +
      'Increase the pivot length in the Constraint Tuning panel and watch the swing slow down.',
    messageType: 'concept',
    recommendedObservables: ['velocity', 'angularVelocity'],
  },

  shm_spring: {
    topic: 'shm_spring',
    label: "Hooke's Law / Simple Harmonic Motion",
    formula: 'F = −k·x',
    tutorTitle: 'Spring Oscillator Detected',
    tutorMessage:
      "A spring constraint obeys Hooke's Law: the restoring force is proportional to stretch distance. " +
      'This produces Simple Harmonic Motion (SHM). ' +
      'Lower the stiffness (k) in the Constraint Tuning panel to slow the oscillation.',
    messageType: 'concept',
    recommendedObservables: ['velocity', 'kineticEnergy'],
  },

  tension_rope: {
    topic: 'tension_rope',
    label: 'Tension / Rope Mechanics',
    formula: 'T = m · (g + a)',
    tutorTitle: 'Rope / Tension System Active',
    tutorMessage:
      'A rope constraint transmits tension — an inextensible pulling force along its length. ' +
      'The tension increases with mass and acceleration. ' +
      'Drop a heavy shape onto the rope terminal to feel the tension increase.',
    messageType: 'concept',
    recommendedObservables: ['velocity', 'momentum'],
  },

  collision: {
    topic: 'collision',
    label: 'Collisions / Conservation of Momentum',
    formula: 'p = m · v   (conserved)',
    tutorTitle: 'Collision Scenario Detected',
    tutorMessage:
      'Multiple free bodies are on the canvas — perfect for studying collisions! ' +
      'Momentum is conserved in every collision. ' +
      'Use the Impulse buttons to launch objects and observe the momentum vectors before and after impact.',
    messageType: 'insight',
    recommendedObservables: ['momentum', 'kineticEnergy'],
  },
};

// ─── Inference function ───────────────────────────────────────────────────────

/**
 * Inspect the current state of `RuntimeStore` and derive the dominant
 * physics topic being demonstrated on the canvas.
 *
 * Priority order (highest to lowest):
 *   1. Pivot constraint  →  pendulum
 *   2. Spring constraint →  SHM / Hooke's law
 *   3. Rope constraint   →  tension
 *   4. ≥2 free bodies, no constraints → collision / momentum
 *   5. 1 free body, no constraints    → free fall / Newton's 2nd law
 *   6. Nothing dynamic               → empty
 *
 * When multiple constraint types coexist, returns `mixed`.
 */
export function inferActiveTopics(store: RuntimeStore): TopicResult | null {
  const dynamicObjects = store.getAllObjects().filter((o) => !o.body.isStatic);
  if (dynamicObjects.length === 0) return null;

  const constraints = store.getAllConstraints();
  const hasPivot  = constraints.some((c) => c.type === 'pivot');
  const hasSpring = constraints.some((c) => c.type === 'spring');
  const hasRope   = constraints.some((c) => c.type === 'rope');

  const constraintTypeCount = [hasPivot, hasSpring, hasRope].filter(Boolean).length;

  // Mixed constraint scene
  if (constraintTypeCount > 1) {
    return {
      topic: 'mixed',
      label: 'Mixed Physics Scenario',
      tutorTitle: 'Complex System Active',
      tutorMessage:
        'You have multiple constraint types in play. Each one introduces different physics: ' +
        'pivots → pendulum, springs → SHM, ropes → tension. ' +
        'Try isolating one constraint at a time to study each concept independently.',
      messageType: 'hint',
      recommendedObservables: ['velocity', 'acceleration'],
    };
  }

  // Single dominant constraint
  if (hasPivot)  return TOPIC_LIBRARY.pendulum;
  if (hasSpring) return TOPIC_LIBRARY.shm_spring;
  if (hasRope)   return TOPIC_LIBRARY.tension_rope;

  // No constraints — infer from object count
  if (dynamicObjects.length >= 2) return TOPIC_LIBRARY.collision;
  if (dynamicObjects.length === 1) {
    // If an applied force is potentially visible, prefer Newton's 2nd Law messaging
    return TOPIC_LIBRARY.newtons_laws;
  }

  return null;
}

/**
 * Returns true when the inferred topic has changed between two successive
 * calls. Used to avoid re-firing the same tutor message on every small update.
 */
export function topicChanged(prev: TopicResult | null, next: TopicResult | null): boolean {
  if (prev === null && next === null) return false;
  if (prev === null || next === null) return true;
  return prev.topic !== next.topic;
}
