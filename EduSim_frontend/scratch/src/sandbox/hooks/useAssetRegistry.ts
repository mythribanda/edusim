// ─── useAssetRegistry ─────────────────────────────────────────────────────────
// Hook that exposes the asset registry with optional search/filter helpers.

import { useMemo } from 'react';
import { assetsRegistry, type AssetDefinition } from '../../config/assetsRegistry';

interface UseAssetRegistryReturn {
  registry: Record<string, AssetDefinition[]>;
  totalCount: number;
  search: (query: string) => Record<string, AssetDefinition[]>;
  getByCategory: (category: string) => AssetDefinition[];
  getById: (id: string) => AssetDefinition | undefined;
}

export function useAssetRegistry(): UseAssetRegistryReturn {
  const totalCount = useMemo(
    () => Object.values(assetsRegistry).reduce((sum, arr) => sum + arr.length, 0),
    [],
  );

  const search = (query: string): Record<string, AssetDefinition[]> => {
    if (!query.trim()) return assetsRegistry;
    const q = query.toLowerCase();
    const result: Record<string, AssetDefinition[]> = {};
    for (const [cat, assets] of Object.entries(assetsRegistry)) {
      const filtered = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)),
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  };

  const getByCategory = (category: string): AssetDefinition[] =>
    assetsRegistry[category] ?? [];

  const getById = (id: string): AssetDefinition | undefined => {
    for (const assets of Object.values(assetsRegistry)) {
      const found = assets.find((a) => a.id === id);
      if (found) return found;
    }
    return undefined;
  };

  return {
    registry: assetsRegistry,
    totalCount,
    search,
    getByCategory,
    getById,
  };
}
