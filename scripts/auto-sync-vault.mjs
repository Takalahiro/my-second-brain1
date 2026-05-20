#!/usr/bin/env node
/**
 * 每小时自动同步 obsidian-vault 子仓库的脚本。
 *
 * 工作流：
 *   1. vault 内有未提交改动 → git add + commit + push  ("vault auto: <stamp>")
 *   2. vault: fetch origin + 把本地 fast-forward 到 origin/main（如有 diverge 则跳过且记录）
 *   3. 重新生成 src/lib/notes-mtime.json
 *   4. 父仓库：仅当 submodule pointer 或 notes-mtime.json 改动时
 *      add obsidian-vault + add src/lib/notes-mtime.json → commit + push
 *      （只动这两个路径，不会误推你正在写的代码）
 *   5. 写入日志到 logs/auto-sync.log（保留最近 200 行）
 *
 * 设计原则：
 *   - 静默：默认无输出；--verbose 才打印过程
 *   - 安全：父仓库 add 只白名单两个文件，且远程必须 fast-forwardable，否则 abort
 *   - 幂等：无改动时是 no-op
 *   - 单飞：通过 lockfile 避免上一次还没跑完又开新一次
 *
 * 使用：
 *   node scripts/auto-sync-vault.mjs              # 静默
 *   node scripts/auto-sync-vault.mjs --verbose    # 看过程
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const LOG_DIR = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'auto-sync.log');
const LOCK_FILE = path.join(LOG_DIR, 'auto-sync.lock');
const VERBOSE = process.argv.includes('--verbose');

mkdirSync(LOG_DIR, { recursive: true });

// ──────────────── lockfile：防止重叠运行 ────────────────
if (existsSync(LOCK_FILE)) {
  const lockAge = Date.now() - Number(readFileSync(LOCK_FILE, 'utf8') || '0');
  if (lockAge < 30 * 60 * 1000) {
    log('skip', `another sync is running (lock age ${Math.round(lockAge / 1000)}s)`);
    process.exit(0);
  }
  // 锁文件超过 30 分钟视为僵尸，强行接管
  unlinkSync(LOCK_FILE);
}
writeFileSync(LOCK_FILE, String(Date.now()), 'utf8');
process.on('exit', () => {
  try {
    unlinkSync(LOCK_FILE);
  } catch {
    /* ignore */
  }
});

// ──────────────── utils ────────────────
function log(level, msg) {
  const stamp = new Date().toISOString();
  const line = `[${stamp}] ${level.padEnd(5)} ${msg}`;
  if (VERBOSE || level === 'ERROR') console.log(line);
  appendRolling(line);
}

function appendRolling(line) {
  let existing = '';
  if (existsSync(LOG_FILE)) {
    existing = readFileSync(LOG_FILE, 'utf8');
  }
  const lines = (existing + line + '\n').split('\n').slice(-200);
  writeFileSync(LOG_FILE, lines.join('\n'), 'utf8');
}

function git(args, cwd = ROOT, allowFail = false) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFail) return '';
    throw err;
  }
}

function gitRun(args, cwd = ROOT) {
  const r = spawnSync('git', args, { cwd, stdio: VERBOSE ? 'inherit' : 'pipe' });
  if (r.status !== 0) {
    throw new Error(`git ${args.join(' ')} exit ${r.status}\n${r.stderr?.toString() ?? ''}`);
  }
}

function shortHash(h) {
  return (h || '').slice(0, 8);
}

// ──────────────── main flow ────────────────
let summary = { upPushed: false, downPulled: false, parentPushed: false };

