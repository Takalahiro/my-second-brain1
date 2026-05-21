import { fmt } from './math-utils';
import type { ProbTopicId, StatStepSequence, StatVizStep } from './types';

let stepId = 0;
function step(partial: Omit<StatVizStep, 'id'>): StatVizStep {
  stepId += 1;
  return { id: `p${stepId}`, ...partial };
}

export const PROB_TOPICS: Array<{ id: ProbTopicId; label: string; desc: string }> = [
  { id: 'conditional', label: '条件概率', desc: 'P(A|B) = P(A∩B)/P(B)' },
  { id: 'bayes', label: '贝叶斯公式', desc: '后验 ∝ 似然 × 先验' },
  { id: 'total', label: '全概率公式', desc: '划分样本空间' },
  { id: 'clt', label: '中心极限定理', desc: '样本均值趋近正态' },
  { id: 'independence', label: '独立与互斥', desc: 'P(A∩B) 的比较' },
];

export type ProbInput = {
  topic: ProbTopicId;
  pA?: number;
  pB?: number;
  pAB?: number;
  pBgivenA?: number;
  prior?: number;
  likelihood?: number;
  partitions?: string;
  sampleN?: number;
  popMean?: number;
  popStd?: number;
};

export function buildProbabilitySteps(input: ProbInput): StatStepSequence {
  stepId = 0;
  switch (input.topic) {
    case 'conditional':
      return conditionalSteps(input);
    case 'bayes':
      return bayesSteps(input);
    case 'total':
      return totalProbSteps(input);
    case 'clt':
      return cltSteps(input);
    case 'independence':
      return independenceSteps(input);
    default:
      return { mode: '概率论', steps: [], resultText: '', resultLatex: '' };
  }
}

