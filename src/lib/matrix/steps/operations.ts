import type { StepSequence } from '../types';
import { cloneMatrix, cofactorMatrix, detByTriangular, identity, isSquare, multiply, transpose } from '../core';
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

export function inverseGaussJordan(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('求逆需要方阵');
  resetStepCounter();
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...identity(n)[i]]);
  const steps = [
    introStep(
      '构造增广矩阵',
      '将 A 与单位矩阵 I 拼接为 [A | I]，通过初等行变换化为 [I | A⁻¹]。',
      '[A \\mid I]',
      [mat('aug', '[A | I]', aug)]
    ),
  ];

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < 1e-12) {
      throw new Error('矩阵奇异，不可逆');
    }
    if (pivot !== col) {
      swapRows(aug, col, pivot);
      steps.push(
        makeStep({
          title: `交换行（第 ${col + 1} 列主元）`,
          explanation: `当前列主元过小，交换 ${col + 1} 行与 ${pivot + 1} 行以获取非零主元。`,
          latex: rowOpLatex('swap', col, pivot),
          matrices: [mat('aug', '[A | I]', aug)],
          highlights: [hl('aug', { rows: [col, pivot] })],
          phase: 'eliminate',
        })
      );
    }

    const pivotVal = aug[col][col];
    if (Math.abs(pivotVal - 1) > 1e-12) {
      scaleRow(aug, col, 1 / pivotVal);
      steps.push(
        makeStep({
          title: `归一化主元行 ${col + 1}`,
          explanation: `将主元行除以 ${pivotVal.toFixed(4)}，使主元变为 1。`,
          latex: rowOpLatex('scale', col, undefined, 1 / pivotVal),
          matrices: [mat('aug', '[A | I]', aug)],
          highlights: [hl('aug', { rows: [col], activeCell: [col, col] })],
          phase: 'eliminate',
        })
      );
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (Math.abs(factor) < 1e-12) continue;
      addRowMultiple(aug, r, col, factor);
      steps.push(
        makeStep({
          title: `消元：行 ${r + 1}`,
          explanation: `消去第 ${r + 1} 行第 ${col + 1} 列的元素，使该列其他行变为 0。`,
          latex: rowOpLatex('add', r, col, factor),
          matrices: [mat('aug', '[A | I]', aug)],
          highlights: [
            hl('aug', { rows: [r, col], activeCell: [r, col] }),
          ],
          phase: 'eliminate',
        })
      );
    }
  }

  const inv = aug.map((row) => row.slice(n));
  steps.push(
    resultStep(
      '得到逆矩阵',
      '左半部分已化为 I，右半部分即为 A⁻¹。',
      `A^{-1} = ${matrixToLatex(inv)}`,
      [mat('result', 'A⁻¹', inv)]
    )
  );

  return {
    operation: 'inverse',
    method: 'gauss-jordan',
    steps,
    result: inv,
    resultText: formatMatrix(inv),
    resultLatex: matrixToLatex(inv),
  };
}

