/**
 * PlanetProperties
 * Planet-specific physical properties and classification systems for EduSim
 */

export type OrbitalCategory =
  | 'planet'
  | 'moon'
  | 'star'
  | 'gas_giant'
  | 'dwarf_planet'
  | 'black_hole';

export interface PlanetProperties {
  radius: number;
  mass: number;
  density: number;
  atmosphereRadius?: number; // Visual aura radius
  gravityInfluenceRadius?: number; // Field size
  surfaceGravity?: number; // Calibrated local surface acceleration (e.g. Earth = 9.8 m/s^2 equivalent)
  orbitalCategory: OrbitalCategory;
  renderScale: number;
  collisionEnabled: boolean;
}

/**
 * Validates a celestial physical configuration before updating physics structures.
 */
export function validatePlanetProperties(props: Partial<PlanetProperties>): { valid: boolean; error?: string } {
  if (props.radius !== undefined) {
    if (typeof props.radius !== 'number' || props.radius <= 0 || !isFinite(props.radius)) {
      return { valid: false, error: 'Radius must be a positive finite number.' };
    }
  }

  if (props.mass !== undefined) {
    if (typeof props.mass !== 'number' || props.mass <= 0 || !isFinite(props.mass)) {
      return { valid: false, error: 'Mass must be a positive finite number.' };
    }
  }

  if (props.density !== undefined) {
    if (typeof props.density !== 'number' || props.density <= 0 || !isFinite(props.density)) {
      return { valid: false, error: 'Density must be a positive finite number.' };
    }
  }

  if (props.gravityInfluenceRadius !== undefined && props.gravityInfluenceRadius !== null) {
    if (typeof props.gravityInfluenceRadius !== 'number' || props.gravityInfluenceRadius < 0 || !isFinite(props.gravityInfluenceRadius)) {
      return { valid: false, error: 'Gravity influence radius must be non-negative.' };
    }
  }

  if (props.renderScale !== undefined) {
    if (typeof props.renderScale !== 'number' || props.renderScale <= 0 || !isFinite(props.renderScale)) {
      return { valid: false, error: 'Render scale must be a positive finite number.' };
    }
  }

  return { valid: true };
}
