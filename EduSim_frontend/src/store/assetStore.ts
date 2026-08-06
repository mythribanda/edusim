import { create } from 'zustand';

export type CompiledAsset = {
  id: string;
  name: string;
  category?: string;
};

interface AssetStore {
  assets: CompiledAsset[];
  setAssets: (a: CompiledAsset[]) => void;
  addAsset: (a: CompiledAsset) => void;

  /** IDs of assets recommended by the AI scene parser for the current query */
  suggestedAssets: string[];
  /** Human-readable topic extracted from the LLM response */
  suggestedTopic: string;
  setSuggestedAssets: (ids: string[], topic?: string) => void;
  clearSuggestedAssets: () => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
  assets: [],
  setAssets: (a) => set({ assets: a }),
  addAsset: (a) => set((s) => ({ assets: [...s.assets, a] })),

  suggestedAssets: [],
  suggestedTopic: '',
  setSuggestedAssets: (ids, topic = '') =>
    set({ suggestedAssets: ids, suggestedTopic: topic }),
  clearSuggestedAssets: () =>
    set({ suggestedAssets: [], suggestedTopic: '' }),
}));

