import * as Matter from 'matter-js';

export type GravityMode = 'linear' | 'radial';

export interface GravitySource {
  id: string;
  mass: number;
  position: { x: number; y: number };
  influenceRadius?: number; // Optional radius of influence (e.g. infinite if undefined)
  enabled: boolean;
  metadata?: any;
}

export interface GravityBody {
  id: string;
  body: Matter.Body;
  mass: number;
  affectedByGravity: boolean;
  ignoreGravity: boolean;
  metadata?: any;
}

export interface GravityConfig {
  mode: GravityMode;
  gravitationalConstant: number; // e.g. G
  softeningFactor: number; // to prevent singularity
  maxForceClamp?: number; // to prevent explosions
  debug?: boolean;
}
