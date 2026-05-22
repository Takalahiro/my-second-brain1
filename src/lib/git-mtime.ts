// 笔记最后更新时间
//
// 取数顺序（谁先有就用谁）：
//   1. 构建期生成的 src/lib/notes-mtime.json（scripts/build-mtime-manifest.mjs 写的）
//   2. 现场跑 git log --follow（本地完整克隆靠谱；CI 浅克隆基本空）
//   3. 文件系统 mtime（兜底；fresh checkout 全是 clone 时刻，主要本地用）
//
// 静态站只在 build / SSR 调，查过就缓存
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import path from 'node:path';
import manifest from './notes-mtime.json' with { type: 'json' };

const VAULT_DIR = path.resolve(process.cwd(), 'obsidian-vault');
const cache = new Map<string, Date | null>();
const manifestMap = manifest as Record<string, string>;

let warnedGitMissing = false;

// 给 collection note 取最后更新时间
//
// Astro 6 的 note.filePath 相对 cwd（如 obsidian-vault/MATH/foo.md）
// 也兼容绝对路径、vault 内相对路径（MATH/foo.md 或没带 .md 后缀）
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

// 展示格式：YYYY-MM-DD HH:mm
export function formatLastUpdated(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}
