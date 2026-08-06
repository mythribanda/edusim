import * as PIXI from 'pixi.js';
import type { SandboxExampleConfig } from '../types/example.types';

export const example7_1: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-1',
    title: '7.1 Keplerian Elliptical Orbit',
    description: "Demonstrates Kepler's First and Second Laws. Observe how planetary velocity varies dramatically, reaching maximum velocity at perihelion (closest approach) and minimum velocity at aphelion (farthest point).",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "Kepler's First Law states that all planets move in elliptical orbits with the Sun at one focus.",
      "Kepler's Second Law (Equal Areas in Equal Time) dictates that planets sweep out equal areas in equal intervals. Consequently, orbital speed is highest at perihelion and lowest at aphelion.",
      "Observe the velocity vector (blue arrow) swell as it swings close to the Sun, and shrink as it climbs out to the far peak."
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
      assetId: 'earth',
      id: 'example-earth',
      x: 400,
      y: 130, // 170 px above the Sun (perihelion radius)
      orbitCenterId: 'example-sun',
      orbitType: 'elliptical',
      eccentricity: 0.5,
      clockwise: true,
      mass: 10,
      radius: 18
    }
  ],
  observables: [
    {
      objectId: 'example-earth',
      types: ['velocity', 'force'],
      label: 'Earth Orbit',
      color: 0x60a5fa
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
    // Spawn custom educational annotations directly onto the canvas!
    const vp = runtime.renderer.getViewport();
    const markers = new PIXI.Container();
    markers.name = 'example-annotations';
    vp.addChild(markers);

    const graphics = new PIXI.Graphics();
    markers.addChild(graphics);

    // 1. Perihelion Focus (Green glowing beacon at closest approach: Y = 300 - 170 = 130)
    graphics.circle(400, 130, 8);
    graphics.stroke({ color: 0x10b981, width: 2, alpha: 0.85 });
    graphics.fill({ color: 0x10b981, alpha: 0.2 });

    const pStyle = new PIXI.TextStyle({
      fill: '#10b981',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const pText = new PIXI.Text('PERIHELION (v_max = closest)', pStyle);
    pText.anchor.set(0.5, 1.3);
    pText.position.set(400, 130);
    markers.addChild(pText);

    // 2. Aphelion Focus (Amber glowing beacon at farthest approach:
    //    Distance = perihelion * (1 + e) / (1 - e) = 170 * (1.5 / 0.5) = 510 px
    //    Position = Sun Center (300) + 510 = 810)
    graphics.circle(400, 810, 8);
    graphics.stroke({ color: 0xf59e0b, width: 2, alpha: 0.85 });
    graphics.fill({ color: 0xf59e0b, alpha: 0.2 });

    const aStyle = new PIXI.TextStyle({
      fill: '#f59e0b',
      fontSize: 11,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const aText = new PIXI.Text('APHELION (v_min = farthest)', aStyle);
    aText.anchor.set(0.5, -0.6);
    aText.position.set(400, 810);
    markers.addChild(aText);

    // 3. Draw a light dashed elliptical orbital axis line (vertical major axis)
    graphics.moveTo(400, 130);
    graphics.lineTo(400, 810);
    graphics.stroke({ color: 0x475569, width: 1, alpha: 0.5 });

    // 4. Point B Focus (Purple glowing beacon on the left: X = 400 - 255 = 145, Y = 300)
    graphics.circle(145, 300, 7);
    graphics.stroke({ color: 0xa78bfa, width: 2, alpha: 0.85 });
    graphics.fill({ color: 0xa78bfa, alpha: 0.25 });

    const bStyle = new PIXI.TextStyle({
      fill: '#a78bfa',
      fontSize: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const bText = new PIXI.Text('POINT B', bStyle);
    bText.anchor.set(1.15, 0.5);
    bText.position.set(145, 300);
    markers.addChild(bText);

    // 5. Point C Focus (Purple glowing beacon on the right: X = 400 + 255 = 655, Y = 300)
    graphics.circle(655, 300, 7);
    graphics.stroke({ color: 0xa78bfa, width: 2, alpha: 0.85 });
    graphics.fill({ color: 0xa78bfa, alpha: 0.25 });

    const cStyle = new PIXI.TextStyle({
      fill: '#a78bfa',
      fontSize: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: 'bold',
    });
    const cText = new PIXI.Text('POINT C', cStyle);
    cText.anchor.set(-0.15, 0.5);
    cText.position.set(655, 300);
    markers.addChild(cText);

    // 6. Draw the horizontal latus rectum line through the Sun (focus) connecting B and C
    graphics.moveTo(145, 300);
    graphics.lineTo(655, 300);
    graphics.stroke({ color: 0x5b21b6, width: 1, alpha: 0.45 });
  }
};
