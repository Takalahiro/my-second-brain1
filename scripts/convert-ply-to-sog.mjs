#!/usr/bin/env node
/**
 * 将 public/ply/*.ply 批量转为 *.sog（PlayCanvas SOG v2）
 * 需要: npx @playcanvas/splat-transform
 * 用法: node scripts/convert-ply-to-sog.mjs [scene...]
 */
import { existsSync, readdirSync } from 'node:fs';
import { basename, extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PLY_DIR = join(ROOT, 'public', 'ply');
const args = process.argv.slice(2);

function listPly() {
  if (!existsSync(PLY_DIR)) return [];
  return readdirSync(PLY_DIR)
    .filter((f) => extname(f).toLowerCase() === '.ply')
    .map((f) => basename(f, '.ply'));
}

async function main() {
  const scenes = args.length ? args : listPly();
  if (!scenes.length) {
    console.log('public/ply 下没有 .ply 文件');
    return;
  }

  for (const scene of scenes) {
    const inPath = join(PLY_DIR, `${scene}.ply`);
    const outPath = join(PLY_DIR, `${scene}.sog`);
    if (!existsSync(inPath)) {
      console.warn(`跳过 ${scene}: 缺少 ${inPath}`);
      continue;
    }
    if (existsSync(outPath)) {
      console.log(`已有 ${scene}.sog，跳过`);
      continue;
    }
    console.log(`转换 ${scene}.ply → ${scene}.sog …`);
    const r = spawnSync(
      'npx',
      ['--yes', '@playcanvas/splat-transform', inPath, outPath],
      { stdio: 'inherit', shell: true, cwd: ROOT },
    );
    if (r.status !== 0) {
      console.error(`❌ ${scene} 转换失败 (code ${r.status})`);
      process.exitCode = 1;
    } else {
      console.log(`✅ ${scene}.sog`);
    }
  }

  console.log('完成后请运行:');
  console.log('  node scripts/convert-sog-to-compressed-ply.mjs');
  console.log('  node scripts/build-media-manifest.mjs');
}

main();
