import * as PIXI from 'pixi.js';
import type { SandboxExampleConfig } from '../types/example.types';

/**
 * ─── NCERT Example 7.7 ───────────────────────────────────────────────────────
 * Express the constant k of Eq. (7.38) in days and kilometres.
 *   Given:  k = 10⁻¹³  s² m⁻³
 * The moon is at a distance of 3.84 × 10⁵ km from the earth.
 * Obtain its time-period of revolution in days.
 *
 * Kepler's Third Law:  T² = k · R³
 *
 * Step 1 – Convert k to days² / km³
 *   1 km = 10³ m  ⟹  1 m = 10⁻³ km
 *   1 day = 86400 s  ⟹  1 s = 1/86400 day
 *
 *   k = 10⁻¹³ s² m⁻³
 *     = 10⁻¹³ × (1/86400)⁻² × (10⁻³)⁻³   (convert s→day, m→km)
 *     = 10⁻¹³ × 86400² × 10⁹
 *     = 10⁻¹³ × 7.46 × 10⁹ × 10⁹
 *     = 10⁻¹³ × 7.46 × 10⁹ × 10⁹
 *     ≈ 1.33 × 10⁻¹⁴  day² km⁻³
 *
 * Step 2 – Time period of the Moon
 *   R = 3.84 × 10⁵ km
 *   T² = k · R³  = 1.33 × 10⁻¹⁴ × (3.84 × 10⁵)³
 *   T² ≈ 753.08
 *   T  ≈ 27.4 days  (matches the observed sidereal month ≈ 27.3 days)
 *
 * Simulation: Earth (static center) with the Moon orbiting at correct relative
 * scale. An overlay panel shows the live step-by-step calculation.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── Physics constants for the simulation ─────────────────────────────────────
// We scale down to sandbox pixels while keeping the orbital dynamics faithful.
// Moon orbit radius in pixels:  200 px
// Earth center: (400, 300)

const EARTH_CENTER_X = 400;
const EARTH_CENTER_Y = 300;
const MOON_ORBIT_RADIUS_PX = 200;

export const example7_7: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-7',
    title: "7.7 Kepler's Third Law – Moon's Period",
    description:
      "Demonstrates Kepler's Third Law (T² = kR³). Shows the conversion of constant k from SI units to days²/km³ and uses it to compute the Moon's orbital period (~27.3 days).",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "Kepler's Third Law: T² = k · R³, where k depends on the central body.",
      'k = 10⁻¹³ s² m⁻³ in SI.  Converting to days and km gives k ≈ 1.33 × 10⁻¹⁴ day² km⁻³.',
      'For the Moon (R = 3.84 × 10⁵ km): T² = 1.33 × 10⁻¹⁴ × (3.84 × 10⁵)³ ≈ 753 → T ≈ 27.4 days.',
      'This closely matches the observed sidereal orbital period of ≈ 27.3 days.'
    ]
  },

  objects: [
    // ── Earth: static central body ──────────────────────────────────────────
    {
      assetId: 'earth',
      id: 'example-earth',
      x: EARTH_CENTER_X,
      y: EARTH_CENTER_Y,
      isStatic: true,
      mass: 6000,
      radius: 35
    },
    // ── Moon: orbiting body ─────────────────────────────────────────────────
    {
      assetId: 'moon',
      id: 'example-moon',
      x: EARTH_CENTER_X,
      y: EARTH_CENTER_Y - MOON_ORBIT_RADIUS_PX,
      orbitCenterId: 'example-earth',
      orbitType: 'circular',
      clockwise: true,
      mass: 8,
      radius: 14,
      customData: {
        density: 0.001
      }
    }
  ],

  observables: [
    {
      objectId: 'example-moon',
      types: ['velocity'],
      label: 'Moon',
      color: 0xa3a3a3
    }
  ],

  overlays: {
    showOrbitPath: true,
    showVelocityVectors: true,
    showForceVectors: false,
    showInfluenceRadius: false,
    showOrbitalTrail: true
  },

  gConstant: 0.0012,
  gravityMode: 'radial',

  camera: {
    zoom: 0.85,
    centerX: EARTH_CENTER_X,
    centerY: EARTH_CENTER_Y
  },

  // ── Custom visual overlays & live calculation panel ─────────────────────
  customSetup: async (runtime, store, controller, observables) => {
    const vp = runtime.renderer.getViewport();

    // ── 1. Draw the dashed circular target orbit ─────────────────────────
    const orbitGuide = new PIXI.Graphics();
    orbitGuide.name = 'example7_7-orbit-guide';
    vp.addChild(orbitGuide);

    orbitGuide.circle(EARTH_CENTER_X, EARTH_CENTER_Y, MOON_ORBIT_RADIUS_PX);
    orbitGuide.stroke({ color: 0x6366f1, width: 1.2, alpha: 0.25 });

    // ── 2. Label at the Moon's starting position ─────────────────────────
    const annotations = new PIXI.Container();
    annotations.name = 'example7_7-annotations';
    vp.addChild(annotations);

    // Earth label
    const earthStyle = new PIXI.TextStyle({
      fill: '#60a5fa',
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const earthText = new PIXI.Text('Earth (Central Body)', earthStyle);
    earthText.anchor.set(0.5, -1.5);
    earthText.position.set(EARTH_CENTER_X, EARTH_CENTER_Y);
    annotations.addChild(earthText);

    // Distance label
    const distStyle = new PIXI.TextStyle({
      fill: '#a78bfa',
      fontSize: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const distText = new PIXI.Text('R = 3.84 × 10⁵ km', distStyle);
    distText.anchor.set(0.5, 0.5);
    distText.position.set(EARTH_CENTER_X + 30, EARTH_CENTER_Y - MOON_ORBIT_RADIUS_PX / 2);
    annotations.addChild(distText);

    // Draw the radius line
    const radiusLine = new PIXI.Graphics();
    annotations.addChild(radiusLine);
    radiusLine.moveTo(EARTH_CENTER_X, EARTH_CENTER_Y);
    radiusLine.lineTo(EARTH_CENTER_X, EARTH_CENTER_Y - MOON_ORBIT_RADIUS_PX);
    radiusLine.stroke({ color: 0xa78bfa, width: 1, alpha: 0.5 });

    // Tracking Moon label
    const moonStyle = new PIXI.TextStyle({
      fill: '#d4d4d4',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const moonLabel = new PIXI.Text('Moon (T ≈ 27.3 days)', moonStyle);
    moonLabel.anchor.set(0.5, 2.0);
    annotations.addChild(moonLabel);

    // ── 3. Live-tracking hook to keep the Moon label above the Moon ──────
    runtime.addHook({
      id: 'example7_7-label-tracker',
      beforeStep: () => {
        const moonObj = store.getObject('example-moon');
        if (moonObj) {
          moonLabel.position.set(moonObj.body.position.x, moonObj.body.position.y);
        }
      }
    });

    // ── 4. Inject HTML overlay with step-by-step solution ────────────────
    const canvasWrap = runtime.renderer.getApp().canvas.parentElement;
    if (!canvasWrap) return;

    // Clean any existing overlay first
    const existing = document.getElementById('example-energy-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'example-energy-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '16px';
    overlay.style.right = '16px';
    overlay.style.background = 'rgba(15, 23, 42, 0.9)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.border = '1px solid rgba(99, 102, 241, 0.3)';
    overlay.style.borderRadius = '14px';
    overlay.style.padding = '16px 18px';
    overlay.style.color = '#e2e8f0';
    overlay.style.fontFamily = 'Inter, system-ui, sans-serif';
    overlay.style.fontSize = '11px';
    overlay.style.lineHeight = '1.6';
    overlay.style.width = '310px';
    overlay.style.zIndex = '1000';
    overlay.style.boxShadow = '0 12px 30px -6px rgba(0, 0, 0, 0.6)';
    overlay.style.maxHeight = '80vh';
    overlay.style.overflowY = 'auto';

    overlay.innerHTML = `
      <button id="close-ex77-overlay" style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Close">✕</button>
      <div style="font-weight: 800; margin-bottom: 8px; color: #818cf8; font-size: 14px; letter-spacing: -0.01em; padding-right: 28px;">
        📐 Example 7.7 — Kepler's Third Law
      </div>
      <div style="color: #94a3b8; font-size: 10px; margin-bottom: 12px; border-bottom: 1px solid rgba(100,116,139,0.3); padding-bottom: 8px;">
        Express k in days² km⁻³ and find the Moon's period.
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: 700; color: #a78bfa; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Given</div>
        <div style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15); border-radius: 8px; padding: 8px 10px; font-size: 11px;">
          k = 10<sup>−13</sup> s² m<sup>−3</sup><br>
          R<sub>moon</sub> = 3.84 × 10<sup>5</sup> km
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: 700; color: #34d399; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Step 1 — Convert k</div>
        <div style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; color: #cbd5e1;">
          1 day = 86400 s &nbsp;⟹&nbsp; 1 s² = (1/86400)² day²<br>
          1 km = 10³ m &nbsp;⟹&nbsp; 1 m⁻³ = 10⁹ km⁻³<br><br>
          <span style="color: #10b981; font-weight: 600;">
            k = 10<sup>−13</sup> × (86400)² × 10<sup>9</sup><br>
            &nbsp;&nbsp;= 10<sup>−13</sup> × 7.46 × 10<sup>9</sup> × 10<sup>9</sup><br>
            &nbsp;&nbsp;≈ 1.33 × 10<sup>−14</sup> day² km<sup>−3</sup>
          </span>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="font-weight: 700; color: #facc15; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Step 2 — Compute T</div>
        <div style="background: rgba(250,204,21,0.06); border: 1px solid rgba(250,204,21,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; color: #cbd5e1;">
          T² = k × R³<br>
          &nbsp;&nbsp;= 1.33 × 10<sup>−14</sup> × (3.84 × 10<sup>5</sup>)³<br>
          &nbsp;&nbsp;= 1.33 × 10<sup>−14</sup> × 5.66 × 10<sup>16</sup><br>
          <span style="color: #fbbf24; font-weight: 600;">
            T² ≈ 753.08<br>
            T ≈ 27.4 days
          </span>
        </div>
      </div>

      <div>
        <div style="font-weight: 700; color: #60a5fa; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">Final Answer</div>
        <div style="background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 8px; padding: 10px; text-align: center;">
          <span style="font-size: 16px; font-weight: 800; color: #60a5fa;">T ≈ 27.3 days</span><br>
          <span style="font-size: 9px; color: #94a3b8; margin-top: 2px; display: inline-block;">
            Matches the observed sidereal month!
          </span>
        </div>
      </div>

      <div id="example77-sim-time" style="margin-top: 10px; text-align: center; font-size: 9px; color: #475569;">
        Simulation running…
      </div>
    `;

    canvasWrap.appendChild(overlay);

    document.getElementById('close-ex77-overlay')?.addEventListener('click', () => {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    });

    // ── 5. Orbital period tracking ───────────────────────────────────────
    // Track the Moon's angular position to measure simulated orbital period
    let lastAngle = -Math.PI / 2; // starts directly above Earth
    let totalAngle = 0;
    let stepCount = 0;
    let orbitCount = 0;

    const simTimeEl = document.getElementById('example77-sim-time');

    runtime.addHook({
      id: 'example7_7-orbit-tracker',
      beforeStep: () => {
        const moonObj = store.getObject('example-moon');
        if (!moonObj) return;

        const dx = moonObj.body.position.x - EARTH_CENTER_X;
        const dy = moonObj.body.position.y - EARTH_CENTER_Y;
        const currentAngle = Math.atan2(dy, dx);

        let delta = currentAngle - lastAngle;
        // Normalize delta to [-PI, PI]
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;

        totalAngle += Math.abs(delta);
        lastAngle = currentAngle;
        stepCount++;

        const completedOrbits = Math.floor(totalAngle / (2 * Math.PI));
        if (completedOrbits > orbitCount) {
          orbitCount = completedOrbits;
        }

        // Update overlay every 60 steps
        if (stepCount % 60 === 0 && simTimeEl) {
          const orbProgress = ((totalAngle % (2 * Math.PI)) / (2 * Math.PI) * 100).toFixed(1);
          simTimeEl.innerHTML = `🌑 Orbits completed: <b style="color:#818cf8">${orbitCount}</b> &nbsp;|&nbsp; Current orbit: <b style="color:#a78bfa">${orbProgress}%</b>`;
        }
      }
    });

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      runtime.removeHook('example7_7-label-tracker');
      runtime.removeHook('example7_7-orbit-tracker');
      const el = document.getElementById('example-energy-overlay');
      if (el) el.remove();
    };
  }
};
