/** 读取 PLY 尾部 extrinsic(4x4) / intrinsic(3x3) / image_size */
import fs from 'node:fs';

const file = process.argv[2] || 'public/ply/shanghai.ply';
const buf = fs.readFileSync(file);
const headerEnd = buf.indexOf(Buffer.from('end_header')) + 'end_header'.length;
let off = headerEnd;
while (off < buf.length && (buf[off] === 0x0d || buf[off] === 0x0a)) off++;

const header = buf.subarray(0, headerEnd).toString('utf8');
const vMatch = header.match(/element vertex (\d+)/);
const vertexCount = Number(vMatch?.[1] ?? 0);

let stride = 0;
let inVertex = false;
for (const line of header.split('\n')) {
  if (line.startsWith('element vertex')) inVertex = true;
  else if (line.startsWith('element ') && !line.startsWith('element vertex')) inVertex = false;
  else if (inVertex && line.startsWith('property float')) stride += 4;
  else if (inVertex && line.startsWith('property ')) {
    const t = line.split(/\s+/)[1];
    stride += { float: 4, double: 8, int: 4, uint: 4, uchar: 1, char: 1, short: 2, ushort: 2 }[t] ?? 4;
  }
}

const bodyStart = off;
const afterVerts = bodyStart + vertexCount * stride;
const dv = new DataView(buf.buffer, buf.byteOffset + afterVerts, buf.length - afterVerts);

const extrinsic = [];
for (let i = 0; i < 16; i++) extrinsic.push(dv.getFloat32(i * 4, true));

const intrinsic = [];
for (let i = 0; i < 9; i++) intrinsic.push(dv.getFloat32(64 + i * 4, true));

const imageSize = [dv.getUint32(64 + 36, true), dv.getUint32(64 + 40, true)];

console.log(JSON.stringify({ vertexCount, stride, bodyStart, afterVerts, extrinsic, intrinsic, imageSize }, null, 2));
