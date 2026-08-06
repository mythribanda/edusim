import * as Matter from 'matter-js';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { OrbitalStateSnapshot, OrbitalObservableData } from './orbitalObservable.types';

/**
 * OrbitalObservables
 * Centralized, reusable calculations and observables calculation engine.
 *
 * Utilizes normalized educational units and ensures 100% pure, robust,
 * and crash-safe calculations.
 */
export class OrbitalObservables {
  /**
   * 1. calculateOrbitalRadius
   * Compute Euclidean distance between gravity source and orbiting body.
   */
  public static calculateOrbitalRadius(
    centerPos: { x: number; y: number },
    bodyPos: { x: number; y: number }
  ): number {
    const dx = bodyPos.x - centerPos.x;
    const dy = bodyPos.y - centerPos.y;
    return Math.max(0.1, Math.hypot(dx, dy));
  }

  /**
   * 2. calculateOrbitalVelocity
   * Compute speed magnitude from Matter.js velocity vector.
   */
  public static calculateOrbitalVelocity(velocity: { x: number; y: number }): number {
    return Math.hypot(velocity.x, velocity.y);
  }

  /**
   * 3. calculateKineticEnergy
   * Formula: KE = 0.5 * m * v^2
   */
  public static calculateKineticEnergy(mass: number, speed: number): number {
    if (mass <= 0 || speed <= 0) return 0;
    return 0.5 * mass * speed * speed;
  }

  /**
   * 4. calculatePotentialEnergy
   * Formula: PE = -G * M * m / r
   */
  public static calculatePotentialEnergy(G: number, M: number, m: number, r: number): number {
    if (r <= 0.1 || G <= 0 || M <= 0 || m <= 0) return 0;
    return -((G * M * m) / r);
  }

  /**
   * 5. calculateTotalEnergy
   * Formula: E = KE + PE
   */
  public static calculateTotalEnergy(ke: number, pe: number): number {
    return ke + pe;
  }

  /**
   * 6. calculateEscapeVelocity
   * Formula: v = sqrt(2 * G * M / r)
   */
  public static calculateEscapeVelocity(G: number, M: number, r: number): number {
    if (r <= 0.1 || G <= 0 || M <= 0) return 0;
    return Math.sqrt((2 * G * M) / r);
  }

