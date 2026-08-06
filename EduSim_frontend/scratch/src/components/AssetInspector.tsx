/**
 * Asset Inspector Component for EduSim
 * Displays detailed information about a selected asset
 */

import React from 'react';
import { useAsset, usePhysics, useAssetDimensions } from '../hooks/useAssets';

interface AssetInspectorProps {
  assetName?: string;
  onClose?: () => void;
}

export function AssetInspector({ assetName, onClose }: AssetInspectorProps) {
  const asset = useAsset(assetName || '');
  const physics = usePhysics(assetName || '');
  const dims = useAssetDimensions(assetName || '');

  if (!asset || !physics || !dims) {
    return (
      <div className="asset-inspector">
        <h2>Asset Inspector</h2>
        <div className="empty-message">
          Select an asset to view detailed information
        </div>
      </div>
    );
  }

  return (
    <div className="asset-inspector">
      <div className="inspector-header">
        <h2>🔍 Asset Inspector: {assetName}</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      <div className="inspector-layout">
        {/* Asset Image */}
        <div className="inspector-image">
          <img src={asset.image} alt={assetName} />
        </div>

        {/* Properties */}
        <div className="inspector-properties">
          {/* Basic Info */}
          <section className="prop-section">
            <h3>Basic Information</h3>
            <PropertyRow label="Name" value={assetName || ""} />
            <PropertyRow label="Category" value={asset.category} />
            <PropertyRow label="Image Path" value={asset.image} code />
          </section>

          {/* Dimensions */}
          <section className="prop-section">
            <h3>Dimensions</h3>
            <PropertyRow label="Width" value={`${dims.width}px`} />
            <PropertyRow label="Height" value={`${dims.height}px`} />
            <PropertyRow label="Aspect Ratio" value={dims.ratio.toFixed(2)} />
          </section>

          {/* Physics Properties */}
          <section className="prop-section">
            <h3>Physics Properties</h3>
            <PropertyRow label="Mass" value={`${physics.mass} kg`} />
            <PropertyRow label="Friction" value={physics.friction} />
            <PropertyRow label="Bounce (Restitution)" value={physics.restitution} />
            <PropertyRow label="Air Friction" value={physics.frictionAir} />
            <PropertyRow label="Density" value={`${physics.density?.toFixed(2)} kg/m³`} />
          </section>

          {/* Usage Example */}
          <section className="prop-section">
            <h3>Usage Example</h3>
            <pre className="code-block">
{`const asset = useAsset('${assetName}');
const physics = usePhysics('${assetName}');
const dims = useAssetDimensions('${assetName}');`}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Property Row Component
 */
interface PropertyRowProps {
  label: string;
  value: string | number | null;
  code?: boolean;
}

function PropertyRow({ label, value, code }: PropertyRowProps) {
  return (
    <div className="prop-row">
      <span className="prop-label">{label}:</span>
      {code ? (
        <code className="prop-value">{value}</code>
      ) : (
        <strong className="prop-value">{value}</strong>
      )}
    </div>
  );
}

export default AssetInspector;
