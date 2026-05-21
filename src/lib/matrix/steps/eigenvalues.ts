import type { StepSequence } from '../types';
import { cloneMatrix, isSquare, multiply, transpose } from '../core';
import { eigenvaluesToLatex, eigenvaluesToText, formatMatrix, matrixToLatex } from '../format';
import { hl, introStep, makeStep, mat, resetStepCounter, resultStep } from './common';

function charPoly2(A: number[][]): number[] {
  const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
  // λ² - (a+d)λ + (ad-bc)
  return [1, -(a + d), a * d - b * c];
}

function charPoly3(A: number[][]): number[] {
  // Use math via determinant of (A - λI) symbolically - simplified numeric at sample points
  const trace = A[0][0] + A[1][1] + A[2][2];
  const det =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
  const s2 =
    A[0][0] * A[1][1] - A[0][1] * A[1][0] +
    A[0][0] * A[2][2] - A[0][2] * A[2][0] +
    A[1][1] * A[2][2] - A[1][2] * A[2][1];
  return [1, -trace, s2, -det];
}

function solveQuadratic(a: number, b: number, c: number): number[] {
  const disc = b * b - 4 * a * c;
  if (disc < -1e-10) return [];
  if (Math.abs(disc) < 1e-10) return [-b / (2 * a)];
  const s = Math.sqrt(Math.max(0, disc));
  return [(-b + s) / (2 * a), (-b - s) / (2 * a)];
}

function solveCubic(a: number, b: number, c: number, d: number): number[] {
  // Cardano / numeric fallback
  const roots: number[] = [];
  for (let lam = -100; lam <= 100; lam += 0.0001) {
    const v = ((a * lam + b) * lam + c) * lam + d;
    if (Math.abs(v) < 1e-4) roots.push(Math.round(lam * 1e4) / 1e4);
  }
  return [...new Set(roots.map((r) => Math.round(r * 1e6) / 1e6))].slice(0, 3);
}

export function eigenCharPoly(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('特征值需要方阵');
  const n = A.length;
  if (n > 3) throw new Error('特征多项式法仅适合 n ≤ 3');
  resetStepCounter();

  const coeffs = n === 2 ? charPoly2(A) : charPoly3(A);
  const polyLatex =
    n === 2
      ? `\\lambda^2 ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1].toFixed(4)}\\lambda ${coeffs[2] >= 0 ? '+' : ''}${coeffs[2].toFixed(4)} = 0`
      : `\\lambda^3 ${coeffs[1] >= 0 ? '+' : ''}${coeffs[1].toFixed(4)}\\lambda^2 ${coeffs[2] >= 0 ? '+' : ''}${coeffs[2].toFixed(4)}\\lambda ${coeffs[3] >= 0 ? '+' : ''}${coeffs[3].toFixed(4)} = 0`;

  const steps = [
    introStep(
      '特征多项式法',
      '解 det(A - λI) = 0 得到特征值。',
      '\\det(A-\\lambda I)=0',
      [mat('A', 'A', A)]
    ),
    makeStep({
      title: '构造 A - λI',
      explanation: '对角线减去 λ，其余元素不变。',
      latex: 'A-\\lambda I',
      matrices: [mat('A', 'A', A)],
      highlights: [hl('A', { cols: [0, 1, 2].slice(0, n) })],
      phase: 'poly',
    }),
    makeStep({
      title: '展开特征多项式',
      explanation: '计算 det(A - λI) 并令其为 0。',
      latex: polyLatex,
      matrices: [mat('A', 'A', A)],
      highlights: [],
      phase: 'poly',
    }),
  ];

  const values =
    n === 2
      ? solveQuadratic(coeffs[0], coeffs[1], coeffs[2])
      : solveCubic(coeffs[0], coeffs[1], coeffs[2], coeffs[3]);

  steps.push(
    resultStep(
      '特征值',
      '解特征方程得到特征值。',
      eigenvaluesToLatex(values),
      [mat('A', 'A', A)]
    )
  );

  return {
    operation: 'eigenvalues',
    method: 'charpoly',
    steps,
    result: values,
    resultText: eigenvaluesToText(values),
    resultLatex: eigenvaluesToLatex(values),
  };
}

function qrDecompose(A: number[][]) {
  const n = A.length;
  const Q = Array.from({ length: n }, () => Array(n).fill(0));
  const R = cloneMatrix(A);
  for (let j = 0; j < n; j++) {
    let v = R.map((row) => row[j]);
    for (let i = 0; i < j; i++) {
      let dot = 0;
      for (let k = 0; k < n; k++) dot += Q[k][i] * v[k];
      R[i][j] = dot;
      for (let k = 0; k < n; k++) v[k] -= dot * Q[k][i];
    }
    const norm = Math.hypot(...v);
    if (norm < 1e-12) throw new Error('QR 分解失败');
    for (let k = 0; k < n; k++) Q[k][j] = v[k] / norm;
    R[j][j] = norm;
    for (let i = j + 1; i < n; i++) R[i][j] = 0;
  }
  return { Q, R };
}

export function eigenQR(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('特征值需要方阵');
  resetStepCounter();
  let Ak = cloneMatrix(A);
  const steps = [
    introStep(
      'QR 迭代',
      '反复做 QR 分解并更新 A ← RQ，对角线收敛到特征值（对称矩阵效果尤佳）。',
      'A_{k+1}=R_k Q_k',
      [mat('A', 'A₀', Ak)]
    ),
  ];

  const maxIter = Math.min(12, 20);
  for (let iter = 0; iter < maxIter; iter++) {
    const { Q, R } = qrDecompose(Ak);
    Ak = multiply(R, Q);
    const diag = Ak.map((row, i) => row[i]);
    steps.push(
      makeStep({
        title: `迭代 ${iter + 1}`,
        explanation: `当前对角线近似: ${diag.map((d) => d.toFixed(4)).join(', ')}`,
        latex: `A_{${iter + 1}} = R_${iter} Q_${iter}`,
        matrices: [mat('A', `A${iter + 1}`, Ak), mat('Q', `Q${iter}`, Q), mat('R', `R${iter}`, R)],
        highlights: [hl('A', { cells: diag.map((_, i) => [i, i] as [number, number]) })],
        phase: 'iterate',
      })
    );
  }

  const values = Ak.map((row, i) => row[i]);
  steps.push(
    resultStep(
      '收敛特征值（近似）',
      'QR 迭代后对角线元素作为特征值近似。',
      eigenvaluesToLatex(values),
      [mat('A', 'A_k', Ak)]
    )
  );

  return {
    operation: 'eigenvalues',
    method: 'qr',
    steps,
    result: values,
    resultText: eigenvaluesToText(values),
    resultLatex: eigenvaluesToLatex(values),
  };
}

export function eigenvaluesSteps(A: number[][], method: string): StepSequence {
  return method === 'qr' ? eigenQR(A) : eigenCharPoly(A);
}
