/**
 * Asset Catalog Resolver
 * Query and resolve assets from the generated catalog
 * Usage: npm run generate:assets (to regenerate catalog)
 */

import assetCatalog from '@/data/asset-catalog.json';

const SYNONYM_ALIASES = {
  car: ['automobile', 'vehicle', 'sedan', 'sports car', 'sport car'],
  bus: ['school bus', 'coach'],
  truck: ['lorry', 'pickup', 'pickup truck'],
  rocket: ['spacecraft', 'missile'],
  planet: ['earth', 'globe', 'world'],
  ball: ['sphere', 'orb'],
  box: ['crate', 'block'],
};

export function normalizeAssetName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeAssetCatalog(source) {
  if (Array.isArray(source)) {
    const assets = source.map((asset) => ({
        ...asset,
        default_width: Number(asset.default_width ?? asset.width ?? asset.defaultWidth ?? 0) || undefined,
        default_height: Number(asset.default_height ?? asset.height ?? asset.defaultHeight ?? 0) || undefined,
      }));

    return {
      assets,
      byId: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
      categories: {},
    };
  }

  if (Array.isArray(source?.assets)) {
    const assets = source.assets.map((asset) => ({
        ...asset,
        default_width: Number(asset.default_width ?? asset.width ?? asset.defaultWidth ?? 0) || undefined,
        default_height: Number(asset.default_height ?? asset.height ?? asset.defaultHeight ?? 0) || undefined,
      }));

    return {
      assets,
      byId: source.byId || Object.fromEntries(assets.map((asset) => [asset.id, asset])),
      categories: source.categories || {},
    };
  }

  return { assets: [], byId: {}, categories: {} };
}

function buildAliasSet(asset) {
  const baseAliases = [
    asset.id,
    asset.filename,
    asset.path,
    asset.category,
    asset.family,
    ...(asset.aliases || []),
  ];

  const extra = SYNONYM_ALIASES[normalizeAssetName(asset.family || asset.id)] || [];
  return new Set([...baseAliases, ...extra].map((value) => normalizeAssetName(value)).filter(Boolean));
}

function tokenize(value) {
  return normalizeAssetName(value).split('_').filter(Boolean);
}

class AssetCatalogResolver {
  constructor(catalog) {
    this.catalog = normalizeAssetCatalog(catalog);
    this.assetMap = new Map();
    this.filenameMap = new Map();
    this.pathMap = new Map();
    this.aliasMap = new Map();
    this.categoryMap = new Map();
    this.assetList = Array.isArray(this.catalog.assets) ? this.catalog.assets : [];
    
    // Build lookup maps for fast queries
    for (const asset of this.assetList) {
      this.assetMap.set(asset.id, asset);
      this.filenameMap.set(normalizeAssetName(asset.filename), asset);
      this.pathMap.set(normalizeAssetName(asset.path), asset);

      const aliases = buildAliasSet(asset);
      for (const alias of aliases) {
        if (!this.aliasMap.has(alias)) {
          this.aliasMap.set(alias, asset);
        }
      }

      const category = normalizeAssetName(asset.category);
      if (!this.categoryMap.has(category)) {
        this.categoryMap.set(category, []);
      }
      this.categoryMap.get(category).push(asset);
    }
  }

  /**
   * Find asset by ID
   * @param {string} id - Asset ID (filename without extension)
   * @returns {object|null} Asset object or null
   */
  findById(id) {
    const normalized = normalizeAssetName(id);
    return this.assetMap.get(normalized) || this.aliasMap.get(normalized) || null;
  }

  /**
   * Find assets by category
   * @param {string} category - Category name (e.g., 'vehicles', 'physics')
   * @returns {array} Array of matching assets
   */
  findByCategory(category) {
    const normalized = normalizeAssetName(category);
    return this.categoryMap.get(normalized) || this.assetList.filter((asset) => normalizeAssetName(asset.category) === normalized);
  }

  /**
   * Find assets by partial filename match
   * @param {string} query - Query string to match
   * @returns {array} Array of matching assets
   */
  search(query) {
    const normalized = normalizeAssetName(query);
    const tokens = tokenize(query);
    return this.assetList.filter((asset) => {
      const haystack = normalizeAssetName([
        asset.id,
        asset.filename,
        asset.path,
        asset.category,
        asset.family,
        ...(asset.aliases || []),
      ].join(' '));
      return normalized
        ? haystack.includes(normalized) || tokens.every((token) => haystack.includes(token))
        : false;
    });
  }