function conditionalSteps(input: ProbInput): StatStepSequence {
  const pA = input.pA ?? 0.4;
  const pB = input.pB ?? 0.5;
  const pAB = input.pAB ?? 0.2;
  const pAgivenB = pAB / pB;
  const pBgivenA = pAB / pA;

  const steps: StatVizStep[] = [
    step({
      title: '条件概率定义',
      explanation: '在 B 已发生条件下，A 发生的概率。',
      latex: 'P(A|B)=\\frac{P(A\\cap B)}{P(B)}',
      phase: 'intro',
    }),
    step({
      title: '代入已知概率',
      explanation: `P(A)=${pA}, P(B)=${pB}, P(A∩B)=${pAB}`,
      latex: `P(A|B)=\\frac{${pAB}}{${pB}}=${fmt(pAgivenB)}`,
      phase: 'compute',
    }),
    step({
      title: '反向条件概率',
      explanation: 'P(B|A) 同理计算。',
      latex: `P(B|A)=\\frac{${pAB}}{${pA}}=${fmt(pBgivenA)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '条件概率',
    steps,
    resultText: `P(A|B) = ${fmt(pAgivenB, 6)}\nP(B|A) = ${fmt(pBgivenA, 6)}`,
    resultLatex: `P(A|B)=${fmt(pAgivenB)},\\ P(B|A)=${fmt(pBgivenA)}`,
  };
}

function bayesSteps(input: ProbInput): StatStepSequence {
  const prior = input.prior ?? 0.01;
  const sens = input.likelihood ?? 0.95;
  const falsePos = input.pBgivenA ?? 0.05;
  const pPos = prior * sens + (1 - prior) * falsePos;
  const post = (prior * sens) / pPos;

  const steps: StatVizStep[] = [
    step({
      title: '贝叶斯定理',
      explanation: '用新证据更新先验信念。',
      latex: 'P(H|D)=\\frac{P(D|H)P(H)}{P(D)}',
      phase: 'intro',
    }),
    step({
      title: '先验与似然',
      explanation: `P(H)=${prior}，P(D|H)=${sens}，P(D|¬H)=${falsePos}`,
      latex: `P(H)=${prior},\\ P(D|H)=${sens}`,
      phase: 'compute',
    }),
    step({
      title: '全概率求 P(D)',
      explanation: '证据边际概率作为归一化常数。',
      latex: `P(D)=${fmt(pPos)}`,
      phase: 'compute',
    }),
    step({
      title: '后验概率',
      explanation: '观察到 D 后，H 为真的概率。',
      latex: `P(H|D)=${fmt(post)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '贝叶斯',
    steps,
    resultText: `P(H|D) = ${fmt(post, 6)}`,
    resultLatex: `P(H|D)=${fmt(post)}`,
  };
}

function totalProbSteps(input: ProbInput): StatStepSequence {
  const parts = (input.partitions ?? '0.3,0.5,0.2')
    .split(/[,，\s]+/)
    .map((s) => parseFloat(s))
    .filter(Number.isFinite);
  const cond = [0.2, 0.5, 0.8].slice(0, parts.length);
  let total = 0;
  for (let i = 0; i < parts.length; i++) total += parts[i] * cond[i];

  const steps: StatVizStep[] = [
    step({
      title: '全概率公式',
      explanation: 'B₁,…,B_k 构成样本空间的一个划分。',
      latex: 'P(A)=\\sum_i P(A|B_i)P(B_i)',
      phase: 'intro',
    }),
    step({
      title: '划分概率',
      explanation: parts.map((p, i) => `P(B${i + 1})=${p}`).join('，'),
      latex: `\\sum P(B_i)=${fmt(parts.reduce((a, b) => a + b, 0))}`,
      phase: 'compute',
    }),
    step({
      title: '加权求和',
      explanation: '各划分下条件概率乘以权重。',
      latex: `P(A)=${fmt(total)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '全概率',
    steps,
    resultText: `P(A) = ${fmt(total, 6)}`,
    resultLatex: `P(A)=${fmt(total)}`,
  };
}

function cltSteps(input: ProbInput): StatStepSequence {
  const n = input.sampleN ?? 30;
  const mu = input.popMean ?? 0;
  const sigma = input.popStd ?? 1;
  const se = sigma / Math.sqrt(n);

  const steps: StatVizStep[] = [
    step({
      title: '中心极限定理',
      explanation: '独立同分布样本均值近似正态，与总体形状无关（n 足够大）。',
      latex: '\\bar{X}\\approx N\\!\\left(\\mu,\\frac{\\sigma^2}{n}\\right)',
      phase: 'intro',
    }),
    step({
      title: '样本量 n',
      explanation: `当前 n=${n}，标准误 SE = σ/√n`,
      latex: `SE=\\frac{\\sigma}{\\sqrt{n}}=${fmt(se)}`,
      phase: 'compute',
    }),
    step({
      title: '近似分布',
      explanation: `x̄ 的近似：N(${mu}, ${fmt(se)}²)`,
      latex: `\\bar{X}\\sim N(${mu},${fmt(se)}^2)`,
      phase: 'result',
      viz: { sampleN: n },
    }),
  ];

  return {
    mode: 'CLT',
    steps,
    resultText: `x̄ ≈ N(${mu}, ${fmt(se ** 2, 6)})`,
    resultLatex: `\\bar{X}\\sim N(${mu},${fmt(se)}^2)`,
  };
}

function independenceSteps(input: ProbInput): StatStepSequence {
  const pA = input.pA ?? 0.4;
  const pB = input.pB ?? 0.5;
  const pAB = input.pAB ?? 0.2;
  const indep = Math.abs(pAB - pA * pB) < 0.001;
  const mutuallyExclusive = pAB === 0;

  const steps: StatVizStep[] = [
    step({
      title: '独立 vs 互斥',
      explanation: '独立: P(A∩B)=P(A)P(B)；互斥: P(A∩B)=0。',
      latex: 'P(A\\cap B)\\stackrel{?}{=}P(A)P(B)',
      phase: 'intro',
    }),
    step({
      title: '计算 P(A)P(B)',
      explanation: '若相等则独立。',
      latex: `P(A)P(B)=${fmt(pA * pB)},\\ P(A\\cap B)=${pAB}`,
      phase: 'compute',
    }),
    step({
      title: '判断',
      explanation: indep ? 'A 与 B 独立' : mutuallyExclusive ? 'A 与 B 互斥' : '既不独立也不互斥',
      latex: indep ? 'A\\perp B' : mutuallyExclusive ? 'A\\cap B=\\emptyset' : 'A,B\\ \\text{相关}',
      phase: 'result',
    }),
  ];

  return {
    mode: '独立/互斥',
    steps,
    resultText: indep ? '独立' : mutuallyExclusive ? '互斥' : '相关',
    resultLatex: indep ? 'A\\perp B' : 'A,B\\ \\text{相关}',
  };
}

export function simulateClt(n: number, trials: number, popMean = 0, popStd = 1): number[] {
  const means: number[] = [];
  for (let t = 0; t < trials; t++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += popMean + popStd * randn();
    means.push(s / n);
  }
  return means;
}

function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function histogram(values: number[], bins = 20): { x: number[]; y: number[] } {
  if (values.length === 0) return { x: [], y: [] };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const w = (hi - lo || 1) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const i = Math.min(bins - 1, Math.floor((v - lo) / w));
    counts[i]++;
  }
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < bins; i++) {
    x.push(lo + (i + 0.5) * w);
    y.push(counts[i] / values.length / w);
  }
  return { x, y };
}
