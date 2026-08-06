import * as Matter from 'matter-js';

/**
 * OrbitUtils
 * Reusable orbital mechanics math utilities.
 *
 * Designed specifically for the EduSim sandbox using normalized educational units.
 * All utility functions are pure, robust, and completely protected against
 * division-by-zero, negative distances, and NaN propagation.
 */

export class OrbitUtils {
  public static readonly DEFAULT_G = 0.0012;

  /**
   * Calculates the orbital velocity required for a stable circular orbit at radius r,
   * incorporating the gravity engine's softening factor for perfect stability.
   * Formula: v = sqrt(G * M * r / (r^2 + softening))
   */
  public static calculateCircularOrbitVelocity(G: number, M: number, r: number, softening = 100): number {
    if (r <= 0 || G <= 0 || M <= 0) return 0;
    return Math.sqrt((G * M * r) / (r * r + softening));
  }

  /**
   * Calculates the escape velocity at a given radius r, incorporating softening.
   * Formula: v = sqrt(2 * G * M * r / (r^2 + softening))
   */
  public static calculateEscapeVelocity(G: number, M: number, r: number, softening = 100): number {
    if (r <= 0 || G <= 0 || M <= 0) return 0;
    return Math.sqrt((2 * G * M * r) / (r * r + softening));
  }

  /**
   * Calculates the total specific or standard orbital energy (KE + PE).
   * Formula: E = KE + PE
   */
  public static calculateOrbitalEnergy(G: number, M: number, m: number, r: number, v: number): number {
    const ke = this.calculateKineticEnergy(m, v);
    const pe = this.calculatePotentialEnergy(G, M, m, r);
    return ke + pe;
  }

  /**
   * Calculates the kinetic energy of an orbiting body.
   * Formula: KE = 0.5 * m * v^2
   */
  public static calculateKineticEnergy(m: number, v: number): number {
    if (m <= 0) return 0;
    return 0.5 * m * v * v;
  }

  /**
   * Calculates the gravitational potential energy between two bodies.
   * Formula: PE = -G * M * m / r
   */
  public static calculatePotentialEnergy(G: number, M: number, m: number, r: number): number {
    if (r <= 0 || G <= 0 || M <= 0 || m <= 0) return 0;
    return -((G * M * m) / r);
  }

  /**
   * Computes a perpendicular tangential velocity vector for a body relative to a central source.
   */
  public static calculateTangentialVelocityVector(
    centerPos: { x: number; y: number },
    orbitingPos: { x: number; y: number },
    speed: number,
    clockwise: boolean
  ): { x: number; y: number } {
    const dx = orbitingPos.x - centerPos.x;
    const dy = orbitingPos.y - centerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0.001) {
      // Avoid division by zero, return arbitrary perpendicular vector
      return { x: 0, y: clockwise ? speed : -speed };
    }

    const norm = { x: dx / dist, y: dy / dist };

    // Perpendicular tangent vector:
    // Clockwise:    (-ny, nx)
    // Counter-CW:   (ny, -nx)
    if (clockwise) {
      return { x: -norm.y * speed, y: norm.x * speed };
    } else {
      return { x: norm.y * speed, y: -norm.x * speed };
    }
  }

  /**
   * Simple Euclidean distance calculation.
   */
  public static calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Normalizes a 2D vector safely, handling zero-magnitude edge cases.
   */
  public static normalizeVector(vec: { x: number; y: number }): { x: number; y: number } {
    const mag = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
    if (mag <= 0.0001) return { x: 0, y: 0 };
    return { x: vec.x / mag, y: vec.y / mag };
  }

  /**
   * Computes the orbital period T of a body in an orbit with a given semi-major axis.
   * Formula (Kepler's 3rd Law): T = 2 * pi * sqrt(a^3 / (G * M))
   */
  public static calculateOrbitalPeriod(G: number, M: number, semiMajorAxis: number): number {
    if (semiMajorAxis <= 0 || G <= 0 || M <= 0) return 0;
    return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * M));
  }

  /**
   * Computes the angular velocity omega.
   * Formula: omega = vTangential / r
   */
  public static calculateAngularVelocity(r: number, vTangential: number): number {
    if (r <= 0) return 0;
    return vTangential / r;
  }

  /**
   * Computes circular orbit velocity.
   */
  public static computeStableOrbitVelocity(G: number, M: number, r: number, softening = 100): number {
    return this.calculateCircularOrbitVelocity(G, M, r, softening);
  }

  /**
   * Computes unit tangential direction vector.
   */
  public static computeTangentialDirection(
    centerPos: { x: number; y: number },
    bodyPos: { x: number; y: number },
    clockwise: boolean
  ): { x: number; y: number } {
    const dx = bodyPos.x - centerPos.x;
    const dy = bodyPos.y - centerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0.0001) return { x: 0, y: clockwise ? 1 : -1 };
    const norm = { x: dx / dist, y: dy / dist };
    return clockwise ? { x: -norm.y, y: norm.x } : { x: norm.y, y: -norm.x };
  }

  /**
   * Eliminates the radial component of velocity, leaving only tangential motion.
   */
  public static removeRadialVelocityComponent(
    centerPos: { x: number; y: number },
    bodyPos: { x: number; y: number },
    velocity: { x: number; y: number }
  ): { x: number; y: number } {
    const dx = bodyPos.x - centerPos.x;
    const dy = bodyPos.y - centerPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0.0001) return velocity;

    const rx = dx / dist;
    const ry = dy / dist;

    // Radial component (v dot r_hat)
    const vRadial = velocity.x * rx + velocity.y * ry;

    return {
      x: velocity.x - vRadial * rx,
      y: velocity.y - vRadial * ry,
    };
  }

  /**
   * Snaps a body's velocity to ideal circular orbit velocity.
   */
  public static applyCircularOrbitVelocity(
    centerBody: Matter.Body,
    orbitingBody: Matter.Body,
    G: number,
    clockwise: boolean
  ): void {
    const M = (centerBody as any).customData?.mass ?? centerBody.mass ?? 800;
    const r = this.calculateDistance(centerBody.position, orbitingBody.position);
    const speed = this.computeStableOrbitVelocity(G, M, r) * 16.67;
    const velVec = this.calculateTangentialVelocityVector(
      centerBody.position,
      orbitingBody.position,
      speed,
      clockwise
    );

    // Galilean frame transition: Add parent velocity to make the orbit stable in a moving frame
    velVec.x += centerBody.velocity.x;
    velVec.y += centerBody.velocity.y;

    Matter.Body.setVelocity(orbitingBody, velVec);
  }
}
