import * as Matter from 'matter-js';
import { assetsRegistry } from '../../../config/assetsRegistry';
import { createObject } from '../../objects/objectFactory';
import { OrbitSpawner } from '../../orbits/orbitSpawner';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { physicsEventBus } from '../../../ai/physicsEventBus';
import type { SandboxRuntime } from '../../engine/runtime';
import type { RuntimeStore } from '../../state/runtimeStore';
import type { PropertyController } from '../../properties/propertyController';
import type { ObservableEngine } from '../../observables/observableEngine';
import type { SandboxExampleConfig } from '../types/example.types';

/**
 * findAssetById
 * Searches all categories in the assetsRegistry for the matching asset definition.
 */
function findAssetById(assetId: string) {
  for (const category of Object.keys(assetsRegistry)) {
    const list = assetsRegistry[category];
    const asset = list.find((a) => a.id === assetId);
    if (asset) return asset;
  }
  return null;
}

/**
 * loadExample
 * Core engine loader that safely tears down previous sandbox simulations
 * and initializes textbook examples deterministically.
 */
export async function loadExample(
  runtime: SandboxRuntime,
  store: RuntimeStore,
  controller: PropertyController,
  observables: ObservableEngine,
  selection: any,
  config: SandboxExampleConfig
): Promise<void> {
  if (!runtime || !store || !controller || !observables || !selection) {
    console.warn('[ExampleLoader] Missing required engine reference arguments.');
    return;
  }

  console.log(`[ExampleLoader] Loading textbook example: ${config.metadata.title}`);

  // ── 1. Safe Reset Lifecycle ───────────────────────────────────────────────
  runtime.pause();
  store.reset();
  runtime.physics.clear(false); // Clears all Matter bodies
  runtime.sync.clear();
  observables.clearObservables();

  if (runtime.gravitySystem) {
    runtime.gravitySystem.getRadialGravity().clear();
  }

  // Clear visual Pixi viewport elements (excluding overlays)
  const vp = runtime.renderer.getViewport();
  for (let i = vp.children.length - 1; i >= 0; i--) {
    const child = vp.children[i];
    const meta = child as {
      _isConstraintOverlay?: boolean;
      _isObservableOverlay?: boolean;
      _isGravityOverlay?: boolean;
    };
    if (meta._isConstraintOverlay || meta._isObservableOverlay || meta._isGravityOverlay) {
      continue;
    }
    vp.removeChildAt(i);
  }

  // Reset camera view to standard center
  vp.position.set(0, 0);
  vp.scale.set(1, 1);

  // ── 2. Configure Physics Constants & Gravity Mode ────────────────────────
  const mode = config.gravityMode ?? 'radial';
  runtime.gravitySystem.setMode(mode);

  if (mode === 'radial' && runtime.gravitySystem.getRadialGravity()) {
    const gVal = config.gConstant ?? 0.0012;
    runtime.gravitySystem.getRadialGravity().setConfig({
      gravitationalConstant: gVal,
      debug: config.overlays.showOrbitPath || config.overlays.showInfluenceRadius || config.overlays.showGravityVectors,
    });
  }

  // Set camera overrides if specified
  if (config.camera) {
    if (config.camera.zoom !== undefined) {
      vp.scale.set(config.camera.zoom);
    }
    if (config.camera.centerX !== undefined && config.camera.centerY !== undefined) {
      const W = runtime.renderer.getApp().canvas.width || 800;
      const H = runtime.renderer.getApp().canvas.height || 600;
      vp.position.set(
        W / 2 - config.camera.centerX * vp.scale.x,
        H / 2 - config.camera.centerY * vp.scale.y
      );
    }
  }

  // ── 3. Spawn Entities (Deterministically: Stars First, then Satellites) ──
  const staticObjects = config.objects.filter((obj) => obj.isStatic || !obj.orbitCenterId);
  const orbitingObjects = config.objects.filter((obj) => !obj.isStatic && obj.orbitCenterId);

  const spawnEntity = async (objCfg: typeof config.objects[0]) => {
    const asset = findAssetById(objCfg.assetId);
    if (!asset) {
      console.warn(`[ExampleLoader] Could not find asset definition for ID: ${objCfg.assetId}`);
      return null;
    }

    const { spawnType, spawnConfig } = asset;
    const isCelestial = !!asset.celestialConfig;

    const baseConfig: any = {
      id: objCfg.id,
      type: spawnType,
      x: objCfg.x,
      y: objCfg.y,
      restitution: spawnConfig.restitution ?? 0.5,
      friction: spawnConfig.friction ?? 0.3,
      density: objCfg.customData?.density ?? spawnConfig.density ?? 0.002,
      fillColor: spawnConfig.fillColor,
      strokeColor: spawnConfig.strokeColor,
      strokeWidth: 2,
      isStatic: objCfg.isStatic ?? spawnConfig.isStatic ?? false,
      texture: asset.texture,
      frictionAir: isCelestial ? 0 : ((spawnConfig as any).frictionAir ?? 0.01),
    };

    if (spawnType === 'circle') {
      baseConfig.radius = objCfg.radius ?? spawnConfig.radius ?? 20;
    } else {
      baseConfig.width = spawnConfig.width ?? 40;
      baseConfig.height = spawnConfig.height ?? 40;
      baseConfig.cornerRadius = spawnConfig.cornerRadius ?? 6;
    }

    const runtimeObj = createObject(baseConfig);

    // Apply manual initial velocity if specified
    if (objCfg.vx !== undefined || objCfg.vy !== undefined) {
      Matter.Body.setVelocity(runtimeObj.body, { x: objCfg.vx ?? 0, y: objCfg.vy ?? 0 });
    }

    // Add to Pixi, Matter, and Sync
    vp.addChild(runtimeObj.display);
    runtime.physics.addBodies(runtimeObj.body);
    runtime.sync.register(runtimeObj.id, runtimeObj.body, runtimeObj.display);
    store.addObject(runtimeObj);

    // Allow property panel and interaction selection for example objects
    selection.register(runtimeObj);

    // Setup physical constants and registry attributes
    if (isCelestial && asset.celestialConfig) {
      const celCfg = asset.celestialConfig;
      const mass = objCfg.mass ?? celCfg.mass ?? runtimeObj.body.mass;

      const customData = {
        mass: mass,
        celestialConfig: celCfg,
        celestialComponent: true,
        orbitalComponent: true,
        gravityComponent: true,
        observableMetadata: { label: asset.name },
        runtimeCategory: celCfg.type,
        parentGravitySource: objCfg.orbitCenterId ?? null,
        ...objCfg.customData,
      };

      (runtimeObj.body as any).customData = customData;
      runtimeObj.body.label = asset.name;
      (runtimeObj as any).metadata = {
        ...runtimeObj.metadata,
        ...customData,
        educationalTags: ['celestial', 'orbital', celCfg.type ?? ''],
      };

      // Ensure mass is assigned properly in customData for effective mass equations
      (runtimeObj.body as any).customData.mass = mass;

      // Register Gravity Source
      if (celCfg.isGravitySource) {
        runtime.gravitySystem.getRadialGravity().addGravitySource({
          id: runtimeObj.id,
          mass: mass,
          position: { x: objCfg.x, y: objCfg.y },
          influenceRadius: celCfg.influenceRadius ?? (baseConfig.radius ? baseConfig.radius * 20 : 1500),
          enabled: true,
          metadata: {
            isStar: celCfg.type === 'star',
            isPlanet: celCfg.type === 'planet',
            isMoon: celCfg.type === 'moon',
            gravityStrength: celCfg.gravityStrength ?? 1.0,
          },
        });
      }

      // Register Gravity Body
      if (celCfg.affectedByGravity) {
        runtime.gravitySystem.getRadialGravity().addGravityBody({
          id: runtimeObj.id,
          body: runtimeObj.body,
          mass: mass,
          affectedByGravity: true,
          ignoreGravity: false,
        });
      }
    }

    return runtimeObj;
  };

  // 1. Spawn static anchor nodes (Suns, Stars, fixed masses)
  for (const obj of staticObjects) {
    await spawnEntity(obj);
  }

  // 2. Spawn orbiting objects and solve for orbital mechanics
  for (const obj of orbitingObjects) {
    const orbitingObj = await spawnEntity(obj);
    if (!orbitingObj) continue;

    const centerObj = store.getObject(obj.orbitCenterId!);
    if (centerObj) {
      const G = runtime.gravitySystem.getRadialGravity().getConfig().gravitationalConstant;
      const softening = runtime.gravitySystem.getRadialGravity().getConfig().softeningFactor ?? 100;

      const r = obj.radius !== undefined ? undefined : OrbitUtils.calculateDistance(centerObj.body.position, orbitingObj.body.position);
      const angle = Math.atan2(
        orbitingObj.body.position.y - centerObj.body.position.y,
        orbitingObj.body.position.x - centerObj.body.position.x
      );

      const spawnOpts = {
        centerBody: centerObj.body,
        orbitingBody: orbitingObj.body,
        radius: r,
        angle: angle,
        clockwise: obj.clockwise ?? true,
        eccentricity: obj.eccentricity ?? 0,
        initialVelocityMultiplier: obj.initialVelocityMultiplier ?? 1.0,
      };

      if (obj.orbitType === 'elliptical') {
        OrbitSpawner.spawnEllipticalOrbit(spawnOpts, G);
      } else {
        OrbitSpawner.spawnCircularOrbit(spawnOpts, G, softening);
      }

      // Link child to parent inside customData
      if ((orbitingObj.body as any).customData) {
        (orbitingObj.body as any).customData.parentGravitySource = centerObj.id;
      }
    }
  }

  // ── 4. Activate Observables Telemetry HUDs ────────────────────────────────
  for (const obs of config.observables) {
    observables.registerObservable({
      objectId: obs.objectId,
      types: obs.types as any,
      label: obs.label,
      color: obs.color,
    });
  }

  // ── 5. Run Textbook-Specific Orchestration Hook ──────────────────────────
  if (config.customSetup) {
    await config.customSetup(runtime, store, controller, observables);
  }

  // ── 6. Start Simulation Loop ──────────────────────────────────────────────
  runtime.start();
  store.setRuntimeState('running');

  // Emit event to notify explanation cards and analytics HUDs of example launch
  physicsEventBus.emit({
    type: 'OBJECT_SPAWNED',
    objectId: config.metadata.id,
    metadata: {
      isExample: true,
      exampleId: config.metadata.id,
      title: config.metadata.title,
    },
  });
}
