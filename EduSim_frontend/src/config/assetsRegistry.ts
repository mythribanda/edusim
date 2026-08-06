// ─── Asset Registry ──────────────────────────────────────────────────────────
// Each asset maps to a physics shape that can be spawned in the simulation.
// The `spawnType` and `spawnConfig` fields are forwarded to the objectFactory.

export interface AssetDefinition {
  id: string;
  name: string;
  emoji: string;            // Used as icon when no image is available
  category: string;
  tags: string[];
  spawnType: 'circle' | 'rectangle' | 'triangle';
  texture?: string;         // Optional SVG/image asset texture path
  spawnConfig: {
    radius?: number;
    width?: number;
    height?: number;
    density?: number;
    restitution?: number;
    friction?: number;
    fillColor: number;
    strokeColor: number;
    isStatic?: boolean;
    cornerRadius?: number;
  };
  celestialConfig?: {
    type?: 'star' | 'planet' | 'moon' | 'satellite' | 'asteroid';

    isGravitySource?: boolean;
    affectedByGravity?: boolean;

    mass?: number;
    radius?: number;

    gravityStrength?: number;
    influenceRadius?: number;

    density?: number;

    orbitalDefaults?: {
      autoOrbit?: boolean;
      preferredOrbitRadius?: number;
      preferredDirection?: 'clockwise' | 'counterclockwise';
      initialVelocityMultiplier?: number;
    };

    rendering?: {
      glow?: boolean;
      atmosphere?: boolean;
      orbitTrail?: boolean;
    };
  };
}

export const STAR_PROFILE = {
  type: 'star' as const,
  isGravitySource: true,
  affectedByGravity: false,
  mass: 5000,
  gravityStrength: 1.2,
  influenceRadius: 3000,
  rendering: { glow: true, atmosphere: true, orbitTrail: false }
};

export const PLANET_PROFILE = {
  type: 'planet' as const,
  isGravitySource: true,
  affectedByGravity: true,
  mass: 1000,
  gravityStrength: 0.8,
  rendering: { glow: false, atmosphere: true, orbitTrail: true }
};

export const MOON_PROFILE = {
  type: 'moon' as const,
  isGravitySource: true,
  affectedByGravity: true,
  mass: 150,
  gravityStrength: 0.4,
  orbitalDefaults: { autoOrbit: true },
  rendering: { glow: false, atmosphere: false, orbitTrail: true }
};

export const SATELLITE_PROFILE = {
  type: 'satellite' as const,
  affectedByGravity: true,
  isGravitySource: false,
  mass: 10,
  orbitalDefaults: { autoOrbit: true },
  rendering: { glow: false, atmosphere: false, orbitTrail: true }
};

export const ASTEROID_PROFILE = {
  type: 'asteroid' as const,
  affectedByGravity: true,
  isGravitySource: false,
  mass: 5,
  orbitalDefaults: { autoOrbit: true },
  rendering: { glow: false, atmosphere: false, orbitTrail: true }
};


