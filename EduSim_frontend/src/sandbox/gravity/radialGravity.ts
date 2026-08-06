import * as Matter from 'matter-js';
import type { GravitySource, GravityBody, GravityConfig } from './gravity.types';

/**
 * RadialGravity
 * Custom orbital gravity engine implementing Newton's Law of Universal Gravitation:
 * F = (G * M * m) / r^2
 *
 * Implements high-performance calculation loops with pre-allocated vectors to prevent
 * memory thrashing/GC stutter, distance softening to avoid division-by-zero singularities,
 * force clamping for stability, and ignore-self checks.
 *
 * Supports orbital path prediction using live numerical integration and debug rendering
 * of force vectors, orbit paths, and gravity zones using modern PixiJS v8 methods.
 */
export class RadialGravity {
  private readonly sources = new Map<string, GravitySource>();
  private readonly bodies = new Map<string, GravityBody>();
  private config: GravityConfig;

  // Pre-allocated vector for calculations to avoid garbage collection pressure
  private readonly computedForceVec = { x: 0, y: 0 };

  constructor(config: Partial<GravityConfig> = {}) {
    this.config = {
      mode: 'radial',
      gravitationalConstant: config.gravitationalConstant ?? 0.001,
      softeningFactor: config.softeningFactor ?? 100, // plummer softening
      maxForceClamp: config.maxForceClamp ?? 50.0,   // prevents explosions while allowing stable orbital physics
      debug: config.debug ?? false,
    };
  }

  // ── Source Management ──────────────────────────────────────────────────────

  addGravitySource(source: GravitySource): void {
    this.sources.set(source.id, source);
  }

  removeGravitySource(id: string): void {
    this.sources.delete(id);
  }

  updateGravitySource(id: string, props: Partial<GravitySource>): void {
    const source = this.sources.get(id);
    if (source) {
      if (props.mass !== undefined) source.mass = props.mass;
      if (props.influenceRadius !== undefined) source.influenceRadius = props.influenceRadius;
      if (props.enabled !== undefined) source.enabled = props.enabled;
      if (props.metadata !== undefined) source.metadata = { ...source.metadata, ...props.metadata };
    }
  }

  getSources(): GravitySource[] {
    return Array.from(this.sources.values());
  }

  // ── Body Management ────────────────────────────────────────────────────────

  addGravityBody(body: GravityBody): void {
    this.bodies.set(body.id, body);
  }

  removeGravityBody(id: string): void {
    this.bodies.delete(id);
  }

  getBodies(): GravityBody[] {
    return Array.from(this.bodies.values());
  }

  /**
   * Automatically discovers and synchronizes all active non-static dynamic bodies
   * in the Matter.js world. Ensures spawned items, falling bobs, and other dynamic
   * shapes automatically respond to gravitational pull.
   */
  syncBodiesFromWorld(world: Matter.World): void {
    const allBodies = Matter.Composite.allBodies(world);
    const activeIds = new Set<string>();
    const worldObjectIds = new Set<string>();

    for (const body of allBodies) {
      const objectId = (body as any).objectId || body.label;
      if (objectId) {
        worldObjectIds.add(objectId);
      }

      // Keep gravity source positions and properties in sync with their physical bodies (even if static)
      if (objectId && this.sources.has(objectId)) {
        const source = this.sources.get(objectId)!;
        source.position.x = body.position.x;
        source.position.y = body.position.y;
        
        // Dynamic virtual mass sync (uses customData virtual mass for static Suns, physical mass for planets)
        source.mass = (body as any).customData?.mass !== undefined
          ? (body as any).customData.mass
          : body.mass;
      }

      // Ignore static components, anchors, pivot pegs, and sensing receptors for dynamic gravity pull
      if (body.isStatic || body.isSensor) continue;

      const id = (body as any).objectId || body.id?.toString() || body.label;
      if (!id) continue;

      activeIds.add(id);

      // Register or update body reference and mass
      if (!this.bodies.has(id)) {
        this.addGravityBody({
          id,
          body,
          mass: body.mass,
          affectedByGravity: true,
          ignoreGravity: false,
        });
      } else {
        const existing = this.bodies.get(id)!;
        existing.body = body;
        existing.mass = body.mass;
      }
    }

    // Clean up any gravity sources removed from the Matter world composite
    for (const sourceId of this.sources.keys()) {
      if (!worldObjectIds.has(sourceId)) {
        console.log(`[RadialGravity] Cleaning up stale gravity source: ${sourceId}`);
        this.sources.delete(sourceId);
      }
    }

    // Clean up any bodies removed from the Matter world composite
    for (const id of this.bodies.keys()) {
      if (!activeIds.has(id)) {
        this.bodies.delete(id);
      }
    }
  }

