#!/usr/bin/env node
/**
 * 从 GitHub 拉最新 obsidian-vault 到本地。
 * 场景：在别的机器写了笔记 push 了，回来这台先 pnpm vault:pull 再 dev。
 */
import { spawnSync, execSync } from 'node:child_process';

const VAULT = './obsidian-vault';

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

const dirty = runQuiet('git status --porcelain', VAULT);
if (dirty) {
  console.error('❌ obsidian-vault 有未提交的改动，请先 pnpm vault:sync 或手动处理：');
  console.error(dirty);
  process.exit(1);
}

const branch = runQuiet('git rev-parse --abbrev-ref HEAD', VAULT) || 'main';
console.log(`▌ 从 GitHub 拉取最新 obsidian-vault (branch=${branch})`);
run(`git fetch origin`, VAULT);
run(`git reset --hard origin/${branch}`, VAULT);

// 父 repo 的 submodule pointer 可能也变了
const parentDirty = runQuiet('git status --porcelain obsidian-vault');
if (parentDirty) {
  console.log('\n▌ 检测到 submodule pointer 变化，需要在父仓库 commit');
  console.log('   运行：git add obsidian-vault && git commit -m "chore: bump vault"');
}

// 顺手 sync assets + 重生 mtime manifest
run('pnpm prepare:vault');

console.log('\n✅ vault 拉取完成');
