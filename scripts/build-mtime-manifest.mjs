#!/usr/bin/env node
/**
 * 扫描 obsidian-vault 内所有 .md，输出 `src/lib/notes-mtime.json`。
 *
 *   { "path/to/foo.md": "2026-05-20T14:30:46+08:00", ... }
 *
 * 取数策略（依次尝试）：
 *   1. `git log -1 --follow --format=%cI -- <path>`（最准确，能跨越重命名）
 *   2. 文件系统 mtime（fresh checkout 时是 clone 时间；本地是真实编辑时间）
 *
 * 该 manifest 会被 `src/lib/git-mtime.ts` 在 SSR 阶段直接读取，
 * 这样即便部署环境是浅克隆（拿不到完整 git log），最后更新时间也至少不会全部相同。
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const OUT = path.join(ROOT, 'src', 'lib', 'notes-mtime.json');

function walk(dir, base, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.name.toLowerCase().endsWith('.md')) {
      out.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return out;
}

function gitMtime(relPath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '-1', '--follow', '--format=%cI', '--', relPath],
      { cwd: VAULT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

function fsMtime(relPath) {
  try {
    return statSync(path.join(VAULT, relPath)).mtime.toISOString();
  } catch {
    return null;
  }
}

const files = walk(VAULT, VAULT);
const manifest = {};
let withGit = 0;
let withFs = 0;
for (const rel of files) {
  const t = gitMtime(rel);
  if (t) {
    manifest[rel] = t;
    withGit++;
  } else {
    const f = fsMtime(rel);
    if (f) {
      manifest[rel] = f;
      withFs++;
    }
  }
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');

console.log(
  `✅ notes-mtime.json: ${files.length} notes (git=${withGit}, fs=${withFs}, missing=${
    files.length - withGit - withFs
  })`
);
