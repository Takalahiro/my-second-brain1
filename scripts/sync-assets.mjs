import { cp, mkdir, readdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';

const VAULT = './obsidian-vault';
const TARGET = './public/vault-assets';
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf', '.mp4', '.webm']);

async function walk(dir, base) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, base);
    } else if (EXTS.has(extname(e.name).toLowerCase())) {
      // 扁平复制：所有图片直接放到 public/vault-assets/ 下（用文件名查找）
      const dest = join(TARGET, e.name);
      await mkdir(dirname(dest), { recursive: true });
      await cp(full, dest);
    }
  }
}

await mkdir(TARGET, { recursive: true });
await walk(VAULT, VAULT);
console.log('✅ Assets synced to', TARGET);
