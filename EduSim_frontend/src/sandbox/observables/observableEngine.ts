import * as PIXI from 'pixi.js';
import type { Body } from 'matter-js';
import type { SandboxRuntime } from '../engine/runtime';
import type { SyncRegistry } from '../engine/sync';
import type { PropertyController } from '../properties/propertyController';
import {
  ObservableRegistration,
  ComputedObservables,
  ObjectFrame,
  ObservableVisualStyle,
} from './observableTypes';
import { drawArrow, createLabel, formatDecimal, clampVector } from './vectorRenderer';

const DEFAULT_STYLE: ObservableVisualStyle = {
  velocity: { color: 0x3b82f6, alpha: 0.9, width: 3 },      // Blue
  acceleration: { color: 0x10b981, alpha: 0.9, width: 3 },  // Green
  force: { color: 0xef4444, alpha: 0.9, width: 3 },         // Red
  angularVelocity: { color: 0x38bdf8, alpha: 0.9, width: 3 },
  text: { fill: 0xffffff, fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' },
};

const SCALE = {
  velocity: 14,
  acceleration: 820,
  angularVelocity: 96,
  force: 1000,
};

interface ObservableEntry {
  registration: ObservableRegistration;
  container: PIXI.Container;
  graphics: PIXI.Graphics;
  label: PIXI.Text;
  lastMetrics: ComputedObservables | null;
}

export class ObservableEngine {
  private readonly runtime: SandboxRuntime;
  private readonly sync: SyncRegistry;
  private readonly propertyController?: PropertyController;
  private readonly overlay: PIXI.Container;
  private readonly entries = new Map<string, ObservableEntry>();
  private readonly history = new Map<string, ObjectFrame>();
  private readonly hookId = 'observable-engine';
  private active = false;

  constructor(runtime: SandboxRuntime, sync: SyncRegistry, propertyController?: PropertyController) {
    this.runtime = runtime;
    this.sync = sync;
    this.propertyController = propertyController;
    this.overlay = new PIXI.Container();
    this.overlay.name = 'observable-overlay';
    (this.overlay as any)._isObservableOverlay = true;
  }

  enable(): void {
    if (this.active) return;
    this.active = true;
    const viewport = this.runtime.renderer.getViewport();
    viewport.sortableChildren = true;
    viewport.addChild(this.overlay);
    viewport.sortChildren();
    this.runtime.addHook({
      id: this.hookId,
      afterStep: (dt) => this.update(dt),
    });
  }

  disable(): void {
    if (!this.active) return;
    this.runtime.removeHook(this.hookId);
    this.overlay.parent?.removeChild(this.overlay);
    this.overlay.removeChildren();
    this.active = false;
  }

  destroy(): void {
    this.disable();
    this.entries.clear();
    this.history.clear();
    this.overlay.destroy({ children: true });
  }

  registerObservable(registration: ObservableRegistration): void {
    if (this.entries.has(registration.objectId)) {
      const existing = this.entries.get(registration.objectId)!;
      existing.registration = registration;
      return;
    }

    const container = new PIXI.Container();
    container.name = `observable-${registration.objectId}`;
    container.zIndex = 200;
    container.addChild(new PIXI.Graphics(), createLabel('', DEFAULT_STYLE.text));
    const graphics = container.getChildAt(0) as PIXI.Graphics;
    const label = container.getChildAt(1) as PIXI.Text;
    label.anchor.set(0, 1);
    label.x = 8;
    label.y = -10;
    label.interactive = false;
    label.style.fill = DEFAULT_STYLE.text.fill;
    label.style.fontSize = DEFAULT_STYLE.text.fontSize;
    label.style.fontFamily = DEFAULT_STYLE.text.fontFamily;
    label.style.fontWeight = '600';

    this.overlay.addChild(container);
    this.entries.set(registration.objectId, {
      registration,
      container,
      graphics,
      label,
      lastMetrics: null,
    });
  }

  unregisterObservable(objectId: string): void {
    const entry = this.entries.get(objectId);
    if (!entry) return;
    entry.container.parent?.removeChild(entry.container);
    entry.container.destroy({ children: true });
    this.entries.delete(objectId);
    this.history.delete(objectId);
  }

  clearObservables(): void {
    for (const entry of this.entries.values()) {
      entry.container.parent?.removeChild(entry.container);
      entry.container.destroy({ children: true });
    }
    this.entries.clear();
    this.history.clear();
  }

  getObservables(objectId: string): ComputedObservables | null {
    const entry = this.entries.get(objectId);
    if (!entry) return null;

    // If the simulation is paused or stopped, dynamically recompute metrics with dt = 0
    // so that live slider / gravity updates register instantly in the HUD and inspector!
    if (this.runtime.getState() !== 'running') {
      const obj = this.sync.getPairs().get(objectId);
      if (obj) {
        entry.lastMetrics = this.computeMetrics(obj.body, 0, objectId);
      }
    }
    return entry.lastMetrics;
  }

  private update(dt: number): void {
    const dtSec = Math.max(dt, 1) / 1000;
    const pairs = this.sync.getPairs();
    const currentIds = new Set<string>();

    for (const [id, pair] of pairs.entries()) {
      currentIds.add(id);
      const entry = this.entries.get(id);
      if (!entry) continue;
      const metrics = this.computeMetrics(pair.body, dtSec, id);
      entry.lastMetrics = metrics;
      this.renderEntry(entry, pair.body, metrics);
    }

    // Remove stale history entries for objects that are no longer present.
    for (const staleId of Array.from(this.history.keys())) {
      if (!currentIds.has(staleId)) this.history.delete(staleId);
    }
  }

  private computeMetrics(body: Body, dtSec: number, objectId: string): ComputedObservables {
    const prevFrame = this.history.get(objectId);
    const position = { x: body.position.x, y: body.position.y };

    // Snapping threshold for resting physical state to guarantee zero noise in visual readouts
    const SPEED_THRESHOLD = 0.05;
    const rawSpeed = Math.hypot(body.velocity.x, body.velocity.y);
    const velocity = rawSpeed < SPEED_THRESHOLD ? { x: 0, y: 0 } : { x: body.velocity.x, y: body.velocity.y };
    const speed = rawSpeed < SPEED_THRESHOLD ? 0 : rawSpeed;
    const angle = body.angle;
    const now = performance.now();

    let acceleration = { x: 0, y: 0, magnitude: 0 };
    if (prevFrame && dtSec > 0) {
      const prevVel = Math.hypot(prevFrame.velocity.x, prevFrame.velocity.y) < SPEED_THRESHOLD
        ? { x: 0, y: 0 }
        : prevFrame.velocity;

      let ax = (velocity.x - prevVel.x) / dtSec;
      let ay = (velocity.y - prevVel.y) / dtSec;
      let amag = Math.hypot(ax, ay);

      // Snap acceleration to absolute zero if underneath a low-level threshold
      const ACC_THRESHOLD = 0.03;
      if (amag < ACC_THRESHOLD) {
        ax = 0;
        ay = 0;
        amag = 0;
      }

      // Smooth out browser jitter using Exponential Moving Average (EMA)
      if (prevFrame && prevFrame.acceleration && amag > 0) {
        const alpha = 0.15;
        ax = alpha * ax + (1 - alpha) * prevFrame.acceleration.x;
        ay = alpha * ay + (1 - alpha) * prevFrame.acceleration.y;
        amag = Math.hypot(ax, ay);
      }

      acceleration = { x: ax, y: ay, magnitude: amag };
    } else if (this.runtime.getState() !== 'running') {
      // Calculate expected static acceleration based on currently applied forces and gravity in paused state
      const activeForce = this.propertyController ? this.propertyController.getActiveForce(objectId) : { x: 0, y: 0 };

      // Calculate applied acceleration
      const ax_applied = activeForce.x / body.mass;
      const ay_applied = activeForce.y / body.mass;

      // Calculate gravity acceleration
      const worldGravity = this.runtime.physics.getWorld().gravity;
      const gravityY = worldGravity.y * (body.isStatic ? 0 : 1);

      // Determine if it is resting on the ground (normal force perfectly cancels gravity)
      const viewport = this.runtime.renderer.getViewport();
      const isResting = body.position.y >= viewport.height - ((body as any).circleRadius ?? 30) - 25;
      const gravityActiveY = isResting ? 0 : gravityY;

      const ax = ax_applied;
      const ay = ay_applied + gravityActiveY;

      acceleration = {
        x: ax,
        y: ay,
        magnitude: Math.hypot(ax, ay),
      };
    }

    const momentum = {
      x: body.mass * velocity.x,
      y: body.mass * velocity.y,
      magnitude: Math.hypot(body.mass * velocity.x, body.mass * velocity.y),
    };

    const kineticEnergy = {
      value: 0.5 * body.mass * speed * speed,
    };

    const angularVelocity = {
      value: Math.abs(body.angularVelocity) < 0.005 ? 0 : body.angularVelocity,
    };

    const activeForce = this.propertyController ? this.propertyController.getActiveForce(objectId) : { x: 0, y: 0 };
    const forceMag = Math.hypot(activeForce.x, activeForce.y);

    this.history.set(objectId, {
      position,
      velocity,
      angle,
      timestamp: now,
      acceleration,
    });

    return {
      velocity: { x: velocity.x, y: velocity.y, magnitude: speed },
      acceleration,
      momentum,
      kineticEnergy,
      angularVelocity,
      force: { x: activeForce.x, y: activeForce.y, magnitude: forceMag },
    };
  }

  private renderEntry(entry: ObservableEntry, body: Body, metrics: ComputedObservables): void {
    const { registration, container, graphics, label } = entry;
    graphics.clear();

    const origin = { x: 0, y: 0 };
    const elements: string[] = [];

    // Render Applied Force Vector first (Red)
    if (registration.types.includes('force') && metrics.force) {
      const magnified = {
        x: metrics.force.x * SCALE.force,
        y: metrics.force.y * SCALE.force,
      };
      const arrow = clampVector(magnified, 220);
      drawArrow(graphics, origin, arrow, {
        ...DEFAULT_STYLE.force,
        headLength: 14,
      });
      // Force is scaled by 100 for N readout
      elements.push(`F=${formatDecimal(metrics.force.magnitude * 100)} N`);
    }

    // Render Velocity Vector (Blue)
    if (registration.types.includes('velocity') && metrics.velocity) {
      const magnified = {
        x: metrics.velocity.x * SCALE.velocity,
        y: metrics.velocity.y * SCALE.velocity,
      };
      const arrow = clampVector(magnified, 220);
      drawArrow(graphics, origin, arrow, {
        ...DEFAULT_STYLE.velocity,
        headLength: 14,
      });
      elements.push(`v=${formatDecimal(metrics.velocity.magnitude)} px/s`);
    }

    // Render Acceleration Vector (Green)
    if (registration.types.includes('acceleration') && metrics.acceleration) {
      const magnified = {
        x: metrics.acceleration.x * SCALE.acceleration,
        y: metrics.acceleration.y * SCALE.acceleration,
      };
      const arrow = clampVector(magnified, 220);
      drawArrow(graphics, origin, arrow, {
        ...DEFAULT_STYLE.acceleration,
        headLength: 14,
      });
      elements.push(`a=${formatDecimal(metrics.acceleration.magnitude)} px/s²`);
    }

    if (registration.types.includes('angularVelocity') && metrics.angularVelocity) {
      const turnMagnitude = metrics.angularVelocity.value;
      const radius = 18 + Math.abs(turnMagnitude) * SCALE.angularVelocity;
      const spinner = Math.min(76, radius);
      graphics.lineStyle(DEFAULT_STYLE.angularVelocity.width, DEFAULT_STYLE.angularVelocity.color, DEFAULT_STYLE.angularVelocity.alpha);
      graphics.arc(origin.x, origin.y, spinner, 0, Math.PI * 1.4);
      graphics.moveTo(origin.x, origin.y - spinner);
      graphics.lineTo(origin.x + 8, origin.y - spinner + 10);
      elements.push(`ω=${formatDecimal(metrics.angularVelocity.value)} rad/s`);
    }

    if (registration.types.includes('momentum') && metrics.momentum) {
      elements.push(`p=${formatDecimal(metrics.momentum.magnitude)} kg·px/s`);
    }

    if (registration.types.includes('kineticEnergy') && metrics.kineticEnergy) {
      elements.push(`KE=${formatDecimal(metrics.kineticEnergy.value)} J`);
    }

    const labelText = registration.label ? `${registration.label}: ${elements.join(' | ')}` : elements.join(' | ');
    label.text = labelText;
    label.style.fill = registration.color ?? DEFAULT_STYLE.text.fill;
    container.position.set(body.position.x, body.position.y);
  }
}
