import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const VAULT = './obsidian-vault';
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;

function slugify(name) {
  return name.toLowerCase().replace(/[()（）]/g, '').replace(/\s/g, '-');
}

async function walk(d, out = []) {
  for (const e of await readdir(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = join(d, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (extname(e.name).toLowerCase() === '.md') out.push(full);
  }
  return out;
}

function stripCodeBlocks(s) {
  // 按行剥 fenced code block，``` / ```` / ````` 嵌套都能 handle
  const lines = s.split(/\r?\n/);
  const out = [];
  let fence = null; // 当前打开的 fence，比如 '```'
  for (const line of lines) {
    const open = line.match(/^(`{3,})/);
    if (fence) {
      if (open && open[1].length >= fence.length) {
        fence = null;
      }
      // fence 里面整行扔掉
    } else if (open) {
      fence = open[1];
      // 开 fence 那行也扔
    } else {
      out.push(line);
    }
  }
  return out.join('\n').replace(/`[^`\n]+`/g, '');
}

const files = await walk(VAULT);
const existingSlugs = new Set(
  files.map((f) => slugify(f.split(/[\\/]/).pop().replace(/\.md$/i, '')))
);

const wikiRe = /(!?)\[\[([^\]|#]+?)(?:[#|][^\]]*)?\]\]/g;
const broken = [];

for (const f of files) {
  const raw = await readFile(f, 'utf8');
  const content = stripCodeBlocks(raw);
  wikiRe.lastIndex = 0;
  let m;
  while ((m = wikiRe.exec(content)) !== null) {
    const bang = m[1];
    const target = m[2].trim();
    // skip：图片 embed（! 前缀 or .png/.jpg 之类）
    if (bang || IMG_EXT.test(target)) continue;
    // skip：POSIX char class，比如 [[:alpha:]]
    if (/^:[\w]+:$/.test(target)) continue;
    const slug = slugify(target);
    if (!existingSlugs.has(slug)) {
      broken.push({
        file: f.replace(/^\.\\?obsidian-vault[\\/]/, '').replace(/\\/g, '/'),
        target,
        slug,
      });
    }
  }
}

console.log(`=== 真正失效的 wiki link（已排除图片嵌入与正则字符类） — ${broken.length} 处 ===\n`);
const grouped = {};
for (const b of broken) {
  if (!grouped[b.file]) grouped[b.file] = [];
  grouped[b.file].push(b);
}
for (const [file, list] of Object.entries(grouped)) {
  console.log(`📄 ${file}`);
  for (const b of list) console.log(`     [[${b.target}]] → 期望 slug: ${b.slug}（不存在）`);
}
