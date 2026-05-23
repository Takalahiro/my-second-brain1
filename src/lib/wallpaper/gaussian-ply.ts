/**
 * 3D Gaussian Splatting PLY → 流式降采样（3DGS 标准格式）
 */

export type GaussianSplatCloud = {
  positions: Float32Array;
  rotations: Float32Array;
  scales: Float32Array;
  colors: Float32Array;
  count: number;
  center: [number, number, number];
  radius: number;
};

/** @deprecated 旧 Points 格式 */
export type GaussianPointCloud = GaussianSplatCloud & {
  depths?: Float32Array;
  sizes?: Float32Array;
  alphas?: Float32Array;
  zMin?: number;
  zMax?: number;
};

export type PlyLoadError = {
  ok: false;
  reason: 'not_found' | 'network' | 'parse' | 'empty' | 'aborted';
  detail?: string;
};

export type PlyLoadResult =
  | { ok: true; cloud: GaussianSplatCloud }
  | PlyLoadError;

const SH_C0 = 0.28209479177387814;
const geometryCache = new Map<string, GaussianSplatCloud>();

const TYPE_SIZES: Record<string, number> = {
  float: 4,
  double: 8,
  int: 4,
  uint: 4,
  uchar: 1,
  char: 1,
  short: 2,
  ushort: 2,
};

type ParsedHeader = {
  vertexCount: number;
  vertexStride: number;
  dataOffset: number;
  offsets: Record<string, number>;
};

function shDcToRgb(f0: number, f1: number, f2: number): [number, number, number] {
  return [
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f0)),
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f1)),
    Math.max(0, Math.min(1, 0.5 + SH_C0 * f2)),
  ];
}

function sigmoid(x: number): number {
  if (x >= 0) return 1 / (1 + Math.exp(-x));
  const e = Math.exp(x);
  return e / (1 + e);
}

function isAborted(signal?: AbortSignal): boolean {
  return !!signal?.aborted;
}

function findHeaderEnd(bytes: Uint8Array): number {
  const marker = new TextEncoder().encode('end_header');
  for (let i = 0; i <= bytes.length - marker.length; i++) {
    let ok = true;
    for (let j = 0; j < marker.length; j++) {
      if (bytes[i + j] !== marker[j]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    let k = i + marker.length;
    while (k < bytes.length && (bytes[k] === 0x0d || bytes[k] === 0x0a)) k++;
    return k;
  }
  return -1;
}

function parseHeaderFromBytes(headerBytes: Uint8Array): ParsedHeader | null {
  const header = new TextDecoder().decode(headerBytes);
  if (!header.includes('end_header')) return null;

  const vertexMatch = header.match(/element vertex (\d+)/);
  if (!vertexMatch) return null;
  const vertexCount = Number(vertexMatch[1]);
  if (!Number.isFinite(vertexCount) || vertexCount <= 0) return null;

  const vertexProps: { type: string; name: string }[] = [];
  let inVertex = false;
  for (const line of header.split('\n')) {
    if (line.startsWith('element vertex')) inVertex = true;
    else if (line.startsWith('element ') && !line.startsWith('element vertex')) inVertex = false;
    else if (inVertex && line.startsWith('property ')) {
      const [, type, name] = line.split(/\s+/);
      if (type && name) vertexProps.push({ type, name });
    }
  }

  const offsets: Record<string, number> = {};
  let vertexStride = 0;
  for (const p of vertexProps) {
    offsets[p.name] = vertexStride;
    vertexStride += TYPE_SIZES[p.type] ?? 4;
  }

  const required = ['x', 'y', 'z', 'opacity'];
  const dcKeys = ['f_dc_0', 'f_dc_1', 'f_dc_2'];
  const scaleKeys = ['scale_0', 'scale_1', 'scale_2'];
  for (const key of [...required, ...dcKeys, ...scaleKeys]) {
    if (!(key in offsets)) {
      return null;
    }
  }

  const dataOffset = findHeaderEnd(headerBytes);
  if (dataOffset < 0) return null;

  return { vertexCount, vertexStride, dataOffset, offsets };
}

function appendBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length === 0) return b;
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

async function streamGaussianPly(
  response: Response,
  maxPoints: number,
  signal?: AbortSignal,
): Promise<PlyLoadResult> {
  if (!response.body) {
    return { ok: false, reason: 'network', detail: 'empty body' };
  }

  const reader = response.body.getReader();
  let allBytes = new Uint8Array(0);
  let header: ParsedHeader | null = null;

  while (!header) {
    if (isAborted(signal)) return { ok: false, reason: 'aborted' };
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (e) {
      if (isAborted(signal)) return { ok: false, reason: 'aborted' };
      return {
        ok: false,
        reason: 'network',
        detail: e instanceof Error ? e.message : 'stream read failed',
      };
    }
    if (chunk.done) return { ok: false, reason: 'parse', detail: 'header truncated' };
    allBytes = appendBytes(allBytes, chunk.value);
    header = parseHeaderFromBytes(allBytes);
    if (allBytes.length > 65536 && !header) {
      return { ok: false, reason: 'parse', detail: 'unsupported 3DGS PLY layout' };
    }
  }

  const { vertexCount, vertexStride, dataOffset, offsets } = header;
  const sampleStride = Math.max(1, Math.ceil(vertexCount / maxPoints));
  const cap = Math.ceil(vertexCount / sampleStride);

  const positions = new Float32Array(cap * 3);
  const rotations = new Float32Array(cap * 4);
  const scales = new Float32Array(cap * 3);
  const colors = new Float32Array(cap * 4);

  const hasRot = 'rot_0' in offsets;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let out = 0;
  let vertexIndex = 0;

  let carry = allBytes.subarray(dataOffset);
  allBytes = new Uint8Array(0);

  const readF32 = (dv: DataView, name: string) => dv.getFloat32(offsets[name], true);

  while (vertexIndex < vertexCount) {
    if (isAborted(signal)) {
      try {
        await reader.cancel();
      } catch {}
      return { ok: false, reason: 'aborted' };
    }

    if (carry.length < vertexStride) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (e) {
        if (isAborted(signal)) return { ok: false, reason: 'aborted' };
        return {
          ok: false,
          reason: 'network',
          detail: e instanceof Error ? e.message : 'stream read failed',
        };
      }
      if (chunk.done) {
        if (vertexIndex < vertexCount * 0.98) {
          return {
            ok: false,
            reason: 'network',
            detail: `stream ended early (${vertexIndex}/${vertexCount})`,
          };
        }
        break;
      }
      carry = appendBytes(carry, chunk.value);
      continue;
    }

    if (vertexIndex % sampleStride === 0) {
      const dv = new DataView(carry.buffer, carry.byteOffset, carry.byteLength);
      const x = readF32(dv, 'x');
      const y = readF32(dv, 'y');
      const z = readF32(dv, 'z');

      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        const opacity = sigmoid(readF32(dv, 'opacity'));
        if (opacity >= 0.05) {
          const s0 = Math.exp(readF32(dv, 'scale_0'));
          const s1 = Math.exp(readF32(dv, 'scale_1'));
          const s2 = Math.exp(readF32(dv, 'scale_2'));
          const [r, g, b] = shDcToRgb(
            readF32(dv, 'f_dc_0'),
            readF32(dv, 'f_dc_1'),
            readF32(dv, 'f_dc_2'),
          );

          positions[out * 3] = x;
          positions[out * 3 + 1] = y;
          positions[out * 3 + 2] = z;
          colors[out * 4] = r;
          colors[out * 4 + 1] = g;
          colors[out * 4 + 2] = b;
          colors[out * 4 + 3] = opacity;
          scales[out * 3] = s0;
          scales[out * 3 + 1] = s1;
          scales[out * 3 + 2] = s2;

          if (hasRot) {
            rotations[out * 4] = readF32(dv, 'rot_1');
            rotations[out * 4 + 1] = readF32(dv, 'rot_2');
            rotations[out * 4 + 2] = readF32(dv, 'rot_3');
            rotations[out * 4 + 3] = readF32(dv, 'rot_0');
          } else {
            rotations[out * 4 + 3] = 1;
          }

          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          minZ = Math.min(minZ, z);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          maxZ = Math.max(maxZ, z);
          out++;
        }
      }
    }

    carry = carry.subarray(vertexStride);
    if (carry.byteOffset > 1_048_576) carry = carry.slice();
    vertexIndex++;
  }

  while (true) {
    if (isAborted(signal)) break;
    try {
      const { done } = await reader.read();
      if (done) break;
    } catch {
      break;
    }
  }

  if (out === 0) {
    return { ok: false, reason: 'empty', detail: 'no visible 3DGS gaussians' };
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const radius = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 1;

  const cloud: GaussianSplatCloud = {
    positions: positions.subarray(0, out * 3),
    rotations: rotations.subarray(0, out * 4),
    scales: scales.subarray(0, out * 3),
    colors: colors.subarray(0, out * 4),
    count: out,
    center: [cx, cy, cz],
    radius,
  };

  return { ok: true, cloud };
}

