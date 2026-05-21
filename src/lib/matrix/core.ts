import type { Matrix } from './types';

export function cloneMatrix(m: Matrix): Matrix {
  return m.map((row) => [...row]);
}

export function zeros(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function identity(n: number): Matrix {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}

export function transpose(m: Matrix): Matrix {
  if (m.length === 0) return [];
  const rows = m.length;
  const cols = m[0].length;
  return Array.from({ length: cols }, (_, j) => Array.from({ length: rows }, (_, i) => m[i][j]));
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const rows = a.length;
  const cols = b[0]?.length ?? 0;
  const inner = b.length;
  const out = zeros(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let s = 0;
      for (let k = 0; k < inner; k++) s += a[i][k] * b[k][j];
      out[i][j] = s;
    }
  }
  return out;
}

export function approxEqual(a: number, b: number, eps = 1e-10) {
  return Math.abs(a - b) <= eps;
}

export function matrixEqual(a: Matrix, b: Matrix, eps = 1e-10) {
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (!approxEqual(a[i][j], b[i][j], eps)) return false;
    }
  }
  return true;
}

export function det2(m: Matrix): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

export function det3(m: Matrix): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

export function detByTriangular(m: Matrix): { det: number; sign: number; triangular: Matrix } {
  const a = cloneMatrix(m);
  const n = a.length;
  let sign = 1;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    if (approxEqual(a[pivot][col], 0)) return { det: 0, sign, triangular: a };
    if (pivot !== col) {
      [a[col], a[pivot]] = [a[pivot], a[col]];
      sign *= -1;
    }
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / a[col][col];
      for (let c = col; c < n; c++) a[r][c] -= f * a[col][c];
    }
  }
  let det = sign;
  for (let i = 0; i < n; i++) det *= a[i][i];
  return { det, sign, triangular: a };
}

export function minor(m: Matrix, skipRow: number, skipCol: number): Matrix {
  return m
    .filter((_, i) => i !== skipRow)
    .map((row) => row.filter((_, j) => j !== skipCol));
}

export function cofactorMatrix(m: Matrix): Matrix {
  const n = m.length;
  const out = zeros(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      const sub = minor(m, i, j);
      const d = sub.length === 1 ? sub[0][0] : sub.length === 2 ? det2(sub) : detByTriangular(sub).det;
      out[i][j] = sign * d;
    }
  }
  return out;
}

export function isSquare(m: Matrix) {
  return m.length > 0 && m.every((row) => row.length === m.length);
}

export function validateSameSize(a: Matrix, b: Matrix, label = '矩阵') {
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) {
    throw new Error(`${label}维度不匹配`);
  }
}
