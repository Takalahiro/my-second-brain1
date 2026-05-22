#!/usr/bin/env node
/**
 * 每小时自动 sync obsidian-vault — cron / Task Scheduler 挂着跑就行。
 *
 * 流程：vault dirty → commit+push → fetch + fast-forward → 重生 notes-mtime.json →
 * 父仓库只 commit 白名单两个 path（obsidian-vault + notes-mtime.json）→ push。
 * 日志滚在 logs/auto-sync.log，最近 200 行。
 *
 * 设计取向：默认静默（--verbose 才啰嗦）、add 只碰白名单、lockfile 防重叠跑、无改动就 no-op。
 *
 *   node scripts/auto-sync-vault.mjs
 *   node scripts/auto-sync-vault.mjs --verbose
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

// lockfile — 上一次还没跑完就别叠跑
if (existsSync(LOCK_FILE)) {
  const lockAge = Date.now() - Number(readFileSync(LOCK_FILE, 'utf8') || '0');
  if (lockAge < 30 * 60 * 1000) {
    log('skip', `another sync is running (lock age ${Math.round(lockAge / 1000)}s)`);
    process.exit(0);
  }
  // 锁超过 30min 当僵尸锁，强行接管
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

// ── helpers ──
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

// ── main ──
let summary = { upPushed: false, downPulled: false, parentPushed: false };

try {
  log('info', '── auto-sync run started ──');

  // 1. vault dirty → push upstream
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

  // 2. fetch + fast-forward（diverge 就 skip，别硬 reset 丢数据）
  gitRun(['fetch', 'origin'], VAULT);
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], VAULT) || 'main';
  const localHead = git(['rev-parse', 'HEAD'], VAULT);
  const remoteHead = git(['rev-parse', `origin/${branch}`], VAULT);

  if (localHead !== remoteHead) {
    // local 是 remote 的 ancestor 才能 ff
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

  // 3. vault 有变动就重生 mtime manifest（没变动也 OK，保证和当前 state 一致）
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

  // 4. 父仓库 — 只 stage 白名单两个 path，push 前先 rebase
  // 先看 whitelist path 有没有真的 dirty
  const parentDirtyPaths = git(['status', '--porcelain', 'obsidian-vault', 'src/lib/notes-mtime.json'], ROOT, true);
  if (parentDirtyPaths) {
    log('info', `parent has whitelisted dirty paths:\n${parentDirtyPaths}`);
    // fetch 一下，别 push 撞 remote
    const parentBranch = git(['rev-parse', '--abbrev-ref', 'HEAD'], ROOT) || 'main';
    try {
      gitRun(['fetch', 'origin'], ROOT);
    } catch (err) {
      log('WARN', `parent fetch failed: ${err.message}`);
    }

    // 绝对不要 git add -A，只 add 这两个
    gitRun(['add', '--', 'obsidian-vault', 'src/lib/notes-mtime.json'], ROOT);

    // staged 里还有 diff 才 commit
    const cached = git(['diff', '--cached', '--name-only'], ROOT, true);
    if (cached) {
      const newVaultHash = shortHash(git(['rev-parse', 'HEAD'], VAULT));
      gitRun(['commit', '-m', `chore(vault): auto-sync to ${newVaultHash}`], ROOT);

      // 父 repo remote 上可能还有别的 commit（比如你手推的代码），rebase 一下
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
