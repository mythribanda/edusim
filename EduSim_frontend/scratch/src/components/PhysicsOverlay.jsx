import React, { useEffect, useRef } from 'react';

export default function PhysicsOverlay({ apiRef, width = 1100, height = 640 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const api = apiRef?.current;
      if (api && api.world) {
        const bodies = api.world.bodies || [];
        bodies.forEach((b) => {
          // draw velocity vector
          const pos = b.position;
          const vel = b.velocity || { x: 0, y: 0 };
          ctx.strokeStyle = 'rgba(0,234,255,0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + vel.x * 6, pos.y + vel.y * 6);
          ctx.stroke();

          // draw label
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.font = '11px system-ui';
          ctx.fillText(`${Math.round(Math.hypot(vel.x, vel.y)*10)/10}`, pos.x + 6, pos.y - 6);
        });
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [apiRef]);

  return (
    <canvas ref={canvasRef} width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
  );
}
