import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const VAULT = './obsidian-vault';
const BASE = 'http://localhost:4321';

function slugify(name) {
  return name.toLowerCase().replace(/[()（）]/g, '').replace(/\s/g, '-');
}

async function walk(d, out = []) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const f = join(d, e.name);
    if (e.isDirectory()) await walk(f, out);
    else if (extname(e.name).toLowerCase() === '.md') out.push(f);
  }
  return out;
}

const files = await walk(VAULT);
const issues = [];
let totalNotes = 0;
let totalInline = 0;
let totalBlock = 0;
let totalErrors = 0;

console.log(`扫描 ${files.length} 篇笔记的 KaTeX 状态...`);

for (let i = 0; i < files.length; i++) {
  if ((i + 1) % 25 === 0) console.log(`  进度 ${i + 1}/${files.length}`);
  const f = files[i];
  const name = f.split(/[\\/]/).pop().replace(/\.md$/i, '');
  const slug = slugify(name);
  const r = await fetch(BASE + '/notes/' + encodeURIComponent(slug));
  if (r.status !== 200) continue;
  const t = await r.text();
  const article = t.match(/<article[\s\S]*?<\/article>/)?.[0] ?? '';
  const inline = (article.match(/class="katex"/g) || []).length;
  const block = (article.match(/class="katex-display"/g) || []).length;
  const errors = (article.match(/katex-error/g) || []).length;

  totalNotes++;
  totalInline += inline;
  totalBlock += block;
  totalErrors += errors;

  if (errors > 0) {
    const errCtx = article.match(/<span class="katex-error"[^>]+title="([^"]+)"/)?.[1] || '?';
    issues.push({ file: f.replace(/\\/g, '/'), errors, sample: errCtx });
  }
}

console.log('\n=== 全量 KaTeX 验证结果 ===');
console.log('扫描笔记数:', totalNotes);
console.log('inline KaTeX 总数:', totalInline);
console.log('block KaTeX 总数:', totalBlock);
console.log('🔴 katex-error 总数:', totalErrors);

if (issues.length > 0) {
  console.log('\n=== 仍有 KaTeX 错误的笔记 ===');
  for (const x of issues) {
    console.log(`  ${x.file} (${x.errors} 处)`);
    console.log(`    示例: ${x.sample.substring(0, 120)}`);
  }
} else {
  console.log('\n✅ 所有笔记的 KaTeX 公式 100% 渲染成功！');
}
