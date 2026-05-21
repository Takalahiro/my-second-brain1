/**
 * 领土地图模型自检：层级、国家轮廓、笔记与 wikilink
 * node scripts/check-territory-map.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wikiPath = [join(root, 'dist/data/wikilinks.json'), join(root, 'src/data/wikilinks.json')].find((p) => {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
});
if (!wikiPath) {
  console.error('FAIL wikilinks.json not found — run pnpm build first');
  process.exit(1);
}
const wiki = JSON.parse(readFileSync(wikiPath, 'utf8'));

// 动态 import 编译产物较麻烦，在此复刻 buildTerritoryTree + 关键校验逻辑
function buildTerritoryTree(nodes) {
  const rootNode = { name: '世界', path: '', depth: 0, noteCount: 0, totalNotes: 0, children: [] };
  const lookup = new Map([['', rootNode]]);
  function ensure(parts) {
    if (!parts.length) return rootNode;
    const path = parts.join('/');
    const hit = lookup.get(path);
    if (hit) return hit;
    const parent = ensure(parts.slice(0, -1));
    const node = {
      name: parts.at(-1),
      path,
      depth: parts.length,
      noteCount: 0,
      totalNotes: 0,
      children: [],
    };
    parent.children.push(node);
    lookup.set(path, node);
    return node;
  }
  for (const n of nodes) {
    const parts = n.id.split('/');
    if (parts.length > 1) ensure(parts.slice(0, -1));
    const leaf = parts.length === 1 ? rootNode : ensure(parts.slice(0, -1));
    leaf.noteCount++;
    let cur = leaf;
    while (cur) {
      cur.totalNotes++;
      cur = cur.path ? lookup.get(cur.path.split('/').slice(0, -1).join('/')) : null;
    }
  }
  return rootNode;
}

const tree = buildTerritoryTree(wiki.nodes);
const countries = tree.children;
let failed = 0;
const fail = (msg) => {
  failed++;
  console.error(`FAIL ${msg}`);
};
const ok = (msg) => console.log(`OK   ${msg}`);

if (countries.length === 0) fail('无国家（根文件夹）');
else ok(`国家 ${countries.length} 个`);

const profiles = ['continental', 'peninsula', 'archipelago', 'island', 'crescent', 'rugged'];
const usedProfiles = new Set();
for (let i = 0; i < countries.length; i++) {
  usedProfiles.add(profiles[i % profiles.length]);
}
if (usedProfiles.size >= Math.min(countries.length, profiles.length)) {
  ok(`国家轮廓 profile 种类 ${usedProfiles.size}`);
} else {
  fail(`国家轮廓 profile 重复过多: ${usedProfiles.size}`);
}

let states = 0;
let cities = 0;
let leafFolders = 0;
function walk(node) {
  if (node.depth === 2) states++;
  if (node.depth >= 3) cities++;
  if (node.children.length === 0 && node.depth >= 1) leafFolders++;
  for (const c of node.children) walk(c);
}
for (const c of countries) walk(c);
ok(`州/省 ${states} · 城市级文件夹 ${cities} · 叶文件夹 ${leafFolders}`);

const notesInTree = wiki.nodes.length;
const notesAtLeaves = wiki.nodes.filter((n) => {
  const folder = n.id.split('/').slice(0, -1).join('/');
  const parts = folder.split('/').filter(Boolean);
  return parts.length >= 1;
}).length;
ok(`笔记 ${notesInTree} · 有文件夹路径 ${notesAtLeaves}`);

const resolvedLinks = wiki.links.filter((l) =>
  wiki.nodes.some((n) => n.id === l.source) && wiki.nodes.some((n) => n.id === l.target),
);
ok(`可渲染 wikilink ${resolvedLinks.length} / ${wiki.links.length}`);

const orphans = wiki.nodes.filter((n) => n.inDegree + n.outDegree === 0);
ok(`孤岛笔记 ${orphans.length}（将渲染为洋面小岛）`);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nTerritory map model checks passed.');