const baseRegistry: Record<string, AssetDefinition[]> = {
  Shapes: [
    {
      id: 'ball-small',
      name: 'Small Ball',
      emoji: '🔴',
      category: 'Shapes',
      tags: ['circle', 'ball', 'round', 'bounce'],
      spawnType: 'circle',
      spawnConfig: { radius: 18, density: 0.002, restitution: 0.75, friction: 0.1, fillColor: 0xef4444, strokeColor: 0xfca5a5 },
    },
    {
      id: 'ball-large',
      name: 'Large Ball',
      emoji: '🟠',
      category: 'Shapes',
      tags: ['circle', 'ball', 'large', 'heavy'],
      spawnType: 'circle',
      spawnConfig: { radius: 36, density: 0.004, restitution: 0.5, friction: 0.15, fillColor: 0xf97316, strokeColor: 0xfdba74 },
    },
    {
      id: 'cube-small',
      name: 'Small Cube',
      emoji: '🟦',
      category: 'Shapes',
      tags: ['box', 'cube', 'square', 'rect'],
      spawnType: 'rectangle',
      spawnConfig: { width: 40, height: 40, density: 0.003, restitution: 0.3, friction: 0.4, fillColor: 0x3b82f6, strokeColor: 0x93c5fd, cornerRadius: 6 },
    },
    {
      id: 'cube-large',
      name: 'Large Cube',
      emoji: '🟫',
      category: 'Shapes',
      tags: ['box', 'cube', 'large', 'block'],
      spawnType: 'rectangle',
      spawnConfig: { width: 70, height: 70, density: 0.005, restitution: 0.2, friction: 0.6, fillColor: 0x78350f, strokeColor: 0xd97706, cornerRadius: 8 },
    },
    {
      id: 'plank',
      name: 'Plank',
      emoji: '🟩',
      category: 'Shapes',
      tags: ['plank', 'platform', 'beam', 'ramp'],
      spawnType: 'rectangle',
      spawnConfig: { width: 120, height: 16, density: 0.002, restitution: 0.2, friction: 0.5, fillColor: 0x15803d, strokeColor: 0x4ade80, cornerRadius: 4 },
    },
    {
      id: 'heavy-disk',
      name: 'Heavy Disk',
      emoji: '⚫',
      category: 'Shapes',
      tags: ['disk', 'heavy', 'circle', 'dense'],
      spawnType: 'circle',
      spawnConfig: { radius: 28, density: 0.012, restitution: 0.1, friction: 0.8, fillColor: 0x1e293b, strokeColor: 0x475569 },
    },
  ],

  Physics: [
    {
      id: 'bouncy-ball',
      name: 'Bouncy Ball',
      emoji: '🏀',
      category: 'Physics',
      tags: ['bounce', 'elastic', 'restitution', 'high'],
      spawnType: 'circle',
      spawnConfig: { radius: 22, density: 0.001, restitution: 0.95, friction: 0.05, fillColor: 0xf59e0b, strokeColor: 0xfcd34d },
    },
    {
      id: 'rubber-cube',
      name: 'Rubber Block',
      emoji: '🟪',
      category: 'Physics',
      tags: ['rubber', 'elastic', 'bounce', 'soft'],
      spawnType: 'rectangle',
      spawnConfig: { width: 45, height: 45, density: 0.001, restitution: 0.9, friction: 0.8, fillColor: 0x7c3aed, strokeColor: 0xc084fc, cornerRadius: 10 },
    },
    {
      id: 'lead-ball',
      name: 'Lead Ball',
      emoji: '⚙️',
      category: 'Physics',
      tags: ['heavy', 'dense', 'mass', 'lead'],
      spawnType: 'circle',
      spawnConfig: { radius: 20, density: 0.02, restitution: 0.05, friction: 0.9, fillColor: 0x374151, strokeColor: 0x6b7280 },
    },
    {
      id: 'ice-cube',
      name: 'Ice Cube',
      emoji: '🧊',
      category: 'Physics',
      tags: ['ice', 'slippery', 'low friction', 'slide'],
      spawnType: 'rectangle',
      spawnConfig: { width: 42, height: 42, density: 0.001, restitution: 0.4, friction: 0.02, fillColor: 0x7dd3fc, strokeColor: 0xe0f2fe, cornerRadius: 8 },
    },
    {
      id: 'cork',
      name: 'Cork',
      emoji: '🟤',
      category: 'Physics',
      tags: ['cork', 'light', 'float', 'low density'],
      spawnType: 'circle',
      spawnConfig: { radius: 16, density: 0.0005, restitution: 0.5, friction: 0.3, fillColor: 0xa16207, strokeColor: 0xfbbf24 },
    },
  ],

  Structures: [
    {
      id: 'wall',
      name: 'Wall',
      emoji: '🧱',
      category: 'Structures',
      tags: ['wall', 'static', 'barrier', 'block'],
      spawnType: 'rectangle',
      spawnConfig: { width: 20, height: 100, density: 0.01, restitution: 0.1, friction: 0.9, fillColor: 0x7f1d1d, strokeColor: 0xf87171, isStatic: true, cornerRadius: 2 },
    },
    {
      id: 'platform',
      name: 'Platform',
      emoji: '⬛',
      category: 'Structures',
      tags: ['platform', 'static', 'floor', 'ground'],
      spawnType: 'rectangle',
      spawnConfig: { width: 140, height: 18, density: 0.01, restitution: 0.3, friction: 0.7, fillColor: 0x1e293b, strokeColor: 0x334155, isStatic: true, cornerRadius: 4 },
    },
    {
      id: 'wedge',
      name: 'Wedge',
      emoji: '📐',
      category: 'Structures',
      tags: ['wedge', 'ramp', 'slope', 'incline'],
      spawnType: 'rectangle',
      spawnConfig: { width: 80, height: 40, density: 0.004, restitution: 0.2, friction: 0.5, fillColor: 0x065f46, strokeColor: 0x34d399, isStatic: true, cornerRadius: 3 },
    },
    {
      id: 'pillar',
      name: 'Pillar',
      emoji: '🏛️',
      category: 'Structures',
      tags: ['pillar', 'column', 'support', 'vertical'],
      spawnType: 'rectangle',
      spawnConfig: { width: 18, height: 120, density: 0.01, restitution: 0.1, friction: 0.8, fillColor: 0x374151, strokeColor: 0x9ca3af, isStatic: true, cornerRadius: 4 },
    },
  ],

  Lab: [
    {
      id: 'test-mass',
      name: 'Test Mass',
      emoji: '🔬',
      category: 'Lab',
      tags: ['test', 'mass', 'experiment', 'measure'],
      spawnType: 'circle',
      spawnConfig: { radius: 14, density: 0.005, restitution: 0.3, friction: 0.4, fillColor: 0x0891b2, strokeColor: 0x67e8f9 },
    },
    {
      id: 'projectile',
      name: 'Projectile',
      emoji: '💥',
      category: 'Lab',
      tags: ['projectile', 'launch', 'fast', 'velocity'],
      spawnType: 'circle',
      spawnConfig: { radius: 10, density: 0.008, restitution: 0.6, friction: 0.05, fillColor: 0xdc2626, strokeColor: 0xfca5a5 },
    },
    {
      id: 'weight',
      name: 'Weight',
      emoji: '⚖️',
      category: 'Lab',
      tags: ['weight', 'gravity', 'heavy', 'measure'],
      spawnType: 'rectangle',
      spawnConfig: { width: 32, height: 48, density: 0.015, restitution: 0.1, friction: 0.7, fillColor: 0x292524, strokeColor: 0x78716c, cornerRadius: 4 },
    },
    {
      id: 'sensor-ball',
      name: 'Sensor Ball',
      emoji: '🟡',
      category: 'Lab',
      tags: ['sensor', 'observe', 'track', 'monitor'],
      spawnType: 'circle',
      spawnConfig: { radius: 16, density: 0.001, restitution: 0.6, friction: 0.1, fillColor: 0xeab308, strokeColor: 0xfde047 },
    },
  ]
};

