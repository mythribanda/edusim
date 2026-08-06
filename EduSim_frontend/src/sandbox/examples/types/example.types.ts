import type { SandboxRuntime } from '../../engine/runtime';
import type { RuntimeStore } from '../../state/runtimeStore';
import type { PropertyController } from '../../properties/propertyController';
import type { ObservableEngine } from '../../observables/observableEngine';

export interface SandboxExampleMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  educationalNotes: string[];
}

export interface SandboxExampleObjectConfig {
  assetId: string;
  id: string; // unique instance ID for this object
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  isStatic?: boolean;
  mass?: number;
  radius?: number;
  eccentricity?: number; // for spawning elliptical orbits
  orbitCenterId?: string; // ID of the center body to orbit around
  orbitType?: 'circular' | 'elliptical';
  clockwise?: boolean;
  initialVelocityMultiplier?: number;
  customData?: Record<string, any>;
}

export interface SandboxExampleObservableConfig {
  objectId: string;
  types: string[]; // e.g. ['velocity', 'acceleration', 'force', 'momentum', 'kineticEnergy', 'kepler']
  label?: string;
  color?: number;
}

export interface SandboxExampleOverlayConfig {
  showOrbitPath?: boolean;
  showGravityVectors?: boolean;
  showInfluenceRadius?: boolean;
  showVelocityVectors?: boolean;
  showForceVectors?: boolean;
  showOrbitalTrail?: boolean;
}

export interface SandboxExampleConfig {
  metadata: SandboxExampleMetadata;
  objects: SandboxExampleObjectConfig[];
  observables: SandboxExampleObservableConfig[];
  overlays: SandboxExampleOverlayConfig;
  gConstant?: number;
  gravityMode?: 'linear' | 'radial';
  camera?: {
    zoom?: number;
    centerX?: number;
    centerY?: number;
  };
  customSetup?: (
    runtime: SandboxRuntime,
    store: RuntimeStore,
    controller: PropertyController,
    observables: ObservableEngine
  ) => void | Promise<void> | (() => void) | Promise<(() => void) | void>;
}

export interface RegistryEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  config: SandboxExampleConfig;
}
