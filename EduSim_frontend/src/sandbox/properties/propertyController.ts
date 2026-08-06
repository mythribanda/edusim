import * as Matter from 'matter-js';
import { Graphics } from 'pixi.js';
import type { RuntimeStore } from '../state/runtimeStore';
import type { SandboxRuntime } from '../engine/runtime';
import type { RuntimeObject } from '../types/RuntimeObject';

export type PropertyEventCallback = (data: any) => void;

/**
 * PropertyController Class
 *
 * Centralized, runtime-safe property mutation system for EduSim.
 * UI elements and external systems MUST use this controller to mutate
 * physics properties, visual representations, or constraints to ensure
 * consistency, safety, validation, and reactive updates.
 */
export class PropertyController {
  private readonly store: RuntimeStore;
  private readonly runtime: SandboxRuntime;
  private readonly subscriptions = new Map<string, Set<PropertyEventCallback>>();
  private readonly activeForces = new Map<string, { x: number; y: number }>();
  private readonly initialStates = new Map<string, {
    x: number;
    y: number;
    angle: number;
    mass: number;
    friction: number;
    frictionAir: number;
  }>();

  constructor(store: RuntimeStore, runtime: SandboxRuntime) {
    this.store = store;
    this.runtime = runtime;

    // Capture initial state when objects are registered
    this.store.subscribe('objectAdded', (data: any) => {
      if (data && data.id && data.body) {
        const obj = data as RuntimeObject;
        this.initialStates.set(obj.id, {
          x: obj.body.position.x,
          y: obj.body.position.y,
          angle: obj.body.angle,
          mass: obj.body.mass,
          friction: obj.body.friction,
          frictionAir: obj.body.frictionAir,
        });
      }
    });

    // Register high-performance runtime loop hook to continuously re-apply forces before each step
    this.runtime.addHook({
      id: 'property-controller-forces',
      beforeStep: () => {
        for (const [objectId, force] of this.activeForces.entries()) {
          const obj = this.store.getObject(objectId);
          if (obj && !obj.body.isStatic) {
            Matter.Body.applyForce(obj.body, obj.body.position, force);
          }
        }
      },
    });
  }

  // ── Event System ───────────────────────────────────────────────────────────

