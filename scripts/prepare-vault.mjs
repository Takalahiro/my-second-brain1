#!/usr/bin/env node
/**
 * build 前预处理 — local dev / CI / Cloudflare Pages 第一步都会跑这个。
 *
 * 干的事：确认 vault submodule 不是空的 → 浅 clone 就 unshallow 一下（让 git log 能用）→
 * sync assets → 生成 notes-mtime.json → media-manifest / stats / wikilinks。
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const SCRIPTS = path.join(ROOT, 'scripts');

function tryRun(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return r.status === 0;
}

function runRequired(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    console.error(`✗ command failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

// Step 1 — vault submodule 得 checkout 出来
const vaultEmpty = !existsSync(VAULT) || readdirSync(VAULT).length === 0;
if (vaultEmpty) {
  console.log('▌ vault submodule 为空，运行 git submodule update --init --recursive ...');
  const ok = tryRun('git', ['submodule', 'update', '--init', '--recursive'], { cwd: ROOT });
  if (!ok) {
    console.error('✗ 无法初始化 obsidian-vault submodule。');
    console.error('  本地：手动运行 `git submodule update --init --recursive`');
    console.error('  Cloudflare Pages：在 Settings → Build & deploy 里启用 "Include git submodules"');
    process.exit(1);
  }
}

// Step 2 — CI/Cloudflare 经常是 shallow clone，git log --follow 几乎没用
//   这里 best-effort unshallow；失败了也无所谓，后面 fs mtime 会兜底
const isShallow = (() => {
  try {
    return execSync('git rev-parse --is-shallow-repository', { cwd: VAULT })
      .toString().trim() === 'true';
  } catch {
    return false;
  }
})();

if (isShallow) {
  console.log('▌ vault 是浅克隆，尝试展开历史以便准确读取每篇笔记的更新时间 ...');
  const ok = tryRun('git', ['fetch', '--unshallow'], { cwd: VAULT });
  if (!ok) console.warn('  ⚠ unshallow 失败，将退回到文件 mtime 作为兜底');
}

// Step 3 — 图片/PDF/视频 flat copy 到 public/vault-assets/
runRequired('node', [path.join(SCRIPTS, 'sync-assets.mjs')]);

// Step 4 — notes-mtime.json（git log + fs.stat 双保险）
runRequired('node', [path.join(SCRIPTS, 'build-mtime-manifest.mjs')]);

// Step 5 — public/video|picture|music → media-manifest.json（背景 + 播放器用）
runRequired('node', [path.join(SCRIPTS, 'build-media-manifest.mjs')]);

// Step 6 — stats.json（笔记数 / 字数 / tags / heatmap 那些）
runRequired('node', [path.join(SCRIPTS, 'build-stats.mjs')]);

// Step 7 — wikilinks scan → graph 数据 + 报告
runRequired('node', [path.join(SCRIPTS, 'build-wikilinks.mjs')]);

console.log('✅ vault prepared.');
