#!/usr/bin/env node
/**
 * 扫描 obsidian-vault 生成 src/data/stats.json，用于"学习统计面板"组件：
 * - totalNotes：笔记总数
 * - totalWords：粗略字数（中文字符 + 英文单词）
 * - byFolder：按顶层目录的笔记数 / 字数
 * - byMonth：最近 12 个月每月新增（按 git/fs mtime）
 * - topTags：frontmatter tags 频率 Top 15
 * - heatmap：最近 12 周（84 天）每天编辑活动
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(ROOT, 'obsidian-vault');
const MTIME_PATH = path.join(ROOT, 'src', 'lib', 'notes-mtime.json');
const OUT_DIR = path.join(ROOT, 'src', 'data');
const OUT = path.join(OUT_DIR, 'stats.json');

if (!existsSync(VAULT)) {
  console.warn('▌ obsidian-vault 不存在，跳过 stats 生成');
  process.exit(0);
}

let mtimeMap = {};
try {
  mtimeMap = JSON.parse(readFileSync(MTIME_PATH, 'utf8'));
} catch (e) {
  console.warn('▌ 没有 notes-mtime.json，stats 将用 fs.statSync 兜底');
}

function walk(dir, rel = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const rp = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walk(full, rp));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      out.push({ full, rel: rp });
    }
  }
  return out;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { fm: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: text };
  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4);
  const fm = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2];
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else {
      v = v.replace(/^['"]|['"]$/g, '');
    }
    fm[k] = v;
  }
  // 兼容多行 tags: ['a','b']  或  下一行 - tag1
  return { fm, body };
}

function countWords(body) {
  // 简单粗略：去掉代码块、行内代码、URL，再计数
  const clean = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[#*_>~\-=]/g, ' ');
  const chinese = (clean.match(/\p{Script=Han}/gu) || []).length;
  const english = (clean.match(/[A-Za-z][A-Za-z0-9'-]*/g) || []).length;
  return chinese + english;
}

function ymKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function ymdKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const files = walk(VAULT);
const stats = {
  generatedAt: new Date().toISOString(),
  totalNotes: 0,
  totalWords: 0,
  byFolder: {},
  byMonth: {},
  topTags: {},
  byDay: {},
};

for (const f of files) {
  const raw = readFileSync(f.full, 'utf8');
  const { fm, body } = parseFrontmatter(raw);
  if (fm.draft === 'true' || fm.draft === true) continue;
  stats.totalNotes += 1;
  const words = countWords(body);
  stats.totalWords += words;

  const topFolder = f.rel.split('/')[0] || '(根)';
  if (!stats.byFolder[topFolder]) stats.byFolder[topFolder] = { name: topFolder, count: 0, words: 0 };
  stats.byFolder[topFolder].count += 1;
  stats.byFolder[topFolder].words += words;

  // mtime
  const mtimeStr = mtimeMap[f.rel];
  let mtime;
  if (mtimeStr) {
    mtime = new Date(mtimeStr);
  } else {
    try { mtime = new Date(statSync(f.full).mtimeMs); } catch { mtime = new Date(); }
  }
  if (!isFinite(mtime.getTime())) mtime = new Date();

  const m = ymKey(mtime);
  stats.byMonth[m] = (stats.byMonth[m] || 0) + 1;
  const d = ymdKey(mtime);
  stats.byDay[d] = (stats.byDay[d] || 0) + 1;

  // tags
  let tags = fm.tags;
  if (typeof tags === 'string') tags = tags.split(/[,\s]+/).filter(Boolean);
  if (Array.isArray(tags)) {
    for (const t of tags) {
      const tag = String(t).replace(/^#/, '').trim();
      if (!tag) continue;
      stats.topTags[tag] = (stats.topTags[tag] || 0) + 1;
    }
  }
}

// 转换为有序数组
const byFolder = Object.values(stats.byFolder)
  .sort((a, b) => b.count - a.count)
  .slice(0, 12);

// 最近 12 个月
const months = [];
const today = new Date();
for (let i = 11; i >= 0; i--) {
  const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
  const k = ymKey(d);
  months.push({ month: k, label: `${d.getMonth() + 1}月`, count: stats.byMonth[k] || 0 });
}

const topTags = Object.entries(stats.topTags)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 15);

// 最近 84 天热力图（7 列 × 12 行）
const heatmap = [];
for (let i = 83; i >= 0; i--) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - i);
  const k = ymdKey(d);
  heatmap.push({ date: k, count: stats.byDay[k] || 0 });
}

const out = {
  generatedAt: stats.generatedAt,
  totalNotes: stats.totalNotes,
  totalWords: stats.totalWords,
  byFolder,
  byMonth: months,
  topTags,
  heatmap,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`✅ stats.json: notes=${out.totalNotes} words≈${out.totalWords} folders=${byFolder.length} tags=${topTags.length}`);
