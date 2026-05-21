import type { StepSequence } from '../types';
import { cloneMatrix, isSquare } from '../core';
import { formatMatrix, matrixToLatex } from '../format';
import {
  addRowMultiple,
  hl,
  introStep,
  makeStep,
  mat,
  resetStepCounter,
  resultStep,
  rowOpLatex,
  scaleRow,
  swapRows,
} from './common';

export function rrefSteps(A: number[][]): StepSequence {
  resetStepCounter();
  const m = cloneMatrix(A);
  const rows = m.length;
  const cols = m[0]?.length ?? 0;
  let pivotRow = 0;
  const steps = [
    introStep(
      '行简化阶梯形 rref',
      '通过初等行变换化为简化行阶梯形：主元为 1，主元列其余元素为 0。',
      '\\operatorname{rref}(A)',
      [mat('A', 'A', m)]
    ),
  ];

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let pivot = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    if (Math.abs(m[pivot][col]) < 1e-12) continue;

    if (pivot !== pivotRow) {
      swapRows(m, pivotRow, pivot);
      steps.push(
        makeStep({
          title: `交换行 ${pivotRow + 1} ↔ ${pivot + 1}`,
          explanation: '将最大主元移到当前行。',
          latex: rowOpLatex('swap', pivotRow, pivot),
          matrices: [mat('A', 'A', m)],
          highlights: [hl('A', { rows: [pivotRow, pivot] })],
          phase: 'eliminate',
        })
      );
    }

    const pv = m[pivotRow][col];
    if (Math.abs(pv - 1) > 1e-12) {
      scaleRow(m, pivotRow, 1 / pv);
      steps.push(
        makeStep({
          title: `主元归一化 R${pivotRow + 1}`,
          explanation: '将主元缩放为 1。',
          latex: rowOpLatex('scale', pivotRow, undefined, 1 / pv),
          matrices: [mat('A', 'A', m)],
          highlights: [hl('A', { rows: [pivotRow], activeCell: [pivotRow, col] })],
          phase: 'eliminate',
        })
      );
    }

    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const f = m[r][col];
      if (Math.abs(f) < 1e-12) continue;
      addRowMultiple(m, r, pivotRow, f);
      steps.push(
        makeStep({
          title: `消元 R${r + 1}`,
          explanation: `消去第 ${r + 1} 行第 ${col + 1} 列。`,
          latex: rowOpLatex('add', r, pivotRow, f),
          matrices: [mat('A', 'A', m)],
          highlights: [hl('A', { rows: [r, pivotRow], activeCell: [r, col] })],
          phase: 'eliminate',
        })
      );
    }
    pivotRow++;
  }

  steps.push(
    resultStep('rref 完成', '得到简化行阶梯形。', `\\operatorname{rref}(A)=${matrixToLatex(m)}`, [
      mat('A', 'rref(A)', m),
    ])
  );

  return {
    operation: 'rref',
    method: 'gauss-jordan',
    steps,
    result: m,
    resultText: formatMatrix(m),
    resultLatex: matrixToLatex(m),
  };
}

export function rankSteps(A: number[][]): StepSequence {
  const seq = rrefSteps(A);
  const m = seq.result as number[][];
  let rank = 0;
  for (const row of m) {
    if (row.some((v) => Math.abs(v) > 1e-10)) rank++;
  }
  seq.operation = 'rank';
  seq.method = 'rref';
  seq.result = rank;
  seq.resultText = String(rank);
  seq.resultLatex = `\\operatorname{rank}(A)=${rank}`;
  seq.steps.push(
    resultStep(
      '统计主元行',
      `rref 中非零行数为 ${rank}，即矩阵的秩。`,
      `\\operatorname{rank}(A)=${rank}`,
      [mat('A', 'rref(A)', m)]
    )
  );
  return seq;
}

