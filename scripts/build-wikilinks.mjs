#!/usr/bin/env node
/**
 * 扫 vault 里所有 [[wikilink]]，解析 target，输出 graph 数据 + 人类可读报告。
 *
 * 产出：
 *   src/data/wikilinks.json   — nodes / links / broken / orphans / stats
 *   docs/WIKILINKS_REPORT.md  — broken、orphan、hot nodes 一览
 *
 * Graph 组件直接读 wikilinks.json，不用重复 parse。
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const DATA_DIR = path.join(ROOT, 'src', 'data');
const OUT_JSON = path.join(DATA_DIR, 'wikilinks.json');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUT_MD = path.join(DOCS_DIR, 'WIKILINKS_REPORT.md');

if (!existsSync(VAULT)) {
  console.warn('▌ obsidian-vault 不存在，跳过 wikilinks 生成');
  process.exit(0);
}

function walk(dir, rel = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const rp = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(full, rp));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push({ full, rel: rp });
  }
  return out;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { fm: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: text };
  return { fm: {}, body: text.slice(end + 4) };
}

/** 剥掉 code block / inline code / HTML comment，别误伤 [[link]] */
function stripNoise(body) {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

const WIKI_RE = /\[\[([^\[\]\n]+?)\]\]/g;

const files = walk(VAULT);
// Pass 1 — 建 index：basename → canonical，完整 rel path → canonical
const baseIndex = new Map();    // lowercased basename -> [{ canonical, rel }]
const pathIndex = new Map();    // lowercased rel (no ext) -> canonical
const canonical = new Map();    // canonical id -> { rel, folder, title, links, backlinks }

for (const f of files) {
  const noExt = f.rel.replace(/\.md$/i, '');
  const basename = path.basename(noExt);
  const folder = path.dirname(noExt).split('/')[0] || '(根)';
  const titleKey = basename;
  const lcBase = basename.toLowerCase();
  const lcPath = noExt.toLowerCase();
  canonical.set(noExt, { rel: f.rel, folder, title: titleKey, links: [], backlinks: [] });
  pathIndex.set(lcPath, noExt);
  if (!baseIndex.has(lcBase)) baseIndex.set(lcBase, []);
  baseIndex.get(lcBase).push(noExt);
}

function resolveTarget(rawTarget) {
  // 去掉 #heading 和 .md 后缀
  let t = rawTarget.split('#')[0].trim().replace(/\.md$/i, '');
  if (!t) return null;
  const lc = t.toLowerCase();
  // 先试完整 path
  if (pathIndex.has(lc)) return pathIndex.get(lc);
  // 再 fallback basename（同名多个的话取第一个，后面 ambiguous 会记）
  const hits = baseIndex.get(path.basename(lc));
  if (hits && hits.length > 0) return hits[0];
  return null;
}

const stats = { totalFiles: files.length, totalLinks: 0, resolved: 0, broken: 0, headingLinks: 0, aliased: 0 };
const broken = []; // [{ from, raw, line }]
const ambiguous = []; // [{ from, raw, candidates }]

for (const f of files) {
  const raw = readFileSync(f.full, 'utf8');
  const { body } = parseFrontmatter(raw);
  const clean = stripNoise(body);
  const noExtFrom = f.rel.replace(/\.md$/i, '');
  const sourceNode = canonical.get(noExtFrom);

  let m;
  WIKI_RE.lastIndex = 0;
  while ((m = WIKI_RE.exec(clean))) {
    const inner = m[1];
    stats.totalLinks++;
    // alias 写法 [[target|显示名]]
    let target = inner;
    let alias = null;
    if (inner.includes('|')) {
      const [t, a] = inner.split('|', 2);
      target = t;
      alias = a.trim();
      stats.aliased++;
    }
    if (target.includes('#')) stats.headingLinks++;

    const resolved = resolveTarget(target);
    if (!resolved) {
      stats.broken++;
      broken.push({ from: f.rel, raw: m[0], target: target.trim() });
      continue;
    }
    stats.resolved++;
    // 同名 basename 命中多个 candidate → 记 ambiguous
    const lcBase = path.basename(target.split('#')[0].trim().toLowerCase().replace(/\.md$/i, ''));
    const hits = baseIndex.get(lcBase) || [];
    if (hits.length > 1) {
      ambiguous.push({ from: f.rel, raw: m[0], target: target.trim(), candidates: hits });
    }
    sourceNode.links.push({ to: resolved, alias, raw: m[0] });
    canonical.get(resolved).backlinks.push({ from: noExtFrom, alias });
  }
}

// Pass 2 — 拼 graph JSON
const nodes = Array.from(canonical.entries()).map(([id, node]) => ({
  id,
  title: node.title,
  folder: node.folder,
  outDegree: node.links.length,
  inDegree: node.backlinks.length,
}));
const links = [];
for (const [id, node] of canonical) {
  for (const l of node.links) {
    links.push({ source: id, target: l.to, alias: l.alias });
  }
}
const orphans = nodes.filter((n) => n.outDegree === 0 && n.inDegree === 0).map((n) => n.id);
const hot = [...nodes].sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree)).slice(0, 20);

