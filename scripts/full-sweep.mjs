import { writeFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const BASE = 'http://localhost:4321';
const VAULT = './obsidian-vault';

function id2slug(id) {
  const name = id.replace(/\.md$/, '').split(/[\\/]/).pop();
  return name
    .toLowerCase()
    .replace(/[()（）]/g, '')
    .replace(/\s/g, '-');
}

async function listVaultMd(dir, rel = '', out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    const relPath = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      await listVaultMd(full, relPath, out);
    } else if (extname(e.name).toLowerCase() === '.md') {
      out.push(relPath);
    }
  }
  return out;
}

async function get(url) {
  const r = await fetch(BASE + url);
  return { status: r.status, text: await r.text(), url };
}

const report = { static: {}, notes: [], folders: [], tags: [], broken: [], issues: {}, summary: {} };

// 1. 关键 static pages 能不能打开
for (const path of ['/', '/notes', '/tags']) {
  const r = await get(path);
  report.static[path] = { status: r.status, length: r.text.length };
}

// 2. vault 里所有 .md → 期望 slug
const mdFiles = await listVaultMd(VAULT);
console.log(`Vault 中找到 ${mdFiles.length} 篇笔记`);

// 3. /notes SSR 里实际 expose 了多少个 note-link
const notesPage = await get('/notes');
const ssrNoteLinks = [...new Set(
  [...notesPage.text.matchAll(/href="(\/notes\/[^"#?]+)"/g)].map((m) => decodeURIComponent(m[1]))
)];
report.summary.notes_visible_in_ssr = ssrNoteLinks.length;
report.summary.notes_total_in_vault = mdFiles.length;

// 4. 逐篇笔记扫一遍
console.log(`扫描 ${mdFiles.length} 个笔记 URL...`);
let i = 0;
for (const md of mdFiles) {
  i++;
  if (i % 25 === 0) console.log(`  进度 ${i}/${mdFiles.length}`);
  const slug = id2slug(md);
  const url = '/notes/' + encodeURIComponent(slug);
  const r = await get(url);
  if (r.status !== 200) {
    report.broken.push({ source: md, url: decodeURIComponent(url), status: r.status });
    continue;
  }
  const t = r.text;
  const article = t.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? '';

  const note = {
    source: md,
    slug,
    url: decodeURIComponent(url),
    status: r.status,
    length: t.length,
    wikiOk:      (article.match(/<a[^>]+class="wiki-link"[^>]*>/g) || []).length,
    wikiNew:     (article.match(/<a[^>]+class="wiki-link-new"[^>]*>/g) || []).length,
    imgs:        (article.match(/<img\s/g) || []).length,
    katexInline: (article.match(/class="katex"/g) || []).length,
    katexBlock:  (article.match(/katex-display/g) || []).length,
    mermaidBlk:  (article.match(/class="mermaid-block"/g) || []).length,
    callouts:    (article.match(/data-callout=/g) || []).length,
    h2:          (article.match(/<h2/g) || []).length,
    h3:          (article.match(/<h3/g) || []).length,
    h4:          (article.match(/<h4/g) || []).length,
    tocNodes:    (t.match(/toc-node/g) || []).length,
    inSSRIndex:  ssrNoteLinks.includes(decodeURIComponent(url)),
  };
  report.notes.push(note);
}

// 5. tag pages + folder pages
const allTagHrefs = [...new Set(
  [...notesPage.text.matchAll(/href="(\/tags\/[^"#?]+)"/g)].map((m) => decodeURIComponent(m[1]))
)];
for (const h of allTagHrefs) {
  const r = await get(h);
  report.tags.push({ url: h, status: r.status });
  if (r.status !== 200) report.broken.push({ url: h, status: r.status });
}
const home = await get('/');
const allFolderHrefs = [...new Set(
  [...home.text.matchAll(/href="(\/folder\/[^"#?]+)"/g)].map((m) => decodeURIComponent(m[1]))
)];
for (const h of allFolderHrefs) {
  const r = await get(h);
  report.folders.push({ url: h, status: r.status });
  if (r.status !== 200) report.broken.push({ url: h, status: r.status });
}

// 6. 把问题分个类
const issues = {
  notInSSR:        [],
  missingToc:      [],
  brokenWikiLinks: [],
  emptyBody:       [],
};
for (const n of report.notes) {
  if (!n.inSSRIndex) issues.notInSSR.push(n.source);
  if (n.tocNodes === 0 && (n.h2 + n.h3 + n.h4) >= 2) issues.missingToc.push({ src: n.source, h234: n.h2 + n.h3 + n.h4 });
  if (n.wikiNew > 0) issues.brokenWikiLinks.push({ src: n.source, n: n.wikiNew });
  if (n.length < 2500) issues.emptyBody.push({ src: n.source, len: n.length });
}
report.issues = issues;
report.summary.total_notes = report.notes.length;
report.summary.total_broken = report.broken.length;
report.summary.with_katex   = report.notes.filter((n) => n.katexInline + n.katexBlock > 0).length;
report.summary.with_mermaid = report.notes.filter((n) => n.mermaidBlk > 0).length;
report.summary.with_images  = report.notes.filter((n) => n.imgs > 0).length;
report.summary.with_callouts= report.notes.filter((n) => n.callouts > 0).length;
report.summary.tag_pages    = report.tags.length;
report.summary.folder_pages = report.folders.length;

await writeFile('scripts/sweep-report.json', JSON.stringify(report, null, 2));

console.log('\n=== 汇总 ===');
console.log('Static:', JSON.stringify(report.static));
console.log('Notes scanned:', report.summary.total_notes);
console.log('Visible in /notes SSR:', report.summary.notes_visible_in_ssr, '/', mdFiles.length);
console.log('Broken (non-200):', report.summary.total_broken);
console.log('With KaTeX:', report.summary.with_katex);
console.log('With Mermaid:', report.summary.with_mermaid);
console.log('With Images:', report.summary.with_images);
console.log('With Callouts:', report.summary.with_callouts);

console.log('\n=== 问题统计 ===');
console.log('SSR 不可见的笔记数:', issues.notInSSR.length, '(默认折叠在 depth ≥ 3 的子文件夹里)');
console.log('应有 TOC 但缺失的笔记:', issues.missingToc.length);
console.log('含失效 wiki-link 的笔记:', issues.brokenWikiLinks.length);
console.log('正文极短(<2.5KB)的笔记:', issues.emptyBody.length);

if (report.broken.length > 0) {
  console.log('\n=== 真正 BROKEN 的 URL ===');
  for (const b of report.broken) console.log(`  ${b.status} - ${b.url || b.source}`);
}

if (issues.brokenWikiLinks.length > 0) {
  console.log('\n=== 笔记中含失效 wiki-link（红色"未创建"链接） ===');
  for (const x of issues.brokenWikiLinks) console.log(`  ${x.n} 个 - ${x.src}`);
}

if (issues.emptyBody.length > 0) {
  console.log('\n=== 正文极短的笔记 ===');
  for (const x of issues.emptyBody) console.log(`  ${x.len}B - ${x.src}`);
}

console.log('\n报告已写入 scripts/sweep-report.json');
