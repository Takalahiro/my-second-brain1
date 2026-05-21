import type { Matrix } from './types';

/** 解析 MATLAB 文本矩阵：[1 2 3; 4 5 6] */
export function parseMatlabMatrix(text: string): Matrix {
  let s = text.trim();
  if (!s) throw new Error('矩阵文本为空');
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1).trim();
  if (!s) throw new Error('矩阵内容为空');

  const rowParts = s.split(';').map((r) => r.trim()).filter(Boolean);
  if (rowParts.length === 0) throw new Error('无法解析行');

  const rows = rowParts.map((rowStr) => {
    const tokens = rowStr.split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) throw new Error(`空行: ${rowStr}`);
    return tokens.map((tok) => {
      const v = Number(tok);
      if (!Number.isFinite(v)) throw new Error(`无效数字: ${tok}`);
      return v;
    });
  });

  const cols = rows[0].length;
  for (const row of rows) {
    if (row.length !== cols) throw new Error('各行列数必须一致');
  }
  return rows;
}

export function matrixToMatlab(m: Matrix): string {
  if (m.length === 0) return '[]';
  const body = m.map((row) => row.join(' ')).join('; ');
  return `[${body}]`;
}