export function inverseAdjugate(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('求逆需要方阵');
  resetStepCounter();
  const n = A.length;
  const det = detByTriangular(A).det;
  if (Math.abs(det) < 1e-12) throw new Error('det(A)=0，不可逆');

  const cof = cofactorMatrix(A);
  const adj = transpose(cof);
  const inv = adj.map((row) => row.map((v) => v / det));

  const steps = [
    introStep(
      '伴随矩阵法',
      '公式 A⁻¹ = adj(A) / det(A)，其中 adj(A) 为代数余子式矩阵的转置。',
      'A^{-1} = \\frac{\\operatorname{adj}(A)}{\\det(A)}',
      [mat('A', 'A', A)]
    ),
    makeStep({
      title: '计算代数余子式矩阵',
      explanation: '对每个元素 aᵢⱼ 计算 (-1)ⁱ⁺ʲ 乘以其余子式行列式。',
      latex: 'C = (c_{ij}),\\quad c_{ij}=(-1)^{i+j}M_{ij}',
      matrices: [mat('A', 'A', A), mat('cof', '代数余子式 C', cof)],
      highlights: [hl('A', { activeCell: [0, 0] })],
      phase: 'compute',
    }),
    makeStep({
      title: '转置得伴随矩阵',
      explanation: 'adj(A) = Cᵀ，将代数余子式矩阵转置。',
      latex: '\\operatorname{adj}(A) = C^{\\mathsf T}',
      matrices: [mat('adj', 'adj(A)', adj)],
      highlights: [],
      phase: 'compute',
    }),
    makeStep({
      title: '除以行列式',
      explanation: `det(A) = ${det.toFixed(4)}，每个元素除以 det(A)。`,
      latex: `A^{-1} = \\frac{1}{${det.toFixed(4)}}\\operatorname{adj}(A)`,
      matrices: [mat('result', 'A⁻¹', inv)],
      highlights: [],
      phase: 'result',
    }),
  ];

  return {
    operation: 'inverse',
    method: 'adjugate',
    steps,
    result: inv,
    resultText: formatMatrix(inv),
    resultLatex: matrixToLatex(inv),
  };
}

export function inverseLU(A: number[][]): StepSequence {
  if (!isSquare(A)) throw new Error('求逆需要方阵');
  const lu = luDecompose(A);
  const n = A.length;
  const inv = identity(n);
  const steps = [...lu.steps];

  for (let col = 0; col < n; col++) {
    const e = identity(n).map((row) => [...row]);
    const y = forwardSub(lu.L, e[col], lu.perm);
    const x = backSub(lu.U, y);
    for (let r = 0; r < n; r++) inv[r][col] = x[r];
    steps.push(
      makeStep({
        title: `求第 ${col + 1} 列：解 A x = e${col + 1}`,
        explanation: '对单位矩阵的每一列 eᵢ，解 A x = eᵢ 得到 A⁻¹ 的对应列。',
        latex: `A\\,x = e_{${col + 1}}`,
        matrices: [mat('col', `A⁻¹ 第 ${col + 1} 列`, inv.map((row) => [row[col]]))],
        highlights: [hl('col', { activeCell: [0, 0] })],
        phase: 'solve',
      })
    );
  }

  steps.push(
    resultStep('LU 法得到 A⁻¹', '所有单位列求解完毕，拼接为逆矩阵。', `A^{-1}=${matrixToLatex(inv)}`, [
      mat('result', 'A⁻¹', inv),
    ])
  );

  return {
    operation: 'inverse',
    method: 'lu',
    steps,
    result: inv,
    resultText: formatMatrix(inv),
    resultLatex: matrixToLatex(inv),
  };
}

function forwardSub(L: number[][], b: number[], perm: number[]) {
  const n = L.length;
  const y = Array(n).fill(0);
  const pb = perm.map((i) => b[i]);
  for (let i = 0; i < n; i++) {
    let s = pb[i];
    for (let j = 0; j < i; j++) s -= L[i][j] * y[j];
    y[i] = s;
  }
  return y;
}

function backSub(U: number[][], y: number[]) {
  const n = U.length;
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < n; j++) s -= U[i][j] * x[j];
    if (Math.abs(U[i][i]) < 1e-12) throw new Error('U 奇异');
    x[i] = s / U[i][i];
  }
  return x;
}

