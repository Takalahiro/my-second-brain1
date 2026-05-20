import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BASE = 'http://localhost:4321';
const VAULT = './obsidian-vault';

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

function hasPipeTable(md) {
  return /^\|.+\|/m.test(md);
}

const files = await walk(VAULT);
const withTables = [];
for (const f of files) {
  const { readFile } = await import('node:fs/promises');
  const md = await readFile(f, 'utf8');
  if (hasPipeTable(md)) withTables.push(f);
}

console.log(`含 pipe 表格的笔记: ${withTables.length} 篇\n`);

let ok = 0;
let fail = 0;
const failures = [];

for (const f of withTables) {
  const name = f.split(/[\\/]/).pop().replace(/\.md$/i, '');
  const slug = slugify(name);
  const r = await fetch(BASE + '/notes/' + encodeURIComponent(slug));
  if (r.status !== 200) {
    fail++;
    failures.push({ f, reason: `HTTP ${r.status}` });
    continue;
  }
  const t = await r.text();
  const article = t.match(/<article[\s\S]*?<\/article>/)?.[0] ?? '';
  const tables = (article.match(/<table/g) || []).length;
  const pipeInP = /<p>[^<]*\|[^<]+\|/.test(article);
  if (tables > 0) {
    ok++;
    console.log(`✓ ${f.replace(/^\.\\?obsidian-vault[\\/]/, '')} → ${tables} 个 <table>`);
  } else {
    fail++;
    failures.push({ f, reason: pipeInP ? '表格仍在 <p> 里' : '无 table 也无 pipe' });
    console.log(`✗ ${f.replace(/^\.\\?obsidian-vault[\\/]/, '')} → ${failures[failures.length - 1].reason}`);
  }
}

console.log(`\n汇总: ✓ ${ok} / ✗ ${fail} / 共 ${withTables.length}`);