export function resolvePlyUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export async function loadGaussianPlyPoints(
  url: string,
  opts: { maxPoints?: number; signal?: AbortSignal } = {},
): Promise<PlyLoadResult> {
  const maxPoints = opts.maxPoints ?? 160_000;
  const resolved = resolvePlyUrl(url);
  const cacheKey = `${resolved}@splat-v1@${maxPoints}`;
  const cached = geometryCache.get(cacheKey);
  if (cached) return { ok: true, cloud: cached };

  if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };

  try {
    const res = await fetch(resolved, { signal: opts.signal });
    if (isAborted(opts.signal)) return { ok: false, reason: 'aborted' };
    if (res.status === 404) {
      return { ok: false, reason: 'not_found', detail: resolved };
    }
    if (!res.ok) {
      return { ok: false, reason: 'network', detail: `HTTP ${res.status}` };
    }
    const result = await streamGaussianPly(res, maxPoints, opts.signal);
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

export function plyErrorMessage(err: PlyLoadError): string {
  switch (err.reason) {
    case 'not_found':
      return 'PLY 文件未找到，请确认 public/ply/ 已部署';
    case 'aborted':
      return '加载已取消';
    case 'empty':
      return '3DGS 点云解析为空，请确认 PLY 含 x/y/z/f_dc/opacity/scale 字段';
    case 'parse':
      return `3DGS PLY 解析失败：${err.detail ?? '未知错误'}`;
    default:
      return `点云下载失败：${err.detail ?? '网络错误'}`;
  }
}

export function clearGaussianPlyCache() {
  geometryCache.clear();
}

/** 按扩展名自动选择 PLY / SOG 加载器 */
export async function loadGaussianSplat(
  url: string,
  opts: { maxPoints?: number; signal?: AbortSignal } = {},
): Promise<PlyLoadResult> {
  const path = url.split('?')[0]?.split('#')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.sog')) {
    const { loadGaussianSog } = await import('./gaussian-sog');
    return loadGaussianSog(url, opts);
  }
  return loadGaussianPlyPoints(url, opts);
}
