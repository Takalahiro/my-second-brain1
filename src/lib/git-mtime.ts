/**
 * 笔记最后更新时间。
 *
 * 取数策略（按优先级）：
 *   1. 构建期生成的 `src/lib/notes-mtime.json` manifest
 *      （由 `scripts/build-mtime-manifest.mjs` 写出，包含每篇 .md 的 ISO 时间字符串）
 *   2. 实时跑 `git log --follow`（本地完整克隆时是真值；CI 浅克隆里几乎肯定为空）
 *   3. 文件系统 mtime（兜底；fresh CI checkout 里都是 clone 时刻，所以仅用于本地）
 *
 * 因为站点是静态站，所以这只在构建期 / SSR 调用，每个文件查一次即缓存。
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import manifest from './notes-mtime.json' with { type: 'json' };

const VAULT_DIR = path.resolve(process.cwd(), 'obsidian-vault');
const cache = new Map<string, Date | null>();
const manifestMap = manifest as Record<string, string>;

let warnedGitMissing = false;

/**
 * 给 collection note 取最后更新时间。
 *
 * Astro 6 提供的 `note.filePath` 是相对 process.cwd() 的路径（如 `obsidian-vault/MATH/foo.md`）。
 * 该函数也容忍：
 *   - 绝对路径
 *   - vault 内相对路径（如 `MATH/foo.md` 或不带 .md 后缀）
 */
export function getNoteLastUpdated(filePath: string | undefined): Date | null {
  if (!filePath) return null;

  let absPath: string;
  if (path.isAbsolute(filePath)) {
    absPath = filePath;
  } else {
    const fromCwd = path.resolve(process.cwd(), filePath);
    absPath = fromCwd.startsWith(VAULT_DIR) ? fromCwd : path.join(VAULT_DIR, filePath);
  }
  if (!absPath.toLowerCase().endsWith('.md')) absPath += '.md';
  const relToVault = path.relative(VAULT_DIR, absPath).replace(/\\/g, '/');

  if (cache.has(relToVault)) return cache.get(relToVault)!;

  let result: Date | null = null;

  // 1. manifest
  const fromManifest = manifestMap[relToVault];
  if (fromManifest) {
    const d = new Date(fromManifest);
    if (!Number.isNaN(d.getTime())) result = d;
  }

  // 2. live git log
  if (!result) {
    try {
      const out = execFileSync(
        'git',
        ['log', '-1', '--follow', '--format=%cI', '--', relToVault],
        { cwd: VAULT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      ).trim();
      if (out) result = new Date(out);
    } catch (err) {
      if (!warnedGitMissing) {
        warnedGitMissing = true;
        console.warn('[git-mtime] git log 不可用，回退到文件 mtime：', (err as Error).message);
      }
    }
  }

  // 3. fs mtime
  if (!result) {
    try {
      const st = statSync(absPath);
      result = st.mtime;
    } catch {
      result = null;
    }
  }

  cache.set(relToVault, result);
  return result;
}

/** 友好显示：YYYY-MM-DD HH:mm */
export function formatLastUpdated(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
