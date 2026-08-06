import * as PIXI from 'pixi.js';
import type { SandboxExampleConfig } from '../types/example.types';

/**
 * ─── NCERT Example 7.5 ───────────────────────────────────────────────────────
 * The planet Mars has two moons, Phobos and Deimos.
 *
 * (i) Phobos has a period of 7 hours, 39 minutes and an orbital radius
 *     of 9.4 × 10³ km. Calculate the mass of Mars.
 *
 * (ii) Assume Earth and Mars move in circular orbits around the Sun,
 *      with the Martian orbit being 1.52 times the orbital radius of Earth.
 *      What is the length of the Martian year in days?
 * ──────────────────────────────────────────────────────────────────────────────
 */

const MARS_CENTER_X = 400;
const MARS_CENTER_Y = 300;
const PHOBOS_ORBIT_RADIUS_PX = 140;

/** Shared close-button style injected once */
const CLOSE_BTN_STYLE = `
  position: absolute; top: 10px; right: 10px;
  width: 24px; height: 24px; border-radius: 6px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; font-size: 14px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
`;

function makeOverlayBase(id: string): HTMLDivElement {
  const el = document.createElement('div');
  el.id = id;
  el.style.cssText = `
    position: absolute; top: 16px; right: 16px;
    background: rgba(15,23,42,0.9); backdrop-filter: blur(10px);
    border: 1px solid rgba(248,113,113,0.3); border-radius: 14px;
    padding: 16px 18px; color: #e2e8f0;
    font-family: Inter, system-ui, sans-serif; font-size: 11px; line-height: 1.6;
    width: 320px; z-index: 1000;
    box-shadow: 0 12px 30px -6px rgba(0,0,0,0.6);
    max-height: 80vh; overflow-y: auto;
  `;
  return el;
}

