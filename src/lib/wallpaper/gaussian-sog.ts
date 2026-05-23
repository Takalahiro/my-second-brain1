/**
 * PlayCanvas SOG v2 → GaussianSplatCloud（浏览器端解压 + WebP 解码）
 * @see https://developer.playcanvas.com/user-manual/gaussian-splatting/formats/sog/
 */
import { unzipSync } from 'fflate';
import type { GaussianSplatCloud, PlyLoadResult } from './gaussian-ply';
import { resolvePlyUrl } from './gaussian-ply';

type SogMetaV2 = {
  version: 2;
  count: number;
  means: { mins: number[]; maxs: number[]; files: string[] };
  scales: { codebook: number[]; files: string[] };
  quats: { files: string[] };
  sh0: { codebook: number[]; files: string[] };
};

const SH_C0 = 0.28209479177387814;
const geometryCache = new Map<string, GaussianSplatCloud>();

function isAborted(signal?: AbortSignal): boolean {
  return !!signal?.aborted;
}

function invLogTransform(v: number): number {
  const a = Math.abs(v);
  return v < 0 ? -(Math.exp(a) - 1) : Math.exp(a) - 1;
}

function sigmoid(x: number): number {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const e = Math.exp(x);
  return e / (1 + e);
}

function shDcToRgb(f0: number, f1: number, f2: number): [number, number, number] {
  return [
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f0)),
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f1)),
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f2)),
  ];
}

function unpackQuat(px: number, py: number, pz: number, tag: number): [number, number, number, number] {
  const maxComp = tag - 252;
  const a = (px / 255) * 2 - 1;
  const b = (py / 255) * 2 - 1;
  const c = (pz / 255) * 2 - 1;
  const sqrt2 = Math.sqrt(2);
  const comps = [0, 0, 0, 0];
  const idx = [
    [1, 2, 3],
    [0, 2, 3],
    [0, 1, 3],
    [0, 1, 2],
  ][maxComp];
  comps[idx[0]] = a / sqrt2;
  comps[idx[1]] = b / sqrt2;
  comps[idx[2]] = c / sqrt2;
  comps[maxComp] = Math.sqrt(
    Math.max(0, 1 - (comps[0] ** 2 + comps[1] ** 2 + comps[2] ** 2 + comps[3] ** 2)),
  );
  return comps as [number, number, number, number];
}

async function decodeWebpRGBA(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: 'image/webp' });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function readFile(files: Record<string, Uint8Array>, name: string): Uint8Array {
  const b = files[name];
  if (!b) throw new Error(`SOG 缺少 ${name}`);
  return b;
}

