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

/** 源 .md 里有没有 math delimiter（$$ / $ / \\( / \\[） */
function sourceHasMath(md) {
  return /\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\(|\\\[/.test(md);
}

const files = await walk(VAULT);
const issues = [];

for (const f of files) {
  const md = await readFile(f, 'utf8');
  if (!sourceHasMath(md)) continue;

  const slug = slugify(f.split(/[\\/]/).pop().replace(/\.md$/i, ''));
  const r = await fetch(BASE + '/notes/' + encodeURIComponent(slug));
  if (r.status !== 200) continue;

  const t = await r.text();
  const article = t.match(/<article[\s\S]*?<\/article>/)?.[0] ?? '';

  const katexCount = (article.match(/class="katex/g) || []).length;
  const katexErr = (article.match(/katex-error/g) || []).length;

  // article 里还留着裸 LaTeX 的特征（说明 KaTeX 没吃到）
  const rawPatterns = [
    { name: 'raw_$$', re: /(?<!class="katex[^"]*">[^<]*)\$\$[^$]+\$\$/ },
    { name: 'raw_frac', re: /\\frac\{[^}]+\}\{[^}]+\}/ },
    { name: 'raw_begin', re: /\\begin\{(cases|align|matrix|bmatrix|pmatrix|equation)\}/ },
    { name: 'raw_\\[', re: /\\\[[\s\S]{0,200}?\\\]/ },
  ];

  const found = [];
  for (const p of rawPatterns) {
    // 把 katex annotation 剥掉再 match，别误报
    const stripped = article.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
    if (p.re.test(stripped)) found.push(p.name);
  }

  if (found.length > 0 || (sourceHasMath(md) && katexCount === 0)) {
    issues.push({
      file: f.replace(/^\.\\?obsidian-vault[\\/]/, '').replace(/\\/g, '/'),
      slug,
      katexCount,
      katexErr,
      found,
    });
  }
}

console.log(`扫描 ${files.length} 篇，含数学的笔记中问题: ${issues.length}\n`);
for (const x of issues.slice(0, 30)) {
  console.log(`📄 ${x.file}`);
  console.log(`   slug: ${x.slug} | katex: ${x.katexCount} | err: ${x.katexErr}`);
  console.log(`   未渲染特征: ${x.found.join(', ') || '无katex但源有数学'}`);
}
if (issues.length > 30) console.log(`... 还有 ${issues.length - 30} 篇`);
