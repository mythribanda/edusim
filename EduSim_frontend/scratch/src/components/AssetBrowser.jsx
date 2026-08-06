import React from 'react';
import categories from '../data/categories.json';
import * as objectDataModule from '../data/objectData';

const objectData = objectDataModule.default ?? objectDataModule;

export default function AssetBrowser({ onSelect }) {
  return (
    <div style={{ padding: 8 }}>
      {Object.keys(categories).map((cat) => {
        const group = categories[cat];
        const list = Array.isArray(group) ? group : Object.values(group).flat();
        return (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>{cat}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {list.slice(0, 100).map((name) => {
                const asset = objectData[name];
                if (!asset) return null;
                const img = (asset.image || '').replace(/^\/public/, '');
                return (
                  <img
                    key={name}
                    src={img}
                    alt={name}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/asset', name)}
                    onClick={() => onSelect && onSelect(name)}
                    style={{ width: 48, height: 48, objectFit: 'contain', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.06)' }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
