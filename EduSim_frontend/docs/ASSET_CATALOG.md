# Asset Catalog System

## Overview

The Asset Catalog is an automatically generated, comprehensive registry of all image assets in the EduSim frontend (`public/assets`). It serves as the **single source of truth** for asset resolution, eliminating hardcoded paths throughout the application.

**Generated File:** `src/data/asset-catalog.json`

## What It Does

- ✅ Recursively scans all subdirectories in `public/assets`
- ✅ Catalogs all image files (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`)
- ✅ Generates structured JSON with asset metadata
- ✅ Provides query/search utilities for runtime asset resolution
- ✅ Automatically handles duplicate filenames by appending folder names
- ✅ Sorts assets alphabetically by category and filename

## Generated Catalog Structure

```json
{
  "generatedAt": "2026-05-14T12:22:32.093Z",
  "totalAssets": 2324,
  "assets": [
    {
      "id": "rocket",
      "filename": "rocket.png",
      "path": "/assets/vehicles/rocket.png",
      "category": "vehicles",
      "extension": "png"
    }
  ]
}
```

### Asset Fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier (filename without extension, or with folder suffix for duplicates) | `rocket` or `rocket_vehicles` |
| `filename` | Original filename | `rocket.png` |
| `path` | Asset path relative to app root | `/assets/vehicles/rocket.png` |
| `category` | Top-level folder name | `vehicles`, `physics`, `animals`, etc. |
| `extension` | File extension (without dot) | `png`, `svg`, `webp` |

## Categories

The catalog includes 13+ major categories:

- **animals** (84 assets)
- **buildings** (58 assets)
- **characters** (405 assets)
- **effects** (197 assets)
- **elements** (81 assets)
- **misc** (42 assets)
- **nature** (56 assets)
- **physics** (71 assets)
- **space** (402 assets)
- **terrain** (541 assets)
- **UI** (212 assets)
- **vehicles** (117 assets)
- **weapons** (58 assets)

**Total: 2324 image assets**

## Regenerating the Catalog

Whenever assets are added, moved, or deleted in `public/assets/`, regenerate the catalog:

```bash
npm run generate:assets
```

This command:
1. Scans `public/assets` recursively
2. Detects all image files
3. Generates `src/data/asset-catalog.json`
4. Shows summary of assets found

## Using the Catalog

### Import the Resolver

```javascript
import resolver from '@/utils/assetCatalogResolver';
```

### Find Asset by ID

```javascript
const asset = resolver.findById('rocket');
// Returns: { id: 'rocket', filename: 'rocket.png', path: '/assets/vehicles/rocket.png', ... }
```

### Get Asset Path

```javascript
const path = resolver.getPath('rocket');
// Returns: '/assets/vehicles/rocket.png'
```

### Find by Category

```javascript
const vehicleAssets = resolver.findByCategory('vehicles');
// Returns array of all vehicle assets
```

### Search Assets

```javascript
const results = resolver.search('ball');
// Returns all assets matching 'ball' in ID, filename, or path
```

### Resolve by Object Type

```javascript
const asset = resolver.resolveByType('rocket', 'vehicles');
// Smart matching: tries exact ID, filename, then substring
```

### Get All Categories

```javascript
const categories = resolver.getCategories();
// Returns: ['animals', 'buildings', 'characters', ...]
```

### Get Random Asset from Category

```javascript
const randomVehicle = resolver.getRandomAsset('vehicles');
```

### Get Catalog Metadata

```javascript
const meta = resolver.getMetadata();
// Returns: { generatedAt: '...', totalAssets: 2324, categories: [...] }
```

## Example Usage in Components

### Asset Preloader

```javascript
import { getAssetPath, findAssetsByCategory } from '@/utils/assetCatalogResolver';

// Preload all vehicle sprites
const vehicles = findAssetsByCategory('vehicles');
const paths = vehicles.map(v => getAssetPath(v.id));

await preloadAssets(paths);
```

### Dynamic Asset Resolution

```javascript
import resolver from '@/utils/assetCatalogResolver';

function getObjectSprite(objectType) {
  const asset = resolver.resolveByType(objectType);
  return asset ? asset.path : '/assets/fallback.png';
}
```

### AI Simulation Asset Injection

```javascript
import { resolveAssetByType } from '@/utils/assetCatalogResolver';

// When AI generates a simulation object
const obj = {
  type: 'rocket',
  // ... other properties
};

// Resolve the asset
const asset = resolveAssetByType(obj.type, 'vehicles');
if (asset) {
  obj.sprite = asset.path;
  obj.filePath = asset.path;
}
```

## File Locations

| File | Purpose |
|------|---------|
| `scripts/generate-asset-catalog.js` | Generator script (Node.js) |
| `src/data/asset-catalog.json` | Generated catalog (auto) |
| `src/utils/assetCatalogResolver.js` | Query API and utilities |
| `package.json` | Contains `generate:assets` npm script |

## Implementation Details

### Duplicate Handling

If two assets have the same filename in different folders:
- Original filename: `block.png` (appears in both `physics/blocks/` and `terrain/`)
- Generated IDs: `block_blocks` and `block_terrain`

### Sorting

Assets are sorted by:
1. **Category** (alphabetically)
2. **Filename** (alphabetically)

### Timestamp

Each catalog includes a `generatedAt` timestamp in ISO 8601 format for tracking when the catalog was last updated.

## Best Practices

✅ **DO:**
- Use the catalog resolver for all asset lookups
- Regenerate the catalog after adding/removing assets
- Store asset paths in simulation DSL using catalog data
- Use `getAssetPath()` for sprite/texture URLs

❌ **DON'T:**
- Hardcode asset paths (e.g., `/assets/vehicles/rocket.png`)
- Manually create asset mappings
- Skip regenerating when assets change
- Assume asset paths will remain static

## Troubleshooting

### Catalog is outdated
**Solution:** Run `npm run generate:assets`

### Asset not found in catalog
**Solution:** Verify file exists in `public/assets/` with a supported extension, then regenerate

### Duplicate ID issues
**Solution:** Check `asset-catalog.json` for assets with folder-suffixed IDs (e.g., `block_physics`)

## Future Enhancements

- [ ] Automatic regeneration on file watch
- [ ] Asset tagging system for better organization
- [ ] Image metadata extraction (dimensions, colors)
- [ ] Asset validation (check for missing files)
- [ ] CDN path support for production
- [ ] Asset compression hints