  /**
   * 7. calculateOrbitalPeriod
   * Formula: T = 2 * pi * r / v (circular base) or Keplerian T = 2 * pi * sqrt(a^3 / GM)
   */
  public static calculateOrbitalPeriod(
    G: number,
    M: number,
    r: number,
    velocityMag: number
  ): number {
    if (r <= 0.1 || G <= 0 || M <= 0) return 0;
    if (velocityMag > 0.01) {
      // Direct kinematics period: T = 2 * pi * r / v
      return (2 * Math.PI * r) / velocityMag;
    }
    // Keplerian fallback: T = 2 * pi * sqrt(r^3 / (G * M))
    return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (G * M));
  }

  /**
   * 8. calculateAngularVelocity
   * Formula: omega = vTangential / r
   */
  public static calculateAngularVelocity(r: number, velocityMag: number): number {
    if (r <= 0.1 || velocityMag <= 0) return 0;
    return velocityMag / r;
  }

  /**
   * 9. calculateOrbitStability
   * Classify orbit state based on radial boundaries, velocities, and energy levels.
   */
  public static calculateOrbitStability(
    speed: number,
    circularSpeed: number,
    escapeSpeed: number,
    r: number,
    minDistanceToCollide: number
  ): { status: 'stable' | 'elliptical' | 'escape' | 'decay' | 'collision'; label: string; description: string } {
    if (r <= minDistanceToCollide) {
      return {
        status: 'collision',
        label: 'COLLISION COURSE',
        description: 'Selected planet is inside the star\'s Roche limit or collision radius!',
      };
    }

    if (speed >= escapeSpeed) {
      return {
        status: 'escape',
        label: 'ESCAPE TRAJECTORY',
        description: 'Specific mechanical energy E >= 0. Body will escape star gravity.',
      };
    }

    // Circular tolerance window
    const tol = 0.08;
    const ratio = speed / circularSpeed;

    if (Math.abs(ratio - 1.0) <= tol) {
      return {
        status: 'stable',
        label: 'STABLE CIRCULAR',
        description: 'Centripetal pull balances inertia perfectly. Stable circular loop.',
      };
    } else if (ratio > 1.0) {
      return {
        status: 'elliptical',
        label: 'BOUND ELLIPTICAL',
        description: 'Bound trajectory with visible periapsis and apoapsis points.',
      };
    } else {
      return {
        status: 'decay',
        label: 'DECAYING PATH',
        description: 'Speed is sub-circular. Gravity is pulling the planet inward.',
      };
    }
  }

  /**
   * Formatting helper for numbers
   */
  public static formatNumber(val: number, decimals = 2): string {
    if (isNaN(val) || !isFinite(val)) return '0.00';
    return val.toFixed(decimals);
  }

  /**
   * 10. generateOrbitalSnapshot
   * Generates a strongly typed state snapshot of a planet orbiting a central source.
   */
  public static generateOrbitalSnapshot(
    centerBody: Matter.Body,
    orbitingBody: Matter.Body,
    G: number
  ): OrbitalStateSnapshot {
    const timestamp = Date.now();
    
    let baseMass = 800;
    let strength = 1.0;

    if (centerBody) {
      if ((centerBody as any).customData?.mass !== undefined) {
        baseMass = (centerBody as any).customData.mass;
      } else if (centerBody.mass !== undefined) {
        baseMass = centerBody.mass;
      }

      // Retrieve gravityStrength from either Matter.Body customData or GravitySource metadata
      const customData = (centerBody as any).customData;
      if (customData) {
        if (customData.gravityStrength !== undefined) {
          strength = customData.gravityStrength;
        } else if (customData.celestialConfig?.gravityStrength !== undefined) {
          strength = customData.celestialConfig.gravityStrength;
        }
      }

      const metadata = (centerBody as any).metadata;
      if (metadata && metadata.gravityStrength !== undefined) {
        strength = metadata.gravityStrength;
      }
    }

    const M = baseMass * strength;
    const m = (orbitingBody as any).customData?.mass ?? orbitingBody.mass ?? 1.0;
    const r = this.calculateOrbitalRadius(centerBody.position, orbitingBody.position);
    const speed = this.calculateOrbitalVelocity(orbitingBody.velocity);

    const ke = this.calculateKineticEnergy(m, speed);
    const pe = this.calculatePotentialEnergy(G, M, m, r);
    const totalEnergy = this.calculateTotalEnergy(ke, pe);

    // circular speed = sqrt(G*M/r) * 16.67 (matter-js timing scale scale)
    const circSpeed = OrbitUtils.computeStableOrbitVelocity(G, M, r) * 16.67;
    const escapeSpeed = OrbitUtils.calculateEscapeVelocity(G, M, r) * 16.67;

    const period = this.calculateOrbitalPeriod(G, M, r, speed);
    const angVel = this.calculateAngularVelocity(r, speed);

    const collisionRadius = (centerBody.circleRadius || 35) + (orbitingBody.circleRadius || 8) + 5;
    const stability = this.calculateOrbitStability(speed, circSpeed, escapeSpeed, r, collisionRadius);

    const radiusData: OrbitalObservableData = {
      value: r * 100,
      unit: 'km',
      label: 'Radius',
      formattedValue: `${this.formatNumber(r * 100, 0)} km`,
      timestamp,
    };

    const velocityData: OrbitalObservableData = {
      value: speed * 10,
      unit: 'km/s',
      label: 'Orbital Speed',
      formattedValue: `${this.formatNumber(speed * 10, 1)} km/s`,
      timestamp,
    };

    const keData: OrbitalObservableData = {
      value: ke * 10,
      unit: 'GJ',
      label: 'Kinetic Energy',
      formattedValue: `${this.formatNumber(ke * 10, 0)} GJ`,
      timestamp,
    };

    const peData: OrbitalObservableData = {
      value: pe * 10,
      unit: 'GJ',
      label: 'Potential Energy',
      formattedValue: `${this.formatNumber(pe * 10, 0)} GJ`,
      timestamp,
    };

    const totalEnergyData: OrbitalObservableData = {
      value: totalEnergy * 10,
      unit: 'GJ',
      label: 'Total Mechanical Energy',
      formattedValue: `${this.formatNumber(totalEnergy * 10, 0)} GJ`,
      timestamp,
    };

    const escapeVal = escapeSpeed * 10;
    const escapeData: OrbitalObservableData = {
      value: escapeVal,
      unit: 'km/s',
      label: 'Escape Velocity',
      formattedValue: `${this.formatNumber(escapeVal, 1)} km/s`,
      timestamp,
    };

    const periodData: OrbitalObservableData = {
      value: period,
      unit: 's',
      label: 'Orbital Period',
      formattedValue: `${this.formatNumber(period, 1)} s`,
      timestamp,
    };

    const angVelData: OrbitalObservableData = {
      value: angVel,
      unit: 'rad/s',
      label: 'Angular Velocity',
      formattedValue: `${this.formatNumber(angVel, 4)} rad/s`,
      timestamp,
    };

    return {
      radius: radiusData,
      velocity: velocityData,
      kineticEnergy: keData,
      potentialEnergy: peData,
      totalEnergy: totalEnergyData,
      escapeVelocity: escapeData,
      orbitalPeriod: periodData,
      angularVelocity: angVelData,
      isStable: stability,
    };
  }
}
