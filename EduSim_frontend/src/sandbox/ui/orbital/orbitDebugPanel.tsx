import React, { useState, useEffect } from 'react';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { OrbitalObservables } from '../../observables/orbital/orbitalObservables';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface OrbitDebugPanelProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
  vectorConfig: {
    showOrbitPath: boolean;
    showGravityVectors: boolean;
    showInfluenceRadius: boolean;
    showVelocityVectors: boolean;
    showForceVectors: boolean;
    showOrbitalTrail: boolean;
  };
  setVectorConfig: React.Dispatch<
    React.SetStateAction<{
      showOrbitPath: boolean;
      showGravityVectors: boolean;
      showInfluenceRadius: boolean;
      showVelocityVectors: boolean;
      showForceVectors: boolean;
      showOrbitalTrail: boolean;
    }>
  >;
}

export const OrbitDebugPanel: React.FC<OrbitDebugPanelProps> = ({
  selectedObject,
  propertyController,
  vectorConfig,
  setVectorConfig,
}) => {
  const [tick, setTick] = useState(0);
  const [fps, setFps] = useState(60);

  // Live FPS and stats timer
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const update = () => {
      frames++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      setTick((t) => t + 1);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const runtime = (propertyController as any).runtime;
  const { body } = selectedObject;

  // Retrieve gravity components
  const radialGravity = runtime?.gravitySystem?.getRadialGravity();
  const sources = radialGravity?.getSources() ?? [];
  const bodies = radialGravity?.getBodies() ?? [];
  const bodyPos = body.position;

  let centralSource: any = null;
  let minDistance = Infinity;

  for (const source of sources) {
    if (source.id === selectedObject.id || !source.enabled) continue;
    const dist = OrbitUtils.calculateDistance(source.position, bodyPos);
    if (dist < minDistance) {
      minDistance = dist;
      centralSource = source;
    }
  }

  // Setup options sync with radialGravity config
  useEffect(() => {
    if (radialGravity) {
      radialGravity.setConfig({
        debug: vectorConfig.showOrbitPath || vectorConfig.showInfluenceRadius || vectorConfig.showGravityVectors,
      });
    }
  }, [vectorConfig, radialGravity]);

  if (!centralSource) {
    return null;
  }

  const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;

  // Generate live observables snapshot
  const snap = OrbitalObservables.generateOrbitalSnapshot(centralSource, body, G);

  // Angular Momentum: L = m * (r x v) = m * (rx * vy - ry * vx)
  const rx = body.position.x - centralSource.position.x;
  const ry = body.position.y - centralSource.position.y;
  const vx = body.velocity.x;
  const vy = body.velocity.y;
  const L = body.mass * (rx * (vy / 0.01667) - ry * (vx / 0.01667));

  // Forces count
  const activePairsCount = sources.length * bodies.length;

  return (
    <div style={S.container}>
      {/* ── Section 1: Visual Overlay Toggles ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🖥️ Vector & Overlay Diagnostics</div>
        <div style={S.checkboxGrid}>
          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={vectorConfig.showOrbitPath}
              onChange={(e) =>
                setVectorConfig((prev) => ({ ...prev, showOrbitPath: e.target.checked }))
              }
              style={S.checkbox}
            />
            🎯 Orbit Prediction Path
          </label>

          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={vectorConfig.showVelocityVectors}
              onChange={(e) =>
                setVectorConfig((prev) => ({ ...prev, showVelocityVectors: e.target.checked }))
              }
              style={S.checkbox}
            />
            🔵 Velocity Vector (v)
          </label>

          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={vectorConfig.showForceVectors}
              onChange={(e) =>
                setVectorConfig((prev) => ({ ...prev, showForceVectors: e.target.checked }))
              }
              style={S.checkbox}
            />
            🔴 Force Vector (F_g)
          </label>

          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={vectorConfig.showInfluenceRadius}
              onChange={(e) =>
                setVectorConfig((prev) => ({ ...prev, showInfluenceRadius: e.target.checked }))
              }
              style={S.checkbox}
            />
            🌌 Influence Boundary
          </label>

          <label style={S.checkboxLabel}>
            <input
              type="checkbox"
              checked={vectorConfig.showOrbitalTrail}
              onChange={(e) =>
                setVectorConfig((prev) => ({ ...prev, showOrbitalTrail: e.target.checked }))
              }
              style={S.checkbox}
            />
            ☄️ Persistent Trail
          </label>
        </div>
      </div>

      {/* ── Section 2: Advanced Mechanical Energies ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>📐 High-Fidelity Physics Diagnostics</div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Kinetic Energy (KE)</span>
          <span style={{ ...S.statVal, color: '#38bdf8' }}>{snap.kineticEnergy.formattedValue}</span>
        </div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Potential Energy (PE)</span>
          <span style={{ ...S.statVal, color: '#f87171' }}>{snap.potentialEnergy.formattedValue}</span>
        </div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Total Mech Energy (E)</span>
          <span style={{ ...S.statVal, color: (snap.totalEnergy.value as number) < 0 ? '#34d399' : '#fbbf24' }}>
            {snap.totalEnergy.formattedValue} ({(snap.totalEnergy.value as number) < 0 ? 'Bound' : 'Unbound'})
          </span>
        </div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Angular Momentum (L)</span>
          <span style={{ ...S.statVal, color: '#c084fc' }}>{L.toFixed(1)} N·m·s</span>
        </div>
      </div>

      {/* ── Section 3: Engine Diagnostics ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>💻 Real-Time Engine Diagnostics</div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Physics Refresh Rate</span>
          <span style={S.statVal}>{fps} Hz / {(1000 / (fps || 60)).toFixed(1)} ms</span>
        </div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Calculated Gravity Pairs</span>
          <span style={S.statVal}>
            {sources.length} sources × {bodies.length} bodies ({activePairsCount})
          </span>
        </div>

        <div style={S.statRow}>
          <span style={S.statLabel}>Stability Diagnostics</span>
          <span style={{ ...S.statVal, color: '#a78bfa' }}>{snap.isStable.label}</span>
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
    gap: 8,
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
  checkboxGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    color: '#cbd5e1',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  checkbox: {
    cursor: 'pointer',
    width: 14,
    height: 14,
    borderRadius: 3,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(0, 0, 0, 0.2)',
    outline: 'none',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 500,
  },
  statVal: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#f8fafc',
  },
};
