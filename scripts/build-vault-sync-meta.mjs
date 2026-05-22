#!/usr/bin/env node
/**
 * 写 src/lib/vault-sync-meta.json — 笔记页展示「上次/下次同步」用。
 * lastSyncedAt 取 vault submodule HEAD 的 commit 时间。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const OUT = path.join(ROOT, 'src', 'lib', 'vault-sync-meta.json');

/** 自动同步间隔：Windows 计划任务 hourly + GitHub Actions 10min，UI 取较快的 10 分钟 */
const SYNC_INTERVAL_MINUTES = 10;

function git(args) {
  try {
    return execFileSync('git', args, { cwd: VAULT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const commit = git(['rev-parse', 'HEAD']) || null;
const lastSyncedAt = git(['log', '-1', '--format=%cI']) || new Date().toISOString();
const shortHash = commit ? commit.slice(0, 8) : null;

const meta = {
  lastSyncedAt,
  vaultCommit: shortHash,
  syncIntervalMinutes: SYNC_INTERVAL_MINUTES,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(meta, null, 2) + '\n');
console.log(`✅ vault-sync-meta.json: last=${lastSyncedAt.slice(0, 16)} commit=${shortHash}`);
