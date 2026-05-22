#!/usr/bin/env node
/**
 * obsidian-vault 双向 sync — 把笔记子仓库和父 repo 对齐。
 *
 * 跑法：
 *   pnpm vault:sync
 *   pnpm vault:sync "新增机器学习笔记"   # 自己写 commit msg 也行
 *
 * 流程：本地有改动 → commit+push → fetch 远端 → fast-forward 拉下来 →
 * 重生 mtime / sync-meta → 父仓库更新 submodule pointer → push。
 */
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const SCRIPTS = path.join(ROOT, 'scripts');

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}` + (cwd ? ` (cwd=${cwd})` : ''));
  const r = spawnSync(cmd, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) throw new Error(`exit ${r.status}: ${cmd}`);
}

function runQuiet(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function shortHash(h) {
  return (h || '').slice(0, 8);
}

const customMsg = process.argv.slice(2).join(' ').trim();
const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 16);
const vaultMsg = customMsg || `chore: sync vault ${stamp}`;
const parentMsg = customMsg ? `chore(vault): ${customMsg}` : `chore(vault): sync submodule ${stamp}`;

console.log('═════════════════════════════════════════════════════════════');
console.log('  obsidian-vault 双向同步');
console.log('  消息:', vaultMsg);
console.log('═════════════════════════════════════════════════════════════');

let vaultChanged = false;

// Step 1 — vault 里有 dirty 文件就 commit + push
const vaultDirty = runQuiet('git status --porcelain', VAULT);
if (vaultDirty) {
  console.log('\n▌ Step 1: obsidian-vault 有未提交改动，推送到 GitHub');
  console.log(vaultDirty);
  run('git add -A', VAULT);
  run(`git commit -m "${vaultMsg.replace(/"/g, '\\"')}"`, VAULT);

  const branch = runQuiet('git rev-parse --abbrev-ref HEAD', VAULT) || 'main';
  console.log(`  current branch: ${branch}`);
  run(`git pull --rebase origin ${branch}`, VAULT);
  run(`git push origin ${branch}`, VAULT);
  vaultChanged = true;
} else {
  console.log('\n▌ Step 1: obsidian-vault 本地无未提交改动，跳过 push');
}

// Step 2 — 从 GitHub 拉最新（别的机器 push 的笔记也会进来）
console.log('\n▌ Step 2: 从 GitHub 拉取最新 obsidian-vault');
run('git fetch origin', VAULT);
const branch = runQuiet('git rev-parse --abbrev-ref HEAD', VAULT) || 'main';
const localHead = runQuiet('git rev-parse HEAD', VAULT);
const remoteHead = runQuiet(`git rev-parse origin/${branch}`, VAULT);

if (localHead && remoteHead && localHead !== remoteHead) {
  const isAncestor =
    spawnSync('git', ['merge-base', '--is-ancestor', localHead, remoteHead], { cwd: VAULT }).status === 0;
  if (isAncestor) {
    console.log(`  fast-forward ${shortHash(localHead)} → ${shortHash(remoteHead)}`);
    run(`git reset --hard origin/${branch}`, VAULT);
    vaultChanged = true;
  } else {
    console.error('\n❌ vault 与远端分叉，无法自动合并。请先手动处理：');
    console.error('   pnpm vault:pull   # 或进 obsidian-vault 手动 rebase');
    process.exit(1);
  }
} else {
  console.log('  已是最新');
}

// Step 3 — vault 有变动就重生 manifest
if (vaultChanged) {
  console.log('\n▌ Step 3: 重新生成 notes-mtime / vault-sync-meta');
  run(`node "${path.join(SCRIPTS, 'build-mtime-manifest.mjs')}"`, ROOT);
  run(`node "${path.join(SCRIPTS, 'build-vault-sync-meta.mjs')}"`, ROOT);
} else {
  console.log('\n▌ Step 3: vault 无变动，跳过 manifest 重建');
}

// Step 4 — 父仓库把 submodule pointer + meta 跟上
const parentDirty = runQuiet(
  'git status --porcelain obsidian-vault src/lib/notes-mtime.json src/lib/vault-sync-meta.json',
  ROOT
);
if (parentDirty) {
  console.log('\n▌ Step 4: 父仓库的 submodule pointer 需要更新');
  run('git add obsidian-vault src/lib/notes-mtime.json src/lib/vault-sync-meta.json', ROOT);
  run(`git commit -m "${parentMsg.replace(/"/g, '\\"')}"`, ROOT);
  const parentBranch = runQuiet('git rev-parse --abbrev-ref HEAD', ROOT) || 'main';
  run(`git pull --rebase --autostash origin ${parentBranch}`, ROOT);
  run(`git push origin ${parentBranch}`, ROOT);
} else {
  console.log('\n▌ Step 4: 父仓库 submodule pointer 已是最新');
}

console.log('\n═════════════════════════════════════════════════════════════');
console.log('✅ 同步完成');
console.log('   Cloudflare Pages 会在几分钟内自动重新部署。');
console.log('═════════════════════════════════════════════════════════════\n');
