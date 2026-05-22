#!/usr/bin/env node
/**
 * public/ 里超过 MAX_MIB 的大文件压一压：
 *   音频 → OGG Opus（stem 不变，扩展名改 .ogg）
 *   PDF → Ghostscript /ebook preset（装了 gs 才行）
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  unlinkSync,
  renameSync,
  statSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { basename, extname, join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const MAX_MIB = Number(process.env.MAX_MIB || 25);
const MAX_BYTES = MAX_MIB * 1024 * 1024;
const DRY = process.argv.includes('--dry-run');

const AUDIO_EXT = new Set(['.mp3', '.flac', '.wav', '.m4a', '.aac']);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

function findBin(cmd, winPath) {
  if (spawnSync(cmd, ['-version'], { stdio: 'ignore' }).status === 0) return cmd;
  if (winPath && existsSync(winPath)) return winPath;
  return null;
}

const ffmpeg = findBin(
  FFMPEG,
  'F:\\ffmpeg-2026-04-19-git-de18feb0f0-essentials_build\\bin\\ffmpeg.exe'
);
const gswin =
  findBin('gswin64c', join(ROOT, 'tools', 'ghostscript', 'bin', 'gswin64c.exe')) ||
  findBin('gswin64c', 'C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe') ||
  findBin('gswin64c', 'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe') ||
  findBin('gswin64c', 'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe');

function walkFiles(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function targets() {
  return walkFiles(PUBLIC).filter((f) => statSync(f).size > MAX_BYTES);
}

function encodeAudio(inputPath) {
  if (!ffmpeg) {
    console.error('✗ 需要 ffmpeg 才能压缩音频');
    return false;
  }
  const ext = extname(inputPath).toLowerCase();
  const stem = basename(inputPath, ext);
  const dir = dirname(inputPath);
  const outPath = join(dir, `${stem}.ogg`);
  const tmp = join(dir, `${stem}.compressing.ogg`);
  const rel = relative(PUBLIC, inputPath).replace(/\\/g, '/');

  if (DRY) {
    console.log(`[dry] audio ${rel}`);
    return true;
  }
  if (existsSync(tmp)) unlinkSync(tmp);

  const bitrates = ['96k', '64k', '48k', '32k', '24k'];
  let ok = false;
  for (const br of bitrates) {
    const r = spawnSync(
      ffmpeg,
      ['-y', '-i', inputPath, '-vn', '-c:a', 'libopus', '-b:a', br, '-vbr', 'on', tmp],
      { stdio: 'inherit' }
    );
    if (r.status !== 0) continue;
    if (statSync(tmp).size <= MAX_BYTES) {
      ok = true;
      break;
    }
    console.warn(`  ↻ ${br} 仍超限，降码率…`);
    unlinkSync(tmp);
  }
  if (!ok) {
    console.error(`✗ 无法压到 ${MAX_MIB} MiB: ${rel}`);
    if (existsSync(tmp)) unlinkSync(tmp);
    return false;
  }

  if (existsSync(outPath) && outPath !== inputPath) unlinkSync(outPath);
  renameSync(tmp, outPath);
  if (inputPath !== outPath) unlinkSync(inputPath);

  console.log(
    `  ✓ ${relative(PUBLIC, outPath).replace(/\\/g, '/')} (${(statSync(outPath).size / 1024 / 1024).toFixed(2)} MiB)`
  );
  return true;
}

function compressPdf(inputPath) {
  const rel = relative(PUBLIC, inputPath).replace(/\\/g, '/');
  if (!gswin) {
    console.warn(`⚠ 跳过 PDF（未安装 Ghostscript）: ${rel}`);
    return false;
  }
  const tmp = join(dirname(inputPath), `${basename(inputPath, '.pdf')}.compressing.pdf`);
  if (DRY) {
    console.log(`[dry] pdf ${rel}`);
    return true;
  }
  const r = spawnSync(
    gswin,
    [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${tmp}`,
      inputPath,
    ],
    { stdio: 'inherit' }
  );
  if (r.status !== 0 || !existsSync(tmp)) {
    console.error(`✗ PDF 压缩失败: ${rel}`);
    if (existsSync(tmp)) unlinkSync(tmp);
    return false;
  }
  const newSize = statSync(tmp).size;
  if (newSize > MAX_BYTES) {
    console.warn(`⚠ PDF 仍大于 ${MAX_MIB} MiB (${(newSize / 1024 / 1024).toFixed(2)} MiB): ${rel}`);
    unlinkSync(tmp);
    return false;
  }
  unlinkSync(inputPath);
  renameSync(tmp, inputPath);
  console.log(`  ✓ ${rel} (${(newSize / 1024 / 1024).toFixed(2)} MiB)`);
  return true;
}

function updateVoiceTracks() {
  const p = join(ROOT, 'src', 'lib', 'voice-tracks.ts');
  let s = readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(/\.mp3'/g, ".ogg'");
  s = s.replace(/\.mp3"/g, '.ogg"');
  if (s !== before) {
    writeFileSync(p, s);
    console.log('✓ 已更新 src/lib/voice-tracks.ts (.mp3 → .ogg)');
  }
}

const list = targets();
if (list.length === 0) {
  console.log(`✅ public/ 中没有超过 ${MAX_MIB} MiB 的文件`);
  process.exit(0);
}

console.log(`处理 ${list.length} 个文件（上限 ${MAX_MIB} MiB）…`);
let ok = 0;
let audioTouched = false;
for (const full of list) {
  const ext = extname(full).toLowerCase();
  const rel = relative(PUBLIC, full).replace(/\\/g, '/');
  console.log(`▶ ${rel}`);
  if (AUDIO_EXT.has(ext)) {
    audioTouched = true;
    if (encodeAudio(full)) ok++;
  } else if (ext === '.pdf') {
    if (compressPdf(full)) ok++;
  } else {
    console.warn(`⚠ 不支持的类型: ${rel}`);
  }
}

if (audioTouched && !DRY) updateVoiceTracks();

console.log(`\n完成 ${ok}/${list.length}`);
if (ok < list.length) process.exit(1);
