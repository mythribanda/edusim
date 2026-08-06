export type PhysicsEventType =
  | 'MASS_CHANGED'
  | 'GRAVITY_CHANGED'
  | 'FRICTION_CHANGED'
  | 'RESTITUTION_CHANGED'
  | 'VELOCITY_CHANGED'
  | 'FORCE_APPLIED'
  | 'OBJECT_CREATED'
  | 'OBJECT_DELETED'
  | 'OBJECT_SPAWNED'       // drag-drop or button spawn
  | 'OBJECT_AT_REST'       // object stopped moving
  | 'SPRING_CREATED'
  | 'ROPE_CREATED'
  | 'PIVOT_CREATED'
  | 'COLLISION_DETECTED'
  | 'OSCILLATION_STARTED'
  | 'ENERGY_TRANSFER'
  | 'MOMENTUM_TRANSFER'
  | 'PROJECTILE_DETECTED'
  | 'ROTATION_STARTED';

export interface PhysicsEvent {
  type: PhysicsEventType;
  objectId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

type EventCallback = (event: PhysicsEvent) => void;

class PhysicsEventBus {
  private listeners: Map<PhysicsEventType, Set<EventCallback>> = new Map();

  subscribe(type: PhysicsEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  emit(event: PhysicsEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const physicsEventBus = new PhysicsEventBus();
