#!/usr/bin/env node
/**
 * 构建前预处理脚本（本地 dev / build 都会跑，也是 Cloudflare Pages build 第一步）。
 *
 * 1. 校验 obsidian-vault submodule 存在并且不是空目录；空了就 git submodule update --init。
 * 2. 在浅克隆环境（Cloudflare/CI）里把 vault 的 git 历史展开成完整深度，
 *    这样 `git log --follow` 可以拿到每篇笔记的真实最后编辑时间。
 * 3. 把 vault 里的资源（图片/PDF/视频）扁平复制到 `public/vault-assets/`。
 * 4. 跑 `build-mtime-manifest.mjs` 输出 `src/lib/notes-mtime.json`。
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

// Step 1: 确保 vault submodule 已 checkout
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

// Step 2: 在浅克隆（CI/Cloudflare）里展开 vault 的 git 历史，让 git log --follow 可用
//   注意：Cloudflare Pages clone parent repo 时通常 --depth=20，submodule 也是 shallow。
//   git log --follow 在 shallow 克隆里只能看到极少几个 commit，无法准确拿到每篇笔记的
//   最后修改时间。所以这里 best-effort 跑 fetch --unshallow。如果环境不允许（已经是完整克隆
//   或网络受限），失败也无所谓 —— mtime manifest 后面有 fs.statSync 兜底。
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

// Step 3: 同步资源
runRequired('node', [path.join(SCRIPTS, 'sync-assets.mjs')]);

// Step 4: 生成 mtime manifest（git log + fs.statSync 双重读取）
runRequired('node', [path.join(SCRIPTS, 'build-mtime-manifest.mjs')]);

// Step 5: 扫描 public/video|picture|music 生成 media-manifest.json（背景 + 音乐播放器使用）
runRequired('node', [path.join(SCRIPTS, 'build-media-manifest.mjs')]);

// Step 6: 生成学习统计 stats.json（笔记数 / 字数 / 标签 / 月度趋势 / 热力图）
runRequired('node', [path.join(SCRIPTS, 'build-stats.mjs')]);

// Step 7: 扫描 [[wikilinks]] 双链：报告 + graph 数据
runRequired('node', [path.join(SCRIPTS, 'build-wikilinks.mjs')]);

console.log('✅ vault prepared.');
