import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * 必须与 src/lib/slugify.ts 的 slugify() 保持一致，
 * 也必须与 Astro 6 glob loader 的 id 归一化一致：
 * 小写、去括号、空格变 -。
 */
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s/g, '-');
}

/**
 * 同步扫描 vault，生成所有笔记的 slug 列表，供 remark-wiki-link 的 permalinks 使用。
 */
export function getPermalinks(dir = './obsidian-vault') {
  const result = [];
  function walk(d) {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const full = join(d, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
      } else if (extname(entry).toLowerCase() === '.md') {
        const name = entry.replace(/\.md$/i, '');
        result.push(slugify(name));
      }
    }
  }
  walk(dir);
  return result;
}
