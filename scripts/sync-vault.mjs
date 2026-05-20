#!/usr/bin/env node
/**
 * obsidian-vault 双向同步脚本
 *
 * 使用：
 *   pnpm vault:sync                          # 自动消息
 *   pnpm vault:sync "新增机器学习笔记"        # 自定义消息
 *
 * 它会：
 *   1. 在 obsidian-vault 内：git add → git commit → git push（如果有未提交改动）
 *   2. 拉取 vault 的远程最新版（避免被本地落后版本覆盖）
 *   3. 在父仓库内：把更新的 submodule pointer commit 上去
 *   4. 触发 Cloudflare Pages 重新部署（push 到父仓库 main 即可）
 */
import { execSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const VAULT = './obsidian-vault';

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}` + (cwd ? ` (cwd=${cwd})` : ''));
  const r = spawnSync(cmd, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) throw new Error(`exit ${r.status}: ${cmd}`);
}

function runQuiet(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8' }).trim();
  } catch (e) {
    return '';
  }
}

const customMsg = process.argv.slice(2).join(' ').trim();
const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 16);
const vaultMsg = customMsg || `chore: sync vault ${stamp}`;
const parentMsg = customMsg ? `chore(vault): ${customMsg}` : `chore(vault): sync submodule ${stamp}`;

console.log('═════════════════════════════════════════════════════════════');
console.log('  obsidian-vault 同步');
console.log('  消息:', vaultMsg);
console.log('═════════════════════════════════════════════════════════════');

// ── Step 1: vault 内 commit + push
const vaultDirty = runQuiet('git status --porcelain', VAULT);
if (vaultDirty) {
  console.log('\n▌ Step 1: obsidian-vault 有未提交改动');
  console.log(vaultDirty);
  run('git add -A', VAULT);
  run(`git commit -m "${vaultMsg.replace(/"/g, '\\"')}"`, VAULT);

  // 先拉远程避免冲突
  const branch = runQuiet('git rev-parse --abbrev-ref HEAD', VAULT) || 'main';
  console.log(`  current branch: ${branch}`);
  run(`git pull --rebase origin ${branch}`, VAULT);
  run(`git push origin ${branch}`, VAULT);
} else {
  console.log('\n▌ Step 1: obsidian-vault 没有改动，跳过');
}

// ── Step 2: 父仓库更新 submodule pointer
const parentDirty = runQuiet('git status --porcelain obsidian-vault');
if (parentDirty) {
  console.log('\n▌ Step 2: 父仓库的 submodule pointer 需要更新');
  run('git add obsidian-vault');
  run(`git commit -m "${parentMsg.replace(/"/g, '\\"')}"`);
  const parentBranch = runQuiet('git rev-parse --abbrev-ref HEAD') || 'main';
  run(`git push origin ${parentBranch}`);
} else {
  console.log('\n▌ Step 2: 父仓库 submodule pointer 已是最新');
}

console.log('\n═════════════════════════════════════════════════════════════');
console.log('✅ 同步完成');
console.log('   Cloudflare Pages 会在几分钟内自动重新部署。');
console.log('═════════════════════════════════════════════════════════════\n');