  // ── Configuration ──────────────────────────────────────────────────────────

  setConfig(config: Partial<GravityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  getConfig(): GravityConfig {
    return this.config;
  }

  clear(): void {
    this.sources.clear();
    this.bodies.clear();
  }

  // ── Physics Calculations ───────────────────────────────────────────────────

  /**
   * Computes the gravitational force vector exerted by a GravitySource on a GravityBody.
   * Utilizes an in-place target vector to completely avoid memory allocations during step updates.
   */
  computeForce(
    source: GravitySource,
    body: GravityBody,
    targetForceVec = this.computedForceVec
  ): { x: number; y: number } {
    targetForceVec.x = 0;
    targetForceVec.y = 0;

    if (!source.enabled || body.ignoreGravity || !body.affectedByGravity || source.id === body.id) {
      return targetForceVec;
    }

    const sourcePos = source.position;
    const bodyPos = body.body.position;

    const dx = sourcePos.x - bodyPos.x;
    const dy = sourcePos.y - bodyPos.y;

    const distSq = dx * dx + dy * dy;

    // Check influence radius boundaries
    if (source.influenceRadius !== undefined && source.influenceRadius > 0) {
      if (distSq > source.influenceRadius * source.influenceRadius) {
        return targetForceVec;
      }
    }

    // Apply softening factor (Plummer style) to denominator to smooth near-collisions
    const softening = this.config.softeningFactor;
    const denominator = distSq + softening;

    if (denominator <= 0) return targetForceVec;

    const physicalDist = Math.sqrt(distSq);
    if (physicalDist <= 0.0001) return targetForceVec;

    // Normalize force direction along the true physical line of sight
    const dirX = dx / physicalDist;
    const dirY = dy / physicalDist;

    // F = (G * M * m) / denominator
    const G = this.config.gravitationalConstant;
    const strength = source.metadata?.gravityStrength !== undefined ? source.metadata.gravityStrength : 1.0;
    let forceMag = (G * source.mass * body.mass * strength) / denominator;

    // Apply maximum force clamping to protect sandbox stability
    if (this.config.maxForceClamp !== undefined && forceMag > this.config.maxForceClamp) {
      forceMag = this.config.maxForceClamp;
    }

    targetForceVec.x = dirX * forceMag;
    targetForceVec.y = dirY * forceMag;

    return targetForceVec;
  }

  /**
   * Applies gravitational forces to all orbiting bodies in the current step.
   * Runs inside the central sandbox update loop.
   */
  update(delta: number): void {
    if (this.sources.size === 0 || this.bodies.size === 0) return;

    const forceVec = this.computedForceVec;

    for (const source of this.sources.values()) {
      if (!source.enabled) continue;

      for (const body of this.bodies.values()) {
        // Skip static bodies, ignored bodies, or self-attraction cases
        if (
          body.ignoreGravity ||
          !body.affectedByGravity ||
          body.body.isStatic ||
          source.id === body.id
        ) {
          continue;
        }

        // Calculate direct gravity vector in-place
        this.computeForce(source, body, forceVec);

        if (forceVec.x !== 0 || forceVec.y !== 0) {
          // Apply gravity force directly at the center of mass to prevent unwanted body torque
          Matter.Body.applyForce(body.body, body.body.position, forceVec);
        }
      }
    }
  }

  // ── Orbit Path Prediction ──────────────────────────────────────────────────

  /**
   * Pre-calculates and projects the orbital trajectory for a specific body.
   * Runs a high-speed forward integration simulation inside a sandbox viewport
   * to map out future points without mutating active physical states.
   */
  getPredictedOrbit(
    body: GravityBody,
    steps = 180,
    dt = 16.67
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    if (body.body.isStatic || body.mass <= 0) return points;

    let posX = body.body.position.x;
    let posY = body.body.position.y;
    let velX = body.body.velocity.x;
    let velY = body.body.velocity.y;

    const mass = body.mass;
    const invMass = body.body.inverseMass;
    const G = this.config.gravitationalConstant;
    const softening = this.config.softeningFactor;
    const clamp = this.config.maxForceClamp;

    points.push({ x: posX, y: posY });

    // Step forward numerical integration
    for (let i = 0; i < steps; i++) {
      let totalForceX = 0;
      let totalForceY = 0;

      for (const source of this.sources.values()) {
        if (!source.enabled || source.id === body.id) continue;

        const dx = source.position.x - posX;
        const dy = source.position.y - posY;
        const distSq = dx * dx + dy * dy;

        if (source.influenceRadius !== undefined && source.influenceRadius > 0) {
          if (distSq > source.influenceRadius * source.influenceRadius) {
            continue;
          }
        }

        const denominator = distSq + softening;
        if (denominator <= 0) continue;

        const physicalDist = Math.sqrt(distSq);
        if (physicalDist <= 0.0001) continue;

        // Normalize force direction along the true physical line of sight
        const dirX = dx / physicalDist;
        const dirY = dy / physicalDist;

        const strength = source.metadata?.gravityStrength !== undefined ? source.metadata.gravityStrength : 1.0;
        let forceMag = (G * source.mass * mass * strength) / denominator;
        if (clamp !== undefined && forceMag > clamp) {
          forceMag = clamp;
        }

        totalForceX += dirX * forceMag;
        totalForceY += dirY * forceMag;
      }

      // Acceleration = Force / Mass
      const accX = totalForceX * invMass;
      const accY = totalForceY * invMass;

      // Match Matter.js's Verlet integration exactly
      const frictionAir = 1 - body.body.frictionAir;
      velX = velX * frictionAir + accX * dt * dt;
      velY = velY * frictionAir + accY * dt * dt;
      posX += velX;
      posY += velY;

      points.push({ x: posX, y: posY });
    }

    return points;
  }

  // ── Debug Rendering ────────────────────────────────────────────────────────

  /**
   * Draws orbital helper aesthetics (orbital trails, gravity zones, force vectors)
   * on top of the active PixiJS Stage overlay.
   */
  drawDebug(graphics: any): void {
    if (!this.config.debug) return;

    // 1. Draw gravity fields / influence spheres for each active source
    for (const source of this.sources.values()) {
      if (!source.enabled) continue;

      if (source.influenceRadius !== undefined && source.influenceRadius > 0) {
        graphics
          .circle(source.position.x, source.position.y, source.influenceRadius)
          .stroke({ color: 0x6366f1, width: 1.5, alpha: 0.35 })
          .fill({ color: 0x6366f1, alpha: 0.04 });
      } else {
        // Infinite influence: draw a glowing gravitational core visualization
        graphics
          .circle(source.position.x, source.position.y, 80)
          .stroke({ color: 0x6366f1, width: 1, alpha: 0.2 })
          .fill({ color: 0x6366f1, alpha: 0.02 });
      }
    }

    // 2. Draw future orbital projection paths and active force vectors
    for (const body of this.bodies.values()) {
      if (body.ignoreGravity || !body.affectedByGravity || body.body.isStatic) {
        continue;
      }

      // Draw predicted orbit trajectory (dashed lines)
      const orbitPoints = this.getPredictedOrbit(body, 220);
      if (orbitPoints.length > 1) {
        for (let i = 1; i < orbitPoints.length; i++) {
          if (i % 2 === 0) {
            graphics
              .moveTo(orbitPoints[i - 1].x, orbitPoints[i - 1].y)
              .lineTo(orbitPoints[i].x, orbitPoints[i].y)
              .stroke({ color: 0x38bdf8, width: 1.5, alpha: 0.5 });
          }
        }
      }

      // Draw vector lines representing gravity forces
      const totalForceVec = { x: 0, y: 0 };
      const tempVec = { x: 0, y: 0 };

      for (const source of this.sources.values()) {
        this.computeForce(source, body, tempVec);
        totalForceVec.x += tempVec.x;
        totalForceVec.y += tempVec.y;
      }

      const forceMag = Math.hypot(totalForceVec.x, totalForceVec.y);
      if (forceMag > 1e-6) {
        const forceScale = 6000; // visual scaling coefficient
        const startX = body.body.position.x;
        const startY = body.body.position.y;
        const endX = startX + totalForceVec.x * forceScale;
        const endY = startY + totalForceVec.y * forceScale;

        // Force vector main axis line
        graphics
          .moveTo(startX, startY)
          .lineTo(endX, endY)
          .stroke({ color: 0xfacc15, width: 2.2, alpha: 0.85 });

        // Arrow head endpoint marker
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 8;
        const headPoints = [
          endX,
          endY,
          endX - arrowLength * Math.cos(angle - Math.PI / 6),
          endY - arrowLength * Math.sin(angle - Math.PI / 6),
          endX - arrowLength * Math.cos(angle + Math.PI / 6),
          endY - arrowLength * Math.sin(angle + Math.PI / 6),
        ];
        graphics.poly(headPoints, true).fill({ color: 0xfacc15, alpha: 0.85 });
      }
    }
  }
}
