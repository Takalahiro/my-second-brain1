import {
  chi2Cdf,
  fmt,
  fmtP,
  fCdf,
  mean,
  normalCdf,
  parseDataInput,
  parseMatrixInput,
  std,
  tCdf,
  variance,
} from './math-utils';
import { criticalNormal } from './distributions';
import type { HypothesisTestId, StatStepSequence, StatVizStep } from './types';

let stepId = 0;
function step(partial: Omit<StatVizStep, 'id'>): StatVizStep {
  stepId += 1;
  return { id: `h${stepId}`, ...partial };
}

export const HYPOTHESIS_TESTS: Array<{ id: HypothesisTestId; label: string; desc: string }> = [
  { id: 'z-mean', label: 'Z 检验（均值）', desc: '总体方差已知' },
  { id: 't-one', label: '单样本 t 检验', desc: '检验样本均值' },
  { id: 't-two', label: '双样本 t 检验', desc: '两独立样本均值' },
  { id: 'z-prop', label: '比例 Z 检验', desc: '二项比例' },
  { id: 'chi2-gof', label: '卡方拟合优度', desc: '观测 vs 期望频数' },
  { id: 'chi2-indep', label: '卡方独立性', desc: '列联表' },
  { id: 'anova', label: '单因素 ANOVA', desc: '多组均值比较' },
];

export type HypothesisInput = {
  testId: HypothesisTestId;
  alpha: number;
  data1: string;
  data2?: string;
  mu0?: number;
  sigma?: number;
  p0?: number;
  expected?: string;
  matrix?: string;
  tail?: 'two' | 'left' | 'right';
};

export function buildHypothesisSteps(input: HypothesisInput): StatStepSequence {
  stepId = 0;
  switch (input.testId) {
    case 'z-mean':
      return zMeanTest(input);
    case 't-one':
      return tOneSampleTest(input);
    case 't-two':
      return tTwoSampleTest(input);
    case 'z-prop':
      return zPropTest(input);
    case 'chi2-gof':
      return chi2GofTest(input);
    case 'chi2-indep':
      return chi2IndepTest(input);
    case 'anova':
      return anovaTest(input);
    default:
      return emptySeq('未知检验');
  }
}

function emptySeq(msg: string): StatStepSequence {
  return { mode: '假设检验', steps: [], resultText: msg, resultLatex: '' };
}

function decision(p: number, alpha: number, tail: 'two' | 'left' | 'right'): string {
  const reject = tail === 'two' ? p < alpha : p < alpha;
  return reject ? '拒绝 H₀' : '不拒绝 H₀';
}

