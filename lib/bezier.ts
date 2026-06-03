/**
 * Quadratic Bezier sampling helpers for the hero letter-flight animation.
 * Three points define each path: start, control (curve-pull), end.
 */

export type Vec3 = { x: number; y: number; z: number };

/** Point on a quadratic Bezier curve at parameter t ∈ [0,1]. */
export function bezierPoint(start: Vec3, control: Vec3, end: Vec3, t: number): Vec3 {
  const u = 1 - t;
  const a = u * u;
  const b = 2 * u * t;
  const c = t * t;
  return {
    x: a * start.x + b * control.x + c * end.x,
    y: a * start.y + b * control.y + c * end.y,
    z: a * start.z + b * control.z + c * end.z,
  };
}

/** Linear interpolation between two rotation triples (degrees). */
export function lerpRotation(start: Vec3, end: Vec3, t: number): Vec3 {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t,
  };
}

/** Clamp a value to a range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Smooth Hermite interpolation; remaps x from [edge0,edge1] to a smooth [0,1]. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** easeOutBack — overshoots slightly then settles, for spring feel. */
export function easeOutBack(t: number, overshoot = 1.70158): number {
  const c1 = overshoot;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}
