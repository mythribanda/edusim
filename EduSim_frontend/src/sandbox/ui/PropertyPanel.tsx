import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as Matter from 'matter-js';
import type { RuntimeStore } from '../state/runtimeStore';
import type { PropertyController } from '../properties/propertyController';
import type { ObservableEngine } from '../observables/observableEngine';
import type { RuntimeObject } from '../types/RuntimeObject';
import type { RuntimeConstraint } from '../constraints/constraintFactory';
import { useInspectorStore } from '../../store/inspectorStore';

import { OrbitalInspector } from './orbital/orbitalInspector';
import { OrbitControls } from './orbital/orbitControls';
import { GravityControls } from './orbital/gravityControls';
import { OrbitDebugPanel } from './orbital/orbitDebugPanel';
import { OrbitVectorsOverlay } from './orbital/OrbitVectorsOverlay';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface PropertyPanelProps {
  store: RuntimeStore;
  propertyController: PropertyController;
  observableEngine?: ObservableEngine | null;
}

// ─── Reusable Custom Inputs ──────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  precision?: number;
  tooltip?: string;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit = '',
  precision = 2,
  tooltip,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toFixed(precision));
  }, [value, precision]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) {
      setInputValue(value.toFixed(precision));
      return;
    }
    // Clamp to valid range
    val = Math.max(min, Math.min(max, val));
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div style={S.controlRow} title={tooltip}>
      <div style={S.controlHeader}>
        <span style={S.controlLabel}>{label}</span>
        <div style={S.controlValWrapper}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            style={S.numericInput}
          />
          {unit && <span style={S.unitSpan}>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        style={S.slider}
      />
    </div>
  );
};

