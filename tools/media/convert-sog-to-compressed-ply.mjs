#!/usr/bin/env node
// sog/ply -> compressed.ply，给 cloudflare 部署用（单文件要 <=25mib）
import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUBLIC, ROOT } from './paths.mjs';

const PLY_DIR = join(PUBLIC, 'ply');
const LIMIT = 25 * 1024 * 1024;
const args = process.argv.slice(2);

function listScenes() {
  if (!existsSync(PLY_DIR)) return [];
  const stems = new Set();
  for (const f of readdirSync(PLY_DIR)) {
    const ext = extname(f).toLowerCase();
    if (ext === '.sog' || ext === '.ply' || ext === '.spz') {
      stems.add(basename(f, ext));
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
    console.log('public/ply 没东西可转');
    return;
  }

  for (const scene of scenes) {
    const inPath = pickInput(scene);
    const outPath = join(PLY_DIR, `${scene}.compressed.ply`);
    if (!inPath) {
      console.warn(`skip ${scene}: 缺 sog/ply`);
      continue;
    }
    const cli = ['--yes', '@playcanvas/splat-transform'];
    if (existsSync(outPath)) cli.push('-w');
    cli.push(inPath, outPath);
    console.log(`${basename(inPath)} -> ${scene}.compressed.ply`);
    const r = spawnSync('npx', cli, { stdio: 'inherit', shell: true, cwd: ROOT });
    if (r.status !== 0) {
      console.error(`${scene} 失败`);
      process.exitCode = 1;
      continue;
    }
    const { size } = statSync(outPath);
    const mib = (size / 1024 / 1024).toFixed(2);
    if (size > LIMIT) {
      console.error(`${scene}.compressed.ply 超 25mib (${mib})`);
      process.exitCode = 1;
    } else {
      console.log(`ok ${scene}.compressed.ply ${mib} mib`);
    }
  }

  console.log('下一步: node tools/media/build-manifest.mjs');
}

main();
