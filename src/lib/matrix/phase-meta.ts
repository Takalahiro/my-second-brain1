/** 步骤阶段：用于 UI 配色与通俗说明 */
export type StepPhase =
  | 'intro'
  | 'eliminate'
  | 'compute'
  | 'expand'
  | 'perm'
  | 'iterate'
  | 'factor'
  | 'solve'
  | 'backsub'
  | 'transpose'
  | 'result'
  | string;

export const PHASE_META: Record<
  string,
  { label: string; hint: string; color: string; bg: string }
> = {
  intro: {
    label: '准备',
    hint: '先看清题目与初始矩阵',
    color: '#b48cff',
    bg: 'rgb(180 140 255 / 0.12)',
  },
  eliminate: {
    label: '消元',
    hint: '通过行变换化简矩阵',
    color: '#6dff9a',
    bg: 'rgb(0 255 120 / 0.1)',
  },
  compute: {
    label: '计算',
    hint: '按公式逐项算出结果',
    color: '#ffd56a',
    bg: 'rgb(255 200 80 / 0.1)',
  },
  expand: {
    label: '展开',
    hint: '按行或列拆成更小行列式',
    color: '#ff9ed4',
    bg: 'rgb(255 120 180 / 0.1)',
  },
  perm: {
    label: '排列',
    hint: '枚举排列并累加符号项',
    color: '#7ec8ff',
    bg: 'rgb(80 180 255 / 0.1)',
  },
  iterate: {
    label: '迭代',
    hint: '反复分解直到收敛',
    color: '#7ec8ff',
    bg: 'rgb(80 180 255 / 0.1)',
  },
  factor: {
    label: '分解',
    hint: '拆成 L、U 等因子矩阵',
    color: '#c8a0ff',
    bg: 'rgb(180 140 255 / 0.1)',
  },
  solve: {
    label: '求解',
    hint: '代入方程组求未知量',
    color: '#6dff9a',
    bg: 'rgb(0 255 120 / 0.1)',
  },
  backsub: {
    label: '回代',
    hint: '从最后一行向上回代',
    color: '#ffd56a',
    bg: 'rgb(255 200 80 / 0.1)',
  },
  transpose: {
    label: '转置',
    hint: '行列下标互换',
    color: '#ff9ed4',
    bg: 'rgb(255 120 180 / 0.1)',
  },
  result: {
    label: '结果',
    hint: '得到最终答案',
    color: '#00ff9d',
    bg: 'rgb(0 255 157 / 0.12)',
  },
};

export function phaseMeta(phase?: string) {
  return PHASE_META[phase ?? ''] ?? PHASE_META.compute;
}

export const OPERATION_LABELS: Record<string, string> = {
  inverse: '求逆矩阵',
  determinant: '行列式',
  multiply: '矩阵乘法',
  eigenvalues: '特征值',
  rref: '行阶梯形',
  lu: 'LU 分解',
  solve: '线性方程组',
  rank: '矩阵的秩',
  transpose: '转置',
};

export const HIGHLIGHT_LEGEND = [
  { cls: 'hl-row', label: '当前行', color: '#b48cff' },
  { cls: 'hl-col', label: '当前列', color: '#6dffcc' },
  { cls: 'hl-active', label: '焦点元素', color: '#00ff65' },
];
