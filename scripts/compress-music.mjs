#!/usr/bin/env node
/**
 * 将 public/music 下过大的音频压缩为 OGG Opus（单文件 ≤ maxMiB）。
 * 默认只处理超过 25 MiB 的文件；--all-flac 可转换全部 .flac。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, unlinkSync, renameSync, statSync } from 'node:fs';
import { basename, extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MUSIC = join(ROOT, 'public', 'music');
const MAX_MIB = Number(process.env.MAX_MIB || 25);
const MAX_BYTES = MAX_MIB * 1024 * 1024;
const ALL_FLAC = process.argv.includes('--all-flac');

const FFMPEG = process.env.FFMPEG || 'ffmpeg';

function findFfmpeg() {
  if (spawnSync(FFMPEG, ['-version'], { stdio: 'ignore' }).status === 0) return FFMPEG;
  const win = 'F:\\ffmpeg-2026-04-19-git-de18feb0f0-essentials_build\\bin\\ffmpeg.exe';
  if (existsSync(win)) return win;
  console.error('✗ 未找到 ffmpeg，请安装或设置 FFMPEG 环境变量');
  process.exit(1);
}

const ffmpeg = findFfmpeg();

function listTargets() {
  return readdirSync(MUSIC, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => {
      const ext = extname(name).toLowerCase();
      const full = join(MUSIC, name);
      const { size } = statSync(full);
      if (ext === '.flac' && ALL_FLAC) return true;
      return size > MAX_BYTES;
    });
}

function encodeOne(inputName) {
  const input = join(MUSIC, inputName);
  const stem = basename(inputName, extname(inputName));
  const outName = `${stem}.ogg`;
  const output = join(MUSIC, outName);
  const tmp = join(MUSIC, `${stem}.compressing.ogg`);

  if (existsSync(tmp)) unlinkSync(tmp);

  // Opus VBR，音质与体积平衡；一般 4–5 分钟流行歌约 4–8 MiB
  const args = [
    '-y',
    '-i',
    input,
    '-vn',
    '-c:a',
    'libopus',
    '-b:a',
    '192k',
    '-vbr',
    'on',
    '-compression_level',
    '10',
    tmp,
  ];

  console.log(`▶ ${inputName} → ${outName}`);
  const r = spawnSync(ffmpeg, args, { stdio: 'inherit', encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`✗ 转码失败: ${inputName}`);
    if (existsSync(tmp)) unlinkSync(tmp);
    return false;
  }

  const { size } = statSync(tmp);
  if (size > MAX_BYTES) {
    console.warn(`⚠ ${outName} 仍大于 ${MAX_MIB} MiB (${(size / 1024 / 1024).toFixed(2)} MiB)，尝试 128k…`);
    unlinkSync(tmp);
    const r2 = spawnSync(
      ffmpeg,
      ['-y', '-i', input, '-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', tmp],
      { stdio: 'inherit' }
    );
    if (r2.status !== 0 || statSync(tmp).size > MAX_BYTES) {
      console.error(`✗ 无法压到 ${MAX_MIB} MiB 以内: ${inputName}`);
      if (existsSync(tmp)) unlinkSync(tmp);
      return false;
    }
  }

  if (existsSync(output) && output !== input) unlinkSync(output);
  renameSync(tmp, output);

  if (extname(inputName).toLowerCase() === '.flac' && input !== output) {
    unlinkSync(input);
  } else if (inputName !== outName) {
    unlinkSync(input);
  }

  const final = statSync(output);
  console.log(`  ✓ ${(final.size / 1024 / 1024).toFixed(2)} MiB`);
  return true;
}

const targets = listTargets();
if (targets.length === 0) {
  console.log(`✅ 没有超过 ${MAX_MIB} MiB 的文件需要处理`);
  process.exit(0);
}

console.log(`压缩 ${targets.length} 个文件（上限 ${MAX_MIB} MiB/首）…`);
let ok = 0;
for (const name of targets) {
  if (encodeOne(name)) ok++;
}
console.log(`\n完成 ${ok}/${targets.length}`);

if (ok < targets.length) process.exit(1);