export const example7_5: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-5',
    title: "7.5 Mars, Phobos & the Martian Year",
    description:
      "Demonstrates Kepler's Third Law in two parts: (i) Computing the mass of Mars from Phobos's orbital data, and (ii) Finding the length of the Martian year using the Earth–Mars orbital radius ratio.",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "Kepler's Third Law relates orbital period and radius: T² = (4π²/GM) R³.",
      'Part (i): From T and R of Phobos, we can solve for M_Mars = 4π²R³ / (GT²) ≈ 6.48 × 10²³ kg.',
      'Part (ii): For two bodies orbiting the same central mass, T₁/T₂ = (R₁/R₂)^(3/2). With R_Mars = 1.52 R_Earth, the Martian year ≈ 684 days.',
      'Phobos is the larger and closer of Mars\'s two moons, completing an orbit in just ~7.65 hours — faster than Mars rotates!'
    ]
  },

  objects: [
    {
      assetId: 'mars',
      id: 'example-mars',
      x: MARS_CENTER_X,
      y: MARS_CENTER_Y,
      isStatic: true,
      mass: 5000,
      radius: 32
    },
    {
      assetId: 'moon',
      id: 'example-phobos',
      x: MARS_CENTER_X + PHOBOS_ORBIT_RADIUS_PX,
      y: MARS_CENTER_Y,
      orbitCenterId: 'example-mars',
      orbitType: 'circular',
      clockwise: true,
      mass: 3,
      radius: 8,
      customData: { density: 0.001 }
    }
  ],

  observables: [
    { objectId: 'example-phobos', types: ['velocity'], label: 'Phobos', color: 0xa3a3a3 }
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
  camera: { zoom: 0.85, centerX: MARS_CENTER_X, centerY: MARS_CENTER_Y },

  customSetup: async (runtime, store, controller, observables) => {
    const vp = runtime.renderer.getViewport();

    // ── 1. Draw orbit guide ─────────────────────────────────────────────
    const orbitGuide = new PIXI.Graphics();
    orbitGuide.name = 'example7_5-orbit-guide';
    vp.addChild(orbitGuide);
    orbitGuide.circle(MARS_CENTER_X, MARS_CENTER_Y, PHOBOS_ORBIT_RADIUS_PX);
    orbitGuide.stroke({ color: 0xf87171, width: 1.2, alpha: 0.25 });

    // ── 2. Canvas annotations ───────────────────────────────────────────
    const annotations = new PIXI.Container();
    annotations.name = 'example7_5-annotations';
    vp.addChild(annotations);

    const marsLabel = new PIXI.Text('Mars (Central Body)', new PIXI.TextStyle({
      fill: '#f87171', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'bold',
    }));
    marsLabel.anchor.set(0.5, -1.8);
    marsLabel.position.set(MARS_CENTER_X, MARS_CENTER_Y);
    annotations.addChild(marsLabel);

    const radiusLine = new PIXI.Graphics();
    annotations.addChild(radiusLine);
    radiusLine.moveTo(MARS_CENTER_X, MARS_CENTER_Y);
    radiusLine.lineTo(MARS_CENTER_X + PHOBOS_ORBIT_RADIUS_PX, MARS_CENTER_Y);
    radiusLine.stroke({ color: 0xfbbf24, width: 1, alpha: 0.5 });

    const distText = new PIXI.Text('R = 9.4 × 10³ km', new PIXI.TextStyle({
      fill: '#fbbf24', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'bold',
    }));
    distText.anchor.set(0.5, 1.8);
    distText.position.set(MARS_CENTER_X + PHOBOS_ORBIT_RADIUS_PX / 2, MARS_CENTER_Y);
    annotations.addChild(distText);

    const phobosLabel = new PIXI.Text('Phobos (T = 7h 39m)', new PIXI.TextStyle({
      fill: '#d4d4d4', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'bold',
    }));
    phobosLabel.anchor.set(0.5, 2.2);
    annotations.addChild(phobosLabel);

    // ── 3. Inset diagram for Part (ii) ──────────────────────────────────
    const INSET_X = 120, INSET_Y = 520, EARTH_R = 40, MARS_R = EARTH_R * 1.52;
    const insetContainer = new PIXI.Container();
    insetContainer.name = 'example7_5-inset';
    vp.addChild(insetContainer);

    const insetGfx = new PIXI.Graphics();
    insetContainer.addChild(insetGfx);
    insetGfx.circle(INSET_X, INSET_Y, 8);
    insetGfx.fill({ color: 0xfbbf24, alpha: 0.9 });
    insetGfx.circle(INSET_X, INSET_Y, EARTH_R);
    insetGfx.stroke({ color: 0x60a5fa, width: 1, alpha: 0.4 });
    insetGfx.circle(INSET_X + EARTH_R, INSET_Y, 4);
    insetGfx.fill({ color: 0x60a5fa, alpha: 0.9 });
    insetGfx.circle(INSET_X, INSET_Y, MARS_R);
    insetGfx.stroke({ color: 0xf87171, width: 1, alpha: 0.4 });
    insetGfx.circle(INSET_X + MARS_R, INSET_Y, 4);
    insetGfx.fill({ color: 0xf87171, alpha: 0.9 });

    const mkStyle = (fill: string, size: number) => new PIXI.TextStyle({
      fill, fontSize: size, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 'bold',
    });

    const insetTitle = new PIXI.Text('Part (ii): Sun – Earth – Mars', mkStyle('#94a3b8', 9));
    insetTitle.anchor.set(0.5, 0);
    insetTitle.position.set(INSET_X, INSET_Y - MARS_R - 18);
    insetContainer.addChild(insetTitle);

    const earthInsetLabel = new PIXI.Text('Earth (R_E)', mkStyle('#60a5fa', 8));
    earthInsetLabel.anchor.set(0, 1.5);
    earthInsetLabel.position.set(INSET_X + EARTH_R + 5, INSET_Y);
    insetContainer.addChild(earthInsetLabel);

    const marsInsetLabel = new PIXI.Text('Mars (1.52 R_E)', mkStyle('#f87171', 8));
    marsInsetLabel.anchor.set(0, 1.5);
    marsInsetLabel.position.set(INSET_X + MARS_R + 5, INSET_Y);
    insetContainer.addChild(marsInsetLabel);

    const resultLabel = new PIXI.Text('T_Mars ≈ 684 days', mkStyle('#fbbf24', 9));
    resultLabel.anchor.set(0.5, 0);
    resultLabel.position.set(INSET_X, INSET_Y + MARS_R + 12);
    insetContainer.addChild(resultLabel);

    // ── 4. Phobos tracking hook ─────────────────────────────────────────
    runtime.addHook({
      id: 'example7_5-label-tracker',
      beforeStep: () => {
        const p = store.getObject('example-phobos');
        if (p) phobosLabel.position.set(p.body.position.x, p.body.position.y);
      }
    });

    // ── 5. HTML Overlays — TWO separate panels ──────────────────────────
    const canvasWrap = runtime.renderer.getApp().canvas.parentElement;
    if (!canvasWrap) return;

    // Clean any existing overlays
    ['example-burn-overlay', 'example-energy-overlay', 'example-part2-overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // ═══════════════════════════════════════════════════════════════════
    // PANEL 1 — Part (i): Mass of Mars
    // ═══════════════════════════════════════════════════════════════════
    const panel1 = makeOverlayBase('example-energy-overlay');
    panel1.innerHTML = `
      <button id="close-panel1" style="${CLOSE_BTN_STYLE}" title="Close">✕</button>
      <div style="font-weight: 800; margin-bottom: 8px; color: #fbbf24; font-size: 14px; padding-right: 28px;">
        🔴 Part (i) — Mass of Mars
      </div>
      <div style="color: #94a3b8; font-size: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(100,116,139,0.3); padding-bottom: 8px;">
        From Phobos's orbital data, calculate M<sub>Mars</sub>.
      </div>

      <div style="background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; margin-bottom: 8px;">
        <span style="color: #94a3b8;">Given:</span><br>
        T<sub>Phobos</sub> = 7 h 39 min = 27540 s<br>
        R<sub>Phobos</sub> = 9.4 × 10<sup>3</sup> km = 9.4 × 10<sup>6</sup> m<br>
        G = 6.67 × 10<sup>−11</sup> N m² kg<sup>−2</sup>
      </div>

      <div style="background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; margin-bottom: 8px;">
        <span style="color: #94a3b8;">Formula:</span> T² = (4π²/GM) R³<br>
        ⟹ <b>M = 4π² R³ / (G T²)</b>
      </div>

      <div style="background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px;">
        <span style="color: #94a3b8;">Calculation:</span><br>
        M = 4 × (3.14)² × (9.4 × 10<sup>6</sup>)³ / (6.67 × 10<sup>−11</sup> × (27540)²)<br>
        M = 4 × 9.87 × 8.30 × 10<sup>20</sup> / (6.67 × 10<sup>−11</sup> × 7.58 × 10<sup>8</sup>)<br>
        M = 3.277 × 10<sup>22</sup> / 5.059 × 10<sup>−2</sup><br><br>
        <div style="text-align: center; padding: 6px; background: rgba(251,191,36,0.1); border-radius: 6px;">
          <span style="color: #fbbf24; font-weight: 800; font-size: 14px;">
            M<sub>Mars</sub> ≈ 6.48 × 10<sup>23</sup> kg
          </span>
        </div>
      </div>

      <div id="example75-sim-time" style="margin-top: 10px; text-align: center; font-size: 9px; color: #475569;">
        Simulation running…
      </div>
    `;
    canvasWrap.appendChild(panel1);

    document.getElementById('close-panel1')?.addEventListener('click', () => {
      panel1.style.display = panel1.style.display === 'none' ? 'block' : 'none';
    });

    // ═══════════════════════════════════════════════════════════════════
    // PANEL 2 — Part (ii): Length of Martian Year
    // ═══════════════════════════════════════════════════════════════════
    const panel2 = makeOverlayBase('example-part2-overlay');
    panel2.style.top = 'auto';
    panel2.style.bottom = '16px';
    panel2.style.right = '16px';
    panel2.style.border = '1px solid rgba(96,165,250,0.3)';
    panel2.innerHTML = `
      <button id="close-panel2" style="${CLOSE_BTN_STYLE}" title="Close">✕</button>
      <div style="font-weight: 800; margin-bottom: 8px; color: #60a5fa; font-size: 14px; padding-right: 28px;">
        🌍 Part (ii) — Martian Year
      </div>
      <div style="color: #94a3b8; font-size: 10px; margin-bottom: 10px; border-bottom: 1px solid rgba(100,116,139,0.3); padding-bottom: 8px;">
        Earth & Mars orbit the Sun. Find the Martian year.
      </div>

      <div style="background: rgba(96,165,250,0.06); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; margin-bottom: 8px;">
        <span style="color: #94a3b8;">Given:</span><br>
        R<sub>Mars</sub> = 1.52 × R<sub>Earth</sub><br>
        T<sub>Earth</sub> = 365 days
      </div>

      <div style="background: rgba(96,165,250,0.06); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px; margin-bottom: 8px;">
        <span style="color: #94a3b8;">Kepler's Third Law:</span><br>
        (T<sub>M</sub> / T<sub>E</sub>)² = (R<sub>M</sub> / R<sub>E</sub>)³<br>
        T<sub>M</sub> = T<sub>E</sub> × (R<sub>M</sub> / R<sub>E</sub>)<sup>3/2</sup>
      </div>

      <div style="background: rgba(96,165,250,0.06); border: 1px solid rgba(96,165,250,0.15); border-radius: 8px; padding: 8px 10px; font-size: 10px;">
        <span style="color: #94a3b8;">Calculation:</span><br>
        T<sub>M</sub> = 365 × (1.52)<sup>3/2</sup><br>
        T<sub>M</sub> = 365 × √(1.52³) = 365 × √(3.512)<br>
        T<sub>M</sub> = 365 × 1.874<br><br>
        <div style="text-align: center; padding: 6px; background: rgba(96,165,250,0.1); border-radius: 6px;">
          <span style="color: #60a5fa; font-weight: 800; font-size: 14px;">
            T<sub>Mars</sub> ≈ 684 days
          </span>
        </div>
      </div>
    `;
    canvasWrap.appendChild(panel2);

    document.getElementById('close-panel2')?.addEventListener('click', () => {
      panel2.style.display = panel2.style.display === 'none' ? 'block' : 'none';
    });

    // ── 6. Orbit tracking ───────────────────────────────────────────────
    let lastAngle = 0, totalAngle = 0, stepCount = 0, orbitCount = 0;
    const simTimeEl = document.getElementById('example75-sim-time');

    runtime.addHook({
      id: 'example7_5-orbit-tracker',
      beforeStep: () => {
        const p = store.getObject('example-phobos');
        if (!p) return;
        const dx = p.body.position.x - MARS_CENTER_X;
        const dy = p.body.position.y - MARS_CENTER_Y;
        const cur = Math.atan2(dy, dx);
        let delta = cur - lastAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        totalAngle += Math.abs(delta);
        lastAngle = cur;
        stepCount++;
        const completed = Math.floor(totalAngle / (2 * Math.PI));
        if (completed > orbitCount) orbitCount = completed;
        if (stepCount % 60 === 0 && simTimeEl) {
          const pct = ((totalAngle % (2 * Math.PI)) / (2 * Math.PI) * 100).toFixed(1);
          simTimeEl.innerHTML = `🔴 Phobos orbits: <b style="color:#f87171">${orbitCount}</b> &nbsp;|&nbsp; Current: <b style="color:#fbbf24">${pct}%</b>`;
        }
      }
    });

    return () => {
      runtime.removeHook('example7_5-label-tracker');
      runtime.removeHook('example7_5-orbit-tracker');
      document.getElementById('example-energy-overlay')?.remove();
      document.getElementById('example-part2-overlay')?.remove();
    };
  }
};