  /**
   * Get asset path by ID
   * @param {string} id - Asset ID
   * @returns {string|null} Full asset path or null
   */
  getPath(id) {
    const asset = this.findById(id);
    return asset ? asset.path : null;
  }

  getDimensions(id) {
    const asset = this.findById(id);
    if (!asset) {
      return null;
    }

    const width = Number(asset.default_width ?? asset.width ?? asset.defaultWidth ?? 0);
    const height = Number(asset.default_height ?? asset.height ?? asset.defaultHeight ?? 0);

    return {
      width: Number.isFinite(width) && width > 0 ? width : undefined,
      height: Number.isFinite(height) && height > 0 ? height : undefined,
    };
  }

  getDefaultAssetForCategory(category) {
    const assets = this.findByCategory(category);
    if (!assets.length) {
      return null;
    }

    const preferred = assets.find((asset) => asset.default === asset.path) || assets[0];
    return preferred;
  }

  /**
   * Find best match for an object type from keywords
   * @param {string} objectType - Object type/name
   * @param {string} category - Optional category to limit search
   * @returns {object|null} Best matching asset
   */
  resolveByType(objectType, category = null) {
    const normalizedQuery = normalizeAssetName(objectType);
    const tokenQuery = tokenize(objectType);
    const normalizedCategory = category ? normalizeAssetName(category) : null;
    const candidates = normalizedCategory ? this.findByCategory(normalizedCategory) : this.assetList;

    if (!normalizedQuery && normalizedCategory) {
      return this.getDefaultAssetForCategory(normalizedCategory);
    }

    if (!candidates.length) {
      return this.getDefaultAssetForCategory('misc') || this.assetList[0] || null;
    }

    const exactId = candidates.find((asset) => normalizeAssetName(asset.id) === normalizedQuery);
    if (exactId) return exactId;

    const exactFilename = candidates.find((asset) => normalizeAssetName(asset.filename) === normalizedQuery || normalizeAssetName(asset.path) === normalizedQuery);
    if (exactFilename) return exactFilename;

    const aliasMatch = candidates.find((asset) => {
      const aliases = buildAliasSet(asset);
      return aliases.has(normalizedQuery) || tokenQuery.every((token) => aliases.has(token));
    });
    if (aliasMatch) return aliasMatch;

    const variantMatch = candidates.find((asset) => {
      const haystack = normalizeAssetName([
        asset.id,
        asset.filename,
        asset.path,
        asset.family,
        ...(asset.aliases || []),
      ].join(' '));
      return normalizedQuery && haystack.includes(normalizedQuery);
    });
    if (variantMatch) return variantMatch;

    if (normalizedCategory) {
      const defaultAsset = this.getDefaultAssetForCategory(normalizedCategory);
      if (defaultAsset) return defaultAsset;
    }

    return this.getDefaultAssetForCategory('misc') || this.assetList[0] || null;
  }

  /**
   * Get all categories
   * @returns {array} Unique category names
   */
  getCategories() {
    return Array.from(new Set(this.assetList.map((asset) => asset.category))).sort();
  }

  /**
   * Get catalog metadata
   * @returns {object} Metadata including generated time and total assets
   */
  getMetadata() {
    return {
      generatedAt: this.catalog.generatedAt,
      totalAssets: this.catalog.totalAssets,
      categories: this.getCategories(),
    };
  }

  /**
   * Get random asset from category
   * @param {string} category - Category name
   * @returns {object|null} Random asset from category or null
   */
  getRandomFromCategory(category) {
    const assets = this.findByCategory(category);
    if (assets.length === 0) return null;
    return assets[Math.floor(Math.random() * assets.length)];
  }
}

// Create singleton instance
const resolver = new AssetCatalogResolver(assetCatalog);

export default resolver;

/**
 * Export individual functions for convenience imports
 */
export function findAssetById(id) {
  return resolver.findById(id);
}

export function findAssetsByCategory(category) {
  return resolver.findByCategory(category);
}

export function searchAssets(query) {
  return resolver.search(query);
}

export function getAssetPath(id) {
  return resolver.getPath(id);
}

export function getAssetDimensions(id) {
  return resolver.getDimensions(id);
}

export function resolveAssetByType(objectType, category) {
  return resolver.resolveByType(objectType, category);
}

export function getAssetCategories() {
  return resolver.getCategories();
}

export function getAssetMetadata() {
  return resolver.getMetadata();
}

export function getRandomAsset(category) {
  return resolver.getRandomFromCategory(category);
}

export function resolveBestAsset(objectType, category) {
  return resolver.resolveByType(objectType, category);
}
