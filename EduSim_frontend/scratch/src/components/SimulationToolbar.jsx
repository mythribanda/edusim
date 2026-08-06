import React, { useCallback, useState } from 'react';
import * as Newtons from '../simulations/presets/NewtonsLawPreset';
import * as Collision from '../simulations/presets/CollisionPreset';
import * as Projectile from '../simulations/presets/ProjectilePreset';
import * as Friction from '../simulations/presets/FrictionPreset';
import * as Gravity from '../simulations/presets/GravityPreset';
import * as Pendulum from '../simulations/presets/PendulumPreset';
import * as Space from '../simulations/presets/SpacePhysicsPreset';

export default function SimulationToolbar({ apiRef, onUpdateStats }) {
  const [gravity, setGravity] = useState(1);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const applyGravity = useCallback((g) => {
    setGravity(g);
    if (apiRef && apiRef.current) apiRef.current.setGravity(g);
    if (onUpdateStats) onUpdateStats();
  }, [apiRef, onUpdateStats]);

  const handlePause = () => {
    if (!apiRef || !apiRef.current) return;
    const next = !paused;
    setPaused(next);
    apiRef.current.engine.enabled = !next;
  };

  const handleReset = () => {
    if (apiRef && apiRef.current) apiRef.current.reset();
    if (onUpdateStats) onUpdateStats();
  };

  const handleClear = () => {
    if (apiRef && apiRef.current) apiRef.current.clear();
    if (onUpdateStats) onUpdateStats();
  };

  const handleSave = () => {
    if (!apiRef || !apiRef.current) return;
    const bodies = apiRef.current.world.bodies.map((b) => ({
      id: b.id,
      asset: b.plugin?.asset?.name || null,
      position: b.position,
      velocity: b.velocity,
      angle: b.angle,
      mass: b.mass,
      friction: b.friction,
      restitution: b.restitution
    }));
    const payload = { bodies };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulation.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (file) => {
    if (!file || !apiRef || !apiRef.current) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        apiRef.current.clear();
        data.bodies.forEach((b) => {
          if (b.asset) apiRef.current.spawn(b.asset, b.position.x, b.position.y);
        });
        if (onUpdateStats) onUpdateStats();
      } catch (e) { console.error(e); }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select onChange={(e) => {
        const v = e.target.value;
        if (!apiRef || !apiRef.current) return;
        apiRef.current.clear();
        switch (v) {
          case 'newton': Newtons.applyPreset_NewtonsLaw(apiRef.current); break;
          case 'collision': Collision.applyPreset_Collision(apiRef.current); break;
          case 'projectile': Projectile.applyPreset_Projectile(apiRef.current); break;
          case 'friction': Friction.applyPreset_Friction(apiRef.current); break;
          case 'gravity': Gravity.applyPreset_Gravity(apiRef.current); break;
          case 'pendulum': Pendulum.applyPreset_Pendulum(apiRef.current); break;
          case 'space': Space.applyPreset_SpacePhysics(apiRef.current); break;
          default: break;
        }
        if (onUpdateStats) onUpdateStats();
      }} style={{ padding: 8, borderRadius: 8 }}>
        <option value="">Load Preset...</option>
        <option value="newton">Newton's Laws</option>
        <option value="projectile">Projectile Motion</option>
        <option value="collision">Collision</option>
        <option value="friction">Friction</option>
        <option value="gravity">Gravity</option>
        <option value="pendulum">Pendulum</option>
        <option value="space">Space Physics</option>
      </select>
      <button onClick={handlePause} style={{ padding: '8px 12px', borderRadius: 8 }}>{paused ? 'Resume' : 'Pause'}</button>
      <button onClick={handleReset} style={{ padding: '8px 12px', borderRadius: 8 }}>Reset</button>
      <button onClick={handleClear} style={{ padding: '8px 12px', borderRadius: 8 }}>Clear</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
        <label style={{ fontSize: 13 }}>Gravity</label>
        <input type="range" min="-2" max="3" step="0.1" value={gravity} onChange={(e) => applyGravity(Number(e.target.value))} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
        <label style={{ fontSize: 13 }}>Speed</label>
        <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={(e) => { setSpeed(Number(e.target.value)); if (apiRef && apiRef.current) apiRef.current.engine.timing.timeScale = Number(e.target.value); }} />
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input id="sim-load-file" type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => handleLoad(e.target.files?.[0])} />
        <button onClick={handleSave} className="btn-primary">Save</button>
        <label htmlFor="sim-load-file" className="btn-primary" style={{ cursor: 'pointer', padding: '8px 12px' }}>Load</label>
        <button onClick={() => { if (apiRef && apiRef.current) apiRef.current.spawn('ball_generic', 200, 50); if (onUpdateStats) onUpdateStats(); }}>Spawn Ball</button>
      </div>
    </div>
  );
}