function zMeanTest(input: HypothesisInput): StatStepSequence {
  const data = parseDataInput(input.data1);
  const mu0 = input.mu0 ?? 0;
  const sigma = input.sigma ?? 1;
  const alpha = input.alpha;
  const tail = input.tail ?? 'two';
  const xbar = mean(data);
  const n = data.length;
  const se = sigma / Math.sqrt(n);
  const z = (xbar - mu0) / se;
  const p =
    tail === 'two'
      ? 2 * (1 - normalCdf(Math.abs(z)))
      : tail === 'right'
        ? 1 - normalCdf(z)
        : normalCdf(z);
  const zCrit = criticalNormal(alpha, tail === 'two');

  const steps: StatVizStep[] = [
    step({
      title: '建立假设',
      explanation: 'H₀: μ = μ₀；H₁ 根据单双侧设定。',
      latex: `H_0:\\mu=${mu0},\\quad H_1:\\mu${tail === 'two' ? '\\ne' : tail === 'right' ? '>' : '<'}${mu0}`,
      phase: 'intro',
    }),
    step({
      title: '样本统计量',
      explanation: `n=${n}，样本均值 x̄=${fmt(xbar)}，已知 σ=${sigma}。`,
      latex: `\\bar{x}=${fmt(xbar)},\\ n=${n}`,
      phase: 'compute',
    }),
    step({
      title: '检验统计量 Z',
      explanation: 'Z = (x̄ − μ₀) / (σ/√n)。',
      latex: `Z=\\frac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}=${fmt(z)}`,
      phase: 'compute',
    }),
    step({
      title: 'p 值与临界值',
      explanation: `α=${alpha}，${tail === 'two' ? '双侧' : tail === 'right' ? '右尾' : '左尾'}检验。`,
      latex: `p=${fmtP(p)},\\quad z_{crit}\\approx\\pm${fmt(zCrit)}`,
      phase: 'result',
    }),
    step({
      title: '结论',
      explanation: decision(p, alpha, tail),
      latex: `p${p < alpha ? '<' : '\\ge'}\\alpha \\Rightarrow ${decision(p, alpha, tail)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: 'Z 检验',
    steps,
    resultText: `Z = ${fmt(z, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, tail)}`,
    resultLatex: `Z=${fmt(z)},\\ p=${fmtP(p)}`,
  };
}

function tOneSampleTest(input: HypothesisInput): StatStepSequence {
  const data = parseDataInput(input.data1);
  const mu0 = input.mu0 ?? 0;
  const alpha = input.alpha;
  const tail = input.tail ?? 'two';
  const xbar = mean(data);
  const n = data.length;
  const s = std(data);
  const df = n - 1;
  const t = (xbar - mu0) / (s / Math.sqrt(n));
  const p =
    tail === 'two'
      ? 2 * (1 - tCdf(Math.abs(t), df))
      : tail === 'right'
        ? 1 - tCdf(t, df)
        : tCdf(t, df);

  const steps: StatVizStep[] = [
    step({
      title: '单样本 t 检验',
      explanation: '总体方差未知，用样本标准差 s 代替 σ。',
      latex: `H_0:\\mu=${mu0}`,
      phase: 'intro',
    }),
    step({
      title: '样本描述',
      explanation: `x̄=${fmt(xbar)}, s=${fmt(s)}, n=${n}, df=${df}`,
      latex: `\\bar{x}=${fmt(xbar)},\\ s=${fmt(s)},\\ n=${n}`,
      phase: 'compute',
    }),
    step({
      title: 't 统计量',
      explanation: 't = (x̄ − μ₀) / (s/√n)。',
      latex: `t=\\frac{\\bar{x}-\\mu_0}{s/\\sqrt{n}}=${fmt(t)}`,
      phase: 'compute',
    }),
    step({
      title: 'p 值',
      explanation: `在 t(${df}) 分布下求 p 值。`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
    step({
      title: '结论',
      explanation: decision(p, alpha, tail),
      latex: decision(p, alpha, tail),
      phase: 'result',
    }),
  ];

  return {
    mode: 't 检验',
    steps,
    resultText: `t = ${fmt(t, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, tail)}`,
    resultLatex: `t=${fmt(t)},\\ p=${fmtP(p)}`,
  };
}

function tTwoSampleTest(input: HypothesisInput): StatStepSequence {
  const a = parseDataInput(input.data1);
  const b = parseDataInput(input.data2 ?? '');
  const alpha = input.alpha;
  const tail = input.tail ?? 'two';
  const m1 = mean(a);
  const m2 = mean(b);
  const v1 = variance(a);
  const v2 = variance(b);
  const n1 = a.length;
  const n2 = b.length;
  const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  const t = (m1 - m2) / se;
  const df = n1 + n2 - 2;
  const p = tail === 'two' ? 2 * (1 - tCdf(Math.abs(t), df)) : 1 - tCdf(t, df);

  const steps: StatVizStep[] = [
    step({
      title: '双样本 t 检验',
      explanation: '假设两总体方差相等（合并方差）。',
      latex: 'H_0:\\mu_1=\\mu_2',
      phase: 'intro',
    }),
    step({
      title: '两组样本',
      explanation: `组1: x̄₁=${fmt(m1)}, n₁=${n1}；组2: x̄₂=${fmt(m2)}, n₂=${n2}`,
      latex: `\\bar{x}_1=${fmt(m1)},\\ \\bar{x}_2=${fmt(m2)}`,
      phase: 'compute',
    }),
    step({
      title: '合并方差',
      explanation: 's_p² 为 pooled variance。',
      latex: `s_p^2=${fmt(sp2)}`,
      phase: 'compute',
    }),
    step({
      title: 't 统计量',
      explanation: `df = ${df}`,
      latex: `t=${fmt(t)},\\ df=${df}`,
      phase: 'compute',
    }),
    step({
      title: '结论',
      explanation: `p = ${fmtP(p)}，${decision(p, alpha, tail)}`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '双样本 t',
    steps,
    resultText: `t = ${fmt(t, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, tail)}`,
    resultLatex: `t=${fmt(t)},\\ p=${fmtP(p)}`,
  };
}

function zPropTest(input: HypothesisInput): StatStepSequence {
  const data = parseDataInput(input.data1);
  const n = data.length;
  const successes = data.filter((x) => x === 1 || x > 0).length;
  const phat = successes / n;
  const p0 = input.p0 ?? 0.5;
  const alpha = input.alpha;
  const tail = input.tail ?? 'two';
  const se = Math.sqrt((p0 * (1 - p0)) / n);
  const z = (phat - p0) / se;
  const p = tail === 'two' ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z);

  const steps: StatVizStep[] = [
    step({
      title: '比例 Z 检验',
      explanation: '检验总体比例是否等于 p₀（大样本近似）。',
      latex: `H_0:p=${p0}`,
      phase: 'intro',
    }),
    step({
      title: '样本比例',
      explanation: `成功 ${successes}/${n}`,
      latex: `\\hat{p}=${fmt(phat)}`,
      phase: 'compute',
    }),
    step({
      title: 'Z 统计量',
      explanation: 'Z = (p̂ − p₀) / √(p₀(1−p₀)/n)',
      latex: `Z=${fmt(z)}`,
      phase: 'compute',
    }),
    step({
      title: '结论',
      explanation: `p = ${fmtP(p)}，${decision(p, alpha, tail)}`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '比例检验',
    steps,
    resultText: `Z = ${fmt(z, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, tail)}`,
    resultLatex: `Z=${fmt(z)},\\ p=${fmtP(p)}`,
  };
}

function chi2GofTest(input: HypothesisInput): StatStepSequence {
  const obs = parseDataInput(input.data1);
  const exp = parseDataInput(input.expected ?? '');
  const k = Math.min(obs.length, exp.length);
  let chi2 = 0;
  for (let i = 0; i < k; i++) {
    if (exp[i] > 0) chi2 += (obs[i] - exp[i]) ** 2 / exp[i];
  }
  const df = k - 1;
  const p = 1 - chi2Cdf(chi2, df);
  const alpha = input.alpha;

  const steps: StatVizStep[] = [
    step({
      title: '卡方拟合优度检验',
      explanation: '比较观测频数与理论期望频数。',
      latex: '\\chi^2=\\sum\\frac{(O-E)^2}{E}',
      phase: 'intro',
    }),
    step({
      title: '计算 χ²',
      explanation: `共 ${k} 个类别，df = ${df}`,
      latex: `\\chi^2=${fmt(chi2)}`,
      phase: 'compute',
    }),
    step({
      title: 'p 值',
      explanation: `在 χ²(${df}) 下求右尾概率。`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
    step({
      title: '结论',
      explanation: decision(p, alpha, 'right'),
      latex: decision(p, alpha, 'right'),
      phase: 'result',
    }),
  ];

  return {
    mode: '卡方拟合',
    steps,
    resultText: `χ² = ${fmt(chi2, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, 'right')}`,
    resultLatex: `\\chi^2=${fmt(chi2)},\\ p=${fmtP(p)}`,
  };
}

function chi2IndepTest(input: HypothesisInput): StatStepSequence {
  const table = parseMatrixInput(input.matrix ?? '10 20\n15 25');
  const rows = table.length;
  const cols = table[0]?.length ?? 0;
  const rowSum = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colSum = Array.from({ length: cols }, (_, j) => table.reduce((a, r) => a + r[j], 0));
  const total = rowSum.reduce((a, b) => a + b, 0);
  let chi2 = 0;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const e = (rowSum[i] * colSum[j]) / total;
      if (e > 0) chi2 += (table[i][j] - e) ** 2 / e;
    }
  }
  const df = (rows - 1) * (cols - 1);
  const p = 1 - chi2Cdf(chi2, df);
  const alpha = input.alpha;

  const steps: StatVizStep[] = [
    step({
      title: '卡方独立性检验',
      explanation: '检验两个分类变量是否独立。',
      latex: '\\chi^2=\\sum\\frac{(O-E)^2}{E}',
      phase: 'intro',
    }),
    step({
      title: '列联表与期望频数',
      explanation: `${rows}×${cols} 表，总样本 ${total}`,
      latex: `E_{ij}=\\frac{(\\text{行和})(\\text{列和})}{n}`,
      phase: 'compute',
    }),
    step({
      title: 'χ² 统计量',
      explanation: `df = (${rows}-1)(${cols}-1) = ${df}`,
      latex: `\\chi^2=${fmt(chi2)},\\ df=${df}`,
      phase: 'compute',
    }),
    step({
      title: '结论',
      explanation: `p = ${fmtP(p)}，${decision(p, alpha, 'right')}`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: '卡方独立',
    steps,
    resultText: `χ² = ${fmt(chi2, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, 'right')}`,
    resultLatex: `\\chi^2=${fmt(chi2)},\\ p=${fmtP(p)}`,
  };
}

function anovaTest(input: HypothesisInput): StatStepSequence {
  const groups = (input.matrix ?? '2 3 4\n3 4 5\n5 6 7')
    .trim()
    .split(/\n+/)
    .map((r) => parseDataInput(r))
    .filter((g) => g.length > 0);
  const k = groups.length;
  const ns = groups.map((g) => g.length);
  const N = ns.reduce((a, b) => a + b, 0);
  const means = groups.map(mean);
  const grand = mean(groups.flat());
  let ssb = 0;
  for (let i = 0; i < k; i++) ssb += ns[i] * (means[i] - grand) ** 2;
  let ssw = 0;
  for (let i = 0; i < k; i++) {
    for (const v of groups[i]) ssw += (v - means[i]) ** 2;
  }
  const dfb = k - 1;
  const dfw = N - k;
  const msb = ssb / dfb;
  const msw = ssw / dfw;
  const F = msb / msw;
  const p = 1 - fCdf(F, dfb, dfw);
  const alpha = input.alpha;

  const steps: StatVizStep[] = [
    step({
      title: '单因素 ANOVA',
      explanation: 'H₀: 各组总体均值相等。',
      latex: 'H_0:\\mu_1=\\mu_2=\\cdots=\\mu_k',
      phase: 'intro',
    }),
    step({
      title: '组间/组内平方和',
      explanation: `k=${k} 组，总样本 N=${N}`,
      latex: `SS_B=${fmt(ssb)},\\ SS_W=${fmt(ssw)}`,
      phase: 'compute',
    }),
    step({
      title: '均方与 F 统计量',
      explanation: 'F = MS_B / MS_W',
      latex: `F=${fmt(F)},\\ df=(${dfb},${dfw})`,
      phase: 'compute',
    }),
    step({
      title: '结论',
      explanation: `p = ${fmtP(p)}，${decision(p, alpha, 'right')}`,
      latex: `p=${fmtP(p)}`,
      phase: 'result',
    }),
  ];

  return {
    mode: 'ANOVA',
    steps,
    resultText: `F = ${fmt(F, 6)}\np = ${fmtP(p)}\n${decision(p, alpha, 'right')}`,
    resultLatex: `F=${fmt(F)},\\ p=${fmtP(p)}`,
  };
}
