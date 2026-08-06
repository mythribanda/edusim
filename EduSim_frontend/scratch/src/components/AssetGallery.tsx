/**
 * Asset Gallery Component for EduSim
 * Browse and display organized assets by category
 */

import React, { useState } from 'react';
import { useCategory, useCategoryInfo, useAssetDimensions } from '../hooks/useAssets';
import './AssetGallery.css';

interface AssetCardProps {
  asset: {
    image: string;
    category: string;
    name?: string;
    mass: number;
    bounce: number;
  };
  onSelect?: (asset: any) => void;
}

/**
 * Individual asset card component
 */
function AssetCard({ asset, onSelect }: AssetCardProps) {
  const name = asset.name || Object.keys(asset).find(k => (asset as any)[k] === asset.image)?.split('/').pop()?.replace(/\.[^/.]+$/, '');
  const dims = useAssetDimensions(name || '');

  return (
    <div className="asset-card" onClick={() => onSelect?.(asset)}>
      <div className="card-image">
        <img
          src={asset.image}
          alt={name || 'asset'}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="placeholder">{name?.toUpperCase() || 'ASSET'}</div>
      </div>
      <div className="card-info">
        <h3>{name || 'Unknown'}</h3>
        <p className="category">{asset.category}</p>
        {dims && (
          <p className="dimensions">
            {dims.width}×{dims.height}px
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Main Asset Gallery Component
 */
interface AssetGalleryProps {
  onSelectAsset?: (asset: any) => void;
}

export function AssetGallery({ onSelectAsset }: AssetGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('vehicles');
  const categoryInfo = useCategoryInfo();
  const categoryAssets = useCategory(selectedCategory);

  return (
    <div className="asset-gallery">
      <header className="gallery-header">
        <h2>🎨 Asset Gallery</h2>
        <p>Browse organized assets by category</p>
      </header>

      {/* Category Tabs */}
      <div className="category-tabs">
        {Object.entries(categoryInfo).map(([name, info]) => (
          <button
            key={name}
            onClick={() => setSelectedCategory(name)}
            className={`tab ${selectedCategory === name ? 'active' : ''}`}
            title={`${info.count} assets`}
          >
            <span className="tab-name">{name}</span>
            <span className="count">{info.count}</span>
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="asset-grid">
        {categoryAssets.length > 0 ? (
          categoryAssets.map((asset, idx) => (
            <AssetCard
              key={idx}
              asset={asset as any}
              onSelect={onSelectAsset}
            />
          ))
        ) : (
          <div className="empty-message">
            <p>No assets in {selectedCategory} category.</p>
            <small>Add images to public/assets/ and run: npm run organize-assets</small>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssetGallery;
