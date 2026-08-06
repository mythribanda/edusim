import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { SandboxExampleConfig } from '../types/example.types';

export const example7_6: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-6',
    title: '7.6 Geosynchronous Orbit (Sync)',
    description: "Demonstrates geosynchronous orbital synchronization. The satellite is placed at the exact altitude where its orbital period matches the Earth's rotational period.",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "A Geosynchronous Orbit has an orbital period equal to the Earth's rotational period (1 sidereal day).",
      "If the orbit is perfectly circular and in the equatorial plane, it is Geostationary — hovering permanently over a single spot.",
      "Observe the white sync beacon connecting the satellite to the tracking station on Earth's surface. They remain perfectly aligned as they rotate together!"
    ]
  },
  objects: [
    {
      assetId: 'earth',
      id: 'example-earth-body',
      x: 400,
      y: 300,
      isStatic: true,
      mass: 30000,
      radius: 48 // Large visible planet
    },
    {
      assetId: 'satellite',
      id: 'example-sat',
      x: 400,
      y: 140, // 160 px altitude (perfect geosynchronous altitude for this setup)
      orbitCenterId: 'example-earth-body',
      orbitType: 'circular',
      clockwise: true,
      mass: 8,
      radius: 12
    }
  ],
  observables: [
    {
      objectId: 'example-sat',
      types: ['velocity'],
      label: 'Satellite',
      color: 0xa7f3d0
    }
  ],
  overlays: {
    showOrbitPath: true,
    showVelocityVectors: false,
    showForceVectors: false,
    showInfluenceRadius: false,
    showOrbitalTrail: false
  },
  gConstant: 0.04, // High G for fast, clear synchronization
  gravityMode: 'radial',
  camera: {
    zoom: 1.1,
    centerX: 400,
    centerY: 300
  },
  customSetup: async (runtime, store, controller, observables) => {
    const vp = runtime.renderer.getViewport();
    const markers = new PIXI.Container();
    markers.name = 'example7_6-sync-visuals';
    vp.addChild(markers);

    const graphics = new PIXI.Graphics();
    markers.addChild(graphics);

    // Precise geosynchronous angular velocity matches orbital rate:
    // omega = sqrt(G*M / r^3) = sqrt(0.04 * 30000 / 160^3) = sqrt(1200 / 4096000) = 0.017116 rad/frame
    const syncOmega = 0.017116;

    // Apply rotation and draw sync line in update loop
    runtime.addHook({
      id: 'example7_6-sync-hook',
      beforeStep: () => {
        const earth = store.getObject('example-earth-body');
        const sat = store.getObject('example-sat');
        if (!earth || !sat) return;

        // Spin the Earth body at the exact synchronous rate
        Matter.Body.setAngle(earth.body, earth.body.angle + syncOmega);

        // Update graphics showing the lock beam
        graphics.clear();

        const earthPos = earth.body.position;
        const satPos = sat.body.position;

        // Calculate location of the tracking station on Earth surface based on its rotation
        const earthAngle = earth.body.angle;
        const stationX = earthPos.x + Math.cos(earthAngle - Math.PI / 2) * 48;
        const stationY = earthPos.y + Math.sin(earthAngle - Math.PI / 2) * 48;

        // 1. Draw glowing tracking station dot (green)
        graphics.circle(stationX, stationY, 4);
        graphics.stroke({ color: 0x10b981, width: 2, alpha: 0.95 });
        graphics.fill({ color: 0x10b981, alpha: 0.85 });

        // 2. Draw synchronous locking beam from station to satellite
        graphics.moveTo(stationX, stationY);
        graphics.lineTo(satPos.x, satPos.y);
        graphics.stroke({ color: 0xffffff, width: 1.5, alpha: 0.65 });

        // 3. Draw a dashed lock cone
        graphics.moveTo(earthPos.x, earthPos.y);
        graphics.lineTo(satPos.x, satPos.y);
        graphics.stroke({ color: 0x818cf8, width: 1, alpha: 0.15 });
      }
    });

    // Cleanup hook on unload
    return () => {
      runtime.removeHook('example7_6-sync-hook');
    };
  }
};
