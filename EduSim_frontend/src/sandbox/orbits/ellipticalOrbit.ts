import * as Matter from 'matter-js';
import { OrbitUtils } from './orbitUtils';
import { OrbitSpawner } from './orbitSpawner';

export interface EllipticalOrbitOptions {
  centerBody: Matter.Body;
  orbitingBody: Matter.Body;
  velocityMultiplier: number;
  clockwise?: boolean;
  initialRadius?: number;
  initialAngle?: number;
  stabilization?: boolean;
}

/**
 * Calculates the elliptical velocity given circular velocity and velocity multiplier.
 */
export function calculateEllipticalVelocity(circularVelocity: number, velocityMultiplier: number): number {
  if (isNaN(circularVelocity) || !isFinite(circularVelocity)) return 0;
  return circularVelocity * velocityMultiplier;
}

/**
 * Estimates the orbital eccentricity from the velocity multiplier.
 * Formula: e = |velocityMultiplier^2 - 1|
 */
export function calculateOrbitEccentricityEstimate(velocityMultiplier: number): number {
  if (isNaN(velocityMultiplier) || !isFinite(velocityMultiplier)) return 0;
  return Math.abs(velocityMultiplier * velocityMultiplier - 1);
}

/**
 * Determines whether the velocity multiplier yields an escape trajectory.
 * Escape occurs when velocityMultiplier >= sqrt(2) ≈ 1.414
 */
export function isEscapeTrajectory(velocityMultiplier: number): boolean {
  if (isNaN(velocityMultiplier) || !isFinite(velocityMultiplier)) return false;
  return velocityMultiplier >= Math.SQRT2;
}

/**
 * Spawns an elliptical orbit around a central massive body.
 *
 * Elliptical orbits emerge naturally from:
 *   same gravity system, different initial velocity conditions (velocity != circular velocity)
 */