  /**
   * Subscribe to property mutation events (e.g., 'propertyChanged', 'objectUpdated', 'constraintUpdated').
   * Returns an unsubscribe function for easy cleanup.
   */
  subscribe(event: string, callback: PropertyEventCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(callback);

    return () => {
      const callbacks = this.subscriptions.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(event);
        }
      }
    };
  }

  private emit(event: string, data: any): void {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[PropertyController] Error in subscription callback for event "${event}":`, err);
        }
      });
    }
  }

  // ── Validation Layer ───────────────────────────────────────────────────────

  /**
   * Validates values to protect runtime and simulation stability.
   */
  validateProperty(property: string, value: any): { valid: boolean; error?: string } {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return { valid: false, error: 'Value cannot be null, undefined, or NaN.' };
    }

    switch (property) {
      case 'mass':
      case 'density':
      case 'scale':
      case 'length':
      case 'radius':
        if (typeof value !== 'number' || value <= 0 || !isFinite(value)) {
          return { valid: false, error: `${property} must be a positive finite number.` };
        }
        break;

      case 'influenceRadius':
      case 'gravityStrength':
        if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
          return { valid: false, error: `${property} must be a non-negative finite number.` };
        }
        break;

      case 'isGravitySource':
      case 'affectedByGravity':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${property} must be a boolean.` };
        }
        break;

      case 'orbitalCategory': {
        const validCategories = ['planet', 'moon', 'star', 'gas_giant', 'dwarf_planet', 'black_hole'];
        if (typeof value !== 'string' || !validCategories.includes(value)) {
          return { valid: false, error: `orbitalCategory must be one of: ${validCategories.join(', ')}` };
        }
        break;
      }

      case 'x':
      case 'y':
      case 'vx':
      case 'vy':
      case 'angularVelocity':
      case 'rotation':
        if (typeof value !== 'number' || !isFinite(value)) {
          return { valid: false, error: `${property} must be a finite number.` };
        }
        break;

      case 'friction':
      case 'frictionAir':
      case 'frictionStatic':
      case 'restitution':
      case 'damping':
        if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
          return { valid: false, error: `${property} must be a non-negative finite number.` };
        }
        break;

      case 'stiffness':
        if (typeof value !== 'number' || value < 0 || value > 1 || !isFinite(value)) {
          return { valid: false, error: 'Stiffness must be a number between 0 and 1.' };
        }
        break;

      case 'lockRotation':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'lockRotation must be a boolean.' };
        }
        break;

      case 'opacity':
        if (typeof value !== 'number' || value < 0 || value > 1 || !isFinite(value)) {
          return { valid: false, error: 'Opacity must be a number between 0 and 1.' };
        }
        break;

      case 'visibility':
      case 'static':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${property} must be a boolean.` };
        }
        break;

      case 'fillColor':
      case 'strokeColor':
        // Accepts color hex number or valid CSS string
        if (typeof value !== 'number' && typeof value !== 'string') {
          return { valid: false, error: `${property} must be a color hex number or string.` };
        }
        break;

      case 'strokeWidth':
        if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
          return { valid: false, error: 'Stroke width must be a non-negative finite number.' };
        }
        break;

      default:
        // No custom validation for unknown properties
        break;
    }

    return { valid: true };
  }

  // ── Force Application & Reset System (Newton's Second Law) ──────────────────

  applyForceToObject(objectId: string, forceVector: { x: number; y: number } | null): void {
    const obj = this.store.getObject(objectId);
    if (!obj) {
      console.warn(`[PropertyController] RuntimeObject with ID "${objectId}" not found.`);
      return;
    }

    if (!forceVector || (forceVector.x === 0 && forceVector.y === 0)) {
      this.activeForces.delete(objectId);
    } else {
      this.activeForces.set(objectId, forceVector);
    }

    // Force updates to trigger re-render in react components
    this.emit('propertyChanged', { objectId, property: 'activeForce', value: forceVector });
  }

  getActiveForce(objectId: string): { x: number; y: number } {
    return this.activeForces.get(objectId) ?? { x: 0, y: 0 };
  }

  clearForces(): void {
    this.activeForces.clear();
    this.emit('propertyChanged', { objectId: 'global', property: 'clearForces', value: null });
  }

  resetVelocity(objectId: string): void {
    const obj = this.store.getObject(objectId);
    if (obj) {
      Matter.Body.setVelocity(obj.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(obj.body, 0);
      this.emit('propertyChanged', { objectId, property: 'velocityReset', value: null });
    }
  }

  restoreInitialState(objectId: string): void {
    const obj = this.store.getObject(objectId);
    const initial = this.initialStates.get(objectId);
    if (obj && initial) {
      Matter.Body.setPosition(obj.body, { x: initial.x, y: initial.y });
      Matter.Body.setAngle(obj.body, initial.angle);
      Matter.Body.setVelocity(obj.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(obj.body, 0);

      // Restore physics parameters using standard updateProperty to trigger scaling and rendering properly
      this.updateProperty(objectId, 'mass', initial.mass);
      this.updateProperty(objectId, 'friction', initial.friction);
      this.updateProperty(objectId, 'frictionAir', initial.frictionAir);

      // Clear applied force
      this.applyForceToObject(objectId, { x: 0, y: 0 });

      this.runtime.sync.flush(); // immediately sync visuals
      this.emit('propertyChanged', { objectId, property: 'stateRestored', value: null });
    }
  }

  // ── Physics & Visual Property Mutation ─────────────────────────────────────


  /**
   * Safely updates a property of a RuntimeObject by ID.
   */
  updateProperty(objectId: string, property: string, value: any): void {
    const obj = this.store.getObject(objectId);
    if (!obj) {
      console.warn(`[PropertyController] RuntimeObject with ID "${objectId}" not found.`);
      return;
    }

    // Validate
    const validation = this.validateProperty(property, value);
    if (!validation.valid) {
      console.warn(`[PropertyController] Validation failed for property "${property}" with value:`, value, `. Error: ${validation.error}`);
      return;
    }

    const { body, display } = obj;

    // Execute mutations safely
    switch (property) {
      // ── Physics Properties ─────────────────────────────────────────────────
      case 'mass': {
        if (body.isStatic) {
          if (!(body as any).customData) (body as any).customData = {};
          (body as any).customData.mass = value;
          
          // Also sync with RadialGravity source if it exists
          const radialGravity = this.runtime.gravitySystem.getRadialGravity();
          radialGravity.updateGravitySource(objectId, { mass: value });
          break;
        }

        const currentMass = body.mass;
        if (currentMass > 0 && value > 0) {
          const k = Math.sqrt(value / currentMass);
          // Scale physical body (holds density constant)
          Matter.Body.scale(body, k, k);
          // Scale PixiJS display container
          display.scale.set(display.scale.x * k, display.scale.y * k);
          
          if (!(body as any).customData) (body as any).customData = {};
          (body as any).customData.mass = value;
          
          // Also sync with RadialGravity source if it exists
          const radialGravity = this.runtime.gravitySystem.getRadialGravity();
          radialGravity.updateGravitySource(objectId, { mass: value });
        }
        break;
      }

      case 'radius': {
        const metadata = obj.metadata;
        if (metadata && metadata.shapeInfo) {
          const shapeInfo = metadata.shapeInfo;
          if (shapeInfo.type === 'circle') {
            const currentRadius = shapeInfo.radius ?? 20;
            if (currentRadius > 0 && value > 0) {
              const k = value / currentRadius;
              // Scale physical body and visual sprite
              Matter.Body.scale(body, k, k);
              display.scale.set(display.scale.x * k, display.scale.y * k);
              shapeInfo.radius = value;
              
              // Scale gravity source influence radius proportionally if active
              const radialGravity = this.runtime.gravitySystem.getRadialGravity();
              const source = radialGravity.getSources().find(s => s.id === objectId);
              if (source && source.influenceRadius !== undefined) {
                source.influenceRadius *= k;
                this.emit('propertyChanged', { objectId, property: 'influenceRadius', value: source.influenceRadius });
              }
            }
          }
        }
        break;
      }

      case 'influenceRadius': {
        const radialGravity = this.runtime.gravitySystem.getRadialGravity();
        radialGravity.updateGravitySource(objectId, { influenceRadius: value });
        break;
      }

      case 'gravityStrength': {
        if (!(body as any).customData) (body as any).customData = {};
        (body as any).customData.gravityStrength = value;
        const radialGravity = this.runtime.gravitySystem.getRadialGravity();
        radialGravity.updateGravitySource(objectId, {
          metadata: { ...radialGravity.getSources().find(s => s.id === objectId)?.metadata, gravityStrength: value }
        });
        break;
      }

      case 'isGravitySource': {
        const radialGravity = this.runtime.gravitySystem.getRadialGravity();
        if (value) {
          radialGravity.addGravitySource({
            id: objectId,
            mass: body.isStatic && (body as any).customData?.mass ? (body as any).customData.mass : body.mass,
            position: { x: body.position.x, y: body.position.y },
            enabled: true,
            influenceRadius: (body as any).circleRadius ? (body as any).circleRadius * 15 : 1000,
          });
        } else {
          radialGravity.removeGravitySource(objectId);
        }
        break;
      }

      case 'affectedByGravity': {
        const radialGravity = this.runtime.gravitySystem.getRadialGravity();
        const existing = radialGravity.getBodies().find(b => b.id === objectId);
        if (existing) {
          existing.affectedByGravity = value;
        }
        break;
      }

      case 'orbitalCategory': {
        if (!(body as any).customData) (body as any).customData = {};
        (body as any).customData.orbitalCategory = value;
        break;
      }

      case 'x':
        Matter.Body.setPosition(body, { x: value, y: body.position.y });
        this.runtime.sync.flush(); // immediately sync visuals
        break;

      case 'y':
        Matter.Body.setPosition(body, { x: body.position.x, y: value });
        this.runtime.sync.flush(); // immediately sync visuals
        break;

      case 'vx':
        Matter.Body.setVelocity(body, { x: value, y: body.velocity.y });
        break;

      case 'vy':
        Matter.Body.setVelocity(body, { x: body.velocity.x, y: value });
        break;

      case 'angularVelocity':
        Matter.Body.setAngularVelocity(body, value);
        break;

      case 'friction':
        body.friction = value;
        break;

      case 'frictionAir':
        body.frictionAir = value;
        break;

      case 'frictionStatic':
        body.frictionStatic = value;
        break;

      case 'restitution':
        body.restitution = value;
        break;

      case 'density':
        Matter.Body.setDensity(body, value);
        break;

      case 'static':
        Matter.Body.setStatic(body, value);
        break;

      // ── Visual Properties ──────────────────────────────────────────────────
      case 'opacity':
        display.alpha = value;
        break;

      case 'visibility':
        display.visible = value;
        break;

      case 'scale': {
        const currentScale = display.scale.x;
        if (currentScale > 0 && value > 0) {
          const k = value / currentScale;
          // Scale physical body synchronously
          Matter.Body.scale(body, k, k);
          // Scale PixiJS display container
          display.scale.set(value);
        }
        break;
      }

      case 'rotation':
        // Keeps both graphics and physics aligned
        Matter.Body.setAngle(body, value);
        display.rotation = value;
        break;

      case 'lockRotation':
        if (value) {
          // Lock rotation: set inertia to Infinity, preventing torque from rotating the body
          if (body.inertia !== Infinity) {
            (body as any)._originalInertia = body.inertia;
          }
          Matter.Body.setInertia(body, Infinity);
          Matter.Body.setAngularVelocity(body, 0);
          Matter.Body.setAngle(body, 0); // snap back flat
          display.rotation = 0;
        } else {
          // Unlock rotation: restore original inertia or calculate standard inertia
          const original = (body as any)._originalInertia;
          if (original && original !== Infinity) {
            Matter.Body.setInertia(body, original);
          } else {
            const defaultInertia = body.mass * 100;
            Matter.Body.setInertia(body, defaultInertia);
          }
        }
        break;

      case 'fillColor':
      case 'strokeColor':
      case 'strokeWidth':
        this.regenerateGraphics(obj, property, value);
        break;

      default:
        console.warn(`[PropertyController] Unsupported property: "${property}"`);
        return;
    }

    // Sync centralized store metadata AND the in-place object metadata
    if (['mass', 'friction', 'restitution', 'static', 'radius', 'influenceRadius', 'gravityStrength', 'isGravitySource', 'affectedByGravity', 'orbitalCategory'].includes(property)) {
      const anyObj = obj as any;
      if (!anyObj.metadata) anyObj.metadata = {};
      if (!anyObj.metadata.customData) anyObj.metadata.customData = {};
      anyObj.metadata.customData[property] = value;

      this.store.updateMetadata(objectId, {
        customData: {
          ...this.store.getMetadata(objectId).customData,
          [property]: value,
        },
      });
    }

    // Dispatch Events
    this.emit('propertyChanged', { objectId, property, value });
    this.emit('objectUpdated', { objectId, property, value });
  }

  /**
   * Safely updates color graphics fills/strokes on the PixiJS Graphics display object
   * without destroying or recreating the Container.
   */
  private regenerateGraphics(obj: RuntimeObject, property: 'fillColor' | 'strokeColor' | 'strokeWidth', value: any): void {
    const { display, metadata } = obj;
    if (!metadata || !metadata.shapeInfo) {
      console.warn(`[PropertyController] Missing shapeInfo in metadata for object "${obj.id}". Cannot regenerate graphics.`);
      return;
    }

    // Find the graphics element (usually display.children[0])
    const gfx = display.children.find((child) => child instanceof Graphics) as Graphics;
    if (!gfx) {
      console.warn(`[PropertyController] Graphics instance not found in display container for object "${obj.id}".`);
      return;
    }

    const { shapeInfo } = metadata;

    // Cache updated value in metadata
    if (property === 'fillColor') shapeInfo.fillColor = value;
    if (property === 'strokeColor') shapeInfo.strokeColor = value;
    if (property === 'strokeWidth') shapeInfo.strokeWidth = value;

    const fillColor = shapeInfo.fillColor ?? 0x6366f1;
    const strokeColor = shapeInfo.strokeColor ?? 0xa5b4fc;
    const strokeWidth = shapeInfo.strokeWidth ?? 2;
    const alpha = display.alpha;

    // Clear graphics and redraw
    gfx.clear();

    if (shapeInfo.type === 'circle') {
      gfx.circle(0, 0, shapeInfo.radius ?? 20);
    } else if (shapeInfo.type === 'rectangle') {
      const w = shapeInfo.width ?? 40;
      const h = shapeInfo.height ?? 40;
      const r = shapeInfo.cornerRadius ?? 0;
      if (r > 0) {
        gfx.roundRect(-w / 2, -h / 2, w, h, r);
      } else {
        gfx.rect(-w / 2, -h / 2, w, h);
      }
    }

    // Apply fills and strokes in PixiJS v8 standard
    gfx.fill({ color: fillColor, alpha });
    if (strokeWidth > 0) {
      gfx.stroke({ width: strokeWidth, color: strokeColor });
    }
  }

  // ── Constraint Property Mutation ───────────────────────────────────────────

  /**
   * Safely updates a constraint property dynamically.
   */
  updateConstraintProperty(constraintId: string, property: 'stiffness' | 'damping' | 'length', value: number): void {
    const rc = this.store.getConstraint(constraintId);
    if (!rc) {
      console.warn(`[PropertyController] Constraint with ID "${constraintId}" not found in RuntimeStore.`);
      return;
    }

    // Validate
    const validation = this.validateProperty(property, value);
    if (!validation.valid) {
      console.warn(`[PropertyController] Validation failed for constraint "${property}" with value:`, value, `. Error: ${validation.error}`);
      return;
    }

    const { constraint } = rc;

    // Apply dynamic updates
    switch (property) {
      case 'stiffness':
        constraint.stiffness = value;
        break;
      case 'damping':
        constraint.damping = value;
        break;
      case 'length':
        constraint.length = value;
        break;
      default:
        console.warn(`[PropertyController] Unsupported constraint property: "${property}"`);
        return;
    }

    // Dispatch Events
    this.emit('constraintUpdated', { constraintId, property, value });
  }

  // ── Global Simulation Property Mutation ────────────────────────────────────

  /**
   * Updates global simulation gravity.
   */
  updateGlobalGravity(y: number, x = 0): void {
    const validationY = this.validateProperty('y', y);
    const validationX = this.validateProperty('x', x);
    if (!validationY.valid || !validationX.valid) {
      console.warn(`[PropertyController] Validation failed for global gravity.`, { y, x });
      return;
    }

    this.runtime.gravitySystem.getLinearGravity().setGravity(x, y);
    this.emit('propertyChanged', { objectId: 'global', property: 'gravity', value: { x, y } });
  }
}
