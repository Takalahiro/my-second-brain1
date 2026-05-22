import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfm } from 'micromark-extension-gfm';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { math } from 'micromark-extension-math';
import { mathFromMarkdown } from 'mdast-util-math';

// 归一化 Obsidian 风格 LaTeX，然后**始终**用 gfm+math 重新 parse
//
// 关键：就算源文件已经是标准 $$ 独立成行，不在这里 reparse 的话
// 初始 mdast 没有 math 扩展，remark-math 变不出 math 节点 → 页面上就是纯文本
export default function remarkNormalizeMath() {
  return (tree, file) => {
    if (typeof file.value !== 'string' && !Buffer.isBuffer(file.value)) return;
    const src = String(file.value);
    if (!hasMathMarkers(src)) return;

    const normalized = normalize(src);
    file.value = normalized;

    const newTree = fromMarkdown(normalized, {
      extensions: [gfm(), math()],
      mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
    });

    tree.children = newTree.children;
    if (newTree.position) tree.position = newTree.position;
  };
}

function hasMathMarkers(src) {
  if (/\$\$/.test(src)) return true;
  if (/\\\(|\\\[/.test(src)) return true;
  // 行内 $...$（排除 ${} 模板字符串）
  if (/(?:^|[^\\$])\$[^$\n{][^$\n]*\$/.test(src)) return true;
  return false;
}

function normalize(src) {
  const placeholders = [];

  let working = src.replace(/^(`{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, (m) => {
    placeholders.push(m);
    return `\x00CODE_FENCE_${placeholders.length - 1}\x00`;
  });

  working = working.replace(/`[^`\n]+`/g, (m) => {
    placeholders.push(m);
    return `\x00INLINE_CODE_${placeholders.length - 1}\x00`;
  });

  // 清理空 $$ / $$$$ 标记（仅同行或紧邻，勿删「块1结束 $$\n\n$$ 块2开始」）
  working = working.replace(/\$\$[ \t]*\$\$/g, '');
  working = working.replace(/^[ \t]*\${4,}[ \t]*$/gm, '');

  // LaTeX 原生行内分隔符 \( ... \) → $...$（KaTeX 不识别 \( \)）
  working = working.replace(/\\\(([\s\S]+?)\\\)/g, (_full, inner) => {
    return `$${inner.trim()}$`;
  });

  // \[ ... \] 块（不论单行还是多行）→ $$...$$
  working = working.replace(/\\\[([\s\S]*?)\\\]/g, (_full, inner) => {
    const body = sanitizeMathBody(inner.trim());
    // 多行 → block；单行 → 仍按 block（独立成行确保 micromark 识别）
    if (inner.includes('\n')) {
      return `\n\n$$\n${body}\n$$\n\n`;
    }
    return `\n\n$$\n${body}\n$$\n\n`;
  });

  // 跨行 $$...$$（开闭 $$ 不独立成行）
  working = working.replace(/\$\$([^$][\s\S]*?)\$\$/g, (full, inner) => {
    if (!inner.includes('\n')) {
      // 单行块：仍做 sanitize（去 equation 包裹、label）
      const body = sanitizeMathBody(inner.trim());
      return body === inner.trim() ? full : `$$${body}$$`;
    }
    let trimmed = inner.replace(/^\n+/, '').replace(/\n+$/, '');
    trimmed = trimmed.replace(/\\\[|\\\]/g, '');
    trimmed = sanitizeMathBody(trimmed);
    return `\n\n$$\n${trimmed}\n$$\n\n`;
  });

  working = working.replace(/\x00(CODE_FENCE|INLINE_CODE)_(\d+)\x00/g, (_, _kind, idx) => {
    return placeholders[parseInt(idx, 10)];
  });

  return working;
}

// 让 KaTeX 能渲染：去 label、展开 equation 环境之类
function sanitizeMathBody(body) {
  return body
    .replace(/\\label\{[^}]*\}/g, '')
    .replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, '$1')
    .replace(/\\begin\{displaymath\}([\s\S]*?)\\end\{displaymath\}/g, '$1')
    .trim();
}
