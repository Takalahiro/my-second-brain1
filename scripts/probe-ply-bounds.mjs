/** 快速读取 3DGS PLY 包围盒 */
import fs from 'node:fs';

const file = process.argv[2] || 'public/ply/shanghai.ply';
const buf = fs.readFileSync(file);
const end = buf.indexOf('end_header');
const header = buf.subarray(0, end + 'end_header'.length).toString('utf8');
const vertexMatch = header.match(/element vertex (\d+)/);
const count = Number(vertexMatch?.[1] ?? 0);
const strideMatch = [...header.matchAll(/property (\S+) (\S+)/g)];
let stride = 0;
const off = {};
for (const m of strideMatch) {
  if (!m[2].startsWith('x') && !['float', 'double', 'uchar', 'int'].includes(m[1])) continue;
}
// parse vertex props only
let inVertex = false;
for (const line of header.split('\n')) {
  if (line.startsWith('element vertex')) inVertex = true;
  else if (line.startsWith('element ') && !line.startsWith('element vertex')) inVertex = false;
  else if (inVertex && line.startsWith('property ')) {
    const [, type, name] = line.split(/\s+/);
    const sz = { float: 4, double: 8, int: 4, uint: 4, uchar: 1, char: 1, short: 2, ushort: 2 }[type] ?? 4;
    off[name] = stride;
    stride += sz;
  }
}

const dataOff = buf.indexOf('end_header') + 'end_header'.length;
while (dataOff < buf.length && (buf[dataOff] === 0x0d || buf[dataOff] === 0x0a)) {}
let start = dataOff;
while (start < buf.length && (buf[start] === 0x0d || buf[start] === 0x0a)) start++;

const step = Math.max(1, Math.floor(count / 5000));
let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < count; i += step) {
  const o = start + i * stride;
  const dv = new DataView(buf.buffer, buf.byteOffset + o, stride);
  const x = dv.getFloat32(off.x, true);
  const y = dv.getFloat32(off.y, true);
  const z = dv.getFloat32(off.z, true);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

console.log(JSON.stringify({
  file,
  count,
  stride,
  offsets: off,
  bounds: { minX, minY, minZ, maxX, maxY, maxZ },
  center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  size: [maxX - minX, maxY - minY, maxZ - minZ],
}, null, 2));
