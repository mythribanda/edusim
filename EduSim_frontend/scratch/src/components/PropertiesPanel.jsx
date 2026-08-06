import React, { useEffect, useState } from 'react';

export default function PropertiesPanel({ selected, apiRef, stats }) {
  const [props, setProps] = useState(null);

  useEffect(() => {
    if (!selected) { setProps(null); return; }
    const p = {
      id: selected.id,
      label: selected.plugin && selected.plugin.asset ? selected.plugin.asset.name : 'unknown',
      category: selected.plugin && selected.plugin.asset ? selected.plugin.asset.category : null,
      position: { x: Math.round(selected.position.x), y: Math.round(selected.position.y) },
      velocity: { x: Number(selected.velocity.x.toFixed(2)), y: Number(selected.velocity.y.toFixed(2)) },
      mass: selected.mass || selected.density
    };
    setProps(p);
  }, [selected]);

  if (!selected) {
    return (
      <div>
        <h3 style={{ marginTop: 0 }}>Properties</h3>
        <div style={{ marginTop: 8 }}>No object selected.</div>
        <div style={{ marginTop: 16 }}>
          <strong>Simulation</strong>
          <div>Bodies: {stats?.bodies ?? '—'}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Properties</h3>
      <div style={{ marginTop: 8 }}><strong>{props?.label}</strong></div>
      <div style={{ marginTop: 8 }}><small>Category: {props?.category}</small></div>
      <div style={{ marginTop: 8 }}>Position: {props?.position.x}, {props?.position.y}</div>
      <div style={{ marginTop: 8 }}>Velocity: {props?.velocity.x}, {props?.velocity.y}</div>
      <div style={{ marginTop: 8 }}>Mass: <input type="number" value={props?.mass || 1} onChange={(e) => {
        const val = Number(e.target.value) || 1;
        setProps((s) => ({ ...s, mass: val }));
        if (selected && apiRef && apiRef.current) {
          apiRef.current.setBodyMass(selected, val);
        }
      }} style={{ width: 100 }} /></div>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => { if (apiRef && apiRef.current && selected) apiRef.current.selectBody(selected); }} style={{ padding: '8px 12px', borderRadius: 8 }}>Highlight</button>
      </div>
    </div>
  );
}
