#!/usr/bin/env node
/**
 * 扫 vault 里所有 .md，生成 src/lib/notes-mtime.json（path → ISO 时间戳）。
 *
 * 时间从哪来：优先 git log --follow（rename 也能跟），拿不到就用 fs mtime 兜底。
 * SSR 时 git-mtime.ts 直接读这个文件 — 浅 clone 环境下至少不会所有笔记显示同一个时间。
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
