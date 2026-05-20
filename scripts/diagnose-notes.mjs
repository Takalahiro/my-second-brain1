import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import matter from 'gray-matter';

const VAULT = './obsidian-vault';
const issues = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full);
    } else if (extname(e.name) === '.md') {
      await checkNote(full);
    }
  }
}

// 把 markdown 里的代码块（fenced + indented + inline code）整体替换为空格，
// 这样后续的 [[ ]] 计数就只针对真正的 wiki link，不会把 numpy `[[1,2,3]]`、
// Python `nums[nums[0]]` 这类代码误判为未闭合 wiki link。
// 按行处理 fenced code，支持任意长度的围栏（```、````、`````），保留行数对齐
function stripCodeBlocks(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let fence = null;
  for (const line of lines) {
    const open = line.match(/^(`{3,})/);
    if (fence) {
      if (open && open[1].length >= fence.length) fence = null;
      out.push(''); // 保留空行占位
    } else if (open) {
      fence = open[1];
      out.push('');
    } else {
      out.push(line);
    }
  }
  return out.join('\n').replace(/`[^`\n]+`/g, (m) => ' '.repeat(m.length));
}

async function checkNote(path) {
  const rel = path.replace(VAULT + '/', '').replace(VAULT + '\\', '');
  try {
    const raw = await readFile(path, 'utf-8');

    let fm;
    try {
      fm = matter(raw);
    } catch (err) {
      issues.push({ file: rel, type: 'frontmatter_parse_error', message: err.message });
      return;
    }

    // 文件名特殊字符（括号、空格等）已由 Astro 6 glob loader 与 slugify 自动归一化为
    // 合法 URL（[()（）] 全部删除，空格 → -），所以不再视为错误，仅做 INFO 提示。
    const filename = rel.split(/[\\/]/).pop().replace(/\.md$/, '');
    if (/[()（）]/.test(filename)) {
      issues.push({ file: rel, type: 'info_special_chars_in_filename', filename });
    }

    if (fm.data.draft === true) {
      issues.push({ file: rel, type: 'draft' });
    }

    const prose = stripCodeBlocks(fm.content);

    if (/\[\[_TOC_\]\]|\[TOC\]/i.test(prose)) {
      // remark-obsidian-image 已经把 [TOC] / [[_TOC_]] 占位符从渲染中剔除，
      // 这里只做 INFO 提示，不算 bug。
      issues.push({ file: rel, type: 'info_has_toc_marker' });
    }

    const emptyLinks = prose.match(/\[\[\s*\]\]/g);
    if (emptyLinks) {
      issues.push({ file: rel, type: 'empty_wiki_link', count: emptyLinks.length });
    }

    // 计算 [[ ]] 配对前，先剥离会导致计数错位的 POSIX 字符类与 [[:xxx:]]/[]+] 等正则字面量
    const withoutPosixClass = prose.replace(/\[\[:[\w]+:\]\]/g, '');
    const openCount  = (withoutPosixClass.match(/\[\[/g) || []).length;
    const closeCount = (withoutPosixClass.match(/\]\]/g) || []).length;
    const diff = openCount - closeCount;
    if (diff !== 0) {
      issues.push({
        file: rel,
        type: 'unclosed_wiki_link',
        diff,
        open: openCount,
        close: closeCount,
      });
    }
  } catch (err) {
    issues.push({ file: rel, type: 'read_error', message: err.message });
  }
}

await walk(VAULT);

console.log('\n📊 诊断结果（已排除代码块）\n');
console.log(`总问题数：${issues.length}\n`);

const byType = {};
for (const issue of issues) {
  if (!byType[issue.type]) byType[issue.type] = [];
  byType[issue.type].push(issue);
}

for (const [type, list] of Object.entries(byType)) {
  const isInfo = type.startsWith('info_');
  const icon = isInfo ? 'ℹ️ ' : '🔴';
  console.log(`\n${icon} ${type} (${list.length})`);
  for (const item of list.slice(0, 10)) {
    console.log(`  - ${item.file}`);
    if (item.message)  console.log(`    错误: ${item.message}`);
    if (item.filename) console.log(`    filename: ${item.filename}`);
    if (item.count)    console.log(`    数量: ${item.count}`);
    if (item.diff !== undefined) console.log(`    差值: ${item.diff}  (open=${item.open}, close=${item.close})`);
  }
  if (list.length > 10) {
    console.log(`  ... 还有 ${list.length - 10} 个`);
  }
}

const errCount = issues.filter((i) => !i.type.startsWith('info_')).length;
const infoCount = issues.filter((i) => i.type.startsWith('info_')).length;
console.log(`\n汇总: 🔴 错误 ${errCount} | ℹ️  信息 ${infoCount}`);

console.log('\n✅ 诊断完成\n');