export function spawnEllipticalOrbit(
  options: EllipticalOrbitOptions,
  G = OrbitUtils.DEFAULT_G
): void {
  const {
    centerBody,
    orbitingBody,
    velocityMultiplier,
    clockwise = true,
    initialRadius,
    initialAngle,
    stabilization = true,
  } = options;

  // STEP 11 — Runtime Safety & validations
  if (!centerBody || !orbitingBody) {
    console.warn('[EllipticalOrbit] Missing center or orbiting body reference.');
    return;
  }

  // Prevent destroyed/invalid bodies
  if (typeof centerBody.position?.x !== 'number' || typeof orbitingBody.position?.x !== 'number') {
    console.warn('[EllipticalOrbit] Center or orbiting body has invalid/destroyed position.');
    return;
  }

  // STEP 3 — Compute Radius Vector
  const radiusVector = {
    x: orbitingBody.position.x - centerBody.position.x,
    y: orbitingBody.position.y - centerBody.position.y,
  };

  let r = Math.hypot(radiusVector.x, radiusVector.y);

  // Safe radius clamping to prevent overlapping / zero radius / infinite acceleration
  const centerRadius = centerBody.circleRadius || (centerBody as any).customData?.celestialConfig?.radius || 35;
  const orbitingRadius = orbitingBody.circleRadius || (orbitingBody as any).customData?.celestialConfig?.radius || 8;
  const minSafeRadius = centerRadius + orbitingRadius + 10;

  if (r < minSafeRadius) {
    r = minSafeRadius;
  }

  let finalAngle = Math.atan2(radiusVector.y, radiusVector.x);

  // Use initialRadius if specifically provided and stabilization is enabled
  if (stabilization && initialRadius !== undefined && initialRadius > 0) {
    r = Math.max(minSafeRadius, initialRadius);
    if (initialAngle !== undefined) {
      finalAngle = initialAngle;
    }
    const targetX = centerBody.position.x + r * Math.cos(finalAngle);
    const targetY = centerBody.position.y + r * Math.sin(finalAngle);
    Matter.Body.setPosition(orbitingBody, { x: targetX, y: targetY });
  }

  // Recalculate radiusVector based on final actual position
  const finalRadiusVector = {
    x: orbitingBody.position.x - centerBody.position.x,
    y: orbitingBody.position.y - centerBody.position.y,
  };
  const finalR = Math.hypot(finalRadiusVector.x, finalRadiusVector.y);

  // STEP 4 — Compute Tangential Direction
  const normalizedRadius = finalR > 0.0001 ? { x: finalRadiusVector.x / finalR, y: finalRadiusVector.y / finalR } : { x: Math.cos(finalAngle), y: Math.sin(finalAngle) };
  const clockwiseDir = clockwise !== false;
  const tangent = clockwiseDir
    ? { x: -normalizedRadius.y, y: normalizedRadius.x }
    : { x: normalizedRadius.y, y: -normalizedRadius.x };

  // Double check tangent coordinates are valid numbers to prevent NaN
  if (isNaN(tangent.x) || isNaN(tangent.y)) {
    tangent.x = 0;
    tangent.y = clockwiseDir ? 1 : -1;
  }

  // STEP 5 — Compute Circular Velocity
  const M = OrbitSpawner.getEffectiveMass(centerBody);
  if (M <= 0) {
    console.warn('[EllipticalOrbit] Center body has non-positive effective mass.');
    return;
  }

  // Incorporate standard softening factor (100) for stability in the EduSim physics runtime
  const circularSpeed = OrbitUtils.calculateCircularOrbitVelocity(G, M, r, 100) * 16.67;

  // STEP 6 — Build Elliptical Velocity
  const ellipticalSpeed = calculateEllipticalVelocity(circularSpeed, velocityMultiplier);

  // Clamp velocity to prevent extreme velocities that would break simulation stability
  const maxSafeVelocity = 100.0;
  const speed = Math.max(0, Math.min(maxSafeVelocity, ellipticalSpeed));

  // STEP 7 — Apply Velocity cleanly
  // Galilean frame transition: Add parent velocity to make the orbit stable in a moving frame
  const velVec = {
    x: tangent.x * speed + centerBody.velocity.x,
    y: tangent.y * speed + centerBody.velocity.y,
  };

  // Prevent any NaN values from propagating to Matter.js body velocity
  if (isNaN(velVec.x) || isNaN(velVec.y)) {
    velVec.x = centerBody.velocity.x;
    velVec.y = centerBody.velocity.y;
  }

  Matter.Body.setVelocity(orbitingBody, velVec);

  // STEP 9 — Add Elliptical Orbit Metadata
  const eccentricityEstimate = calculateOrbitEccentricityEstimate(velocityMultiplier);
  const isEscape = isEscapeTrajectory(velocityMultiplier);

  let periapsis = r;
  let apoapsis = r;

  if (isEscape) {
    periapsis = r;
    apoapsis = Infinity;
  } else {
    // Keplerian elliptical trajectory boundaries calculations
    if (velocityMultiplier < 1) {
      apoapsis = r;
      periapsis = r * (velocityMultiplier * velocityMultiplier) / (2 - velocityMultiplier * velocityMultiplier);
    } else if (velocityMultiplier > 1) {
      periapsis = r;
      apoapsis = r * (velocityMultiplier * velocityMultiplier) / (2 - velocityMultiplier * velocityMultiplier);
    }
  }

  // Attach metadata securely to orbiting body's customData
  const customData = (orbitingBody as any).customData || {};
  customData.orbitType = 'elliptical';
  customData.velocityMultiplier = velocityMultiplier;
  customData.eccentricityEstimate = eccentricityEstimate;
  customData.periapsis = periapsis;
  customData.apoapsis = apoapsis;
  customData.isEscapeTrajectory = isEscape;
  customData.referenceRadius = r;
  customData.referenceAngle = finalAngle;
  (orbitingBody as any).customData = customData;

  // STEP 13 — Debugging & Diagnostics
  console.log('[EllipticalOrbit] Diagnostics:');
  console.log(' - G:', G);
  console.log(' - Center Mass:', M);
  console.log(' - Orbiting Mass:', OrbitSpawner.getEffectiveMass(orbitingBody));
  console.log(' - Radius at Spawn:', r);
  console.log(' - Circular Velocity:', circularSpeed.toFixed(4));
  console.log(' - Elliptical Velocity:', speed.toFixed(4));
  console.log(' - Velocity Multiplier:', velocityMultiplier);
  console.log(' - Eccentricity Estimate:', eccentricityEstimate.toFixed(4));
  console.log(' - Orbit Type:', isEscape ? 'escape' : (eccentricityEstimate === 0 ? 'circular' : 'elliptical'));
  console.log(' - Periapsis:', isFinite(periapsis) ? periapsis.toFixed(1) : 'Infinite');
  console.log(' - Apoapsis:', isFinite(apoapsis) ? apoapsis.toFixed(1) : 'Infinite');
  console.log(' - Escape Trajectory:', isEscape);
}
