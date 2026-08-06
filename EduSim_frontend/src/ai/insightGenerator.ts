import { PhysicsEvent } from './physicsEventBus';

export interface ExplanationInsight {
  title: string;
  explanation: string;
  effects: string[];
  formula: string;
  suggestions: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, decimals = 2) => Number(n).toFixed(decimals);
const fmtN = (n: number) => Number(n).toFixed(1);

// Gravity (m/s²) scaled from Matter.js internal units (approx × 9.8)
const gravLabel = (g: number) => {
  if (g === 0)    return 'zero-g (weightless)';
  if (g <= 0.2)   return 'moon-like gravity';
  if (g <= 1.05)  return 'Earth gravity';
  return 'high-gravity';
};

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateInsight(event: PhysicsEvent): ExplanationInsight | null {
  switch (event.type) {

    // ── Object spawned (drag-drop or button) ──────────────────────────────────
    case 'OBJECT_SPAWNED': {
      const mass    = event.metadata?.mass   ? `${fmtN(event.metadata.mass)} kg` : 'unknown mass';
      const gVal    = event.metadata?.gravity ?? 9.8;
      const gScaled = fmtN(gVal * 9.8);          // convert Matter unit → m/s²
      const shape   = event.metadata?.shape  ?? 'object';
      const name    = event.metadata?.name   ?? shape;
      const weight  = event.metadata?.mass
        ? `${fmtN(event.metadata.mass * gVal * 9.8)} N`
        : '—';
      return {
        title: `${name} released — free-fall begins`,
        explanation:
          `This ${shape} (mass ≈ ${mass}) is now in free-fall under ${gravLabel(gVal)}. ` +
          `Gravity accelerates it downward at ${gScaled} m/s² and exerts a weight force of ${weight}. ` +
          `It will keep accelerating until it hits something.`,
        effects: [
          `Downward acceleration: ${gScaled} m/s²`,
          `Weight force: ${weight}`,
          'Velocity increases every second',
          'Kinetic energy builds as it falls',
        ],
        formula: 'F_gravity = m × g   |   v = g × t',
        suggestions: ['Change Gravity', 'Change Mass', 'Add Spring'],
      };
    }

    // ── Object came to rest ───────────────────────────────────────────────────
    case 'OBJECT_AT_REST': {
      const friction = event.metadata?.friction ?? 0;
      const rest     = event.metadata?.restitution ?? 0;
      return {
        title: 'Object came to rest — energy dissipated',
        explanation:
          `The object stopped moving. Friction (μ = ${fmt(friction)}) and ` +
          `low restitution (e = ${fmt(rest)}) converted its kinetic energy into ` +
          `heat and sound, bringing it to equilibrium.`,
        effects: [
          'Kinetic energy → 0 J',
          `Friction coefficient: μ = ${fmt(friction)}`,
          `Bounciness (restitution): e = ${fmt(rest)}`,
          'Net force on object: 0 N (balanced)',
        ],
        formula: 'ΔKE = −W_friction = −μ × N × d',
        suggestions: ['Apply Force', 'Change Restitution', 'Upward Blast'],
      };
    }

    // ── Mass changed ──────────────────────────────────────────────────────────
    case 'MASS_CHANGED': {
      const isIncrease = event.newValue > event.oldValue;
      const diff       = Math.abs(event.newValue - event.oldValue);
      const inertiaDir = isIncrease ? 'higher' : 'lower';
      return {
        title: `Mass ${isIncrease ? 'increased' : 'decreased'}: ${fmtN(event.oldValue)} kg → ${fmtN(event.newValue)} kg`,
        explanation:
          `Inertia is now ${inertiaDir} — the object needs ` +
          `${isIncrease ? 'more' : 'less'} force to achieve the same acceleration. ` +
          `A ${fmtN(diff)} kg change means its weight changed by ` +
          `≈ ${fmtN(diff * 9.8)} N under Earth gravity.`,
        effects: [
          `Inertia: ${inertiaDir} (resists changes in motion more)`,
          `Weight change: ≈ ${fmtN(diff * 9.8)} N`,
          `Momentum at same speed: ${isIncrease ? 'larger' : 'smaller'} (p = mv)`,
          `Collision impact: ${isIncrease ? 'stronger' : 'weaker'}`,
        ],
        formula: 'F = m × a   |   p = m × v   |   W = m × g',
        suggestions: ['Apply Force', 'Check Collision'],
      };
    }

    // ── Gravity changed ───────────────────────────────────────────────────────
    case 'GRAVITY_CHANGED': {
      const gNew   = event.newValue;
      const gOld   = event.oldValue;
      const gUpDir = gNew > gOld;
      const gMs    = fmtN(gNew * 9.8);   // human-readable m/s²
      const gOldMs = fmtN(gOld * 9.8);
      return {
        title: `Gravity changed: ${gOldMs} m/s² → ${gMs} m/s²  (${gravLabel(gNew)})`,
        explanation:
          `All objects now accelerate downward at ${gMs} m/s². ` +
          `${gNew === 0
            ? 'In zero-g, objects float — weight is 0 N for every body.'
            : `Under ${gravLabel(gNew)}, a 1 kg object weighs ${fmtN(gNew * 9.8)} N. ` +
              `A 10 kg object weighs ${fmtN(10 * gNew * 9.8)} N.`}`,
        effects: [
          `Free-fall acceleration: ${gMs} m/s²`,
          `1 kg object weight: ${fmtN(gNew * 9.8)} N`,
          gUpDir ? 'Objects fall faster' : 'Objects fall slower',
          gUpDir ? 'Collisions are more violent' : 'Collisions are gentler',
          gNew === 0 ? 'Objects float indefinitely' : '',
        ].filter(Boolean),
        formula: 'F_w = m × g   |   PE = m × g × h   |   v = g × t',
        suggestions: ['Add Object', 'Add Spring'],
      };
    }

    // ── Friction changed ──────────────────────────────────────────────────────
    case 'FRICTION_CHANGED': {
      const mu     = event.newValue;
      const muOld  = event.oldValue;
      const isUp   = mu > muOld;
      // Example: 5 kg object on a flat surface, normal force = mass × g
      const exampleMass = 5;
      const frictionForce = fmtN(mu * exampleMass * 9.8);
      return {
        title: `Friction ${isUp ? 'increased' : 'decreased'}: μ = ${fmt(muOld)} → ${fmt(mu)}`,
        explanation:
          `Friction now opposes sliding with coefficient μ = ${fmt(mu)}. ` +
          `For a ${exampleMass} kg object on a flat surface, this creates a friction force of ` +
          `≈ ${frictionForce} N. ${isUp
            ? 'The object will stop much faster.'
            : 'The object will slide further before stopping.'}`,
        effects: [
          `Friction force (5 kg example): ≈ ${frictionForce} N`,
          isUp ? 'Objects decelerate faster' : 'Objects slide further',
          isUp ? 'More kinetic energy lost to heat' : 'Less energy lost to heat',
          'Affects rolling and sliding equally',
        ],
        formula: 'F_f = μ × N   |   N = m × g',
        suggestions: ['Apply Force', 'Change Mass'],
      };
    }

    // ── Restitution changed ───────────────────────────────────────────────────
    case 'RESTITUTION_CHANGED': {
      const e    = event.newValue;
      const eOld = event.oldValue;
      const isUp = e > eOld;
      const elasticType =
        e >= 0.95 ? 'perfectly elastic (no energy lost)'
        : e >= 0.6 ? 'highly elastic'
        : e >= 0.3 ? 'partially elastic'
        : 'nearly inelastic (most energy absorbed)';
      return {
        title: `Bounciness ${isUp ? 'up' : 'down'}: e = ${fmt(eOld)} → ${fmt(e)}`,
        explanation:
          `Restitution e = ${fmt(e)} means the object is ${elasticType}. ` +
          `If dropped from 1 m, it will bounce back to ≈ ${fmtN(e * e * 100)} cm. ` +
          `${isUp
            ? 'More kinetic energy survives each collision.'
            : 'More kinetic energy is lost as deformation and heat.'}`,
        effects: [
          `Bounce height from 1 m drop: ≈ ${fmtN(e * e * 100)} cm`,
          `Energy retained per bounce: ${fmtN(e * e * 100)}%`,
          isUp ? 'Longer bouncing sequence' : 'Shorter bouncing sequence',
          e >= 0.95 ? 'Elastic: momentum fully conserved' : 'Inelastic: some momentum lost',
        ],
        formula: 'e = v_after / v_before   |   KE_after = e² × KE_before',
        suggestions: ['Drop Object', 'Test Collision'],
      };
    }

    // ── Spring created ────────────────────────────────────────────────────────
    case 'SPRING_CREATED': {
      const k = event.metadata?.stiffness ?? 0.02;
      // Period estimate (approximate — depends on mass, but useful heuristic)
      const periodEst = fmtN(2 * Math.PI * Math.sqrt(1 / (k * 1000)));
      return {
        title: `Spring attached — oscillation begins (k ≈ ${fmt(k, 3)})`,
        explanation:
          `A spring with stiffness k = ${fmt(k, 3)} is now connected. ` +
          `It generates a restoring force proportional to how far it stretches or compresses. ` +
          `The object will oscillate (bounce up and down) in simple harmonic motion. ` +
          `Estimated oscillation period: ≈ ${periodEst} s.`,
        effects: [
          `Spring stiffness: k = ${fmt(k, 3)}`,
          `Restoring force grows as spring stretches`,
          `Elastic potential energy stored: PE = ½kx²`,
          'Energy converts: PE ↔ KE every half-cycle',
        ],
        formula: 'F = −k × x   |   PE = ½kx²   |   T = 2π√(m/k)',
        suggestions: ['Change Mass', 'Change Gravity'],
      };
    }

    // ── Rope created ──────────────────────────────────────────────────────────
    case 'ROPE_CREATED': {
      return {
        title: 'Rope constraint added — tension force active',
        explanation:
          `A rope limits the maximum distance between two points. ` +
          `When taut, it exerts an equal and opposite tension force on both ends. ` +
          `Unlike a spring, a rope only pulls — it cannot push.`,
        effects: [
          'Constrains maximum separation distance',
          'Tension force acts along the rope direction',
          'Creates pendulum-like swinging motion',
          'Rope goes slack when objects move closer',
        ],
        formula: 'T = m × (g + a_centripetal)   |   a_c = v² / r',
        suggestions: ['Change Gravity', 'Apply Force'],
      };
    }

    // ── Pivot created ─────────────────────────────────────────────────────────
    case 'PIVOT_CREATED': {
      return {
        title: 'Pivot attached — pendulum motion possible',
        explanation:
          `A pivot is a fixed anchor point. The connected body swings around it like a pendulum. ` +
          `Gravity pulls the body down while the pivot provides an inward centripetal force. ` +
          `The period of swing depends on the length and gravity.`,
        effects: [
          'Body swings in an arc around the fixed pivot',
          'Gravity acts as restoring force',
          'Longer arm → slower swing',
          'Higher gravity → faster swing',
        ],
        formula: 'T = 2π√(L/g)   |   F_centripetal = mv²/r',
        suggestions: ['Change Gravity', 'Change Mass'],
      };
    }

    // ── Collision detected ────────────────────────────────────────────────────
    case 'COLLISION_DETECTED': {
      const pairs  = event.metadata?.pairsCount ?? 1;
      const speed  = event.metadata?.relativeSpeed;
      const impulse = event.metadata?.impulse;
      const speedStr   = speed  ? ` at relative speed ≈ ${fmt(speed, 1)} m/s` : '';
      const impulseStr = impulse ? ` (impulse ≈ ${fmt(impulse, 2)} N·s)` : '';
      return {
        title: `Collision detected${speedStr}${impulseStr}`,
        explanation:
          `${pairs > 1 ? `${pairs} collision pairs` : 'Two objects'} just collided. ` +
          `Momentum is conserved — what one object loses, the other gains. ` +
          `The restitution coefficient determines how much kinetic energy is preserved. ` +
          `${speed ? `Impact speed was ≈ ${fmt(speed, 1)} m/s.` : ''}`,
        effects: [
          'Momentum transferred between objects',
          `Kinetic energy ${event.metadata?.restitution >= 0.9 ? 'mostly preserved (elastic)' : 'partially lost (inelastic)'}`,
          'Brief but large impulsive force acted',
          pairs > 1 ? `${pairs} simultaneous contact points` : 'Single contact point',
        ],
        formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'   |   p = m × v',
        suggestions: ['Change Restitution', 'Change Mass'],
      };
    }

    // ── Force applied ─────────────────────────────────────────────────────────
    case 'FORCE_APPLIED': {
      const fx   = event.newValue?.x ?? 0;
      const fy   = event.newValue?.y ?? 0;
      const fMag = fmtN(Math.hypot(fx, fy) * 1000);  // scale to readable N
      const mass = event.metadata?.mass;
      const accStr = mass
        ? `  →  acceleration ≈ ${fmtN((Math.hypot(fx, fy) * 1000) / mass)} m/s²`
        : '';
      return {
        title: `Force applied: ≈ ${fMag} N${accStr}`,
        explanation:
          `An external force of ≈ ${fMag} N is pushing this object. ` +
          `According to Newton's 2nd Law, this directly causes acceleration. ` +
          `${mass ? `With mass = ${fmtN(mass)} kg, the resulting acceleration is ≈ ${fmtN((Math.hypot(fx, fy) * 1000) / mass)} m/s².` : ''}`,
        effects: [
          `Applied force magnitude: ≈ ${fMag} N`,
          mass ? `Resulting acceleration: ≈ ${fmtN((Math.hypot(fx, fy) * 1000) / mass)} m/s²` : 'Velocity changes in force direction',
          'Kinetic energy increases each second',
          'Momentum builds up over time',
        ],
        formula: 'F = m × a   |   W = F × d   |   p = F × t',
        suggestions: ['Change Friction', 'Change Mass'],
      };
    }

    default:
      return null;
  }
}
