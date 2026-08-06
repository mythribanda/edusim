import type { RuntimeStore } from '../sandbox/state/runtimeStore';
import type { PropertyController } from '../sandbox/properties/propertyController';
import type { SandboxRuntime } from '../sandbox/engine/runtime';
import { physicsEventBus, PhysicsEvent } from './physicsEventBus';
import { isMeaningfulChange } from './eventDiffDetector';

export class RuntimeObserver {
  private store: RuntimeStore;
  private propertyController: PropertyController;
  private runtime: SandboxRuntime;

  private unsubProp: (() => void) | null = null;
  private unsubConstraint: (() => void) | null = null;

  private debounceMap  = new Map<string, NodeJS.Timeout>();
  private restInterval: ReturnType<typeof setInterval> | null = null;

  // Track previous values to check diffs manually if not provided
  private prevStates = new Map<string, any>();

  constructor(store: RuntimeStore, propertyController: PropertyController, runtime: SandboxRuntime) {
    this.store = store;
    this.propertyController = propertyController;
    this.runtime = runtime;
  }

  start() {
    this.unsubProp       = this.propertyController.subscribe('propertyChanged',  this.handlePropertyChange.bind(this));
    this.unsubConstraint = this.store.subscribe('constraintAdded',               this.handleConstraintAdded.bind(this));
    this.runtime.physics.onCollisionStart(this.handleCollision.bind(this));
    this.startRestMonitor();
  }

  stop() {
    if (this.unsubProp)       this.unsubProp();
    if (this.unsubConstraint) this.unsubConstraint();
    this.runtime.physics.offCollisionStart(this.handleCollision.bind(this));
    this.debounceMap.forEach(clearTimeout);
    this.debounceMap.clear();
    if (this.restInterval) {
      clearInterval(this.restInterval);
      this.restInterval = null;
    }
  }

  private debounceEmit(key: string, event: PhysicsEvent, delay = 400) {
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key));
    }
    this.debounceMap.set(key, setTimeout(() => {
      physicsEventBus.emit(event);
      this.debounceMap.delete(key);
    }, delay));
  }

  private handlePropertyChange(data: any) {
    const { objectId, property, value } = data;
    
    const stateKey = `${objectId}_${property}`;
    const oldVal = this.prevStates.get(stateKey);
    
    // Only emit if meaningful
    if (isMeaningfulChange(oldVal, value, property)) {
      this.prevStates.set(stateKey, value);

      switch (property) {
        case 'gravity':
          this.debounceEmit('global_gravity', {
            type: 'GRAVITY_CHANGED',
            oldValue: oldVal?.y ?? 9.8,
            newValue: value.y
          });
          break;
        case 'mass':
          this.debounceEmit(`${objectId}_mass`, {
            type: 'MASS_CHANGED',
            objectId,
            oldValue: oldVal ?? 1.0,
            newValue: value
          });
          break;
        case 'friction':
          this.debounceEmit(`${objectId}_friction`, {
            type: 'FRICTION_CHANGED',
            objectId,
            oldValue: oldVal ?? 0.1,
            newValue: value
          });
          break;
        case 'restitution':
          this.debounceEmit(`${objectId}_restitution`, {
            type: 'RESTITUTION_CHANGED',
            objectId,
            oldValue: oldVal ?? 0.0,
            newValue: value
          });
          break;
        case 'activeForce':
          if (value && (value.x !== 0 || value.y !== 0)) {
            this.debounceEmit(`${objectId}_force`, {
              type: 'FORCE_APPLIED',
              objectId,
              newValue: value
            }, 800);
          }
          break;
      }
    }
  }

  private handleConstraintAdded(data: any) {
    const constraint = data.constraint;
    // Spring: low stiffness
    if (constraint.stiffness !== undefined && constraint.stiffness < 1) {
      this.debounceEmit('spring_created', {
        type: 'SPRING_CREATED',
        metadata: { stiffness: constraint.stiffness },
      });
    }
    // Rope: stiffness close to 1 and no bodyB pointA offset (heuristic)
    if (constraint.stiffness >= 0.8 && constraint.length && constraint.length > 30) {
      this.debounceEmit('rope_created', {
        type: 'ROPE_CREATED',
        metadata: { length: constraint.length },
      });
    }
    // Pivot: very stiff, short length
    if (constraint.stiffness >= 0.99 && (!constraint.length || constraint.length < 10)) {
      this.debounceEmit('pivot_created', {
        type: 'PIVOT_CREATED',
        metadata: {},
      });
    }
  }

  private handleCollision(event: Matter.IEventCollision<Matter.Engine>) {
    if (event.pairs.length > 0) {
      const pair = event.pairs[0];
      if (!pair.bodyA.isStatic || !pair.bodyB.isStatic) {
        // Compute relative speed for richer insight
        const dvx = (pair.bodyA.velocity?.x ?? 0) - (pair.bodyB.velocity?.x ?? 0);
        const dvy = (pair.bodyA.velocity?.y ?? 0) - (pair.bodyB.velocity?.y ?? 0);
        const relSpeed = Math.hypot(dvx, dvy);
        this.debounceEmit('collision', {
          type: 'COLLISION_DETECTED',
          metadata: {
            pairsCount: event.pairs.length,
            relativeSpeed: Math.round(relSpeed * 10) / 10,
          },
        }, 1500);
      }
    }
  }

  // ── At-rest monitor ───────────────────────────────────────────────────────
  // Poll dynamic bodies every 2 s; if a body was moving before and has now
  // nearly stopped, emit OBJECT_AT_REST once.
  private movingBodies = new Set<number>();

  private startRestMonitor() {
    this.restInterval = setInterval(() => {
      const world = this.runtime.physics.getWorld();
      for (const body of world.bodies) {
        if (body.isStatic || body.isSensor) continue;
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        const bodyId = body.id;
        if (speed > 0.5) {
          this.movingBodies.add(bodyId);
        } else if (speed < 0.08 && this.movingBodies.has(bodyId)) {
          // Was moving, now at rest
          this.movingBodies.delete(bodyId);
          this.debounceEmit(`rest_${bodyId}`, {
            type: 'OBJECT_AT_REST',
            objectId: String(bodyId),
            metadata: {
              friction:     body.friction,
              restitution:  body.restitution,
            },
          }, 500);
        }
      }
    }, 2000);
  }
}
