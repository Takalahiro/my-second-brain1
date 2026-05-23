/**
 * Splat 排序 + 纹理生成 Worker
 * 摘自 antimatter15/splat (MIT)
 */
import { processPlyBuffer, SPLAT_ROW_LENGTH } from './process-ply';

let buffer: ArrayBuffer | undefined;
let vertexCount = 0;
let viewProj: number[] | undefined;
const rowLength = SPLAT_ROW_LENGTH;
let lastProj: number[] = [];
let depthIndex = new Uint32Array();
let lastVertexCount = 0;
let sortRunning = false;

const floatView = new Float32Array(1);
const int32View = new Int32Array(floatView.buffer);

function floatToHalf(float: number): number {
  floatView[0] = float;
  const f = int32View[0];
  const sign = (f >> 31) & 0x0001;
  const exp = (f >> 23) & 0x00ff;
  let frac = f & 0x007fffff;
  let newExp: number;
  if (exp === 0) {
    newExp = 0;
  } else if (exp < 113) {
    newExp = 0;
    frac |= 0x00800000;
    frac = frac >> (113 - exp);
    if (frac & 0x01000000) {
      newExp = 1;
      frac = 0;
    }
  } else if (exp < 142) {
    newExp = exp - 112;
  } else {
    newExp = 31;
    frac = 0;
  }
  return (sign << 15) | (newExp << 10) | (frac >> 13);
}

function packHalf2x16(x: number, y: number): number {
  return (floatToHalf(x) | (floatToHalf(y) << 16)) >>> 0;
}

function generateTexture() {
  if (!buffer) return;
  const f_buffer = new Float32Array(buffer);
  const u_buffer = new Uint8Array(buffer);
  const texwidth = 1024 * 2;
  const texheight = Math.ceil((2 * vertexCount) / texwidth);
  const texdata = new Uint32Array(texwidth * texheight * 4);
  const texdata_c = new Uint8Array(texdata.buffer);
  const texdata_f = new Float32Array(texdata.buffer);

  for (let i = 0; i < vertexCount; i++) {
    texdata_f[8 * i + 0] = f_buffer[8 * i + 0];
    texdata_f[8 * i + 1] = f_buffer[8 * i + 1];
    texdata_f[8 * i + 2] = f_buffer[8 * i + 2];
    texdata_c[4 * (8 * i + 7) + 0] = u_buffer[32 * i + 24 + 0];
    texdata_c[4 * (8 * i + 7) + 1] = u_buffer[32 * i + 24 + 1];
    texdata_c[4 * (8 * i + 7) + 2] = u_buffer[32 * i + 24 + 2];
    texdata_c[4 * (8 * i + 7) + 3] = u_buffer[32 * i + 24 + 3];

    const scale = [f_buffer[8 * i + 3], f_buffer[8 * i + 4], f_buffer[8 * i + 5]];
    const rot = [
      (u_buffer[32 * i + 28 + 0] - 128) / 128,
      (u_buffer[32 * i + 28 + 1] - 128) / 128,
      (u_buffer[32 * i + 28 + 2] - 128) / 128,
      (u_buffer[32 * i + 28 + 3] - 128) / 128,
    ];
    const M = [
      1.0 - 2.0 * (rot[2] * rot[2] + rot[3] * rot[3]),
      2.0 * (rot[1] * rot[2] + rot[0] * rot[3]),
      2.0 * (rot[1] * rot[3] - rot[0] * rot[2]),
      2.0 * (rot[1] * rot[2] - rot[0] * rot[3]),
      1.0 - 2.0 * (rot[1] * rot[1] + rot[3] * rot[3]),
      2.0 * (rot[2] * rot[3] + rot[0] * rot[1]),
      2.0 * (rot[1] * rot[3] + rot[0] * rot[2]),
      2.0 * (rot[2] * rot[3] - rot[0] * rot[1]),
      1.0 - 2.0 * (rot[1] * rot[1] + rot[2] * rot[2]),
    ].map((k, i) => k * scale[Math.floor(i / 3)]);

    const sigma = [
      M[0] * M[0] + M[3] * M[3] + M[6] * M[6],
      M[0] * M[1] + M[3] * M[4] + M[6] * M[7],
      M[0] * M[2] + M[3] * M[5] + M[6] * M[8],
      M[1] * M[1] + M[4] * M[4] + M[7] * M[7],
      M[1] * M[2] + M[4] * M[5] + M[7] * M[8],
      M[2] * M[2] + M[5] * M[5] + M[8] * M[8],
    ];
    texdata[8 * i + 4] = packHalf2x16(4 * sigma[0], 4 * sigma[1]);
    texdata[8 * i + 5] = packHalf2x16(4 * sigma[2], 4 * sigma[3]);
    texdata[8 * i + 6] = packHalf2x16(4 * sigma[4], 4 * sigma[5]);
  }

  self.postMessage({ texdata, texwidth, texheight }, [texdata.buffer]);
}

function runSort(vp: number[]) {
  if (!buffer) return;
  const f_buffer = new Float32Array(buffer);
  if (lastVertexCount === vertexCount) {
    const dot = lastProj[2] * vp[2] + lastProj[6] * vp[6] + lastProj[10] * vp[10];
    if (Math.abs(dot - 1) < 0.01) return;
  } else {
    generateTexture();
    lastVertexCount = vertexCount;
  }

  let maxDepth = -Infinity;
  let minDepth = Infinity;
  const sizeList = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const depth =
      ((vp[2] * f_buffer[8 * i + 0] + vp[6] * f_buffer[8 * i + 1] + vp[10] * f_buffer[8 * i + 2]) *
        4096) |
      0;
    sizeList[i] = depth;
    if (depth > maxDepth) maxDepth = depth;
    if (depth < minDepth) minDepth = depth;
  }

  const depthInv = (256 * 256 - 1) / (maxDepth - minDepth);
  const counts0 = new Uint32Array(256 * 256);
  for (let i = 0; i < vertexCount; i++) {
    sizeList[i] = ((sizeList[i] - minDepth) * depthInv) | 0;
    counts0[sizeList[i]]++;
  }
  const starts0 = new Uint32Array(256 * 256);
  for (let i = 1; i < 256 * 256; i++) starts0[i] = starts0[i - 1] + counts0[i - 1];
  depthIndex = new Uint32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) depthIndex[starts0[sizeList[i]]++] = i;

  lastProj = vp;
  self.postMessage({ depthIndex, viewProj: vp, vertexCount }, [depthIndex.buffer]);
}

function throttledSort() {
  if (!sortRunning) {
    sortRunning = true;
    const lastView = viewProj!;
    runSort(lastView);
    setTimeout(() => {
      sortRunning = false;
      if (lastView !== viewProj) throttledSort();
    }, 0);
  }
}

self.onmessage = (e: MessageEvent) => {
  if (e.data.ply) {
    try {
      vertexCount = 0;
      if (viewProj) runSort(viewProj);
      buffer = processPlyBuffer(e.data.ply, e.data.maxSplats);
      vertexCount = Math.floor(buffer.byteLength / rowLength);
      self.postMessage({ buffer, vertexCount });
    } catch (err) {
      self.postMessage({
        error: err instanceof Error ? err.message : 'processPlyBuffer failed',
      });
    }
  } else if (e.data.view) {
    viewProj = e.data.view;
    throttledSort();
  }
};

export {};
