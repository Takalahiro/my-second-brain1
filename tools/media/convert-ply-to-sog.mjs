#!/usr/bin/env node
// ply -> sog，要装 @playcanvas/splat-transform
import { existsSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PUBLIC, ROOT } from './paths.mjs';

const PLY_DIR = join(PUBLIC, 'ply');
const args = process.argv.slice(2);

function listPly() {
  if (!existsSync(PLY_DIR)) return [];
  return readdirSync(PLY_DIR)
    .filter((f) => extname(f).toLowerCase() === '.ply')
    .map((f) => basename(f, '.ply'));
}

function main() {
  const scenes = args.length ? args : listPly();
  if (!scenes.length) {
    console.log('public/ply 里没有 ply');
    return;
  }

  for (const scene of scenes) {
    const inPath = join(PLY_DIR, `${scene}.ply`);
    const outPath = join(PLY_DIR, `${scene}.sog`);
    if (!existsSync(inPath)) {
      console.warn(`skip ${scene}: 没有 ${inPath}`);
      continue;
    }
    if (existsSync(outPath)) {
      console.log(`${scene}.sog 有了，跳过`);
      continue;
    }
    console.log(`${scene}.ply -> ${scene}.sog`);
    const r = spawnSync(
      'npx',
      ['--yes', '@playcanvas/splat-transform', inPath, outPath],
      { stdio: 'inherit', shell: true, cwd: ROOT },
    );
    if (r.status !== 0) {
      console.error(`${scene} 失败 code=${r.status}`);
      process.exitCode = 1;
    }
  }

  console.log('下一步: node tools/media/convert-sog-to-compressed-ply.mjs');
}

main();
