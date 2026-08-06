import React, { useEffect, useState, useRef } from 'react';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { OrbitalObservables } from '../../observables/orbital/orbitalObservables';
import { KeplerObservable } from '../../observables/orbital/keplerObservable';
import { KeplerThirdLawObservable } from '../../observables/orbital/keplerThirdLawObservable';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface OrbitalInspectorProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
}

export const OrbitalInspector: React.FC<OrbitalInspectorProps> = ({
  selectedObject,
  propertyController,
}) => {
  const [, setTick] = useState(0);
  const keplerInstancesRef = useRef<Map<string, KeplerObservable>>(new Map());
  const keplerThirdLawInstancesRef = useRef<Map<string, KeplerThirdLawObservable>>(new Map());

  // High-frequency telemetry updates
  useEffect(() => {
    let frameId: number;
    const update = () => {
      setTick((t) => t + 1);
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const { body } = selectedObject;

  // Retrieve radial gravity and identify dominant central source
  const radialGravity = (propertyController as any).runtime?.gravitySystem?.getRadialGravity();
  const sources = radialGravity?.getSources() ?? [];
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

  if (!centralSource) {
    return (
      <div style={S.emptyContainer}>
        <span style={S.emptyIcon}>⚪</span>
        <div style={S.emptyTitle}>No Central Gravity Source</div>
        <p style={S.emptySubtitle}>
          This object is currently floating in deep space. Enable "Gravitational Puller" on a massive central star or sun to analyze orbits.
        </p>
      </div>
    );
  }

  const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
  const gravityStrength = centralSource.metadata?.gravityStrength ?? 1.0;
  const M = centralSource.mass * gravityStrength;
  const m = body.mass;

  // 1. Generate live telemetry snapshot using our centralized Observables calculations
  const snap = OrbitalObservables.generateOrbitalSnapshot(centralSource, body, G);

  // 2. Resolve or construct our state-preserving Kepler analytics instance
  let keplerObs = keplerInstancesRef.current.get(selectedObject.id);
  if (!keplerObs || (keplerObs as any).centerBody.id !== centralSource.id) {
    keplerObs = new KeplerObservable(centralSource, body, G);
    keplerInstancesRef.current.set(selectedObject.id, keplerObs);
  }

  let keplerThirdLawObs = keplerThirdLawInstancesRef.current.get(selectedObject.id);
  if (!keplerThirdLawObs || (keplerThirdLawObs as any).centerBody.id !== centralSource.id) {
    keplerThirdLawObs = new KeplerThirdLawObservable(centralSource, body, G);
    keplerThirdLawInstancesRef.current.set(selectedObject.id, keplerThirdLawObs);
  }

  // 3. Compute continuous Keplerian metrics and educational insights
  const keplerMetrics = keplerObs.updateKeplerMetrics(16.67);
  const thirdLawMetrics = keplerThirdLawObs.updateOrbitalPeriodMetrics(16.67);

  // 4. Fetch forward projected orbit path to get periapsis/apoapsis prediction bounds
  const predictedPoints = radialGravity?.getPredictedOrbit(
    { id: selectedObject.id, body, mass: m, affectedByGravity: true },
    220
  ) ?? [];

  let periapsis = snap.radius.value as number;
  let apoapsis = snap.radius.value as number;

  if (predictedPoints.length > 1) {
    const distances = predictedPoints.map((p: any) =>
      OrbitUtils.calculateDistance(p, centralSource.position)
    );
    periapsis = Math.min(...distances);
    apoapsis = Math.max(...distances);
  }

  // Stability styles mapping
  let stabilityColor = '#10b981';
  let orbitIcon = '🌍';

  switch (snap.isStable.status) {
    case 'collision':
      stabilityColor = '#ef4444';
      orbitIcon = '💥';
      break;
    case 'decay':
      stabilityColor = '#f87171';
      orbitIcon = '🥀';
      break;
    case 'escape':
      stabilityColor = '#fbbf24';
      orbitIcon = '🚀';
      break;
    case 'elliptical':
      stabilityColor = '#60a5fa';
      orbitIcon = '🪐';
      break;
    case 'stable':
    default:
      stabilityColor = '#10b981';
      orbitIcon = '🌍';
      break;
  }

  // Force pulling F_g using physical radius scale (r = radiusVal / 100)
  const radiusVal = snap.radius.value as number;
  const physicalR = radiusVal / 100;
  const force = (G * M * m) / (physicalR * physicalR + (radialGravity?.config?.softeningFactor ?? 100));

  // Circular speed ratio using physical velocity scales for accurate educational values
  const physicalVCircular = OrbitUtils.calculateCircularOrbitVelocity(G, M, physicalR, radialGravity?.config?.softeningFactor ?? 100) * 16.67;
  const physicalSpeed = (snap.velocity.value as number) / 10;
  const speedRatio = physicalSpeed / (physicalVCircular || 1.0);

  return (
    <div style={S.container}>
      {/* ── Heading ── */}
      <div style={S.orbitHeaderCard}>
        <div style={S.orbitHeaderRow}>
          <span style={S.orbitTitleIcon}>{orbitIcon}</span>
          <div style={S.orbitHeaderMeta}>
            <span style={S.orbitHeaderType}>{snap.isStable.label}</span>
            <span style={{ ...S.orbitHeaderStatus, color: stabilityColor }}>
              ● {snap.isStable.description}
            </span>
          </div>
        </div>
      </div>

      {/* ── Telemetry Rows ── */}
      <div style={S.telemetryGroup}>
        <div style={S.groupLabel}>🛰️ Orbital State Variables</div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Orbital Radius</span>
          <div style={S.teleValueWrapper}>
            <span style={S.teleValue}>{snap.radius.formattedValue}</span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Orbital Velocity</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#38bdf8' }}>{snap.velocity.formattedValue}</span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Angular Velocity</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#a78bfa' }}>{snap.angularVelocity.formattedValue}</span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Orbital Period (T)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#34d399' }}>
              {snap.isStable.status === 'escape' ? '∞' : snap.orbitalPeriod.formattedValue}
            </span>
          </div>
        </div>
      </div>

      {/* ── Kepler Orbital Analytics (Example 7.1) ── */}
      <div style={S.telemetryGroup}>
        <div style={S.groupLabel}>🪐 Kepler Orbital Analytics (Ex. 7.1)</div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Measured Eccentricity (e)</span>
          <div style={S.teleValueWrapper}>
            <span style={{
              ...S.teleValue,
              color: keplerMetrics.orbitType === 'circular' ? '#34d399' : keplerMetrics.orbitType === 'elliptical' ? '#7dd3fc' : '#fbbf24'
            }}>
              {keplerMetrics.eccentricity.toFixed(4)}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: 4,
              textTransform: 'uppercase',
              background: keplerMetrics.orbitType === 'circular' ? 'rgba(16, 185, 129, 0.15)' : keplerMetrics.orbitType === 'elliptical' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(251, 191, 36, 0.15)',
              color: keplerMetrics.orbitType === 'circular' ? '#34d399' : keplerMetrics.orbitType === 'elliptical' ? '#7dd3fc' : '#fcd34d',
            }}>
              {keplerMetrics.orbitType}
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Perihelion Speed (v_P)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#34d399' }}>
              {(keplerMetrics.perihelionVelocity * 10).toFixed(1)} km/s
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Aphelion Speed (v_A)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#fbbf24' }}>
              {snap.isStable.status === 'escape' ? 'N/A' : `${(keplerMetrics.aphelionVelocity * 10).toFixed(1)} km/s`}
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Kepler Velocity Ratio</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#a78bfa' }}>
              {snap.isStable.status === 'escape' ? '∞' : `${keplerMetrics.velocityRatio.toFixed(2)}x`}
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Completed Years (Revs)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#38bdf8' }}>
              {thirdLawMetrics.revolutionCount} revs
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Current Year Progress</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#fb7185' }}>
              {((Math.abs((thirdLawMetrics as any).accumulatedAngle || 0) / (2 * Math.PI)) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Measured Year Length (T)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#34d399' }}>
              {thirdLawMetrics.rollingAveragePeriod > 0 ? `${thirdLawMetrics.rollingAveragePeriod.toFixed(2)} s` : 'Measuring...'}
            </span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Kepler T²/a³ Constant</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#a78bfa', fontSize: 11 }}>
              {thirdLawMetrics.rollingAveragePeriod > 0 ? thirdLawMetrics.keplerConstant.toExponential(4) : 'Measuring...'}
            </span>
          </div>
        </div>

        {/* Live Tutor / Educational Insights Callout Box */}
        <div style={S.insightBox}>
          {[...keplerMetrics.insights, ...thirdLawMetrics.insights].map((insight, idx) => (
            <p key={idx} style={S.insightText}>
              ● {insight}
            </p>
          ))}
        </div>
      </div>

      {/* ── Apoapsis / Periapsis HUD ── */}
      <div style={S.telemetryGroup}>
        <div style={S.groupLabel}>📏 Predicted Extremes</div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Periapsis (Closest)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#10b981' }}>{(periapsis * 100).toFixed(0)} km</span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Apoapsis (Furthest)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#fbbf24' }}>
              {snap.isStable.status === 'escape' ? '∞' : `${(apoapsis * 100).toFixed(0)} km`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Forces HUD ── */}
      <div style={S.telemetryGroup}>
        <div style={S.groupLabel}>📡 Gravitational Fields</div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Gravity Pull (F_g)</span>
          <div style={S.teleValueWrapper}>
            <span style={{ ...S.teleValue, color: '#f472b6' }}>{(force * 100).toFixed(2)} N</span>
          </div>
        </div>

        <div style={S.teleRow}>
          <span style={S.teleLabel}>Circular Speed Ratio</span>
          <div style={S.teleValueWrapper}>
            <span style={S.teleValue}>{speedRatio.toFixed(2)} v_c</span>
          </div>
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
    padding: '4px 0',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 8,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.4,
  },
  orbitHeaderCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
    border: '1px solid rgba(167, 139, 250, 0.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: '12px 14px',
  },
  orbitHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  orbitTitleIcon: {
    fontSize: 22,
  },
  orbitHeaderMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  orbitHeaderType: {
    fontSize: 13,
    fontWeight: 800,
    color: '#e2e8f0',
    letterSpacing: '0.02em',
  },
  orbitHeaderStatus: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 2,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  telemetryGroup: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
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
  teleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teleLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 500,
  },
  teleValueWrapper: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  teleValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#f8fafc',
    fontFamily: 'monospace',
  },
  insightBox: {
    marginTop: 6,
    padding: '8px 10px',
    background: 'rgba(167, 139, 250, 0.06)',
    borderLeft: '3px solid #a78bfa',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  insightText: {
    fontSize: 9.5,
    color: '#cbd5e1',
    lineHeight: 1.4,
    margin: 0,
    textAlign: 'left' as const,
  },
};
