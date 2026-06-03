/**
 * Render text to an offscreen canvas and sample it down to exactly `count`
 * normalized points. Returns a Float32Array of length count*3 (x, y, z=0),
 * with x/y in a centered range scaled by the text aspect ratio:
 *   x ∈ [-aspect/2, aspect/2], y ∈ [-0.5, 0.5]
 * Caller multiplies by world scale.
 */
export function sampleTextToPoints(
  text: string,
  count: number,
  opts?: { width?: number; height?: number; font?: string },
): Float32Array {
  const W = opts?.width ?? 2048;
  const H = opts?.height ?? 512;
  const out = new Float32Array(count * 3);

  if (typeof document === "undefined") return out;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return out;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Heavy weight so lowercase letters stay solid (no gaps).
  ctx.font = opts?.font ?? `900 ${Math.floor(H * 0.7)}px "Archivo Black", "Inter", system-ui, sans-serif`;
  ctx.fillText(text, W / 2, H / 2);

  const data = ctx.getImageData(0, 0, W, H).data;
  const filled: number[] = [];
  // step a couple px for speed; collect filled pixel indices
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (data[i] > 128) filled.push(x, y);
    }
  }

  const total = filled.length / 2;
  if (total === 0) {
    // fallback: spread points on a line
    for (let k = 0; k < count; k++) {
      out[k * 3] = (k / count - 0.5) * (W / H);
      out[k * 3 + 1] = 0;
      out[k * 3 + 2] = 0;
    }
    return out;
  }

  const aspect = W / H;
  for (let k = 0; k < count; k++) {
    // even resampling with a random jitter into the bucket
    const idx = Math.floor((k / count) * total + Math.random() * 0.999);
    const px = filled[idx * 2];
    const py = filled[idx * 2 + 1];
    // normalize: x centered & scaled by aspect, y flipped & centered
    out[k * 3] = (px / W - 0.5) * aspect;
    out[k * 3 + 1] = -(py / H - 0.5);
    out[k * 3 + 2] = 0;
  }
  return out;
}
