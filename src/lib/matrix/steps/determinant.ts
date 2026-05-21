import type { StepSequence } from '../types';
import { cloneMatrix, det2, det3, detByTriangular, isSquare, minor } from '../core';
import { formatMatrix, matrixToLatex } from '../format';
import { hl, introStep, makeStep, mat, resetStepCounter, resultStep } from './common';

export function detTriangular(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('行列式需要方阵');
  resetStepCounter();
  const work = cloneMatrix(A);
  const n = A.length;
  let sign = 1;
  const steps = [
    introStep(
      '上三角化法',
      '通过初等行变换将 A 化为上三角矩阵，行列式等于主对角线乘积（乘以行交换符号）。',
      '\\det(A)',
      [mat('A', 'A', work)]
    ),
  ];

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(work[r][col]) > Math.abs(work[pivot][col])) pivot = r;
    }
    if (Math.abs(work[pivot][col]) < 1e-12) {
      steps.push(
        resultStep('行列式为 0', '出现零主元，矩阵奇异。', '\\det(A)=0', [mat('A', 'A', work)])
      );
      return {
        operation: 'determinant',
        method: 'triangular',
        steps,
        result: 0,
        resultText: '0',
        resultLatex: '\\det(A)=0',
      };
    }
    if (pivot !== col) {
      [work[col], work[pivot]] = [work[pivot], work[col]];
      sign *= -1;
      steps.push(
        makeStep({
          title: `交换行 ${col + 1} ↔ ${pivot + 1}`,
          explanation: '行交换改变行列式符号，记录 sign = -1。',
          latex: 'R_i \\leftrightarrow R_j \\Rightarrow \\det \\leftarrow -\\det',
          matrices: [mat('A', 'A (工作)', work)],
          highlights: [hl('A', { rows: [col, pivot] })],
          phase: 'eliminate',
        })
      );
    }

    for (let r = col + 1; r < n; r++) {
      const f = work[r][col] / work[col][col];
      for (let c = col; c < n; c++) work[r][c] -= f * work[col][c];
      steps.push(
        makeStep({
          title: `消元行 ${r + 1}`,
          explanation: '行倍加不改变行列式，继续化为上三角。',
          latex: `R_{${r + 1}} \\leftarrow R_{${r + 1}} - ${f.toFixed(4)}R_{${col + 1}}`,
          matrices: [mat('A', 'A (工作)', work)],
          highlights: [hl('A', { rows: [r, col], activeCell: [r, col] })],
          phase: 'eliminate',
        })
      );
    }
  }

  let det = sign;
  const diag = work.map((row, i) => row[i]);
  for (const d of diag) det *= d;
  steps.push(
    resultStep(
      '主对角线乘积',
      `上三角矩阵主对角线: ${diag.map((d) => d.toFixed(4)).join(' × ')}，符号因子 ${sign}。`,
      `\\det(A) = ${det.toFixed(6)}`,
      [mat('A', '上三角', work)]
    )
  );

  return {
    operation: 'determinant',
    method: 'triangular',
    steps,
    result: det,
    resultText: String(det),
    resultLatex: `\\det(A)=${det.toFixed(6)}`,
  };
}

export function detLaplace(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('行列式需要方阵');
  resetStepCounter();
  const steps = [
    introStep(
      '拉普拉斯展开',
      '按第一行展开：det(A) = Σⱼ (-1)¹⁺ʲ a₁ⱼ M₁ⱼ，M 为余子式。',
      '\\det(A)=\\sum_j (-1)^{1+j}a_{1j}M_{1j}',
      [mat('A', 'A', A)]
    ),
  ];

  function expand(m: number[][], row: number, depth: number): { det: number; steps: typeof steps } {
    const n = m.length;
    if (n === 1) return { det: m[0][0], steps: [] };
    if (n === 2) return { det: det2(m), steps: [] };

    let total = 0;
    const localSteps = [...steps];
    for (let j = 0; j < n; j++) {
      const sign = (row + j) % 2 === 0 ? 1 : -1;
      const sub = minor(m, row, j);
      const subDet = n - 1 === 2 ? det2(sub) : n - 1 === 3 ? det3(sub) : detByTriangular(sub).det;
      const term = sign * m[row][j] * subDet;
      total += term;
      localSteps.push(
        makeStep({
          title: `按第 ${row + 1} 行第 ${j + 1} 列展开`,
          explanation: `项 (${sign > 0 ? '+' : '-'})${m[row][j]} × det(M${row + 1}${j + 1}) = ${term.toFixed(4)}`,
          latex: `(-1)^{${row + 1}+${j + 1}} a_{${row + 1}${j + 1}} \\det(M_{${row + 1}${j + 1}})`,
          matrices: [mat('A', '当前矩阵', m), mat('M', `余子式 M${row + 1}${j + 1}`, sub)],
          highlights: [hl('A', { activeCell: [row, j] })],
          phase: 'expand',
        })
      );
    }
    return { det: total, steps: localSteps };
  }

  const { det, steps: allSteps } = expand(A, 0, 0);
  allSteps.push(
    resultStep('展开求和结果', '所有展开项相加。', `\\det(A)=${det.toFixed(6)}`, [mat('A', 'A', A)])
  );

  return {
    operation: 'determinant',
    method: 'laplace',
    steps: allSteps,
    result: det,
    resultText: String(det),
    resultLatex: `\\det(A)=${det.toFixed(6)}`,
  };
}

export function detLeibniz(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('行列式需要方阵');
  const n = A.length;
  if (n > 4) throw new Error('莱布尼茨公式仅适合 n ≤ 4 的小矩阵');
  resetStepCounter();

  const perms: number[][] = [];
  function permute(arr: number[], l = 0) {
    if (l === arr.length) { perms.push([...arr]); return; }
    for (let i = l; i < arr.length; i++) {
      [arr[l], arr[i]] = [arr[i], arr[l]];
      permute(arr, l + 1);
      [arr[l], arr[i]] = [arr[i], arr[l]];
    }
  }
  permute(Array.from({ length: n }, (_, i) => i));

  const steps = [
    introStep(
      '莱布尼茨公式',
      'det(A) = Σσ∈Sₙ sgn(σ) ∏ aᵢ,σ(i)，对所有排列求和。',
      '\\det(A)=\\sum_{\\sigma\\in S_n}\\operatorname{sgn}(\\sigma)\\prod_i a_{i,\\sigma(i)}',
      [mat('A', 'A', A)]
    ),
  ];

  let det = 0;
  for (const p of perms) {
    let sign = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (p[i] > p[j]) sign++;
      }
    }
    const sgn = sign % 2 === 0 ? 1 : -1;
    let prod = sgn;
    const cells: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) {
      prod *= A[i][p[i]];
      cells.push([i, p[i]]);
    }
    det += prod;
    steps.push(
      makeStep({
        title: `排列 σ = (${p.map((x) => x + 1).join(',')})`,
        explanation: `符号 ${sgn > 0 ? '+' : '-'}，乘积 = ${prod.toFixed(4)}`,
        latex: `\\operatorname{sgn}(${p.map((x) => x + 1).join(',')})\\prod a_{i,\\sigma(i)}`,
        matrices: [mat('A', 'A', A)],
        highlights: [hl('A', { cells })],
        phase: 'perm',
      })
    );
  }

  steps.push(resultStep('求和', '所有排列项相加。', `\\det(A)=${det.toFixed(6)}`, [mat('A', 'A', A)]));

  return {
    operation: 'determinant',
    method: 'leibniz',
    steps,
    result: det,
    resultText: String(det),
    resultLatex: `\\det(A)=${det.toFixed(6)}`,
  };
}
