import * as PIXI from 'pixi.js';

export interface ArrowStyle {
  color: number;
  alpha: number;
  width: number;
  headLength?: number;
}

export interface TextStyleOptions {
  fill: number;
  fontSize: number;
  fontFamily: string;
}

export function drawArrow(
  graphics: PIXI.Graphics,
  origin: { x: number; y: number },
  vector: { x: number; y: number },
  style: ArrowStyle,
): void {
  const endX = origin.x + vector.x;
  const endY = origin.y + vector.y;
  const mag  = Math.hypot(vector.x, vector.y);
  if (mag < 0.5) return;

  graphics.lineStyle(style.width, style.color, style.alpha);
  graphics.moveTo(origin.x, origin.y).lineTo(endX, endY);

  const headLength = Math.min(style.headLength ?? 16, mag * 0.35);
  const nx = vector.x / mag;
  const ny = vector.y / mag;
  const px = -ny;
  const py = nx;

  const p1x = endX - nx * headLength + px * headLength * 0.45;
  const p1y = endY - ny * headLength + py * headLength * 0.45;
  const p2x = endX - nx * headLength - px * headLength * 0.45;
  const p2y = endY - ny * headLength - py * headLength * 0.45;

  graphics.beginFill(style.color, style.alpha);
  graphics.moveTo(endX, endY);
  graphics.lineTo(p1x, p1y);
  graphics.lineTo(p2x, p2y);
  graphics.closePath();
  graphics.endFill();
}

export function createLabel(text: string, style: TextStyleOptions): PIXI.Text {
  return new PIXI.Text(text, {
    fill: style.fill,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  });
}

export function formatDecimal(value: number, precision = 1): string {
  return value.toFixed(precision);
}

export function clampVector(vector: { x: number; y: number }, maxLength: number): { x: number; y: number } {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude <= maxLength || magnitude === 0) return vector;
  const scale = maxLength / magnitude;
  return { x: vector.x * scale, y: vector.y * scale };
}
