/**
 * Orbital Observables Types & Interfaces
 * Centralized strong typings for the EduSim sandbox orbital mechanics telemetry engine.
 */

export type OrbitalObservableType =
  | 'velocity'
  | 'radius'
  | 'kinetic_energy'
  | 'potential_energy'
  | 'total_energy'
  | 'escape_velocity'
  | 'orbital_period'
  | 'angular_velocity'
  | 'stability';

export interface OrbitalObservableData {
  value: number | string;
  unit: string;
  label: string;
  formattedValue: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface OrbitalStateSnapshot {
  radius: OrbitalObservableData;
  velocity: OrbitalObservableData;
  kineticEnergy: OrbitalObservableData;
  potentialEnergy: OrbitalObservableData;
  totalEnergy: OrbitalObservableData;
  escapeVelocity: OrbitalObservableData;
  orbitalPeriod: OrbitalObservableData;
  angularVelocity: OrbitalObservableData;
  isStable: {
    status: 'stable' | 'elliptical' | 'escape' | 'decay' | 'collision';
    label: string;
    description: string;
  };
}
