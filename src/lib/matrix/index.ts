import type { MethodOption, OperationId, StepSequence } from './types';
import { detLaplace, detLeibniz, detTriangular } from './steps/determinant';
import { eigenvaluesSteps } from './steps/eigenvalues';
import { rankSteps, rrefSteps, solveSteps, transposeSteps } from './steps/elimination';
import {
  inverseAdjugate,
  inverseGaussJordan,
  inverseLU,
  luSteps,
  multiplySteps,
} from './steps/operations';

export const OPERATIONS: Array<{
  id: OperationId;
  label: string;
  icon: string;
  needsB?: boolean;
  needsVector?: boolean;
  methods: MethodOption[];
}> = [
  {
    id: 'inverse',
    label: '求逆 A⁻¹',
    icon: '⁻¹',
    methods: [
      { id: 'gauss-jordan', label: '高斯-若尔当', desc: '增广矩阵 [A|I] 消元，适合教学' },
      { id: 'adjugate', label: '伴随矩阵法', desc: 'A⁻¹ = adj(A)/det(A)' },
      { id: 'lu', label: 'LU 分解法', desc: '对单位列逐列求解' },
    ],
  },
  {
    id: 'determinant',
    label: '行列式 det(A)',
    icon: 'det',
    methods: [
      { id: 'triangular', label: '上三角化', desc: '高斯消元，主对角线乘积' },
      { id: 'laplace', label: '拉普拉斯展开', desc: '按行/列递归展开' },
      { id: 'leibniz', label: '莱布尼茨公式', desc: 'n≤4 排列求和' },
    ],
  },
  {
    id: 'multiply',
    label: '乘法 A×B',
    icon: '×',
    needsB: true,
    methods: [{ id: 'definition', label: '定义法', desc: '逐元素点积展示' }],
  },
  {
    id: 'eigenvalues',
    label: '特征值 eig(A)',
    icon: 'λ',
    methods: [
      { id: 'charpoly', label: '特征多项式', desc: 'n≤3 解 det(A-λI)=0' },
      { id: 'qr', label: 'QR 迭代', desc: '数值迭代近似' },
    ],
  },
  {
    id: 'rref',
    label: 'rref(A)',
    icon: 'R',
    methods: [{ id: 'gauss-jordan', label: '高斯-若尔当', desc: '行简化阶梯形' }],
  },
  {
    id: 'lu',
    label: 'LU 分解',
    icon: 'LU',
    methods: [{ id: 'doolittle', label: 'Doolittle', desc: 'L 单位对角，U 上三角' }],
  },
  {
    id: 'solve',
    label: '解 Ax=b',
    icon: '=',
    needsVector: true,
    methods: [{ id: 'gaussian', label: '高斯消元', desc: '增广矩阵消元 + 回代' }],
  },
  {
    id: 'rank',
    label: '秩 rank(A)',
    icon: 'rk',
    methods: [{ id: 'rref', label: 'rref 法', desc: '统计主元行数' }],
  },
  {
    id: 'transpose',
    label: '转置 Aᵀ',
    icon: 'ᵀ',
    methods: [{ id: 'definition', label: '元素交换', desc: '逐元素展示交换' }],
  },
];

export function runMatrixOperation(
  operation: OperationId,
  method: string,
  A: number[][],
  B?: number[][],
  b?: number[][]
): StepSequence {
  switch (operation) {
    case 'inverse':
      if (method === 'adjugate') return inverseAdjugate(A);
      if (method === 'lu') return inverseLU(A);
      return inverseGaussJordan(A);
    case 'determinant':
      if (method === 'laplace') return detLaplace(A);
      if (method === 'leibniz') return detLeibniz(A);
      return detTriangular(A);
    case 'multiply':
      if (!B) throw new Error('矩阵乘法需要矩阵 B');
      if (A[0].length !== B.length) throw new Error('A 的列数必须等于 B 的行数');
      return multiplySteps(A, B);
    case 'eigenvalues':
      return eigenvaluesSteps(A, method);
    case 'rref':
      return rrefSteps(A);
    case 'lu':
      return luSteps(A);
    case 'solve':
      if (!b) throw new Error('解方程组需要向量 b');
      return solveSteps(A, b);
    case 'rank':
      return rankSteps(A);
    case 'transpose':
      return transposeSteps(A);
    default:
      throw new Error(`未知运算: ${operation}`);
  }
}

export type { StepSequence, OperationId, MethodOption, VizStep, MatrixHighlight } from './types';
export { parseMatlabMatrix, matrixToMatlab } from './parse';
export { formatMatrix, formatNumber, matrixToLatex } from './format';
export { identity, zeros, transpose, cloneMatrix } from './core';