async function decodeSogToCloud(
  files: Record<string, Uint8Array>,
  maxPoints: number,
  signal?: AbortSignal,
): Promise<PlyLoadResult> {
  const metaBytes = files['meta.json'];
  if (!metaBytes) return { ok: false, reason: 'parse', detail: 'SOG 缺少 meta.json' };

  let meta: SogMetaV2;
  try {
    meta = JSON.parse(new TextDecoder().decode(metaBytes)) as SogMetaV2;
  } catch {
    return { ok: false, reason: 'parse', detail: 'SOG meta.json 无效' };
  }
  if (meta.version !== 2) {
    return { ok: false, reason: 'parse', detail: `不支持的 SOG 版本: ${meta.version}` };
  }

  const total = meta.count;
  if (!Number.isFinite(total) || total <= 0) {
    return { ok: false, reason: 'empty', detail: 'SOG count 无效' };
  }

  if (isAborted(signal)) return { ok: false, reason: 'aborted' };

  const [meansLo, meansHi, quats, scalesImg, sh0] = await Promise.all([
    decodeWebpRGBA(readFile(files, meta.means.files[0])),
    decodeWebpRGBA(readFile(files, meta.means.files[1])),
    decodeWebpRGBA(readFile(files, meta.quats.files[0])),
    decodeWebpRGBA(readFile(files, meta.scales.files[0])),
    decodeWebpRGBA(readFile(files, meta.sh0.files[0])),
  ]);

  if (isAborted(signal)) return { ok: false, reason: 'aborted' };

  const texMin = Math.min(
    meansLo.width * meansLo.height,
    quats.width * quats.height,
    scalesImg.width * scalesImg.height,
    sh0.width * sh0.height,
  );
  if (texMin < total) {
    return { ok: false, reason: 'parse', detail: 'SOG 纹理尺寸不足' };
  }

  const sampleStride = Math.max(1, Math.ceil(total / maxPoints));
  const cap = Math.ceil(total / sampleStride);
  const positions = new Float32Array(cap * 3);
  const rotations = new Float32Array(cap * 4);
  const scales = new Float32Array(cap * 3);
  const colors = new Float32Array(cap * 4);

  const sCode = new Float32Array(meta.scales.codebook);
  const cCode = new Float32Array(meta.sh0.codebook);
  const [xMin, yMin, zMin] = meta.means.mins;
  const xScale = meta.means.maxs[0] - xMin || 1;
  const yScale = meta.means.maxs[1] - yMin || 1;
  const zScale = meta.means.maxs[2] - zMin || 1;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let out = 0;

  for (let i = 0; i < total; i += sampleStride) {
    const o = i * 4;
    const xs = meansLo.data[o] | (meansHi.data[o] << 8);
    const ys = meansLo.data[o + 1] | (meansHi.data[o + 1] << 8);
    const zs = meansLo.data[o + 2] | (meansHi.data[o + 2] << 8);

    const x = invLogTransform(xMin + xScale * (xs / 65535));
    const y = invLogTransform(yMin + yScale * (ys / 65535));
    const z = invLogTransform(zMin + zScale * (zs / 65535));

    const opacity = sigmoid(sh0.data[o + 3] / 255);
    if (opacity < 0.05) continue;

    const s0 = Math.exp(sCode[scalesImg.data[o]]);
    const s1 = Math.exp(sCode[scalesImg.data[o + 1]]);
    const s2 = Math.exp(sCode[scalesImg.data[o + 2]]);
    const [r, g, b] = shDcToRgb(cCode[sh0.data[o]], cCode[sh0.data[o + 1]], cCode[sh0.data[o + 2]]);

    const tag = quats.data[o + 3];
    if (tag >= 252 && tag <= 255) {
      const [w, qx, qy, qz] = unpackQuat(quats.data[o], quats.data[o + 1], quats.data[o + 2], tag);
      rotations[out * 4] = qx;
      rotations[out * 4 + 1] = qy;
      rotations[out * 4 + 2] = qz;
      rotations[out * 4 + 3] = w;
    } else {
      rotations[out * 4 + 3] = 1;
    }

    positions[out * 3] = x;
    positions[out * 3 + 1] = y;
    positions[out * 3 + 2] = z;
    scales[out * 3] = s0;
    scales[out * 3 + 1] = s1;
    scales[out * 3 + 2] = s2;
    colors[out * 4] = r;
    colors[out * 4 + 1] = g;
    colors[out * 4 + 2] = b;
    colors[out * 4 + 3] = opacity;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
    out++;
  }

  if (out === 0) return { ok: false, reason: 'empty', detail: 'SOG 解码后无可见高斯' };

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  return {
    ok: true,
    cloud: {
      positions: positions.subarray(0, out * 3),
      rotations: rotations.subarray(0, out * 4),
      scales: scales.subarray(0, out * 3),
      colors: colors.subarray(0, out * 4),
      count: out,
      center: [cx, cy, cz],
      radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1,
    },
  };
}

export async function loadGaussianSog(
  url: string,
  opts: { maxPoints?: number; signal?: AbortSignal } = {},
): Promise<PlyLoadResult> {
  const maxPoints = opts.maxPoints ?? 160_000;
  const resolved = resolvePlyUrl(url);
  const cacheKey = `${resolved}@sog-v1@${maxPoints}`;
  const cached = geometryCache.get(cacheKey);
  if (cached) return { ok: true, cloud: cached };

  if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };

  try {
    const res = await fetch(resolved, { signal: opts.signal });
    if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };
    if (res.status === 404) return { ok: false, reason: 'not_found', detail: resolved };
    if (!res.ok) return { ok: false, reason: 'network', detail: `HTTP ${res.status}` };

    const buf = new Uint8Array(await res.arrayBuffer());
    if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };

    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(buf) as Record<string, Uint8Array>;
    } catch {
      return { ok: false, reason: 'parse', detail: 'SOG 解压失败' };
    }

    const result = await decodeSogToCloud(files, maxPoints, opts.signal);
    if (result.ok) geometryCache.set(cacheKey, result.cloud);
    return result;
  } catch (e) {
    if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, reason: 'aborted' };
    }
    return {
      ok: false,
      reason: 'network',
      detail: e instanceof Error ? e.message : 'fetch failed',
    };
  }
}

export function clearGaussianSogCache() {
  geometryCache.clear();
}