export function luDecompose(A: number[][]) {
  if (!isSquare(A)) throw new Error('LU 分解需要方阵');
  resetStepCounter();
  const n = A.length;
  const U = cloneMatrix(A);
  const L = identity(n);
  const perm = Array.from({ length: n }, (_, i) => i);
  const steps = [
    introStep(
      'LU 分解',
      '将 A 分解为 PA = LU，L 为单位下三角，U 为上三角。',
      'PA = LU',
      [mat('A', 'A', A)]
    ),
  ];

  for (let k = 0; k < n - 1; k++) {
    let pivot = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[i][k]) > Math.abs(U[pivot][k])) pivot = i;
    }
    if (Math.abs(U[pivot][k]) < 1e-12) throw new Error('无法 LU 分解：零主元');
    if (pivot !== k) {
      [U[k], U[pivot]] = [U[pivot], U[k]];
      [L[k], L[pivot]] = [L[pivot], L[k]];
      [perm[k], perm[pivot]] = [perm[pivot], perm[k]];
      steps.push(
        makeStep({
          title: `选主元交换行 ${k + 1} ↔ ${pivot + 1}`,
          explanation: '部分选主元提高数值稳定性。',
          latex: rowOpLatex('swap', k, pivot),
          matrices: [mat('U', 'U (工作矩阵)', U), mat('L', 'L', L)],
          highlights: [hl('U', { rows: [k, pivot] })],
          phase: 'factor',
        })
      );
    }

    for (let i = k + 1; i < n; i++) {
      const m = U[i][k] / U[k][k];
      L[i][k] = m;
      for (let j = k; j < n; j++) U[i][j] -= m * U[k][j];
      steps.push(
        makeStep({
          title: `消元 L[${i + 1},${k + 1}] = ${m.toFixed(4)}`,
          explanation: `计算乘数并更新 U 的第 ${i + 1} 行，同时在 L 中记录乘数。`,
          latex: `L_{${i + 1}${k + 1}} = ${m.toFixed(4)}`,
          matrices: [mat('U', 'U', U), mat('L', 'L', L)],
          highlights: [hl('U', { rows: [i, k], activeCell: [i, k] }), hl('L', { activeCell: [i, k] })],
          phase: 'factor',
        })
      );
    }
  }

  steps.push(
    resultStep(
      '分解完成',
      '得到下三角 L 与上三角 U。',
      'A = LU',
      [mat('L', 'L', L), mat('U', 'U', U)]
    )
  );

  return { L, U, perm, steps };
}

export function luSteps(A: number[][]): StepSequence {
  const { L, U, steps } = luDecompose(A);
  return {
    operation: 'lu',
    method: 'doolittle',
    steps,
    result: { L, U },
    resultText: `L =\n${formatMatrix(L)}\n\nU =\n${formatMatrix(U)}`,
    resultLatex: `L=${matrixToLatex(L)},\\quad U=${matrixToLatex(U)}`,
  };
}

export function multiplySteps(A: number[][], B: number[][]): StepSequence {
  resetStepCounter();
  const C = multiply(A, B);
  const steps = [
    introStep(
      '矩阵乘法',
      'C = A × B，其中 cᵢⱼ = Σₖ aᵢₖ bₖⱼ。',
      'C = AB',
      [mat('A', 'A', A), mat('B', 'B', B)]
    ),
  ];

  for (let i = 0; i < C.length; i++) {
    for (let j = 0; j < C[0].length; j++) {
      const terms: string[] = [];
      let sum = 0;
      for (let k = 0; k < A[0].length; k++) {
        terms.push(`${A[i][k]}\\cdot${B[k][j]}`);
        sum += A[i][k] * B[k][j];
      }
      steps.push(
        makeStep({
          title: `计算 c_{${i + 1}${j + 1}} = ${sum.toFixed(4)}`,
          explanation: `第 ${i + 1} 行与第 ${j + 1} 列做点积：${terms.join(' + ').replace(/\\cdot/g, '×')}`,
          latex: `c_{${i + 1}${j + 1}} = ${terms.join('+')}`,
          matrices: [mat('A', 'A', A), mat('B', 'B', B), mat('C', 'C (部分)', C)],
          highlights: [
            hl('A', { rows: [i] }),
            hl('B', { cols: [j] }),
            hl('C', { activeCell: [i, j] }),
          ],
          phase: 'compute',
        })
      );
    }
  }

  steps.push(resultStep('乘法完成', '所有元素计算完毕。', `C=${matrixToLatex(C)}`, [mat('C', 'C', C)]));

  return {
    operation: 'multiply',
    method: 'definition',
    steps,
    result: C,
    resultText: formatMatrix(C),
    resultLatex: matrixToLatex(C),
  };
}