const out = {
  generatedAt: new Date().toISOString(),
  stats,
  nodes,
  links,
  broken,
  ambiguous,
  orphans,
  hot,
};

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(out, null, 2));

// Pass 3 — 写 markdown 报告给人看
mkdirSync(DOCS_DIR, { recursive: true });
const lines = [];
lines.push(`# 双链 (Wikilinks) 检查报告`);
lines.push(``);
lines.push(`> 生成时间：${out.generatedAt}`);
lines.push(``);
lines.push(`## 概览`);
lines.push(``);
lines.push(`| 指标 | 数值 |`);
lines.push(`|---|---|`);
lines.push(`| 笔记总数 | ${stats.totalFiles} |`);
lines.push(`| 双链总数 | ${stats.totalLinks} |`);
lines.push(`| ✓ 解析成功 | ${stats.resolved} |`);
lines.push(`| ✗ 悬空链接 | ${stats.broken} |`);
lines.push(`| 带 alias 链接 | ${stats.aliased} |`);
lines.push(`| 含 #heading 链接 | ${stats.headingLinks} |`);
lines.push(`| 孤岛笔记 (无入也无出) | ${orphans.length} |`);
lines.push(`| 同名冲突链接 | ${ambiguous.length} |`);
lines.push(``);

lines.push(`## 🔥 热点 Top 20（按总度数 入+出）`);
lines.push(``);
lines.push(`| 笔记 | 目录 | 入度 | 出度 |`);
lines.push(`|---|---|---|---|`);
for (const h of hot) {
  lines.push(`| \`${h.title}\` | ${h.folder} | ${h.inDegree} | ${h.outDegree} |`);
}
lines.push(``);

if (broken.length > 0) {
  lines.push(`## ✗ 悬空链接（${broken.length} 条）`);
  lines.push(``);
  lines.push(`| 源笔记 | 链接文本 | 目标 |`);
  lines.push(`|---|---|---|`);
  for (const b of broken.slice(0, 200)) {
    lines.push(`| \`${b.from}\` | \`${b.raw.replace(/\|/g, '\\|')}\` | \`${b.target}\` |`);
  }
  if (broken.length > 200) lines.push(`| … | _余 ${broken.length - 200} 条省略_ | |`);
  lines.push(``);
}

if (ambiguous.length > 0) {
  lines.push(`## ⚠ 同名冲突链接（${ambiguous.length} 条）`);
  lines.push(``);
  lines.push(`| 源笔记 | 链接 | 候选 |`);
  lines.push(`|---|---|---|`);
  for (const a of ambiguous.slice(0, 100)) {
    lines.push(`| \`${a.from}\` | \`${a.raw.replace(/\|/g, '\\|')}\` | ${a.candidates.map((c) => `\`${c}\``).join(' / ')} |`);
  }
  lines.push(``);
}

if (orphans.length > 0) {
  lines.push(`## 🏝 孤岛笔记（${orphans.length} 条）`);
  lines.push(``);
  lines.push(`这些笔记既没有出链也没有入链，建议补充关联：`);
  lines.push(``);
  for (const o of orphans.slice(0, 100)) lines.push(`- \`${o}\``);
  if (orphans.length > 100) lines.push(`- _余 ${orphans.length - 100} 条省略_`);
  lines.push(``);
}

writeFileSync(OUT_MD, lines.join('\n'));

console.log(`✅ wikilinks.json: notes=${stats.totalFiles} links=${stats.totalLinks} ok=${stats.resolved} broken=${stats.broken} orphans=${orphans.length}`);
console.log(`✅ docs/WIKILINKS_REPORT.md generated`);
