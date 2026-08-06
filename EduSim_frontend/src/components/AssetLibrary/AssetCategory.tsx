import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AssetDefinition } from '../../config/assetsRegistry';
import { AssetCard } from './AssetCard';

interface AssetCategoryProps {
  name: string;
  assets: AssetDefinition[];
  onDragStart: (e: React.DragEvent, asset: AssetDefinition) => void;
  /** Set of asset IDs that the AI suggested for the current query */
  suggestedIds?: Set<string>;
}

export const AssetCategory = memo(function AssetCategory({
  name,
  assets,
  onDragStart,
  suggestedIds,
}: AssetCategoryProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Count how many suggested assets are in this category
  const suggestedCount = suggestedIds
    ? assets.filter((a) => suggestedIds.has(a.id)).length
    : 0;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Category Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 2px',
          color: '#94a3b8',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#7c8fa8',
        }}>
          {name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* AI suggested count badge for this category */}
          {suggestedCount > 0 && (
            <span style={{
              fontSize: 9,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(168,85,247,0.35))',
              color: '#c4b5fd',
              borderRadius: 4,
              padding: '1px 5px',
              fontWeight: 700,
              border: '1px solid rgba(139,92,246,0.4)',
            }}>
              ✨ {suggestedCount}
            </span>
          )}
          <span style={{
            fontSize: 9,
            background: 'rgba(120,140,255,0.2)',
            color: '#a5b4fc',
            borderRadius: 4,
            padding: '1px 5px',
            fontWeight: 600,
          }}>
            {assets.length}
          </span>
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: 10, color: '#64748b', display: 'inline-block' }}
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* Category Items */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 8,
              paddingTop: 4,
              scrollbarWidth: 'none',
            }}>
              {assets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDragStart={onDragStart}
                  isSuggested={suggestedIds ? suggestedIds.has(asset.id) : false}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Separator */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginTop: 2 }} />
    </div>
  );
});
