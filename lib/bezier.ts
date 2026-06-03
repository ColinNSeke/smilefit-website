export type Vec3 = { x: number; y: number; z: number };

/** Point on a quadratic Bezier curve at parameter t ∈ [0,1]. */
export function bezierPoint(start: Vec3, control: Vec3, end: Vec3, t: number): Vec3 {
  const u = 1 - t;
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
    z: u * u * start.z + 2 * u * t * control.z + t * t * end.z,
  };
}

/** Linear interpolation between two Vec3s. */
export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** Clamp a value to a range. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Deterministic seeded random in [0, 1).
 * Same seed → same value every call, no state, safe on server and client.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1.618) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * easeOutBack — overshoots slightly then settles.
 * cubic-bezier(0.34, 1.56, 0.64, 1) approximated analytically.
 */
export function easeOutBack(t: number, overshoot = 1.5): number {
  const c1 = overshoot;
  const c3 = c1 + 1;
  const x = t - 1;
  return 1 + c3 * x * x * x + c1 * x * x;
}

/** Euclidean distance between two Vec3s. */
export function vec3Distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
