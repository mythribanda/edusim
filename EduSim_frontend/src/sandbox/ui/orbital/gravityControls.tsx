import React, { useState, useEffect } from 'react';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface GravityControlsProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
  onRefresh?: () => void;
}

export const GravityControls: React.FC<GravityControlsProps> = ({
  selectedObject,
  propertyController,
  onRefresh,
}) => {
  const runtime = (propertyController as any).runtime;
  const store = (propertyController as any).store;

  const { body } = selectedObject;

  // Local helper to force refresh
  const triggerRefresh = () => {
    if (onRefresh) onRefresh();
  };

  // ─── Extract dynamic values from engine / metadata ────────────────────────
  const radialGravity = runtime?.gravitySystem?.getRadialGravity();
  const gravitySource = radialGravity?.getSources()?.find((s: any) => s.id === selectedObject.id);
  const isSource = !!gravitySource;

  const customData = (selectedObject.metadata?.customData || {}) as any;
  const radius = selectedObject.metadata?.shapeInfo?.radius ?? (body as any).circleRadius ?? 25;
  const orbitalCategory = customData.orbitalCategory ?? (selectedObject.id === 'orbit-star' ? 'star' : 'planet');
  const gravityStrength = customData.gravityStrength ?? (gravitySource ? 1.0 : 0.0);
  const influenceRadius = gravitySource?.influenceRadius ?? 1500;

  // Global gravity system configs
  const G = radialGravity?.config?.gravitationalConstant ?? 0.001;
  const softening = radialGravity?.config?.softeningFactor ?? 100;
  const forceClamp = radialGravity?.config?.maxForceClamp ?? 0.05;

  const handleUpdate = (property: string, value: any) => {
    propertyController.updateProperty(selectedObject.id, property, value);
    triggerRefresh();
  };

  const handleGlobalConfigUpdate = (key: string, value: number) => {
    if (radialGravity) {
      radialGravity.setConfig({
        [key]: value
      });
      triggerRefresh();
    }
  };

  return (
    <div style={S.container}>
      {/* ── Section 1: Physical Parameters ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🪐 Physical Profile</div>

        {/* Mass */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Stellar Mass</span>
            <span style={S.sliderVal}>{body.isStatic && customData.mass ? customData.mass : body.mass.toFixed(0)} M_e</span>
          </div>
          <input
            type="range"
            min={1}
            max={selectedObject.id === 'orbit-star' || orbitalCategory === 'star' ? 1000000 : 10000}
            step={selectedObject.id === 'orbit-star' || orbitalCategory === 'star' ? 1000 : 10}
            value={body.isStatic && customData.mass ? customData.mass : body.mass}
            onChange={(e) => handleUpdate('mass', parseFloat(e.target.value))}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Increases gravity field strength and changes the balance of the barycenter.</span>
        </div>

        {/* Radius */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Physical Radius</span>
            <span style={S.sliderVal}>{(radius * 100).toLocaleString()} km</span>
          </div>
          <input
            type="range"
            min={500}
            max={15000}
            step={100}
            value={radius * 100}
            onChange={(e) => handleUpdate('radius', parseFloat(e.target.value) / 100)}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Scales both collision boundaries and the visual celestial sprite (1 px = 100 km).</span>
        </div>

        {/* Density */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Object Density</span>
            <span style={S.sliderVal}>{(body.density * 1000).toFixed(2)} g/cm³</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={10.0}
            step={0.1}
            value={body.density * 1000}
            onChange={(e) => handleUpdate('density', parseFloat(e.target.value) / 1000)}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Changes physical mass per unit volume. Higher density increases gravitational mass without scaling spatial size.</span>
        </div>
      </div>

      {/* ── Section 2: Gravity Source Parameters ── */}
      {isSource && (
        <div style={S.controlGroup}>
          <div style={S.groupLabel}>🌌 Local Gravity Field</div>

          {/* Gravity Strength */}
          <div style={S.sliderRow}>
            <div style={S.sliderMeta}>
              <span style={S.sliderLabel}>Gravity Strength</span>
              <span style={S.sliderVal}>{gravityStrength.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={0.5}
              value={gravityStrength}
              onChange={(e) => handleUpdate('gravityStrength', parseFloat(e.target.value))}
              style={S.sliderInput}
            />
            <span style={S.sliderTooltip}>Custom multiplier scaling this object's specific gravity pull.</span>
          </div>

          {/* Influence Radius */}
          <div style={S.sliderRow}>
            <div style={S.sliderMeta}>
              <span style={S.sliderLabel}>Influence Field Range</span>
              <span style={S.sliderVal}>{(influenceRadius * 100).toLocaleString()} km</span>
            </div>
            <input
              type="range"
              min={5000}
              max={300000}
              step={5000}
              value={influenceRadius * 100}
              onChange={(e) => handleUpdate('influenceRadius', parseFloat(e.target.value) / 100)}
              style={S.sliderInput}
            />
            <span style={S.sliderTooltip}>Outer boundary limit (1 px = 100 km). Particles outside this sphere ignore this body's gravity field.</span>
          </div>
        </div>
      )}

      {/* ── Section 3: Global Gravity Mechanics ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🌌 System-Wide Physics constants</div>

        {/* G Constant */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Gravitational Constant (G)</span>
            <span style={S.sliderVal}>{G.toFixed(5)}</span>
          </div>
          <input
            type="range"
            min={0.0001}
            max={0.01}
            step={0.0001}
            value={G}
            onChange={(e) => handleGlobalConfigUpdate('gravitationalConstant', parseFloat(e.target.value))}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Universal strength of gravity. Raising G makes all orbits faster but more volatile.</span>
        </div>

        {/* Softening Factor */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Plummer Softening</span>
            <span style={S.sliderVal}>{(softening * 10000).toLocaleString()} km²</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000000}
            step={250000}
            value={softening * 10000}
            onChange={(e) => handleGlobalConfigUpdate('softeningFactor', parseFloat(e.target.value) / 10000)}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Minimizes gravity singularity forces at extremely close ranges, preventing numerical explosions (1 px² = 10,000 km²).</span>
        </div>

        {/* Force Clamp */}
        <div style={S.sliderRow}>
          <div style={S.sliderMeta}>
            <span style={S.sliderLabel}>Max Force Clamp</span>
            <span style={S.sliderVal}>{(forceClamp * 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} N</span>
          </div>
          <input
            type="range"
            min={50}
            max={10000}
            step={50}
            value={forceClamp * 100}
            onChange={(e) => handleGlobalConfigUpdate('maxForceClamp', parseFloat(e.target.value) / 100)}
            style={S.sliderInput}
          />
          <span style={S.sliderTooltip}>Limits the maximum gravitational force on extreme close contact to guard sandbox structural stability (1 engine unit = 100 N).</span>
        </div>
      </div>
    </div>
  );
};

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  controlGroup: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  groupLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 4,
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    paddingBottom: 2,
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  sliderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: 600,
  },
  sliderVal: {
    fontSize: 10,
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontWeight: 700,
  },
  sliderInput: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    cursor: 'pointer',
  },
  sliderTooltip: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.3,
  },
};
