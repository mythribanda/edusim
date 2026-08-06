/**
 * Reusable normalized educational constants for sandbox gravity properties.
 * These do NOT use real astronomical SI units, which would cause physics
 * engines to explode or require microscopic timesteps. Instead, they represent
 * harmonized, sandbox-friendly normalized scaling units.
 */

export interface OrbitalDefaults {
  clockwise: boolean;
  initialVelocityMultiplier: number;
}

export interface PresetProperties {
  name: string;
  category: 'planet' | 'moon' | 'star' | 'gas_giant' | 'dwarf_planet' | 'black_hole';
  radius: number;
  mass: number;
  density: number;
  gravityStrength: number;
  influenceRadius: number;
  fillColor: number;
  strokeColor: number;
  strokeWidth: number;
  orbitalDefaults: OrbitalDefaults;
}

// Normalized reusable helper constants for sandbox gravity scaling
export const GRAVITY_CONSTANTS = {
  DEFAULT_G: 0.0012,
  MAX_GRAVITY_CLAMP: 0.05,
  SOFTENING_FACTOR: 100,
  BASE_DENSITY: 0.002, // kg / px^2
};

export const EARTH_LIKE: PresetProperties = {
  name: 'Earth-like Planet',
  category: 'planet',
  radius: 25,
  mass: 1000,
  density: 0.002,
  gravityStrength: 1.0,
  influenceRadius: 600,
  fillColor: 0x3b82f6, // Sleek vibrant blue
  strokeColor: 0x60a5fa, // Light sky outline
  strokeWidth: 2,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 1.0,
  },
};

export const MOON_LIKE: PresetProperties = {
  name: 'Moon-like Satellite',
  category: 'moon',
  radius: 10,
  mass: 100,
  density: 0.002,
  gravityStrength: 0.16,
  influenceRadius: 150,
  fillColor: 0x9ca3af, // Sleek lunar grey
  strokeColor: 0xd1d5db, // Moonbeam highlight
  strokeWidth: 1.5,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 1.0,
  },
};

export const SUN_LIKE: PresetProperties = {
  name: 'Sun-like Star',
  category: 'star',
  radius: 60,
  mass: 100000,
  density: 0.005,
  gravityStrength: 28.0,
  influenceRadius: 1500,
  fillColor: 0xeab308, // Glowing Solar Golden
  strokeColor: 0xf97316, // Solar Orange Outline
  strokeWidth: 4,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 0.0, // Fixed solar anchor
  },
};

export const SMALL_PLANET: PresetProperties = {
  name: 'Dwarf Planet',
  category: 'dwarf_planet',
  radius: 15,
  mass: 300,
  density: 0.002,
  gravityStrength: 0.4,
  influenceRadius: 350,
  fillColor: 0xf87171, // Rose-red surface
  strokeColor: 0xfca5a5, // Soft highlight
  strokeWidth: 2,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 1.05,
  },
};

export const LARGE_PLANET: PresetProperties = {
  name: 'Gas Giant',
  category: 'gas_giant',
  radius: 45,
  mass: 5000,
  density: 0.0015,
  gravityStrength: 2.5,
  influenceRadius: 900,
  fillColor: 0xa78bfa, // Royal Purple Gas Giant
  strokeColor: 0xc084fc, // Bright Lavender Bands
  strokeWidth: 3,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 0.95,
  },
};

export const BLACK_HOLE: PresetProperties = {
  name: 'Singularity',
  category: 'black_hole',
  radius: 20,
  mass: 500000,
  density: 0.2, // Ultra-dense singularity
  gravityStrength: 100.0,
  influenceRadius: 2000,
  fillColor: 0x030712, // Deepest space black
  strokeColor: 0x6366f1, // Accretion disk violet-blue
  strokeWidth: 5,
  orbitalDefaults: {
    clockwise: true,
    initialVelocityMultiplier: 0.0,
  },
};

export const GRAVITY_PRESETS = {
  EARTH_LIKE,
  MOON_LIKE,
  SUN_LIKE,
  SMALL_PLANET,
  LARGE_PLANET,
  BLACK_HOLE,
};
