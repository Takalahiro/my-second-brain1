import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const VAULT = './obsidian-vault';

async function tree(dir, depth = 0, maxDepth = 6) {
  if (depth > maxDepth) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const dirs = [];
  const files = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) dirs.push(e.name);
    else if (extname(e.name).toLowerCase() === '.md') files.push(e.name);
  }
  return { dir, depth, dirs, files };
}

// 收集每个文件夹的直接 .md 文件和子文件夹
async function walk(dir, results = []) {
  const node = await tree(dir);
  results.push(node);
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) await walk(join(dir, e.name), results);
  }
  return results;
}

const all = await walk(VAULT);

console.log('=== 根目录下散落的笔记（不在任何子文件夹里）===\n');
const topLevel = all.filter((n) => n.dir === VAULT)[0];
if (topLevel) {
  console.log(`${VAULT}/`);
  console.log(`  子目录: ${topLevel.dirs.join(' | ')}`);
  console.log(`  直接 .md 文件 (${topLevel.files.length}): ${topLevel.files.join(' | ')}`);
}

console.log('\n=== 每个一级根目录下的"散落笔记"（直接在根目录里，不在子文件夹）===\n');
for (const topDir of topLevel.dirs) {
  const fullPath = join(VAULT, topDir);
  const node = all.find((n) => n.dir === fullPath);
  if (!node) continue;
  console.log(`📁 ${topDir}/`);
  console.log(`   子目录 (${node.dirs.length}): ${node.dirs.join(' | ') || '（无）'}`);
  console.log(`   ⚠️ 散落 .md (${node.files.length}): ${node.files.join(' | ') || '（无）'}`);
  if (node.files.length > 0) {
    console.log(`   👉 建议把这 ${node.files.length} 篇笔记移入合适的二级文件夹`);
  }
  console.log();
}

console.log('\n=== 各二级目录下的笔记数 ===\n');
for (const node of all) {
  const rel = node.dir.replace(VAULT + '/', '').replace(VAULT + '\\', '').replace(VAULT, '');
  if (!rel) continue;
  if (node.files.length > 0) {
    console.log(`  ${rel}: ${node.files.length} 篇`);
  }
}
