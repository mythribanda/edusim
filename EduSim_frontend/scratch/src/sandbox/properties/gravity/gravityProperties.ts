/**
 * GravityProperties
 * Reusable gravity-related property definitions, validation rules, and schema interfaces
 * to power data-driven educative simulations in the EduSim Sandbox.
 */

export type GravityFalloffType = 'inverse-square' | 'linear' | 'constant';

export interface GravityProperties {
  mass: number;
  gravityStrength: number;
  isGravitySource: boolean;
  affectedByGravity: boolean;
  influenceRadius?: number; // Infinite range if undefined/omitted
  gravityFalloff?: GravityFalloffType;
}

/**
 * Specialized property configuration for celestial bodies acting as gravity fields (e.g. Suns, Asteroid belts, Singularity pegs).
 */
export interface GravitySourceProperties {
  mass: number;
  gravityStrength: number;
  influenceRadius?: number;
  gravityFalloff: GravityFalloffType;
  enabled: boolean;
}

/**
 * Specialized property configuration for standard orbiting items, satellite nodes, or small particles.
 */
export interface GravityBodyProperties {
  mass: number;
  affectedByGravity: boolean;
  ignoreGravity: boolean;
}

/**
 * Validation Result Structure
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: 'INVALID_MASS' | 'NEGATIVE_RADIUS' | 'NAN_VALUE' | 'INFINITE_VALUE' | 'UNSTABLE_CONFIG' | 'INVALID_TYPE';
}

/**
 * Validates a numerical property to prevent runtime division by zero or coordinate explosions.
 */
export function validateNumericProperty(name: string, value: number, min = 0, allowZero = false): ValidationResult {
  if (value === null || value === undefined || isNaN(value)) {
    return {
      valid: false,
      error: `Property "${name}" cannot be null, undefined, or NaN.`,
      code: 'NAN_VALUE',
    };
  }

  if (!isFinite(value)) {
    return {
      valid: false,
      error: `Property "${name}" must be a finite number.`,
      code: 'INFINITE_VALUE',
    };
  }

  if (allowZero) {
    if (value < min) {
      return {
        valid: false,
        error: `Property "${name}" must be greater than or equal to ${min}.`,
        code: 'NEGATIVE_RADIUS',
      };
    }
  } else {
    if (value <= min) {
      return {
        valid: false,
        error: `Property "${name}" must be strictly greater than ${min}.`,
        code: 'INVALID_MASS',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates a complete sandbox gravity configuration for stability.
 */
export function validateGravityConfiguration(properties: Partial<GravityProperties>): ValidationResult {
  if (properties.mass !== undefined) {
    const res = validateNumericProperty('mass', properties.mass, 0.001);
    if (!res.valid) return res;
  }

  if (properties.gravityStrength !== undefined) {
    const res = validateNumericProperty('gravityStrength', properties.gravityStrength, 0.0, true);
    if (!res.valid) return res;
  }

  if (properties.influenceRadius !== undefined && properties.influenceRadius !== null) {
    const res = validateNumericProperty('influenceRadius', properties.influenceRadius, 5.0, true);
    if (!res.valid) return res;
  }

  // Prevent unstable configuration: mass is extremely high but influence radius is too small
  if (
    properties.mass !== undefined &&
    properties.influenceRadius !== undefined &&
    properties.mass > 100000 &&
    properties.influenceRadius < 50
  ) {
    return {
      valid: false,
      error: 'Unstable gravity configuration: Super-massive body cannot have a micro influence radius.',
      code: 'UNSTABLE_CONFIG',
    };
  }

  return { valid: true };
}

/**
 * Runtime Type Guard: Checks if an object acts as a dynamic source of gravity.
 */
export function isGravitySource(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Checks if object explicitly declares gravity source properties or holds star metadata
  const hasSourceFlag = obj.isGravitySource === true;
  const hasMetadata = obj.metadata?.customData?.isGravitySource === true || obj.metadata?.isStar === true;
  const hasSourceProps = typeof obj.gravityStrength === 'number' && obj.gravityStrength > 0;
  
  return hasSourceFlag || hasMetadata || hasSourceProps;
}

/**
 * Runtime Type Guard: Checks if an object is pulled/attracted by gravity fields.
 */
export function isAffectedByGravity(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // True unless explicitly opt-out/ignored
  if (obj.affectedByGravity === false || obj.ignoreGravity === true) {
    return false;
  }

  const meta = obj.metadata?.customData;
  if (meta && (meta.affectedByGravity === false || meta.ignoreGravity === true)) {
    return false;
  }

  return true;
}