try {
  log('info', '── auto-sync run started ──');

  // 1. vault 内 dirty → commit + push
  const vaultDirty = git(['status', '--porcelain'], VAULT, true);
  if (vaultDirty) {
    log('info', `vault has local changes (${vaultDirty.split('\n').length} files), pushing up`);
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    gitRun(['add', '-A'], VAULT);
    gitRun(['commit', '-m', `vault auto: ${stamp}`], VAULT);
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], VAULT) || 'main';
    try {
      gitRun(['pull', '--rebase', 'origin', branch], VAULT);
    } catch (err) {
      log('ERROR', `vault rebase failed: ${err.message}`);
      throw err;
    }
    gitRun(['push', 'origin', branch], VAULT);
    summary.upPushed = true;
    log('info', `vault upstream pushed → ${shortHash(git(['rev-parse', 'HEAD'], VAULT))}`);
  }

  // 2. vault: fetch origin + fast-forward
  gitRun(['fetch', 'origin'], VAULT);
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], VAULT) || 'main';
  const localHead = git(['rev-parse', 'HEAD'], VAULT);
  const remoteHead = git(['rev-parse', `origin/${branch}`], VAULT);

  if (localHead !== remoteHead) {
    // 是否 fast-forward 可行
    const isAncestor = spawnSync('git', ['merge-base', '--is-ancestor', localHead, remoteHead], {
      cwd: VAULT,
    }).status === 0;
    if (isAncestor) {
      gitRun(['reset', '--hard', `origin/${branch}`], VAULT);
      summary.downPulled = true;
      log('info', `vault fast-forwarded ${shortHash(localHead)} → ${shortHash(remoteHead)}`);
    } else {
      log('WARN', `vault diverged from origin/${branch}; skipping reset to avoid data loss`);
    }
  }

  // 3. 重新生成 mtime manifest（即使没下行变化，也保证 manifest 跟当前 vault state 一致）
  if (summary.upPushed || summary.downPulled) {
    const r = spawnSync('node', [path.join(ROOT, 'scripts', 'build-mtime-manifest.mjs')], {
      cwd: ROOT,
      stdio: VERBOSE ? 'inherit' : 'pipe',
    });
    if (r.status !== 0) {
      log('WARN', 'mtime manifest generation failed');
    } else {
      log('info', 'mtime manifest regenerated');
    }
  }

  // 4. 父仓库：仅 commit 这两个白名单文件，且必须先 rebase 远端避免误推
  // 先看是否真的需要 commit
  const parentDirtyPaths = git(['status', '--porcelain', 'obsidian-vault', 'src/lib/notes-mtime.json'], ROOT, true);
  if (parentDirtyPaths) {
    log('info', `parent has whitelisted dirty paths:\n${parentDirtyPaths}`);
    // 先拉远端避免 push 被 rejected
    const parentBranch = git(['rev-parse', '--abbrev-ref', 'HEAD'], ROOT) || 'main';
    try {
      gitRun(['fetch', 'origin'], ROOT);
    } catch (err) {
      log('WARN', `parent fetch failed: ${err.message}`);
    }

    // 只 add 这两个路径，绝不 add -A
    gitRun(['add', '--', 'obsidian-vault', 'src/lib/notes-mtime.json'], ROOT);

    // 只有白名单内还真的有变化才 commit
    const cached = git(['diff', '--cached', '--name-only'], ROOT, true);
    if (cached) {
      const newVaultHash = shortHash(git(['rev-parse', 'HEAD'], VAULT));
      gitRun(['commit', '-m', `chore(vault): auto-sync to ${newVaultHash}`], ROOT);

      // rebase 远端（如果父仓库远端有别的 commit 比如手动推的代码）
      try {
        gitRun(['pull', '--rebase', '--autostash', 'origin', parentBranch], ROOT);
      } catch (err) {
        log('ERROR', `parent rebase failed: ${err.message}`);
        log('ERROR', 'manual intervention required, leaving commit in place');
        throw err;
      }

      gitRun(['push', 'origin', parentBranch], ROOT);
      summary.parentPushed = true;
      log('info', `parent submodule pointer pushed → ${shortHash(git(['rev-parse', 'HEAD'], ROOT))}`);
    } else {
      log('info', 'whitelisted paths had no real changes after staging, skipping commit');
    }
  }

  log('info', `── done. up=${summary.upPushed} down=${summary.downPulled} parent=${summary.parentPushed} ──`);
  process.exit(0);
} catch (err) {
  log('ERROR', err.message || String(err));
  process.exit(1);
}
