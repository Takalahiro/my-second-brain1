import type { LayerActivation } from '../model/types';

export type SpatialMap = {
  data: Float32Array;
  h: number;
  w: number;
};

export function parseShape(shape: number[]) {
  if (shape.length === 4) return { h: shape[1] ?? 1, w: shape[2] ?? 1, c: shape[3] ?? 1 };
  if (shape.length === 3) return { h: shape[0] ?? 1, w: shape[1] ?? 1, c: shape[2] ?? 1 };
  if (shape.length === 2) return { h: 1, w: shape[1] ?? 1, c: 1 };
  return { h: 1, w: 1, c: 1 };
}

function sliceChannel(data: Float32Array, h: number, w: number, c: number, ch: number) {
  const out = new Float32Array(h * w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[y * w + x] = data[(y * w + x) * c + ch] ?? 0;
    }
  }
  return out;
}

/** 选取能量最高的 channel，最能代表「这一层看到了什么」 */
export function pickRepresentativeMap(layer: LayerActivation): SpatialMap {
  const { h, w, c } = parseShape(layer.shape);
  const raw = layer.data instanceof Float32Array ? layer.data : Float32Array.from(layer.data);

  if (layer.meta.kind === 'flatten' || layer.meta.kind === 'dense') {
    const n = raw.length;
    const side = Math.ceil(Math.sqrt(n));
    const data = new Float32Array(side * side);
    for (let i = 0; i < side * side; i++) data[i] = raw[i] ?? 0;
    return { data, h: side, w: side };
  }

  if (c <= 1) return { data: raw.slice(0, h * w), h, w };

  let bestCh = 0;
  let bestEnergy = -1;
  for (let ch = 0; ch < c; ch++) {
    const chData = sliceChannel(raw, h, w, c, ch);
    let energy = 0;
    for (const v of chData) energy += Math.abs(v);
    if (energy > bestEnergy) {
      bestEnergy = energy;
      bestCh = ch;
    }
  }
  return { data: sliceChannel(raw, h, w, c, bestCh), h, w };
}

export function normalizeMap(data: Float32Array) {
  let min = Infinity;
  let max = -Infinity;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = (data[i] - min) / span;
  return out;
}

/** 绘制 2D 热力图到 canvas，用于纹理与 HUD 缩略图 */
export function drawHeatmapToCanvas(
  data: Float32Array,
  h: number,
  w: number,
  size = 128
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#08050f';
  ctx.fillRect(0, 0, size, size);
  const norm = normalizeMap(data);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sy = Math.min(h - 1, Math.floor((y / size) * h));
      const sx = Math.min(w - 1, Math.floor((x / size) * w));
      const t = norm[sy * w + sx] ?? 0;
      const i = (y * size + x) * 4;
      img.data[i] = Math.floor(80 + t * 100);
      img.data[i + 1] = Math.floor(60 + t * 140);
      img.data[i + 2] = Math.floor(180 + t * 75);
      img.data[i + 3] = Math.floor(40 + t * 215);
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function layerThumbnailDataUrl(layer: LayerActivation, size = 96): string {
  const { data, h, w } = pickRepresentativeMap(layer);
  return drawHeatmapToCanvas(data, h, w, size).toDataURL();
}
