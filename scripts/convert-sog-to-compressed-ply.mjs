#!/usr/bin/env node
/**
 * 将 public/ply/*.sog（或 *.ply）转为 PlayCanvas 压缩 PLY（*.compressed.ply）。
 * 单文件 ~18 MiB，≤ Cloudflare 25 MiB 限制；@mkkellogg/gaussian-splats-3d 原生支持。
 *
 * 用法: node scripts/convert-sog-to-compressed-ply.mjs [scene...]
 */
import { existsSync, readdirSync } from 'node:fs';
import { statSync } from 'node:fs';
import { basename, extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLY_DIR = join(ROOT, 'public', 'ply');
const LIMIT = 25 * 1024 * 1024;
const args = process.argv.slice(2);

function listScenes() {
  if (!existsSync(PLY_DIR)) return [];
  const stems = new Set();
  for (const f of readdirSync(PLY_DIR)) {
    const ext = extname(f).toLowerCase();
    if (ext === '.sog' || ext === '.ply' || ext === '.compressed.ply') {
      const stem = f.replace(/\.(compressed\.ply|sog|ply)$/i, '');
      stems.add(stem);
    }
  }
  return [...stems].sort((a, b) => a.localeCompare(b, 'zh-Hans'));
}

function pickInput(scene) {
  for (const ext of ['.sog', '.ply']) {
    const p = join(PLY_DIR, `${scene}${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

function main() {
  const scenes = args.length ? args : listScenes();
  if (!scenes.length) {
    console.log('public/ply 下没有可转换的场景');
    return;
  }

  for (const scene of scenes) {
    const inPath = pickInput(scene);
    const outPath = join(PLY_DIR, `${scene}.compressed.ply`);
    if (!inPath) {
      console.warn(`跳过 ${scene}: 缺少 .sog 或 .ply`);
      continue;
    }
    const overwrite = existsSync(outPath);
    console.log(`转换 ${basename(inPath)} → ${scene}.compressed.ply …`);
    const cliArgs = ['--yes', '@playcanvas/splat-transform'];
    if (overwrite) cliArgs.push('-w');
    cliArgs.push(inPath, outPath);
    const r = spawnSync('npx', cliArgs, { stdio: 'inherit', shell: true, cwd: ROOT });
    if (r.status !== 0) {
      console.error(`❌ ${scene} 转换失败 (code ${r.status})`);
      process.exitCode = 1;
      continue;
    }
    const { size } = statSync(outPath);
    const mib = (size / 1024 / 1024).toFixed(2);
    if (size > LIMIT) {
      console.error(`❌ ${scene}.compressed.ply 超过 25 MiB (${mib} MiB)`);
      process.exitCode = 1;
    } else {
      console.log(`✅ ${scene}.compressed.ply (${mib} MiB)`);
    }
  }

  console.log('完成后请运行: node scripts/build-media-manifest.mjs');
}

main();