// ─── PropertyPanel Component ─────────────────────────────────────────────────

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  store,
  propertyController,
  observableEngine,
}) => {
  const [selected, setSelected] = useState<RuntimeObject | null>(null);
  const [propertyVersion, setPropertyVersion] = useState(0);
  const [activeConstraints, setActiveConstraints] = useState<RuntimeConstraint[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'orbital'>('general');
  const compiledControllers = useInspectorStore((state) => state.controllers);
  const [vectorConfig, setVectorConfig] = useState({
    showOrbitPath: true,
    showGravityVectors: true,
    showInfluenceRadius: true,
    showVelocityVectors: true,
    showForceVectors: true,
    showOrbitalTrail: true,
  });

  // Collapsible sections state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    newton: false, // Default expanded for STEM lab focus!
    celestial: false, // Celestial & Gravity controls!
    physics: true,
    motion: true,
    visuals: true,
    constraints: true,
    observables: false,
    aiCompiled: false,
  });

  // Observable ref nodes for raw DOM injection (high-performance 60 FPS telemetry update)
  const velRef = useRef<HTMLSpanElement>(null);
  const accRef = useRef<HTMLSpanElement>(null);
  const momRef = useRef<HTMLSpanElement>(null);
  const keRef = useRef<HTMLSpanElement>(null);
  const angVelRef = useRef<HTMLSpanElement>(null);

  // Newton refs
  const hudFRef = useRef<HTMLSpanElement>(null);
  const hudMRef = useRef<HTMLSpanElement>(null);
  const hudARef = useRef<HTMLSpanElement>(null);
  const hudEqRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ── 1. Subscribe to RuntimeStore selection changes ────────────────────────
  useEffect(() => {
    const updateSelection = () => {
      const obj = store.getSelectedObject();
      setSelected(obj);
      setActiveTab('general');

      // Re-scan constraints connected to the newly selected object
      if (obj) {
        const bodyId = obj.body.id;
        const all = store.getAllConstraints();
        const connected = all.filter(
          (rc) =>
            rc.constraint.bodyA === obj.body ||
            rc.constraint.bodyB === obj.body ||
            (rc.constraint as any).body === obj.body
        );
        setActiveConstraints(connected);
      } else {
        setActiveConstraints([]);
      }
    };

    updateSelection();

    const unsubSelection = store.subscribe('selectionChanged', updateSelection);
    const unsubConstraintAdd = store.subscribe('constraintAdded', updateSelection);
    const unsubConstraintRem = store.subscribe('constraintRemoved', updateSelection);

    return () => {
      unsubSelection();
      unsubConstraintAdd();
      unsubConstraintRem();
    };
  }, [store]);

  // ── 2. Listen to PropertyController mutation events to force re-render ────
  useEffect(() => {
    const triggerRefresh = () => setPropertyVersion((v) => v + 1);

    const unsubProperty = propertyController.subscribe('propertyChanged', triggerRefresh);
    const unsubConstraint = propertyController.subscribe('constraintUpdated', triggerRefresh);

    return () => {
      unsubProperty();
      unsubConstraint();
    };
  }, [propertyController]);

  // ── 3. Scientific Instrumentation Tick (requestAnimationFrame) ─────────────
  useEffect(() => {
    let frameId: number;

    const updateObservables = () => {
      if (selected && observableEngine) {
        const metrics = observableEngine.getObservables(selected.id);
        if (metrics) {
          if (velRef.current && metrics.velocity) {
            velRef.current.innerText = `${metrics.velocity.magnitude.toFixed(1)}`;
          }
          if (accRef.current && metrics.acceleration) {
            accRef.current.innerText = `${metrics.acceleration.magnitude.toFixed(1)}`;
          }
          if (momRef.current && metrics.momentum) {
            momRef.current.innerText = `${metrics.momentum.magnitude.toFixed(1)}`;
          }
          if (keRef.current && metrics.kineticEnergy) {
            keRef.current.innerText = `${metrics.kineticEnergy.value.toFixed(1)}`;
          }
          if (angVelRef.current && metrics.angularVelocity) {
            angVelRef.current.innerText = `${metrics.angularVelocity.value.toFixed(2)}`;
          }

          // Live F = ma telemetry updates based directly on the applied force to isolate F = ma physics educationally
          const force = propertyController.getActiveForce(selected.id);
          const forceMagScaled = Math.hypot(force.x, force.y) * 100;
          const mass = selected.body.mass;
          const accMagScaled = forceMagScaled / mass;

          if (hudFRef.current) {
            hudFRef.current.innerText = `${forceMagScaled.toFixed(1)}`;
          }
          if (hudMRef.current) {
            hudMRef.current.innerText = `${mass.toFixed(1)}`;
          }
          if (hudARef.current) {
            hudARef.current.innerText = `${accMagScaled.toFixed(2)}`;
          }
          if (hudEqRef.current) {
            hudEqRef.current.innerText = `${forceMagScaled.toFixed(1)} N = ${mass.toFixed(1)} kg × ${accMagScaled.toFixed(2)} m/s²`;
          }
        }
      }
      frameId = requestAnimationFrame(updateObservables);
    };

    frameId = requestAnimationFrame(updateObservables);
    return () => cancelAnimationFrame(frameId);
  }, [selected, observableEngine, propertyVersion, propertyController]);

  // Determine if selected object shape is circle or rectangle
  const isCircle = selected?.metadata?.shapeInfo?.type === 'circle';

  if (!selected) {
    return (
      <div style={S.emptyState}>
        <div style={S.emptyGlow} />
        <span style={S.emptyIcon}>🔬</span>
        <h3 style={S.emptyTitle}>Laboratory Inspector</h3>
        <p style={S.emptySubtitle}>Select any object in the workspace to analyze, inspect, and edit its physical properties in real-time.</p>
      </div>
    );
  }

  const { body, display } = selected;
  const isLocked = store.isObjectLocked(selected.id);

  // Dynamic Gravity/Celestial telemetry and properties
  const radialGravity = (propertyController as any).runtime?.gravitySystem?.getRadialGravity();
  const gravitySource = radialGravity?.getSources()?.find((s: any) => s.id === selected.id);
  const isSource = !!gravitySource;
  const influenceRadius = gravitySource?.influenceRadius ?? 0;

  const gravityBody = radialGravity?.getBodies()?.find((b: any) => b.id === selected.id);
  const isAffected = gravityBody ? gravityBody.affectedByGravity : true;

  const customData = (selected.metadata?.customData || {}) as any;
  const radius = selected.metadata?.shapeInfo?.radius ?? (body as any).circleRadius ?? 25;
  const orbitalCategory = customData.orbitalCategory ?? (selected.id === 'orbit-star' ? 'star' : 'planet');
  const gravityStrength = customData.gravityStrength ?? (gravitySource ? 1.0 : 0.0);

  return (
    <div style={S.panel}>
      {/* ── Header Card ──────────────────────────────────────────────────────── */}
      <div style={S.headerCard}>
        <div style={S.headerLeft}>
          <div style={{ ...S.headerBadge, background: isCircle ? '#059669' : '#4f46e5' }}>
            {isCircle ? 'Circle' : 'Rect'}
          </div>
          <span style={S.objectId} title={selected.id}>{selected.id}</span>
        </div>
        <button
          onClick={() => {
            if (isLocked) {
              store.unlockObject(selected.id);
            } else {
              store.lockObject(selected.id);
            }
            setPropertyVersion((v) => v + 1);
          }}
          style={{
            ...S.lockBtn,
            backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: isLocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
            color: isLocked ? '#f87171' : '#94a3b8',
          }}
          title={isLocked ? 'Object is locked in current educational position' : 'Click to lock object coordinates'}
        >
          {isLocked ? '🔒 Locked' : '🔓 Active'}
        </button>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      {isCircle && (
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '10px',
          padding: '3px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '14px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'general' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
              color: activeTab === 'general' ? '#fff' : '#64748b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'general' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              outline: 'none',
            }}
          >
            🔬 General Lab
          </button>
          <button
            onClick={() => setActiveTab('orbital')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'orbital' ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'transparent',
              color: activeTab === 'orbital' ? '#fff' : '#64748b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'orbital' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              outline: 'none',
            }}
          >
            🪐 Orbital Mechanics
          </button>
        </div>
      )}

      {/* ── Tab Content ────────────────────────────────────────────────────── */}
      {activeTab === 'orbital' && isCircle ? (
        <div style={S.orbitalContent}>
          {/* Background Vector Overlay */}
          <OrbitVectorsOverlay
            selectedObject={selected}
            propertyController={propertyController}
            vectorConfig={vectorConfig}
          />
          <OrbitalInspector
            selectedObject={selected}
            propertyController={propertyController}
          />
          <OrbitControls
            selectedObject={selected}
            propertyController={propertyController}
            onRefresh={() => setPropertyVersion((v) => v + 1)}
          />
          <GravityControls
            selectedObject={selected}
            propertyController={propertyController}
            onRefresh={() => setPropertyVersion((v) => v + 1)}
          />
          <OrbitDebugPanel
            selectedObject={selected}
            propertyController={propertyController}
            vectorConfig={vectorConfig}
            setVectorConfig={setVectorConfig}
          />
        </div>
      ) : (
        <>
          {/* ── SECTION: AI Compiled Controls ───────────────────────────────────── */}
          {compiledControllers.length > 0 && (
            <div style={S.section}>
              <div style={S.sectionHeader} onClick={() => toggleSection('aiCompiled')}>
                <span style={{ ...S.sectionTitle, color: '#818cf8' }}>🤖 AI Compiled Controls</span>
                <span style={S.chevron}>{collapsed.aiCompiled ? '▼' : '▲'}</span>
              </div>

              {!collapsed.aiCompiled && (
                <div style={S.sectionBody}>
                  {compiledControllers.map((ctrl) => {
                    let currentVal = ctrl.default;
                    if (selected) {
                      if (ctrl.property === 'mass') currentVal = selected.body.mass;
                      else if (ctrl.property === 'friction') currentVal = selected.body.friction;
                      else if (ctrl.property === 'restitution') currentVal = selected.body.restitution;
                      else if (ctrl.property === 'velocity') {
                        currentVal = Math.hypot(selected.body.velocity.x, selected.body.velocity.y);
                      }
                    }

                    return (
                      <SliderRow
                        key={ctrl.id}
                        label={ctrl.label}
                        min={ctrl.min}
                        max={ctrl.max}
                        step={(ctrl.max - ctrl.min) / 100}
                        value={currentVal}
                        precision={2}
                        onChange={(v) => {
                          if (selected) {
                            if (ctrl.property === 'velocity') {
                              const body = selected.body;
                              const currentSpeed = Math.hypot(body.velocity.x, body.velocity.y);
                              if (currentSpeed > 0.001) {
                                const scale = v / currentSpeed;
                                propertyController.updateProperty(selected.id, 'vx', body.velocity.x * scale);
                                propertyController.updateProperty(selected.id, 'vy', body.velocity.y * scale);
                              } else {
                                propertyController.updateProperty(selected.id, 'vx', v);
                              }
                            } else {
                              propertyController.updateProperty(selected.id, ctrl.property, v);
                            }
                          }
                        }}
                        tooltip={ctrl.educationalPurpose}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SECTION: Newton's Second Law Lab ─────────────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('newton')}>
              <span style={{ ...S.sectionTitle, color: '#fde047' }}>🔬 F = ma Laboratory</span>
              <span style={S.chevron}>{collapsed.newton ? '▼' : '▲'}</span>
            </div>

            {!collapsed.newton && (
              <div style={S.sectionBody}>
                {/* Elegant HUD Card */}
                <div style={S.eduHudCard}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fde047', letterSpacing: '0.05em' }}>
                    F = m &middot; a
                  </div>
                  <div
                    ref={hudEqRef}
                    style={{
                      fontSize: 10,
                      color: '#94a3b8',
                      marginTop: 6,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                    }}
                  >
                    0.0 N = 10.0 kg &times; 0.00 m/s&sup2;
                  </div>
                </div>

                {/* Live Readouts */}
                <div style={S.telemetryGrid}>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Applied Force</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={hudFRef} style={{ ...S.telemetryValue, color: '#ef4444' }}>0.0</span>
                      <span style={S.telemetryUnit}>N</span>
                    </div>
                  </div>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Mass</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={hudMRef} style={{ ...S.telemetryValue, color: '#c084fc' }}>10.0</span>
                      <span style={S.telemetryUnit}>kg</span>
                    </div>
                  </div>
                  <div style={{ ...S.telemetryCard, gridColumn: 'span 2' }}>
                    <span style={S.telemetryLabel}>Applied Accel. (a = F/m)</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={hudARef} style={{ ...S.telemetryValue, color: '#10b981' }}>0.00</span>
                      <span style={S.telemetryUnit}>m/s&sup2;</span>
                    </div>
                  </div>
                </div>

                {/* Sliders */}
                {(() => {
                  const force = propertyController.getActiveForce(selected.id);
                  const forceMag = Math.hypot(force.x, force.y);

                  return (
                    <>
                      <SliderRow
                        label="Applied Force X"
                        min={-20}
                        max={20}
                        step={0.5}
                        value={force.x * 100}
                        unit="N"
                        precision={1}
                        onChange={(v) => propertyController.applyForceToObject(selected.id, { x: v / 100, y: force.y })}
                        tooltip="Continuous horizontal push. Fx > 0 pushes right, Fx < 0 pushes left."
                      />
                      <SliderRow
                        label="Applied Force Y"
                        min={-20}
                        max={20}
                        step={0.5}
                        value={force.y * 100}
                        unit="N"
                        precision={1}
                        onChange={(v) => propertyController.applyForceToObject(selected.id, { x: force.x, y: v / 100 })}
                        tooltip="Continuous vertical push. Fy > 0 pushes down, Fy < 0 pushes up (against gravity)."
                      />
                      <SliderRow
                        label="Force Magnitude"
                        min={0}
                        max={30}
                        step={0.5}
                        value={forceMag * 100}
                        unit="N"
                        precision={1}
                        onChange={(v) => {
                          const targetForce = v / 100;
                          if (forceMag > 0.0001) {
                            const scale = targetForce / forceMag;
                            propertyController.applyForceToObject(selected.id, { x: force.x * scale, y: force.y * scale });
                          } else {
                            propertyController.applyForceToObject(selected.id, { x: targetForce, y: 0 });
                          }
                        }}
                        tooltip="Total strength of applied force. Retains the current vector angle."
                      />
                    </>
                  );
                })()}

                {/* Action Buttons */}
                <div style={S.actionRow}>
                  <button
                    onClick={() => propertyController.resetVelocity(selected.id)}
                    style={S.actionBtn}
                    title="Reset velocities of this object to zero"
                  >
                    🛑 Reset Velocity
                  </button>
                  <button
                    onClick={() => propertyController.applyForceToObject(selected.id, null)}
                    style={{ ...S.actionBtn, borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444', background: 'rgba(239,68,68,0.04)' }}
                    title="Clear all active forces applied to this object"
                  >
                    🗑️ Clear Forces
                  </button>
                  <button
                    onClick={() => propertyController.restoreInitialState(selected.id)}
                    style={{ ...S.actionBtn, borderColor: 'rgba(59,130,246,0.25)', color: '#3b82f6', background: 'rgba(59,130,246,0.04)' }}
                    title="Restore this object's starting coordinates and physical properties"
                  >
                    🔄 Restore Initial State
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: Celestial & Gravity Properties ────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('celestial')}>
              <span style={{ ...S.sectionTitle, color: '#a78bfa' }}>🪐 Celestial & Gravity</span>
              <span style={S.chevron}>{collapsed.celestial ? '▼' : '▲'}</span>
            </div>

            {!collapsed.celestial && (
              <div style={S.sectionBody}>
                {/* Orbital Category Dropdown */}
                <div style={S.controlRow}>
                  <span style={S.controlLabel}>Classification</span>
                  <select
                    value={orbitalCategory}
                    onChange={(e) => {
                      propertyController.updateProperty(selected.id, 'orbitalCategory', e.target.value);
                      setPropertyVersion(v => v + 1);
                    }}
                    style={S.selectInput}
                  >
                    <option value="star">🌟 Sun/Star</option>
                    <option value="planet">🌍 Terrestrial Planet</option>
                    <option value="gas_giant">🪐 Gas Giant</option>
                    <option value="moon">🌒 Moon/Satellite</option>
                    <option value="dwarf_planet">☄️ Dwarf Planet</option>
                    <option value="black_hole">🕳️ Black Hole</option>
                  </select>
                </div>

                {/* Gravity Source Toggle */}
                <div style={S.toggleRow}>
                  <span style={S.controlLabel}>Gravitational Puller</span>
                  <button
                    onClick={() => {
                      propertyController.updateProperty(selected.id, 'isGravitySource', !isSource);
                      setPropertyVersion(v => v + 1);
                    }}
                    style={{
                      ...S.toggleBtn,
                      backgroundColor: isSource ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: isSource ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: isSource ? '#c084fc' : '#94a3b8',
                    }}
                  >
                    {isSource ? '🌌 Gravity Source (Active)' : '⚪ No Gravity Field'}
                  </button>
                </div>

                {/* Affected By Gravity Toggle */}
                <div style={S.toggleRow}>
                  <span style={S.controlLabel}>Affected by Gravity</span>
                  <button
                    onClick={() => {
                      propertyController.updateProperty(selected.id, 'affectedByGravity', !isAffected);
                      setPropertyVersion(v => v + 1);
                    }}
                    style={{
                      ...S.toggleBtn,
                      backgroundColor: isAffected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      borderColor: isAffected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                      color: isAffected ? '#60a5fa' : '#f87171',
                    }}
                  >
                    {isAffected ? '🌌 Attracted by Stars' : '🚀 Gravity Ignored'}
                  </button>
                </div>

                {/* Radius Slider */}
                {isCircle && (
                  <SliderRow
                    label="Physical Radius"
                    min={500}
                    max={15000}
                    step={100}
                    value={radius * 100}
                    unit="km"
                    precision={0}
                    onChange={(v) => {
                      propertyController.updateProperty(selected.id, 'radius', v / 100);
                      setPropertyVersion(v2 => v2 + 1);
                    }}
                    tooltip="The radius of the celestial body (1 px = 100 km). Modifying this scales both collision bounds and visual rendering."
                  />
                )}

                {/* Celestial Mass Slider */}
                <SliderRow
                  label="Celestial Mass"
                  min={1}
                  max={selected.id === 'orbit-star' || orbitalCategory === 'star' || orbitalCategory === 'black_hole' ? 1000000 : 10000}
                  step={selected.id === 'orbit-star' || orbitalCategory === 'star' || orbitalCategory === 'black_hole' ? 1000 : 10}
                  value={body.isStatic && customData.mass ? customData.mass : body.mass}
                  unit="M_e"
                  precision={0}
                  onChange={(v) => {
                    propertyController.updateProperty(selected.id, 'mass', v);
                    setPropertyVersion(v2 => v2 + 1);
                  }}
                  tooltip="The gravitational mass of the body. Influences gravity pull, orbital velocity, and escape velocity calculations."
                />

                {/* Gravity Strength Modifier */}
                {isSource && (
                  <SliderRow
                    label="Gravity Strength"
                    min={0}
                    max={50}
                    step={0.5}
                    value={gravityStrength}
                    precision={1}
                    onChange={(v) => {
                      propertyController.updateProperty(selected.id, 'gravityStrength', v);
                      setPropertyVersion(v2 => v2 + 1);
                    }}
                    tooltip="Scales the gravitational attraction force multiplier of this celestial body."
                  />
                )}

                {/* Influence Radius Slider */}
                {isSource && (
                  <SliderRow
                    label="Influence Field Range"
                    min={5000}
                    max={300000}
                    step={5000}
                    value={(influenceRadius || 1500) * 100}
                    unit="km"
                    precision={0}
                    onChange={(v) => {
                      propertyController.updateProperty(selected.id, 'influenceRadius', v / 100);
                      setPropertyVersion(v2 => v2 + 1);
                    }}
                    tooltip="The boundary size of this object's gravity field (1 px = 100 km). Objects outside this range will not feel its pull."
                  />
                )}
              </div>
            )}
          </div>

          {/* ── SECTION: Physics Parameters ───────────────────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('physics')}>
              <span style={{ ...S.sectionTitle, color: '#c084fc' }}>⚡ Physics Parameters</span>
              <span style={S.chevron}>{collapsed.physics ? '▼' : '▲'}</span>
            </div>

            {!collapsed.physics && (
              <div style={S.sectionBody}>
                {/* Mass */}
                <SliderRow
                  label="Mass"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={body.mass}
                  unit="kg"
                  precision={1}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'mass', v)}
                  tooltip="The amount of matter in the object. Larger mass scales the object's physical boundaries proportionally (holding density constant)."
                />

                {/* Restitution */}
                <SliderRow
                  label="Restitution (Bounce)"
                  min={0}
                  max={1.1}
                  step={0.01}
                  value={body.restitution}
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'restitution', v)}
                  tooltip="Coefficient of bounciness. 0 = no bounce (perfectly inelastic), 1 = perfect elastic bounce."
                />

                {/* Friction */}
                <SliderRow
                  label="Surface Friction"
                  min={0}
                  max={1}
                  step={0.01}
                  value={body.friction}
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'friction', v)}
                  tooltip="Slide friction resistance against other object surfaces."
                />

                {/* Friction Air */}
                <SliderRow
                  label="Air Resistance"
                  min={0}
                  max={0.1}
                  step={0.001}
                  value={body.frictionAir}
                  precision={3}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'frictionAir', v)}
                  tooltip="Aerodynamic air drag. Slows down moving objects over time."
                />

                {/* Friction Static */}
                <SliderRow
                  label="Static Friction"
                  min={0}
                  max={2}
                  step={0.05}
                  value={body.frictionStatic}
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'frictionStatic', v)}
                  tooltip="Friction force required to start moving an object from a complete standstill."
                />

                {/* Density */}
                <SliderRow
                  label="Density"
                  min={0.1}
                  max={50.0}
                  step={0.1}
                  value={body.density * 1000}
                  unit="g/cm³"
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'density', v / 1000)}
                  tooltip="Mass per unit volume. Water is 1.0 g/cm³, average earth is 5.5 g/cm³, and heavy metals are ~7-10 g/cm³."
                />

                {/* Static / Dynamic Toggle */}
                <div style={S.toggleRow}>
                  <span style={S.controlLabel}>Simulation State</span>
                  <button
                    onClick={() => propertyController.updateProperty(selected.id, 'static', !body.isStatic)}
                    style={{
                      ...S.toggleBtn,
                      backgroundColor: body.isStatic ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: body.isStatic ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: body.isStatic ? '#a5b4fc' : '#94a3b8',
                    }}
                  >
                    {body.isStatic ? '🔒 Static Boundary' : '🔓 Dynamic Physics'}
                  </button>
                </div>

                {/* Lock Rotation Toggle */}
                <div style={S.toggleRow}>
                  <span style={S.controlLabel}>Rotation Lock</span>
                  <button
                    onClick={() => {
                      const isLocked = body.inertia === Infinity;
                      propertyController.updateProperty(selected.id, 'lockRotation', !isLocked);
                      setPropertyVersion((v) => v + 1); // trigger state update to force UI repaint
                    }}
                    style={{
                      ...S.toggleBtn,
                      backgroundColor: body.inertia === Infinity ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: body.inertia === Infinity ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: body.inertia === Infinity ? '#c084fc' : '#94a3b8',
                    }}
                  >
                    {body.inertia === Infinity ? '🔒 Rotation Locked' : '🔓 Free Rotation'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: Motion State ─────────────────────────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('motion')}>
              <span style={{ ...S.sectionTitle, color: '#67e8f9' }}>🌐 Position & Motion</span>
              <span style={S.chevron}>{collapsed.motion ? '▼' : '▲'}</span>
            </div>

            {!collapsed.motion && (
              <div style={S.sectionBody}>
                {/* Position X / Y in double row */}
                <div style={S.multiFieldGrid}>
                  <div style={S.smallField}>
                    <span style={S.controlLabel}>Pos X</span>
                    <input
                      type="number"
                      value={Math.round(body.position.x)}
                      onChange={(e) => propertyController.updateProperty(selected.id, 'x', parseFloat(e.target.value) || 0)}
                      style={S.smallNumericInput}
                    />
                  </div>
                  <div style={S.smallField}>
                    <span style={S.controlLabel}>Pos Y</span>
                    <input
                      type="number"
                      value={Math.round(body.position.y)}
                      onChange={(e) => propertyController.updateProperty(selected.id, 'y', parseFloat(e.target.value) || 0)}
                      style={S.smallNumericInput}
                    />
                  </div>
                </div>

                {/* Velocity X / Y in double row */}
                <div style={S.multiFieldGrid}>
                  <div style={S.smallField}>
                    <span style={S.controlLabel}>Vel X</span>
                    <input
                      type="number"
                      step="0.1"
                      value={body.velocity.x}
                      onChange={(e) => propertyController.updateProperty(selected.id, 'vx', parseFloat(e.target.value) || 0)}
                      style={S.smallNumericInput}
                    />
                  </div>
                  <div style={S.smallField}>
                    <span style={S.controlLabel}>Vel Y</span>
                    <input
                      type="number"
                      step="0.1"
                      value={body.velocity.y}
                      onChange={(e) => propertyController.updateProperty(selected.id, 'vy', parseFloat(e.target.value) || 0)}
                      style={S.smallNumericInput}
                    />
                  </div>
                </div>

                {/* Angular Velocity */}
                <SliderRow
                  label="Angular Velocity"
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={body.angularVelocity}
                  unit="rad/s"
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'angularVelocity', v)}
                  tooltip="Rate of spin around centroid center."
                />

                {/* Angle (Rotation) */}
                <SliderRow
                  label="Angle (Rotation)"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={body.angle}
                  unit="rad"
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'rotation', v)}
                  tooltip="Orientation of the object in radians."
                />
              </div>
            )}
          </div>

          {/* ── SECTION: Visual & Styling ─────────────────────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('visuals')}>
              <span style={{ ...S.sectionTitle, color: '#f9a8d4' }}>🎨 Visual & Styling</span>
              <span style={S.chevron}>{collapsed.visuals ? '▼' : '▲'}</span>
            </div>

            {!collapsed.visuals && (
              <div style={S.sectionBody}>
                {/* Opacity */}
                <SliderRow
                  label="Opacity"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={display.alpha}
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'opacity', v)}
                  tooltip="Transparency of the renderer graphics."
                />

                {/* Scale */}
                <SliderRow
                  label="Scale Factor"
                  min={0.3}
                  max={3.0}
                  step={0.05}
                  value={display.scale.x}
                  unit="x"
                  precision={2}
                  onChange={(v) => propertyController.updateProperty(selected.id, 'scale', v)}
                  tooltip="Multiplier for physical bounds and Pixi rendering size."
                />

                {/* Visibility Toggle */}
                <div style={S.toggleRow}>
                  <span style={S.controlLabel}>Renderer Visibility</span>
                  <button
                    onClick={() => propertyController.updateProperty(selected.id, 'visibility', !display.visible)}
                    style={{
                      ...S.toggleBtn,
                      backgroundColor: display.visible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: display.visible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      color: display.visible ? '#6ee7b7' : '#94a3b8',
                    }}
                  >
                    {display.visible ? '👁 Visible' : '🙈 Hidden'}
                  </button>
                </div>

                {/* Color Palette Picker */}
                <div style={S.controlRow}>
                  <span style={S.controlLabel}>Theme Lab Color</span>
                  <div style={S.colorPalette}>
                    {[
                      { hex: 0xef4444, css: '#ef4444' }, // Red
                      { hex: 0xf97316, css: '#f97316' }, // Orange
                      { hex: 0xeab308, css: '#eab308' }, // Yellow
                      { hex: 0x10b981, css: '#10b981' }, // Emerald
                      { hex: 0x06b6d4, css: '#06b6d4' }, // Cyan
                      { hex: 0x6366f1, css: '#6366f1' }, // Indigo
                      { hex: 0x8b5cf6, css: '#8b5cf6' }, // Purple
                      { hex: 0xec4899, css: '#ec4899' }, // Pink
                    ].map((color) => {
                      const currentFill = selected.metadata?.shapeInfo?.fillColor;
                      const isSelected = typeof currentFill === 'number'
                        ? currentFill === color.hex
                        : currentFill === color.css;
                      return (
                        <button
                          key={color.hex}
                          onClick={() => propertyController.updateProperty(selected.id, 'fillColor', color.hex)}
                          style={{
                            ...S.paletteBtn,
                            backgroundColor: color.css,
                            border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.3)',
                            boxShadow: isSelected ? '0 0 0 2px #6366f1' : 'none',
                            transform: isSelected ? 'scale(1.2)' : 'none',
                          }}
                          title={color.css}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: Constraint Tuning ────────────────────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('constraints')}>
              <span style={{ ...S.sectionTitle, color: '#6ee7b7' }}>🔗 Connected Constraints</span>
              <span style={S.chevron}>{collapsed.constraints ? '▼' : '▲'}</span>
            </div>

            {!collapsed.constraints && (
              <div style={S.sectionBody}>
                {activeConstraints.length > 0 ? (
                  activeConstraints.map((rc) => {
                    const { id, type, constraint } = rc;
                    const isSpring = type === 'spring';
                    return (
                      <div key={id} style={S.constraintCard}>
                        <div style={S.constraintCardHeader}>
                          <span style={S.constraintName}>
                            {type === 'spring' ? '🌀 Spring Link' : type === 'pivot' ? '📌 Anchor Pivot' : '🔗 Rope Chain'}
                          </span>
                          <span style={S.constraintId}>{id}</span>
                        </div>

                        {/* Stiffness */}
                        <SliderRow
                          label="Stiffness"
                          min={isSpring ? 0.001 : 0.05}
                          max={1.0}
                          step={isSpring ? 0.001 : 0.05}
                          value={constraint.stiffness}
                          precision={3}
                          onChange={(v) => propertyController.updateConstraintProperty(id, 'stiffness', v)}
                          tooltip="Constraint elasticity. Smaller values let it stretch like a loose rubber band."
                        />

                        {/* Damping */}
                        {(type === 'spring' || type === 'pivot') && (
                          <SliderRow
                            label="Damping"
                            min={0.0}
                            max={0.1}
                            step={0.001}
                            value={constraint.damping}
                            precision={4}
                            onChange={(v) => propertyController.updateConstraintProperty(id, 'damping', v)}
                            tooltip="Frictional resistance inside the constraint. Larger damping reduces oscillations rapidly."
                          />
                        )}

                        {/* Length */}
                        <SliderRow
                          label="Rest Length"
                          min={10}
                          max={400}
                          step={5}
                          value={constraint.length}
                          unit="px"
                          precision={0}
                          onChange={(v) => propertyController.updateConstraintProperty(id, 'length', v)}
                          tooltip="The equilibrium spring length where no tension or compression exists."
                        />
                      </div>
                    );
                  })
                ) : (
                  <div style={S.noConstraints}>
                    <span>No constraints connected to this body. Add a Spring, Pivot, or Rope in the workspace to see it here.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── SECTION: Live Scientific Instrumentation ──────────────────────────── */}
          <div style={S.section}>
            <div style={S.sectionHeader} onClick={() => toggleSection('observables')}>
              <span style={{ ...S.sectionTitle, color: '#fde047' }}>🔬 Scientific Instrumentation</span>
              <span style={S.chevron}>{collapsed.observables ? '▼' : '▲'}</span>
            </div>

            {!collapsed.observables && (
              <div style={S.sectionBody}>
                <div style={S.telemetryGrid}>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Velocity</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={velRef} style={S.telemetryValue}>0.0</span>
                      <span style={S.telemetryUnit}>px/s</span>
                    </div>
                  </div>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Acceleration</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={accRef} style={S.telemetryValue}>0.0</span>
                      <span style={S.telemetryUnit}>px/s²</span>
                    </div>
                  </div>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Momentum</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={momRef} style={S.telemetryValue}>0.0</span>
                      <span style={S.telemetryUnit}>kg·px/s</span>
                    </div>
                  </div>
                  <div style={S.telemetryCard}>
                    <span style={S.telemetryLabel}>Kinetic Energy</span>
                    <div style={S.telemetryValueRow}>
                      <span ref={keRef} style={S.telemetryValue}>0.0</span>
                      <span style={S.telemetryUnit}>J</span>
                    </div>
                  </div>
                </div>
                <div style={{ ...S.telemetryCard, marginTop: 6 }}>
                  <span style={S.telemetryLabel}>Angular Velocity (Spin)</span>
                  <div style={S.telemetryValueRow}>
                    <span ref={angVelRef} style={S.telemetryValue}>0.00</span>
                    <span style={S.telemetryUnit}>rad/s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Inline Styles (Glassmorphism Dashboard Theme) ───────────────────────────

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    padding: '14px 12px',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    color: '#cbd5e1',
    userSelect: 'none',
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: 4,
    background: 'rgba(0, 0, 0, 0.15)',
    borderRadius: '0 0 6px 6px',
    overflow: 'hidden',
  },
  tabBtn: {
    flex: 1,
    padding: '10px 4px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    transition: 'all 0.15s ease',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  orbitalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height: '100%',
    minHeight: 320,
    padding: '24px',
    borderRadius: 14,
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.01)',
    position: 'relative',
    overflow: 'hidden',
  },
  emptyGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 16,
    filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.2))',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#a5b4fc',
    marginBottom: 6,
    letterSpacing: '-0.02em',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.6,
  },
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: '8px 10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  headerBadge: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: '0.04em',
  },
  objectId: {
    fontSize: 12,
    fontWeight: 700,
    color: '#e2e8f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
  },
  lockBtn: {
    fontSize: 9,
    fontWeight: 700,
    cursor: 'pointer',
    border: '1px solid',
    borderRadius: 6,
    padding: '4px 8px',
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255, 255, 255, 0.01)',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 8,
    color: '#475569',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
  },
  controlRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  controlHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: '#94a3b8',
  },
  controlValWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  numericInput: {
    width: 48,
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    padding: '2px 4px',
    fontSize: 10,
    color: '#818cf8',
    fontFamily: 'monospace',
    textAlign: 'right',
    outline: 'none',
  },
  unitSpan: {
    fontSize: 9,
    color: '#475569',
    fontWeight: 600,
  },
  slider: {
    flex: 1,
    accentColor: '#6366f1',
    cursor: 'pointer',
    height: 4,
    outline: 'none',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  toggleBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  multiFieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  smallField: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    padding: '4px 6px',
  },
  smallNumericInput: {
    width: 42,
    background: 'transparent',
    border: 'none',
    color: '#22d3ee',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'right',
    outline: 'none',
  },
  paletteBtn: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.15s ease',
  },
  colorPalette: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  constraintCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  constraintCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    paddingBottom: 4,
  },
  constraintName: {
    fontSize: 10,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  constraintId: {
    fontSize: 8,
    color: '#475569',
    fontFamily: 'monospace',
  },
  noConstraints: {
    padding: '12px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.01)',
    border: '1px dashed rgba(255, 255, 255, 0.06)',
    textAlign: 'center',
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  telemetryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  telemetryCard: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: '6px 8px',
  },
  telemetryLabel: {
    fontSize: 8,
    color: '#475569',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 2,
  },
  telemetryValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  telemetryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#fde047',
    fontFamily: 'monospace',
  },
  telemetryUnit: {
    fontSize: 8,
    color: '#475569',
    fontFamily: 'monospace',
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 6,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6.5px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  eduHudCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
    border: '1px solid rgba(253, 224, 71, 0.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectInput: {
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    color: '#e2e8f0',
    padding: '4px 8px',
    fontSize: 10,
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
};

export default PropertyPanel;
