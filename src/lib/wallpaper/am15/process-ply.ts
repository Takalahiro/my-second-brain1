/**
 * 3DGS PLY → splat 二进制 buffer
 * 摘自 antimatter15/splat (MIT) — processPlyBuffer
 */

const TYPE_MAP: Record<string, keyof DataView> = {
  double: 'getFloat64',
  int: 'getInt32',
  uint: 'getUint32',
  float: 'getFloat32',
  short: 'getInt16',
  ushort: 'getUint16',
  uchar: 'getUint8',
};

function findHeaderEnd(header: string): { index: number; skip: number } {
  for (const marker of ['end_header\n', 'end_header\r\n']) {
    const index = header.indexOf(marker);
    if (index >= 0) return { index, skip: marker.length };
  }
  return { index: -1, skip: 0 };
}

export function processPlyBuffer(inputBuffer: ArrayBuffer, maxSplats?: number): ArrayBuffer {
  const ubuf = new Uint8Array(inputBuffer);
  const header = new TextDecoder().decode(ubuf.slice(0, 1024 * 10));
  const { index: headerEndIndex, skip } = findHeaderEnd(header);
  if (headerEndIndex < 0) throw new Error('Unable to read .ply file header');

  const countMatch = /element vertex (\d+)\r?\n/.exec(header);
  if (!countMatch) throw new Error('Missing vertex count in PLY header');
  const vertexCount = parseInt(countMatch[1], 10);

  let rowOffset = 0;
  const offsets: Record<string, number> = {};
  const types: Record<string, keyof DataView> = {};
  let inVertex = false;

  for (const rawLine of header.slice(0, headerEndIndex).split('\n')) {
    const line = rawLine.replace(/\r$/, '').trim();
    if (line.startsWith('element vertex')) inVertex = true;
    else if (line.startsWith('element ') && !line.startsWith('element vertex')) inVertex = false;
    else if (inVertex && line.startsWith('property ')) {
      const parts = line.split(/\s+/);
      const type = parts[1];
      const name = parts[2];
      if (!type || !name) continue;
      const arrayType = TYPE_MAP[type] || 'getInt8';
      types[name] = arrayType;
      offsets[name] = rowOffset;
      rowOffset += parseInt(arrayType.replace(/[^\d]/g, ''), 10) / 8;
    }
  }

  const dataView = new DataView(inputBuffer, headerEndIndex + skip);
  let row = 0;
  const attrs = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (!types[prop]) throw new Error(`${prop} not found`);
        return (dataView[types[prop]] as (o: number, le?: boolean) => number)(
          row * rowOffset + offsets[prop],
          true,
        );
      },
    },
  );

  const sizeList = new Float32Array(vertexCount);
  const sizeIndex = new Uint32Array(vertexCount);
  for (row = 0; row < vertexCount; row++) {
    sizeIndex[row] = row;
    if (!types.scale_0) continue;
    const size =
      Math.exp(attrs.scale_0 as number) *
      Math.exp(attrs.scale_1 as number) *
      Math.exp(attrs.scale_2 as number);
    const opacity = 1 / (1 + Math.exp(-(attrs.opacity as number)));
    sizeList[row] = size * opacity;
  }
  sizeIndex.sort((b, a) => sizeList[a] - sizeList[b]);

  const cap = Math.min(vertexCount, maxSplats ?? vertexCount);
  const rowLength = 3 * 4 + 3 * 4 + 4 + 4;
  const buffer = new ArrayBuffer(rowLength * cap);
  const SH_C0 = 0.28209479177387814;

  for (let j = 0; j < cap; j++) {
    row = sizeIndex[j];
    const position = new Float32Array(buffer, j * rowLength, 3);
    const scales = new Float32Array(buffer, j * rowLength + 4 * 3, 3);
    const rgba = new Uint8ClampedArray(buffer, j * rowLength + 4 * 3 + 4 * 3, 4);
    const rot = new Uint8ClampedArray(buffer, j * rowLength + 4 * 3 + 4 * 3 + 4, 4);

    if (types.scale_0) {
      const qlen = Math.sqrt(
        (attrs.rot_0 as number) ** 2 +
          (attrs.rot_1 as number) ** 2 +
          (attrs.rot_2 as number) ** 2 +
          (attrs.rot_3 as number) ** 2,
      );
      rot[0] = ((attrs.rot_0 as number) / qlen) * 128 + 128;
      rot[1] = ((attrs.rot_1 as number) / qlen) * 128 + 128;
      rot[2] = ((attrs.rot_2 as number) / qlen) * 128 + 128;
      rot[3] = ((attrs.rot_3 as number) / qlen) * 128 + 128;
      scales[0] = Math.exp(attrs.scale_0 as number);
      scales[1] = Math.exp(attrs.scale_1 as number);
      scales[2] = Math.exp(attrs.scale_2 as number);
    } else {
      scales[0] = 0.01;
      scales[1] = 0.01;
      scales[2] = 0.01;
      rot[0] = 255;
      rot[1] = 0;
      rot[2] = 0;
      rot[3] = 0;
    }

    position[0] = attrs.x as number;
    position[1] = attrs.y as number;
    position[2] = attrs.z as number;

    if (types.f_dc_0) {
      rgba[0] = (0.5 + SH_C0 * (attrs.f_dc_0 as number)) * 255;
      rgba[1] = (0.5 + SH_C0 * (attrs.f_dc_1 as number)) * 255;
      rgba[2] = (0.5 + SH_C0 * (attrs.f_dc_2 as number)) * 255;
    } else {
      rgba[0] = attrs.red as number;
      rgba[1] = attrs.green as number;
      rgba[2] = attrs.blue as number;
    }
    if (types.opacity) {
      rgba[3] = (1 / (1 + Math.exp(-(attrs.opacity as number)))) * 255;
    } else {
      rgba[3] = 255;
    }
  }

  return buffer;
}

export const SPLAT_ROW_LENGTH = 3 * 4 + 3 * 4 + 4 + 4;

export function estimateOrbitDistance(buffer: ArrayBuffer, sampleCount = 300): number {
  const f = new Float32Array(buffer);
  const n = Math.min(sampleCount, Math.floor(buffer.byteLength / SPLAT_ROW_LENGTH));
  let d = 0;
  for (let i = 0; i < n; i++) {
    d += Math.hypot(f[8 * i], f[8 * i + 1], f[8 * i + 2]);
  }
  return (d / n || 1) * 3;
}
