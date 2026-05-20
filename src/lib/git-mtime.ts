/**
 * 笔记最后更新时间。
 *
 * 优先级：
 *   1. git log --follow 中该文件的最后一次提交时间（包括重命名/移动历史）
 *   2. 文件系统 mtime（未入库时的兜底）
 *
 * 因为站点是静态站，所以这只在构建期（SSR / `astro build`）调用。
 * 对每个文件只查一次，结果在内存里缓存。
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';

const VAULT_DIR = path.resolve(process.cwd(), 'obsidian-vault');
const cache = new Map<string, Date | null>();

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
    // 先按 cwd 解析（Astro filePath 走这条），不存在再回退到 VAULT_DIR
    const fromCwd = path.resolve(process.cwd(), filePath);
    absPath = fromCwd.startsWith(VAULT_DIR) ? fromCwd : path.join(VAULT_DIR, filePath);
  }
  if (!absPath.toLowerCase().endsWith('.md')) absPath += '.md';
  const relToVault = path.relative(VAULT_DIR, absPath).replace(/\\/g, '/');

  if (cache.has(relToVault)) return cache.get(relToVault)!;

  let result: Date | null = null;
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
