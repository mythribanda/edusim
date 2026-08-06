import * as Matter from 'matter-js';
import { OrbitUtils } from './orbitUtils';
import type { OrbitSpawnOptions } from './orbit.types';

/**
 * OrbitSpawner
 * The high-level orbital initialization system.
 *
 * Integrates directly with Matter.js bodies and our custom gravity systems.
 * Provides mathematically sound solvers for stable circular orbits and custom
 * elliptical orbits using the Keplerian Vis-Viva equation.
 */
export class OrbitSpawner {
  /**
   * Helper to retrieve the virtual or actual mass of a body.
   * Static bodies in Matter.js have infinite mass, so we inspect custom properties
   * or default to a reasonable educational massive value (800).
   */
  public static getEffectiveMass(body: Matter.Body): number {
    if (!body) return 1;
    let baseMass = 1;
    if ((body as any).customData?.mass !== undefined) {
      baseMass = (body as any).customData.mass;
    } else if (body.isStatic) {
      baseMass = 800; // Standard solar mass default
    } else {
      baseMass = body.mass || 1;
    }

    // Multiply by gravityStrength multiplier if configured
    const customData = (body as any).customData;
    let strength = 1.0;
    if (customData) {
      if (customData.gravityStrength !== undefined) {
        strength = customData.gravityStrength;
      } else if (customData.celestialConfig?.gravityStrength !== undefined) {
        strength = customData.celestialConfig.gravityStrength;
      }
    }

    return baseMass * strength;
  }

  /**
   * Spawns a stable circular orbit around a center body.
   * If radius is not specified, uses the current distance between the two bodies.
   */
  public static spawnCircularOrbit(options: OrbitSpawnOptions, G = OrbitUtils.DEFAULT_G, softeningFactor = 100): void {
    const { centerBody, orbitingBody, angle = 0, clockwise = true, initialVelocityMultiplier = 1.0 } = options;

    if (!centerBody || !orbitingBody) {
      console.warn('[OrbitSpawner] Missing center or orbiting body reference.');
      return;
    }

    // 1. Calculate effective radius
    let r = options.radius;
    if (r === undefined || r <= 0) {
      r = OrbitUtils.calculateDistance(centerBody.position, orbitingBody.position);
    }
    if (r < 10) r = 150;

    // 2. Position orbiting body at the target radius relative to the center body
    const finalAngle = options.radius !== undefined ? angle : Math.atan2(
      orbitingBody.position.y - centerBody.position.y,
      orbitingBody.position.x - centerBody.position.x
    );

    const targetX = centerBody.position.x + r * Math.cos(finalAngle);
    const targetY = centerBody.position.y + r * Math.sin(finalAngle);
    Matter.Body.setPosition(orbitingBody, { x: targetX, y: targetY });

    // 3. Compute stable orbital circular speed using softening-aware formula:
    //    v = sqrt(G * M * r / (r^2 + softening)) * dt
    const M = this.getEffectiveMass(centerBody);
    let speed = OrbitUtils.calculateCircularOrbitVelocity(G, M, r, softeningFactor) * 16.67;
    speed *= initialVelocityMultiplier;

    // 4. Compute perpendicular velocity vector tangent to center body
    const velVec = OrbitUtils.calculateTangentialVelocityVector(
      centerBody.position,
      { x: targetX, y: targetY },
      speed,
      clockwise
    );

    // Galilean frame transition: Add parent velocity for stable orbit in moving frame
    velVec.x += centerBody.velocity.x;
    velVec.y += centerBody.velocity.y;

    Matter.Body.setVelocity(orbitingBody, velVec);

    if (!(orbitingBody as any).customData) (orbitingBody as any).customData = {};
    (orbitingBody as any).customData.referenceRadius = r;
    (orbitingBody as any).customData.referenceAngle = finalAngle;
    (orbitingBody as any).customData.orbitType = 'circular';
  }

  /**
   * Spawns a stable Keplerian elliptical orbit around a center body.
   * Uses the Vis-Viva equation at periapsis: v = sqrt( G * M * (1 + e) / r_periapsis )
   */
  public static spawnEllipticalOrbit(options: OrbitSpawnOptions, G = OrbitUtils.DEFAULT_G): void {
    const { centerBody, orbitingBody, angle = 0, clockwise = true, eccentricity = 0.25, initialVelocityMultiplier = 1.0 } = options;

    if (!centerBody || !orbitingBody) {
      console.warn('[OrbitSpawner] Missing center or orbiting body reference.');
      return;
    }

    // Clamp eccentricity between safe elliptical limits [0.0, 0.95]
    const e = Math.max(0, Math.min(0.95, eccentricity));

    // 1. Calculate periapsis radius
    let r_p = options.radius;
    if (r_p === undefined || r_p <= 0) {
      r_p = OrbitUtils.calculateDistance(centerBody.position, orbitingBody.position);
    }

    if (r_p < 10) {
      r_p = 150;
    }

    // 2. Position orbiting body at periapsis relative to the center body
    const finalAngle = options.radius !== undefined ? angle : Math.atan2(
      orbitingBody.position.y - centerBody.position.y,
      orbitingBody.position.x - centerBody.position.x
    );

    const targetX = centerBody.position.x + r_p * Math.cos(finalAngle);
    const targetY = centerBody.position.y + r_p * Math.sin(finalAngle);

    Matter.Body.setPosition(orbitingBody, { x: targetX, y: targetY });

    // 3. Compute periapsis speed using the Vis-Viva elliptical velocity equation:
    // v_p = sqrt( G * M * (1 + e) / r_p ) * dt
    const M = this.getEffectiveMass(centerBody);
    if (M <= 0) return;

    let speed = Math.sqrt((G * M * (1 + e)) / r_p) * 16.67;

    // Apply speed scaling factor
    speed *= initialVelocityMultiplier;

    // 4. Calculate perpendicular tangential velocity vector
    const velVec = OrbitUtils.calculateTangentialVelocityVector(
      centerBody.position,
      orbitingBody.position,
      speed,
      clockwise
    );

    // Galilean frame transition: Add parent velocity to make the orbit stable in a moving frame
    velVec.x += centerBody.velocity.x;
    velVec.y += centerBody.velocity.y;

    // 5. Apply velocity cleanly to Matter body
    Matter.Body.setVelocity(orbitingBody, velVec);

    if (!(orbitingBody as any).customData) (orbitingBody as any).customData = {};
    (orbitingBody as any).customData.referenceRadius = r_p;
    (orbitingBody as any).customData.referenceAngle = finalAngle;
    (orbitingBody as any).customData.orbitType = 'elliptical';
  }
}
