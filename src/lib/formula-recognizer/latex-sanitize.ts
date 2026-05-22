// OCR 吐出来的 LaTeX 洗一洗
export function sanitizeLatex(raw: string): string {
  if (!raw) return '';

  let code = raw.trim();

  // 去掉模型可能输出的 Markdown / 定界符
  code = code.replace(/^```(?:latex|tex)?\s*/i, '').replace(/\s*```$/i, '');
  code = code.replace(/^\$\$([\s\S]*?)\$\$$/, '$1').replace(/^\\\[([\s\S]*?)\\\]$/, '$1');
  code = code.replace(/^\$([\s\S]*?)\$$/, '$1').replace(/^\\\(([\s\S]*?)\\\)$/, '$1');

  // 合并多余空白，保留换行
  code = code.replace(/\r\n/g, '\n');
  code = code.replace(/[ \t]+/g, ' ');
  code = code.replace(/\n{3,}/g, '\n\n');

  // 命令与后续字母之间补空格（Texo-web 同款逻辑）
  const tokens = code.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const next = tokens[i + 1];
    out.push(token);
    if (token === '\\\\') {
      out.push('\n');
    } else if (next && token.startsWith('\\') && /^[A-Za-z0-9({[]/.test(next[0]!)) {
      out.push(' ');
    }
  }
  code = out.join('').trim();

  // 常见 OCR 误识别修正
  const fixes: Array<[RegExp, string]> = [
    [/\bl\b(?=\s*\\)/g, '1'], // 孤立 l → 1（在命令前）
    [/\\left\s*\./g, '\\left.'],
    [/\\right\s*\./g, '\\right.'],
    [/\\over\s+/g, '\\frac'],
  ];
  for (const [pattern, replacement] of fixes) {
    code = code.replace(pattern, replacement);
  }

  return code;
}

// 简单质量分，越高越像有效公式
export function latexQualityScore(latex: string): number {
  if (!latex.trim()) return 0;
  let score = Math.min(latex.length, 120);
  if (/\\frac|\\sum|\\int|\\sqrt|\\alpha|\\beta|\\pi/.test(latex)) score += 20;
  if (/[\u4e00-\u9fff]/.test(latex)) score -= 30;
  if (latex.includes('�')) score -= 50;
  const openBraces = (latex.match(/\{/g) ?? []).length;
  const closeBraces = (latex.match(/\}/g) ?? []).length;
  score -= Math.abs(openBraces - closeBraces) * 5;
  return score;
}