export function transposeSteps(A: number[][]): StepSequence {
  resetStepCounter();
  const rows = A.length;
  const cols = A[0]?.length ?? 0;
  const T = Array.from({ length: cols }, () => Array(rows).fill(0));
  const steps = [
    introStep(
      '矩阵转置',
      'Aᵀ 的第 (i,j) 元素等于 A 的第 (j,i) 元素。',
      'A^{\\mathsf T}',
      [mat('A', 'A', A)]
    ),
  ];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      T[j][i] = A[i][j];
      steps.push(
        makeStep({
          title: `交换 a_{${i + 1}${j + 1}} → a'_{${j + 1}${i + 1}}`,
          explanation: `将 A[${i + 1},${j + 1}]=${A[i][j]} 放到转置矩阵位置 [${j + 1},${i + 1}]。`,
          latex: `a'_{${j + 1}${i + 1}} = a_{${i + 1}${j + 1}}`,
          matrices: [mat('A', 'A', A), mat('T', 'Aᵀ (构建中)', T)],
          highlights: [
            hl('A', { activeCell: [i, j] }),
            hl('T', { activeCell: [j, i] }),
          ],
          phase: 'transpose',
        })
      );
    }
  }

  steps.push(resultStep('转置完成', '', `A^{\\mathsf T}=${matrixToLatex(T)}`, [mat('T', 'Aᵀ', T)]));

  return {
    operation: 'transpose',
    method: 'definition',
    steps,
    result: T,
    resultText: formatMatrix(T),
    resultLatex: matrixToLatex(T),
  };
}

export function solveSteps(A: number[][], b: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('Ax=b 需要 A 为方阵');
  if (b.length !== A.length || (b[0]?.length ?? 0) !== 1) {
    throw new Error('b 必须是 n×1 列向量');
  }
  resetStepCounter();
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i][0]]);
  const steps = [
    introStep(
      '高斯消元解方程组',
      '构造增广矩阵 [A | b]，化为行阶梯形后回代求解。',
      '[A \\mid b]',
      [mat('aug', '[A | b]', aug)]
    ),
  ];

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < 1e-12) throw new Error('方程组无唯一解');
    if (pivot !== col) {
      swapRows(aug, col, pivot);
      steps.push(
        makeStep({
          title: `选主元 R${col + 1} ↔ R${pivot + 1}`,
          explanation: '交换行获取非零主元。',
          latex: rowOpLatex('swap', col, pivot),
          matrices: [mat('aug', '[A | b]', aug)],
          highlights: [hl('aug', { rows: [col, pivot] })],
          phase: 'eliminate',
        })
      );
    }
    for (let r = col + 1; r < n; r++) {
      const f = aug[r][col] / aug[col][col];
      addRowMultiple(aug, r, col, f);
      steps.push(
        makeStep({
          title: `消元 R${r + 1}`,
          explanation: '化为上三角形式。',
          latex: rowOpLatex('add', r, col, f),
          matrices: [mat('aug', '[A | b]', aug)],
          highlights: [hl('aug', { rows: [r, col] })],
          phase: 'eliminate',
        })
      );
    }
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = aug[i][n];
    for (let j = i + 1; j < n; j++) s -= aug[i][j] * x[j];
    x[i] = s / aug[i][i];
    steps.push(
      makeStep({
        title: `回代 x${i + 1} = ${x[i].toFixed(4)}`,
        explanation: `从最后一行向上回代求解 x${i + 1}。`,
        latex: `x_{${i + 1}} = ${x[i].toFixed(4)}`,
        matrices: [mat('aug', '[A | b]', aug)],
        highlights: [hl('aug', { rows: [i], activeCell: [i, n] })],
        phase: 'backsub',
      })
    );
  }

  const col = x.map((v) => [v]);
  steps.push(
    resultStep('解向量', '方程组求解完成。', `x=${matrixToLatex(col)}`, [mat('x', 'x', col)])
  );

  return {
    operation: 'solve',
    method: 'gaussian',
    steps,
    result: col,
    resultText: formatMatrix(col),
    resultLatex: matrixToLatex(col),
  };
}
