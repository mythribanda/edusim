import React, { memo, useState, useEffect, useRef } from 'react';
import type { AssetDefinition } from '../../config/assetsRegistry';

interface AssetCardProps {
  asset: AssetDefinition;
  onDragStart: (e: React.DragEvent, asset: AssetDefinition) => void;
  /** When true, card glows with a purple ring and shows an AI Pick badge */
  isSuggested?: boolean;
}

// Inject keyframe once into the document head
let _pulseCSSInjected = false;
function ensurePulseCSS() {
  if (_pulseCSSInjected || typeof document === 'undefined') return;
  _pulseCSSInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes edusim-asset-pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(139,92,246,0.7), 0 0 18px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3); }
      50%       { box-shadow: 0 0 0 2px rgba(167,139,250,1.0), 0 0 28px rgba(139,92,246,0.75), 0 4px 16px rgba(0,0,0,0.4); }
    }
  `;
  document.head.appendChild(style);
}

export const AssetCard = memo(function AssetCard({
  asset,
  onDragStart,
  isSuggested = false,
}: AssetCardProps) {
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Inject CSS once on mount
  useEffect(() => { ensurePulseCSS(); }, []);

  // When this card becomes suggested, briefly scroll it into view
  useEffect(() => {
    if (isSuggested && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [isSuggested]);

  const suggestedStyle: React.CSSProperties = isSuggested ? {
    background: 'rgba(139,92,246,0.14)',
    border: '1.5px solid rgba(139,92,246,0.75)',
    animation: 'edusim-asset-pulse 2s ease-in-out infinite',
  } : {};

  return (
    <div
      ref={cardRef}
      draggable
      data-asset-id={asset.id}
      onDragStart={(e) => onDragStart(e, asset)}
      title={`${asset.name} — drag to canvas`}
      style={{
        width: 76,
        height: 76,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: 'grab',
        userSelect: 'none',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...suggestedStyle,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = isSuggested
          ? 'rgba(139,92,246,0.25)'
          : 'rgba(120,140,255,0.12)';
        el.style.border = isSuggested
          ? '1.5px solid rgba(167,139,250,1)'
          : '1px solid rgba(120,140,255,0.35)';
        el.style.transform = 'translateY(-2px) scale(1.06)';
        el.style.animation = 'none';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = isSuggested
          ? 'rgba(139,92,246,0.14)'
          : 'rgba(255,255,255,0.04)';
        el.style.border = isSuggested
          ? '1.5px solid rgba(139,92,246,0.75)'
          : '1px solid rgba(255,255,255,0.07)';
        el.style.transform = 'translateY(0) scale(1)';
        el.style.animation = isSuggested
          ? 'edusim-asset-pulse 2s ease-in-out infinite'
          : 'none';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.cursor = 'grabbing';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      {/* ✨ AI Pick badge */}
      {isSuggested && (
        <div style={{
          position: 'absolute',
          top: 3,
          left: 3,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          borderRadius: 5,
          padding: '1px 4px',
          fontSize: 7,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '0.04em',
          lineHeight: 1.4,
          zIndex: 2,
          boxShadow: '0 1px 4px rgba(139,92,246,0.5)',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
        }}>
          ✨ AI
        </div>
      )}

      {/* Icon - SVG or Emoji Fallback */}
      {asset.texture && !imgError ? (
        <img
          src={asset.texture}
          alt={asset.name}
          onError={() => setImgError(true)}
          style={{
            width: 32,
            height: 32,
            objectFit: 'contain',
            filter: isSuggested
              ? 'drop-shadow(0 2px 6px rgba(139,92,246,0.6))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <span style={{
          fontSize: 26,
          lineHeight: 1,
          filter: isSuggested
            ? 'drop-shadow(0 2px 6px rgba(139,92,246,0.6))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}>
          {asset.emoji}
        </span>
      )}

      {/* Name */}
      <span style={{
        fontSize: 9.5,
        fontWeight: 600,
        color: isSuggested ? '#c4b5fd' : '#94a3b8',
        textAlign: 'center',
        letterSpacing: '0.03em',
        lineHeight: 1.2,
        maxWidth: 68,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: "'Inter', sans-serif",
      }}>
        {asset.name}
      </span>

      {/* Static badge */}
      {asset.spawnConfig.isStatic && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#f59e0b',
          boxShadow: '0 0 4px #f59e0b',
        }} title="Static body" />
      )}
    </div>
  );
});

