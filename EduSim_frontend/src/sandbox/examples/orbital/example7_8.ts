import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { SandboxExampleConfig } from '../types/example.types';

export const example7_8: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-8',
    title: '7.8 Orbital Energy Conservation',
    description: "Demonstrates energy conservation in orbit. Track the exchange between kinetic energy (K) and potential energy (U) while the total mechanical energy (E) remains constant.",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "Total Mechanical Energy (E) is the sum of Kinetic Energy (K) and Gravitational Potential Energy (U): E = K + U.",
      "As the satellite falls closer to the Sun, potential energy decreases (becomes more negative) and kinetic energy increases (speed increases).",
      "During climb-out, kinetic energy is converted back into potential energy. Total energy remains perfectly constant throughout!"
    ]
  },
  objects: [
    {
      assetId: 'sun',
      id: 'example-sun',
      x: 400,
      y: 300,
      isStatic: true,
      mass: 8000,
      radius: 50
    },
    {
      assetId: 'satellite',
      id: 'example-sat',
      x: 400,
      y: 150, // altitude = 150 px
      orbitCenterId: 'example-sun',
      orbitType: 'elliptical',
      eccentricity: 0.45,
      clockwise: true,
      mass: 12,
      radius: 12
    }
  ],
  observables: [
    {
      objectId: 'example-sat',
      types: ['velocity'],
      label: 'Energy Satellite',
      color: 0x818cf8
    }
  ],
  overlays: {
    showOrbitPath: true,
    showVelocityVectors: true,
    showForceVectors: true,
    showInfluenceRadius: false,
    showOrbitalTrail: true
  },
  gConstant: 0.0012,
  gravityMode: 'radial',
  camera: {
    zoom: 0.95,
    centerX: 400,
    centerY: 300
  },
  customSetup: async (runtime, store, controller, observables) => {
    // 1. Inject live HTML Energy HUD overlay!
    const canvasWrap = runtime.renderer.getApp().canvas.parentElement;
    if (!canvasWrap) return;

    // Clean up any existing overlay first
    const existing = document.getElementById('example-energy-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'example-energy-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '16px';
    overlay.style.right = '16px';
    overlay.style.background = 'rgba(15, 23, 42, 0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.border = '1px solid rgba(99, 102, 241, 0.3)';
    overlay.style.borderRadius = '12px';
    overlay.style.padding = '14px';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'Inter, sans-serif';
    overlay.style.fontSize = '12px';
    overlay.style.width = '260px';
    overlay.style.zIndex = '1000';
    overlay.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';

    overlay.innerHTML = `
      <button id="close-ex78-overlay" style="position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" title="Close">✕</button>
      <div style="font-weight: bold; margin-bottom: 6px; color: #60a5fa; font-size: 13px; padding-right: 28px;">📊 Live Energy Telemetry</div>
      <div style="margin-bottom: 12px; color: #94a3b8; font-size: 10.5px; line-height: 1.4;">
        Observe how Kinetic and Potential energy exchange values while the Total Energy stays conserved.
      </div>
      
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
          <span style="color: #4ade80; font-weight: 600;">Kinetic Energy (K)</span>
          <span id="k-val" style="font-family: monospace;">0.00 J</span>
        </div>
        <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="k-bar" style="background: #4ade80; width: 0%; height: 100%; transition: width 0.05s ease;"></div>
        </div>
      </div>

      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
          <span style="color: #f87171; font-weight: 600;">Potential Energy (U)</span>
          <span id="u-val" style="font-family: monospace;">0.00 J</span>
        </div>
        <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden; position: relative;">
          <!-- Potential is negative, we fill from right to left to represent negative depth -->
          <div id="u-bar" style="background: #f87171; width: 0%; height: 100%; position: absolute; right: 0; transition: width 0.05s ease;"></div>
        </div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
          <span style="color: #60a5fa; font-weight: bold;">Total Energy (E = K + U)</span>
          <span id="e-val" style="font-family: monospace; font-weight: bold;">0.00 J</span>
        </div>
        <div style="background: #1e293b; height: 8px; border-radius: 4px; overflow: hidden; position: relative;">
          <div id="e-bar" style="background: #60a5fa; width: 0%; height: 100%; transition: width 0.05s ease;"></div>
        </div>
      </div>
    `;

    canvasWrap.appendChild(overlay);

    document.getElementById('close-ex78-overlay')?.addEventListener('click', () => {
      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
    });

    const kVal = document.getElementById('k-val');
    const kBar = document.getElementById('k-bar');
    const uVal = document.getElementById('u-val');
    const uBar = document.getElementById('u-bar');
    const eVal = document.getElementById('e-val');
    const eBar = document.getElementById('e-bar');

    // Run telemetry computation in update loop
    runtime.addHook({
      id: 'example7_8-energy-hook',
      beforeStep: () => {
        const sun = store.getObject('example-sun');
        const sat = store.getObject('example-sat');

        if (!sun || !sat || !kVal || !kBar || !uVal || !uBar || !eVal || !eBar) return;

        const G = runtime.gravitySystem.getRadialGravity().getConfig().gravitationalConstant ?? 0.0012;
        const M = sun.body.mass;
        const m = sat.body.mass;

        const dx = sat.body.position.x - sun.body.position.x;
        const dy = sat.body.position.y - sun.body.position.y;
        const r = Math.hypot(dx, dy);

        // Kinetic Energy K = 0.5 * m * v^2
        const vx = sat.body.velocity.x;
        const vy = sat.body.velocity.y;
        const speedSq = vx * vx + vy * vy;
        const K = 0.5 * m * speedSq * 1000; // Scaled to look realistic

        // Potential Energy U = -G*M*m / r
        const U = -(G * M * m / r) * 1000; // Same scaling coefficient

        // Total Mechanical Energy
        const E = K + U;

        // Dynamic limits for bar graph displays
        const maxK = 1800;
        const maxU = 2200; // negative depth

        const kPercent = Math.min(100, Math.max(0, (K / maxK) * 100));
        const uPercent = Math.min(100, Math.max(0, (Math.abs(U) / maxU) * 100));
        const ePercent = Math.min(100, Math.max(0, (Math.abs(E) / maxU) * 100));

        kVal.innerText = `${K.toFixed(1)} J`;
        kBar.style.width = `${kPercent}%`;

        uVal.innerText = `${U.toFixed(1)} J`;
        uBar.style.width = `${uPercent}%`;

        eVal.innerText = `${E.toFixed(1)} J`;
        eBar.style.width = `${ePercent}%`;
      }
    });

    return () => {
      runtime.removeHook('example7_8-energy-hook');
    };
  }
};
