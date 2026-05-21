const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
  'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield',
]);

const BUILTINS = new Set([
  'print', 'len', 'range', 'int', 'float', 'str', 'list', 'dict', 'set', 'tuple',
  'bool', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed',
  'sum', 'min', 'max', 'abs', 'round', 'input', 'open', 'super', 'property',
]);

type TokenKind = 'plain' | 'keyword' | 'builtin' | 'string' | 'comment' | 'number' | 'decorator';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readString(code: string, start: number): number {
  const quote = code[start];
  const triple = code.slice(start, start + 3) === quote.repeat(3);
  const endQuote = triple ? quote.repeat(3) : quote;
  let i = start + endQuote.length;

  while (i < code.length) {
    if (code[i] === '\\') {
      i += 2;
      continue;
    }
    if (code.slice(i, i + endQuote.length) === endQuote) {
      return i + endQuote.length;
    }
    i += 1;
  }
  return code.length;
}

function readIdentifier(code: string, start: number): { text: string; end: number; kind: TokenKind } {
  let i = start;
  while (i < code.length && /[\w]/.test(code[i])) i += 1;
  const text = code.slice(start, i);
  let kind: TokenKind = 'plain';
  if (KEYWORDS.has(text)) kind = 'keyword';
  else if (BUILTINS.has(text)) kind = 'builtin';
  return { text, end: i, kind };
}

function readNumber(code: string, start: number): number {
  let i = start;
  while (i < code.length && /[\d.eE_+-]/.test(code[i])) i += 1;
  return i;
}

/** 将 Python 源码转为带 span 的 HTML，供编辑器高亮层使用 */
export function highlightPython(code: string): string {
  const parts: string[] = [];
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (ch === '#') {
      const end = code.indexOf('\n', i);
      const sliceEnd = end === -1 ? code.length : end;
      parts.push(`<span class="py-hl-comment">${escapeHtml(code.slice(i, sliceEnd))}</span>`);
      i = sliceEnd;
      continue;
    }

    if (ch === '@' && /[a-zA-Z_]/.test(code[i + 1] ?? '')) {
      const id = readIdentifier(code, i + 1);
      parts.push(`<span class="py-hl-decorator">${escapeHtml(code.slice(i, id.end))}</span>`);
      i = id.end;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const end = readString(code, i);
      parts.push(`<span class="py-hl-string">${escapeHtml(code.slice(i, end))}</span>`);
      i = end;
      continue;
    }

    if (/\d/.test(ch)) {
      const end = readNumber(code, i);
      parts.push(`<span class="py-hl-number">${escapeHtml(code.slice(i, end))}</span>`);
      i = end;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const id = readIdentifier(code, i);
      if (id.kind === 'keyword') {
        parts.push(`<span class="py-hl-keyword">${escapeHtml(id.text)}</span>`);
      } else if (id.kind === 'builtin') {
        parts.push(`<span class="py-hl-builtin">${escapeHtml(id.text)}</span>`);
      } else {
        parts.push(escapeHtml(id.text));
      }
      i = id.end;
      continue;
    }

    parts.push(escapeHtml(ch));
    i += 1;
  }

  return parts.join('');
}

export const PYTHON_INDENT = '    ';

/** Tab / Shift+Tab 缩进处理 */
export function applyIndent(
  code: string,
  start: number,
  end: number,
  shift: boolean,
  indent = PYTHON_INDENT,
): { code: string; selStart: number; selEnd: number } {
  const lineStart = code.lastIndexOf('\n', start - 1) + 1;
  const lineEndRaw = code.indexOf('\n', end);
  const blockEnd = lineEndRaw === -1 ? code.length : lineEndRaw;
  const block = code.slice(lineStart, blockEnd);
  const lines = block.split('\n');

  if (shift) {
    const dedented = lines.map((line) => {
      if (line.startsWith(indent)) return line.slice(indent.length);
      if (line.startsWith('\t')) return line.slice(1);
      return line;
    });
    const newBlock = dedented.join('\n');
    const delta = block.length - newBlock.length;
    const firstRemove =
      lines[0].startsWith(indent) ? indent.length : lines[0].startsWith('\t') ? 1 : 0;
    const next = code.slice(0, lineStart) + newBlock + code.slice(blockEnd);

    if (start === end) {
      const col = start - lineStart;
      const remove = col === 0 ? firstRemove : 0;
      return {
        code: next,
        selStart: Math.max(lineStart, start - remove),
        selEnd: Math.max(lineStart, start - remove),
      };
    }

    return {
      code: next,
      selStart: Math.max(lineStart, start - firstRemove),
      selEnd: Math.max(lineStart, end - delta),
    };
  }

  if (start === end) {
    const next = code.slice(0, start) + indent + code.slice(end);
    return { code: next, selStart: start + indent.length, selEnd: start + indent.length };
  }

  const indented = lines.map((line) => indent + line).join('\n');
  const next = code.slice(0, lineStart) + indented + code.slice(blockEnd);
  return {
    code: next,
    selStart: start + indent.length,
    selEnd: end + indent.length * lines.length,
  };
}