// Dynamically load SVGs from root svgs/ folder
const svgModules = import.meta.glob('../svgs/**/*.svg', { eager: true, import: 'default' }) as Record<string, string>;

// Helper to capitalize words
function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Copy baseRegistry to exportable assetsRegistry
export const assetsRegistry: Record<string, AssetDefinition[]> = { ...baseRegistry };

// Process the glob files and dynamically populate categories
Object.entries(svgModules).forEach(([filePath, url]) => {
  // Extract category and name from path: "../../svgs/planets/earth.svg"
  const match = filePath.match(/\/svgs\/([^/]+)\/([^/]+)\.svg$/);
  if (!match) return;

  const rawCategory = match[1];
  const rawName = match[2];

  // Capitalize category name (e.g. "planets" -> "Planets")
  const category = capitalize(rawCategory);

  // Strip common trailing "_svg" or "-svg" suffixes and format clean item name
  const cleanName = rawName.replace(/[_-]svg$/i, '');
  const name = capitalize(cleanName.replace(/[_-]+/g, ' '));
  const id = cleanName.toLowerCase();

  // Map appropriate premium emojis based on category or name
  let emoji = '📦';
  const nameLower = name.toLowerCase();
  const catLower = category.toLowerCase();

  if (catLower.includes('planet')) {
    if (nameLower.includes('earth')) emoji = '🌍';
    else if (nameLower.includes('mars')) emoji = '🔴';
    else if (nameLower.includes('jupiter')) emoji = '🪐';
    else if (nameLower.includes('saturn')) emoji = '🪐';
    else if (nameLower.includes('mercury')) emoji = '🌑';
    else if (nameLower.includes('venus')) emoji = '🟡';
    else if (nameLower.includes('neptune')) emoji = '🔵';
    else if (nameLower.includes('uranus')) emoji = '💎';
    else if (nameLower.includes('sun')) emoji = '☀️';
    else if (nameLower.includes('moon')) emoji = '🌙';
    else emoji = '🪐';
  } else if (catLower.includes('vehicle')) {
    if (nameLower.includes('car')) emoji = '🏎️';
    else if (nameLower.includes('bus')) emoji = '🚌';
    else if (nameLower.includes('truck')) emoji = '🚚';
    else if (nameLower.includes('train')) emoji = '🚊';
    else if (nameLower.includes('rocket')) emoji = '🚀';
    else emoji = '🚗';
  } else if (catLower.includes('animal')) {
    if (nameLower.includes('tiger') || nameLower.includes('lion')) emoji = '🦁';
    else if (nameLower.includes('bear')) emoji = '🐻';
    else if (nameLower.includes('cat')) emoji = '🐱';
    else if (nameLower.includes('dog')) emoji = '🐶';
    else if (nameLower.includes('bird')) emoji = '🐦';
    else if (nameLower.includes('frog')) emoji = '🐸';
    else emoji = '🦁';
  } else if (catLower.includes('food')) {
    emoji = '🍎';
  } else if (catLower.includes('instrument') || catLower.includes('music')) {
    emoji = '🎸';
  } else if (catLower.includes('weapon')) {
    emoji = '⚔️';
  } else {
    emoji = '🎨';
  }

  // Smart shape matching based on naming conventions and category
  const isCelestial = catLower.includes('planet') ||
    nameLower.includes('planet') ||
    nameLower.includes('earth') ||
    nameLower.includes('mars') ||
    nameLower.includes('jupiter') ||
    nameLower.includes('saturn') ||
    nameLower.includes('mercury') ||
    nameLower.includes('venus') ||
    nameLower.includes('neptune') ||
    nameLower.includes('uranus') ||
    nameLower.includes('sun') ||
    nameLower.includes('star') ||
    nameLower.includes('moon') ||
    nameLower.includes('luna') ||
    nameLower.includes('satellite') ||
    nameLower.includes('probe') ||
    nameLower.includes('iss') ||
    nameLower.includes('sputnik') ||
    nameLower.includes('hubble') ||
    nameLower.includes('voyager') ||
    nameLower.includes('asteroid') ||
    nameLower.includes('meteor') ||
    nameLower.includes('comet') ||
    nameLower.includes('rocket');

  const isCircle = isCelestial ||
    catLower.includes('planet') ||
    nameLower.includes('ball') ||
    nameLower.includes('wheel') ||
    nameLower.includes('disk') ||
    nameLower.includes('circle');

  const spawnType = isCircle ? 'circle' : 'rectangle';

  // Config parameters with fine-tuned premium defaults
  const spawnConfig: any = {
    density: 0.002,
    restitution: 0.6,
    friction: 0.1,
    fillColor: 0x818cf8,
    strokeColor: 0xc7d2fe,
  };

  if (isCircle) {
    spawnConfig.radius = catLower.includes('planet') || isCelestial
      ? (nameLower.includes('sun') ? 65 : nameLower.includes('jupiter') ? 55 : nameLower.includes('moon') ? 16 : nameLower.includes('satellite') || nameLower.includes('probe') || nameLower.includes('iss') || nameLower.includes('rocket') ? 14 : 35)
      : 24;
  } else {
    spawnConfig.width = 60;
    spawnConfig.height = 40;
    spawnConfig.cornerRadius = 6;
  }

  let celestialConfig: any = undefined;
  if (isCelestial) {
    if (nameLower.includes('sun') || nameLower.includes('star') || nameLower.includes('sol')) {
      celestialConfig = { ...STAR_PROFILE };
    } else if (nameLower.includes('moon') || nameLower.includes('luna')) {
      celestialConfig = { ...MOON_PROFILE };
    } else if (nameLower.includes('satellite') || nameLower.includes('probe') || nameLower.includes('iss') || nameLower.includes('sputnik') || nameLower.includes('hubble') || nameLower.includes('voyager') || nameLower.includes('rocket')) {
      celestialConfig = { ...SATELLITE_PROFILE };
    } else if (nameLower.includes('asteroid') || nameLower.includes('meteor') || nameLower.includes('comet')) {
      celestialConfig = { ...ASTEROID_PROFILE };
    } else {
      celestialConfig = { ...PLANET_PROFILE };
    }

    celestialConfig = {
      ...celestialConfig,
      radius: spawnConfig.radius,
    };
  }

  const asset: AssetDefinition = {
    id,
    name,
    emoji,
    category,
    tags: [catLower, rawName.toLowerCase(), ...rawName.split(/[_-]/).map((t) => t.toLowerCase())],
    spawnType,
    texture: url,
    spawnConfig,
    celestialConfig,
  };

  if (!assetsRegistry[category]) {
    assetsRegistry[category] = [];
  }

  // Prevent duplicate definitions to preserve static custom/fine-tuned physics properties
  const exists = assetsRegistry[category].some((a) => a.id === id);
  if (!exists) {
    assetsRegistry[category].push(asset);
  }
});

