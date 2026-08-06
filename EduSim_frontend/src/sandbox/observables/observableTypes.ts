import type { Vector } from 'matter-js';

export type ObservableType =
  | 'velocity'
  | 'acceleration'
  | 'momentum'
  | 'kineticEnergy'
  | 'angularVelocity'
  | 'force';

export interface ObservableRegistration {
  objectId: string;
  types: ObservableType[];
  label?: string;
  color?: number;
}

export interface VelocityMetrics {
  x: number;
  y: number;
  magnitude: number;
}

export interface AccelerationMetrics {
  x: number;
  y: number;
  magnitude: number;
}

export interface MomentumMetrics {
  x: number;
  y: number;
  magnitude: number;
}

export interface KineticEnergyMetrics {
  value: number;
}

export interface AngularVelocityMetrics {
  value: number;
}

export interface ComputedObservables {
  velocity?: VelocityMetrics;
  acceleration?: AccelerationMetrics;
  momentum?: MomentumMetrics;
  kineticEnergy?: KineticEnergyMetrics;
  angularVelocity?: AngularVelocityMetrics;
  force?: {
    x: number;
    y: number;
    magnitude: number;
  };
}

export interface ObjectFrame {
  position: Vector;
  velocity: Vector;
  angle: number;
  timestamp: number;
  acceleration?: { x: number; y: number; magnitude: number };
}

export interface ObservableVisualStyle {
  velocity: {
    color: number;
    alpha: number;
    width: number;
  };
  acceleration: {
    color: number;
    alpha: number;
    width: number;
  };
  force: {
    color: number;
    alpha: number;
    width: number;
  };
  angularVelocity: {
    color: number;
    alpha: number;
    width: number;
  };
  text: {
    fill: number;
    fontSize: number;
    fontFamily: string;
  };
}
