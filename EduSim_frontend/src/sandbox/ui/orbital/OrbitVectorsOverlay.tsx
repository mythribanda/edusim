import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { OrbitUtils } from '../../orbits/orbitUtils';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface OrbitVectorsOverlayProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
  vectorConfig: {
    showOrbitPath: boolean;
    showGravityVectors: boolean;
    showInfluenceRadius: boolean;
    showVelocityVectors: boolean;
    showForceVectors: boolean;
    showOrbitalTrail: boolean;
  };
}

export const OrbitVectorsOverlay: React.FC<OrbitVectorsOverlayProps> = ({
  selectedObject,
  propertyController,
  vectorConfig,
}) => {
  const runtime = (propertyController as any).runtime;

  useEffect(() => {
    if (!runtime) return;

    // Create a dedicated graphics container for vectors
    const graphics = new PIXI.Graphics();
    graphics.zIndex = 110; // Draw on top of standard constraints and objects

    const viewport = runtime.renderer.getViewport();
    viewport.addChild(graphics);
    viewport.sortChildren();

    let frameId: number;

    const drawArrow = (
      g: PIXI.Graphics,
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: number,
      width = 2.5
    ) => {
      // Draw shaft
      g.moveTo(from.x, from.y);
      g.lineTo(to.x, to.y);
      g.stroke({ color, width, alpha: 0.95 });

      // Draw arrowhead
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 5) return;

      const angle = Math.atan2(dy, dx);
      const headLen = 10;

      g.moveTo(to.x, to.y);
      g.lineTo(
        to.x - headLen * Math.cos(angle - Math.PI / 6),
        to.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      g.lineTo(
        to.x - headLen * Math.cos(angle + Math.PI / 6),
        to.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      g.closePath();
      g.fill({ color, alpha: 0.95 });
    };

    const drawDashedLine = (
      g: PIXI.Graphics,
      from: { x: number; y: number },
      to: { x: number; y: number },
      color: number,
      width = 1.5,
      dashLen = 6,
      gapLen = 4
    ) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      const dirX = dx / len;
      const dirY = dy / len;

      let dist = 0;
      let drawing = true;

      while (dist < len) {
        const step = drawing ? dashLen : gapLen;
        const nextDist = Math.min(dist + step, len);

        if (drawing) {
          g.moveTo(from.x + dirX * dist, from.y + dirY * dist);
          g.lineTo(from.x + dirX * nextDist, from.y + dirY * nextDist);
          g.stroke({ color, width, alpha: 0.7 });
        }

        dist = nextDist;
        drawing = !drawing;
      }
    };

    // Render loop
    const render = () => {
      graphics.clear();

      const { body } = selectedObject;
      if (!body) {
        frameId = requestAnimationFrame(render);
        return;
      }

      const radialGravity = runtime.gravitySystem.getRadialGravity();
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
        frameId = requestAnimationFrame(render);
        return;
      }

      const starPos = centralSource.position;
      const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
      const gravityStrength = centralSource.metadata?.gravityStrength ?? 1.0;
      const M = centralSource.mass * gravityStrength;
      const m = body.mass;
      const r = minDistance;

      // 1. Draw dashed Orbital Radius Line from star center to planet center
      drawDashedLine(graphics, starPos, bodyPos, 0x64748b, 1.5, 5, 4);

      // 2. Draw soft glowing sphere of influence around central star
      if (vectorConfig.showInfluenceRadius && centralSource.influenceRadius > 0) {
        graphics.circle(starPos.x, starPos.y, centralSource.influenceRadius);
        graphics.stroke({ color: 0x6366f1, width: 1.5, alpha: 0.15 });
        graphics.fill({ color: 0x6366f1, alpha: 0.015 });
      }

      // 3. Draw Velocity Vector (Blue Arrow)
      if (vectorConfig.showVelocityVectors) {
        const vel = body.velocity;
        const scaleFactor = 16.0;
        const targetPos = {
          x: bodyPos.x + vel.x * scaleFactor,
          y: bodyPos.y + vel.y * scaleFactor,
        };
        drawArrow(graphics, bodyPos, targetPos, 0x3b82f6, 3);

        // Draw helper tangent guide (light blue dashed direction line)
        const tangentSpeed = 60.0;
        const speed = Math.hypot(vel.x, vel.y);
        if (speed > 0.001) {
          const tangentPos = {
            x: bodyPos.x + (vel.x / speed) * tangentSpeed,
            y: bodyPos.y + (vel.y / speed) * tangentSpeed,
          };
          drawDashedLine(graphics, bodyPos, tangentPos, 0x38bdf8, 1.2, 3, 2);
        }
      }

      // 4. Draw Gravitational Pull / Force Vector (Red Arrow)
      if (vectorConfig.showForceVectors) {
        const force = (G * M * m) / (r * r + (radialGravity?.config?.softeningFactor ?? 100));

        // Point arrow exactly towards central body center
        const dx = starPos.x - bodyPos.x;
        const dy = starPos.y - bodyPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.1) {
          const scaleFactor = Math.min(100, Math.max(25, force * 4000));
          const targetPos = {
            x: bodyPos.x + (dx / dist) * scaleFactor,
            y: bodyPos.y + (dy / dist) * scaleFactor,
          };
          drawArrow(graphics, bodyPos, targetPos, 0xef4444, 3);
        }
      }

      // 5. Draw Keplerian Apoapsis / Periapsis markers on predicted trail
      if (vectorConfig.showOrbitPath) {
        const predictedPoints = radialGravity?.getPredictedOrbit(
          { id: selectedObject.id, body, mass: body.mass, affectedByGravity: true },
          220
        ) ?? [];

        if (predictedPoints.length > 2) {
          let minD = Infinity;
          let maxD = -Infinity;
          let pNode = predictedPoints[0];
          let aNode = predictedPoints[0];

          predictedPoints.forEach((p: any) => {
            const d = OrbitUtils.calculateDistance(p, starPos);
            if (d < minD) {
              minD = d;
              pNode = p;
            }
            if (d > maxD) {
              maxD = d;
              aNode = p;
            }
          });

          // Draw Periapsis Marker (Green glowing ring)
          graphics.circle(pNode.x, pNode.y, 6);
          graphics.stroke({ color: 0x10b981, width: 2, alpha: 0.9 });
          graphics.fill({ color: 0x10b981, alpha: 0.25 });

          // Draw Apoapsis Marker (Amber glowing ring)
          // Hide apoapsis if path is hyperbolic / escape trajectory (it goes to infinity)
          const vCircular = OrbitUtils.calculateCircularOrbitVelocity(G, M, r) * 16.67;
          const vEscape = OrbitUtils.calculateEscapeVelocity(G, M, r) * 16.67;
          const speed = Math.hypot(body.velocity.x, body.velocity.y);

          if (speed < vEscape) {
            graphics.circle(aNode.x, aNode.y, 6);
            graphics.stroke({ color: 0xf59e0b, width: 2, alpha: 0.9 });
            graphics.fill({ color: 0xf59e0b, alpha: 0.25 });
          }
        }
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      graphics.destroy();
    };
  }, [runtime, selectedObject, vectorConfig]);

  return null;
};
