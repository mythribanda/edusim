import React, { useState, useEffect } from 'react';
import * as Matter from 'matter-js';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { OrbitSpawner } from '../../orbits/orbitSpawner';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface OrbitControlsProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
  onRefresh?: () => void;
}

export const OrbitControls: React.FC<OrbitControlsProps> = ({
  selectedObject,
  propertyController,
  onRefresh,
}) => {
  const runtime = (propertyController as any).runtime;
  const store = (propertyController as any).store;

  const [timeScale, setTimeScale] = useState(1.0);
  const [draggedRadius, setDraggedRadius] = useState<number | null>(null);

  const { body } = selectedObject;

  // Sync timing scale state on mount/change
  useEffect(() => {
    if (runtime) {
      const currentScale = runtime.physics.getEngine().timing.timeScale;
      setTimeScale(currentScale);
    }
  }, [runtime]);

  // Retrieve dominant central gravity source
  const radialGravity = runtime?.gravitySystem?.getRadialGravity();
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

  // Live physical distance
  const currentRadius = centralSource
    ? Math.round(OrbitUtils.calculateDistance(centralSource.position, body.position))
    : 150;

  const displayRadius = draggedRadius !== null ? draggedRadius : currentRadius;

  // Helper: Trigger parent and local states refresh
  const triggerRefresh = () => {
    if (onRefresh) onRefresh();
  };

  // ─── 1. Orbit Radius Control System ────────────────────────────────────────

  const setOrbitRadius = (newRadius: number) => {
    if (!centralSource || !runtime) return;

    const parentBody = runtime?.sync.getPairs().get(centralSource.id)?.body || store?.getObject(centralSource.id)?.body;
    const parentPos = parentBody ? parentBody.position : centralSource.position;

    const dx = body.position.x - parentPos.x;
    const dy = body.position.y - parentPos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.001) {
      // 1. Move orbiting body relative to gravity source along the radial vector
      const dirX = dx / dist;
      const dirY = dy / dist;

      const newX = parentPos.x + dirX * newRadius;
      const newY = parentPos.y + dirY * newRadius;

      // Position Matter body cleanly
      Matter.Body.setPosition(body, { x: newX, y: newY });

      // 2. Recompute orbital velocity & tangential direction with softening matching gravitySystem
      const gravityStrength = centralSource.metadata?.gravityStrength ?? 1.0;
      const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
      const M = centralSource.mass * gravityStrength;
      const softening = radialGravity?.config?.softeningFactor ?? 100;

      // v = sqrt(G * M * newRadius / (newRadius * newRadius + softening)) * 16.67
      const circSpeed = Math.sqrt((G * M * newRadius) / (newRadius * newRadius + softening)) * 16.67;

      const currentVxRel = body.velocity.x - (parentBody ? parentBody.velocity.x : 0);
      const currentVyRel = body.velocity.y - (parentBody ? parentBody.velocity.y : 0);
      const crossProduct = dx * currentVyRel - dy * currentVxRel;
      const clockwise = crossProduct >= 0;
      const tangentDir = OrbitUtils.computeTangentialDirection(
        parentPos,
        { x: newX, y: newY },
        clockwise
      );

      // 3. Apply new velocity (incorporating parent body velocity transition)
      const parentVx = parentBody ? parentBody.velocity.x : 0;
      const parentVy = parentBody ? parentBody.velocity.y : 0;

      const newVx = parentVx + tangentDir.x * circSpeed;
      const newVy = parentVy + tangentDir.y * circSpeed;

      propertyController.updateProperty(selectedObject.id, 'vx', newVx);
      propertyController.updateProperty(selectedObject.id, 'vy', newVy);

      Matter.Body.setVelocity(body, { x: newVx, y: newVy });

      const customData = (body as any).customData || {};
      customData.referenceRadius = newRadius;
      customData.referenceAngle = Math.atan2(dy, dx);
      customData.orbitType = 'circular';
      (body as any).customData = customData;

      triggerRefresh();
    }
  };

  const increaseOrbitRadius = () => {
    if (!centralSource) return;
    const nextR = Math.min(800, currentRadius + 25);
    setOrbitRadius(nextR);
  };

  const decreaseOrbitRadius = () => {
    if (!centralSource) return;
    const nextR = Math.max(40, currentRadius - 25);
    setOrbitRadius(nextR);
  };

  // ─── 2. Velocity Adjustments & Stabilization ──────────────────────────────

  const applyThrust = (percentChange: number) => {
    const parentBody = runtime?.sync.getPairs().get(centralSource?.id)?.body || store?.getObject(centralSource?.id)?.body;
    const parentVx = parentBody ? parentBody.velocity.x : 0;
    const parentVy = parentBody ? parentBody.velocity.y : 0;

    const relVx = body.velocity.x - parentVx;
    const relVy = body.velocity.y - parentVy;
    const relSpeed = Math.hypot(relVx, relVy);

    if (relSpeed > 0.0001) {
      const newRelSpeed = relSpeed * (1 + percentChange);
      const newVx = parentVx + (relVx / relSpeed) * newRelSpeed;
      const newVy = parentVy + (relVy / relSpeed) * newRelSpeed;

      propertyController.updateProperty(selectedObject.id, 'vx', newVx);
      propertyController.updateProperty(selectedObject.id, 'vy', newVy);
      Matter.Body.setVelocity(body, { x: newVx, y: newVy });

      const customData = (body as any).customData || {};
      customData.referenceRadius = Math.hypot(body.position.x - parentBody.position.x, body.position.y - parentBody.position.y);
      customData.referenceAngle = Math.atan2(body.position.y - parentBody.position.y, body.position.x - parentBody.position.x);
      customData.orbitType = 'elliptical';
      (body as any).customData = customData;

      triggerRefresh();
    }
  };

  // Circularize Orbit: compute ideal velocity, remove radial component, restore stable circular orbit
  const circularizeOrbit = () => {
    if (!centralSource) return;

    // STEP 2 — Compute Correct Radius Vector using actual runtime body centers (Matter.js body positions)
    const parentBody = runtime?.sync.getPairs().get(centralSource.id)?.body || store?.getObject(centralSource.id)?.body;
    const parentPos = parentBody ? parentBody.position : centralSource.position;

    const dx = body.position.x - parentPos.x;
    const dy = body.position.y - parentPos.y;

    // STEP 3 — Normalize Radius Vector and handle division by zero
    const r = Math.hypot(dx, dy);
    if (r <= 0.0001) return;

    const normalizedRadius = {
      x: dx / r,
      y: dy / r,
    };

    // STEP 4 — Compute Correct Tangential Direction
    // velocity MUST be perpendicular to radius vector.
    // Determine orbit direction based on the current velocity cross product
    const currentVxRel = body.velocity.x - (parentBody ? parentBody.velocity.x : 0);
    const currentVyRel = body.velocity.y - (parentBody ? parentBody.velocity.y : 0);
    const crossProduct = dx * currentVyRel - dy * currentVxRel;
    const clockwise = crossProduct >= 0;

    // tangent vector = {-ny, nx} for clockwise, {ny, -nx} for counter-clockwise
    const tangent = clockwise
      ? { x: -normalizedRadius.y, y: normalizedRadius.x }
      : { x: normalizedRadius.y, y: -normalizedRadius.x };

    // STEP 5 — Compute Correct Circular Velocity using Plummer Softening
    const gravityStrength = centralSource.metadata?.gravityStrength ?? 1.0;
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
    const M = centralSource.mass * gravityStrength;
    const softening = radialGravity?.config?.softeningFactor ?? 100;

    // v = sqrt(G * M * r / (r^2 + softening)) * 16.67
    const circSpeed = Math.sqrt((G * M * r) / (r * r + softening)) * 16.67;

    // STEP 6 — Completely Overwrite Velocity (incorporating parent body velocity transition)
    const parentVx = parentBody ? parentBody.velocity.x : 0;
    const parentVy = parentBody ? parentBody.velocity.y : 0;

    const newVx = parentVx + tangent.x * circSpeed;
    const newVy = parentVy + tangent.y * circSpeed;

    // STEP 7 — Remove Radial Velocity Completely (tangent vector calculation ensures radial component is exactly 0)
    // Diagnostics / Debugging output (STEP 11)
    const radialVelocity = currentVxRel * normalizedRadius.x + currentVyRel * normalizedRadius.y;
    console.log("[Orbit Circularization Diagnostics] (fix1010)");
    console.log("Radius:", r);
    console.log("Circular Velocity:", circSpeed);
    console.log("Tangential Vector:", tangent);
    console.log("Radial Velocity:", radialVelocity);
    console.log("Circular Speed Ratio:", 1.0);
    console.log("Parent Velocity:", { x: parentVx, y: parentVy });
    console.log("New World Velocity:", { x: newVx, y: newVy });

    // Apply the absolute new velocity to both property controller and Matter.js body
    propertyController.updateProperty(selectedObject.id, 'vx', newVx);
    propertyController.updateProperty(selectedObject.id, 'vy', newVy);
    Matter.Body.setVelocity(body, { x: newVx, y: newVy });

    const customData = (body as any).customData || {};
    customData.referenceRadius = r;
    customData.referenceAngle = Math.atan2(dy, dx);
    customData.orbitType = 'circular';
    (body as any).customData = customData;

    triggerRefresh();
  };

  // Make Elliptical: Compute elliptical periapsis speed and apply tangential impulse
  const setEllipticalOrbit = () => {
    if (!centralSource) return;

    const parentBody = runtime?.sync.getPairs().get(centralSource.id)?.body || store?.getObject(centralSource.id)?.body;
    if (!parentBody) return;

    const dx = body.position.x - parentBody.position.x;
    const dy = body.position.y - parentBody.position.y;
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;

    // Determine current orbit direction based on the velocity cross product
    const currentVxRel = body.velocity.x - parentBody.velocity.x;
    const currentVyRel = body.velocity.y - parentBody.velocity.y;
    const crossProduct = dx * currentVyRel - dy * currentVxRel;
    const clockwise = crossProduct >= 0;

    // Retrieve stable reference radius and angle to make successive clicks idempotent
    const customData = (body as any).customData || {};
    const refRadius = customData.referenceRadius || Math.hypot(dx, dy);
    const refAngle = customData.referenceAngle !== undefined ? customData.referenceAngle : Math.atan2(dy, dx);

    // Use our new complete elliptical orbit spawner
    import('../../orbits/ellipticalOrbit').then(({ spawnEllipticalOrbit }) => {
      spawnEllipticalOrbit({
        centerBody: parentBody,
        orbitingBody: body,
        velocityMultiplier: 0.8, // 0.8 creates a beautiful bound elliptical orbit (periapsis < radius)
        clockwise,
        initialRadius: refRadius,
        initialAngle: refAngle,
        stabilization: true
      }, G);

      // Sync computed velocities back to the property controllers
      propertyController.updateProperty(selectedObject.id, 'vx', body.velocity.x);
      propertyController.updateProperty(selectedObject.id, 'vy', body.velocity.y);
      triggerRefresh();
    });
  };

  // Dynamically Stabilize Orbit: snaps velocity to stable circular orbit at current distance
  const stabilizeOrbit = () => {
    circularizeOrbit();
  };

  const resetVelocity = () => {
    propertyController.updateProperty(selectedObject.id, 'vx', 0);
    propertyController.updateProperty(selectedObject.id, 'vy', 0);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    triggerRefresh();
  };

  // ─── 3. Time Control Scaling ──────────────────────────────────────────────

  const updateTimeScale = (scale: number) => {
    if (runtime) {
      runtime.physics.getEngine().timing.timeScale = scale;
      setTimeScale(scale);
    }
  };

  // ─── 4. Spawning Celestial Moons / Satellites ─────────────────────────────

  const spawnBody = async (type: 'satellite' | 'moon') => {
    if (!runtime || !store) return;

    // Parent is either the current selected planet, or the dominant star
    const isPlanetSelected = selectedObject.metadata?.customData?.orbitalCategory === 'planet';
    const parentObj = isPlanetSelected ? selectedObject : store.getObject('orbit-star');
    if (!parentObj) return;

    const { createObject } = await import('../../objects/objectFactory');
    const uid = () => `orbital-${type}-${Math.random().toString(36).substr(2, 6)}`;

    const id = uid();
    const parentPos = parentObj.body.position;

    // Configuration of spawned body
    const radius = type === 'satellite' ? 5 : 9;
    const offset = type === 'satellite' ? 35 : 55;
    const fillColor = type === 'satellite' ? 0x94a3b8 : 0xcbd5e1;
    const strokeColor = type === 'satellite' ? 0x64748b : 0x94a3b8;

    const spawnedObj = createObject({
      id,
      type: 'circle',
      x: parentPos.x,
      y: parentPos.y - offset,
      radius,
      restitution: 0.1,
      friction: 0.05,
      frictionAir: 0,
      density: type === 'satellite' ? 0.0005 : 0.001,
      fillColor,
      strokeColor,
      strokeWidth: 1.5,
    });

    spawnedObj.body.label = type === 'satellite' ? 'Satellite' : 'Moon';
    (spawnedObj.body as any).customData = {
      orbitalCategory: type === 'satellite' ? 'moon' : 'moon',
    };

    // Calculate stable circular speed around the parent
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
    const softening = radialGravity?.config?.softeningFactor ?? 100;
    OrbitSpawner.spawnCircularOrbit(
      {
        centerBody: parentObj.body,
        orbitingBody: spawnedObj.body,
        radius: offset,
        angle: -Math.PI / 2,
        clockwise: true,
      },
      G,
      softening
    );

    // Register into the runtime and visual layers
    runtime.renderer.getViewport().addChild(spawnedObj.display);
    runtime.physics.addBodies(spawnedObj.body);
    runtime.sync.register(spawnedObj.id, spawnedObj.body, spawnedObj.display);
    store.addObject(spawnedObj);

    // Select the newly spawned body to inspect it!
    const selectManager = (runtime as any).selectionManager || (propertyController as any).selectionManager;
    if (selectManager) {
      selectManager.register(spawnedObj);
    }
    store.setSelectedObject(id);

    triggerRefresh();
  };

  return (
    <div style={S.container}>
      {/* ── Section 1: Orbit Radius Slider & Manipulation ── */}
      {centralSource && (
        <div style={S.controlGroup}>
          <div style={S.groupLabel}>🪐 Orbital Geometry</div>

          <div style={S.sliderRow}>
            <div style={S.sliderMeta}>
              <span style={S.sliderLabel}>Orbit Radius</span>
              <span style={S.sliderVal}>{Math.round(displayRadius * 100).toLocaleString()} km</span>
            </div>
            <input
              type="range"
              min={40}
              max={600}
              step={1}
              value={displayRadius}
              onMouseDown={() => setDraggedRadius(currentRadius)}
              onTouchStart={() => setDraggedRadius(currentRadius)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDraggedRadius(val);
                setOrbitRadius(val);
              }}
              onMouseUp={() => setDraggedRadius(null)}
              onTouchEnd={() => setDraggedRadius(null)}
              style={S.sliderInput}
            />
            <span style={S.sliderTooltip}>
              Drag to scale the orbit. Notice that velocity changes dynamically: Larger orbit → slower velocity, Smaller orbit → faster velocity.
            </span>
          </div>

          <div style={S.buttonGrid}>
            <button
              onClick={increaseOrbitRadius}
              style={S.actionBtn}
              title="Increase orbit radius by 25px and stabilize velocity"
            >
              ➕ Expand Orbit
            </button>
            <button
              onClick={decreaseOrbitRadius}
              style={S.actionBtn}
              title="Decrease orbit radius by 25px and stabilize velocity"
            >
              ➖ Contract Orbit
            </button>
          </div>
        </div>
      )}

      {/* ── Section 2: Delta-V Thrust & Stabilization ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🚀 Delta-V Propulsion / Thrust</div>
        <div style={S.buttonGrid}>
          <button
            onClick={() => applyThrust(0.1)}
            style={{ ...S.actionBtn, borderColor: '#34d399', color: '#34d399' }}
            title="Apply prograde thrust (+10% velocity) to raise apoapsis"
          >
            ➕ Prograde (+10%)
          </button>
          <button
            onClick={() => applyThrust(-0.1)}
            style={{ ...S.actionBtn, borderColor: '#f87171', color: '#f87171' }}
            title="Apply retrograde thrust (-10% velocity) to lower periapsis"
          >
            ➖ Retrograde (-10%)
          </button>
        </div>
        <div style={S.buttonRow}>
          <button
            onClick={circularizeOrbit}
            style={{ ...S.actionBtn, borderColor: '#38bdf8', color: '#38bdf8' }}
            title="Snap body to stable circular velocity removing radial deviations"
          >
            🔄 Circularize
          </button>
          <button
            onClick={setEllipticalOrbit}
            style={{ ...S.actionBtn, borderColor: '#a78bfa', color: '#a78bfa' }}
            title="Enter stable eccentric elliptical path (eccentricity e = 0.35)"
          >
            🪐 Make Elliptical
          </button>
        </div>
        <button
          onClick={stabilizeOrbit}
          style={{ ...S.actionBtn, width: '100%', borderColor: '#10b981', color: '#10b981' }}
          title="Dynamically stabilize orbit at current distance"
        >
          🛡️ Stabilize Orbit
        </button>
        <button
          onClick={resetVelocity}
          style={{ ...S.actionBtn, width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
        >
          🛑 Cut Engines (Zero Velocity)
        </button>
      </div>

      {/* ── Section 3: Time Scaling ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>⏳ Physics Timestep Warp</div>
        <div style={S.warpGrid}>
          {[
            { label: '⏸️ Pause', value: 0 },
            { label: '0.5x', value: 0.5 },
            { label: '1.0x (Std)', value: 1.0 },
            { label: '2.0x ⏩', value: 2.0 },
          ].map((t) => {
            const isActive = timeScale === t.value;
            return (
              <button
                key={t.value}
                onClick={() => updateTimeScale(t.value)}
                style={{
                  ...S.warpBtn,
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isActive ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Orbital Construction ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🏗️ Orbital Constructor</div>
        <div style={S.buttonGrid}>
          <button onClick={() => spawnBody('moon')} style={S.actionBtn}>
            🌒 Launch Moon
          </button>
          <button onClick={() => spawnBody('satellite')} style={S.actionBtn}>
            🛰️ Deploy Satellite
          </button>
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
  sliderRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    marginBottom: 4,
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
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  warpGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 6,
  },
  warpBtn: {
    padding: '6px 4px',
    borderRadius: 6,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 700,
    outline: 'none',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  },
};
