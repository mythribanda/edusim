import * as Matter from 'matter-js';

export type OrbitType = 'circular' | 'elliptical';

export interface OrbitConfig {
  gravitationalConstant: number;
  defaultOrbitRadius: number;
  defaultOrbitDirection: 'clockwise' | 'counterclockwise';
  velocityMultiplier: number;
  debug: boolean;
  allowEllipticalOrbits: boolean;
}

export interface OrbitSpawnOptions {
  centerBody: Matter.Body;
  orbitingBody: Matter.Body;
  radius?: number;
  angle?: number; // Initial position angle relative to center body in radians
  clockwise?: boolean;
  orbitType?: OrbitType;
  eccentricity?: number; // 0 for circular, 0 < e < 1 for elliptical, >= 1 is parabolic/escape
  initialVelocityMultiplier?: number;
}

export interface OrbitalState {
  currentRadius: number;
  velocity: { x: number; y: number };
  angularVelocity: number;
  orbitalEnergy: number;
  isStableOrbit: boolean;
}
