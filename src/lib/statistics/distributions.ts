import {
  chi2Cdf,
  comb,
  fCdf,
  gamma,
  logGamma,
  normalCdf,
  normalPdf,
  regBeta,
  regLowerGamma,
  tCdf,
} from './math-utils';
import type { DistId, DistributionDef } from './types';

function p(params: Record<string, number>, id: string, fallback: number): number {
  return params[id] ?? fallback;
}

function betaFn(a: number, b: number): number {
  return Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b));
}

export const DISTRIBUTIONS: DistributionDef[] = [
  {
    id: 'bernoulli',
    name: 'Bernoulli',
    nameZh: '伯努利',
    kind: 'discrete',
    params: [{ id: 'p', label: '成功概率 p', default: 0.4, min: 0.01, max: 0.99, step: 0.05 }],
    latex: 'P(X=k)=p^k(1-p)^{1-k},\\ k\\in\\{0,1\\}',
    mean: (par) => p(par, 'p', 0.5),
    variance: (par) => {
      const pv = p(par, 'p', 0.5);
      return pv * (1 - pv);
    },
    pmf: (k, par) => {
      const pv = p(par, 'p', 0.5);
      if (k === 0) return 1 - pv;
      if (k === 1) return pv;
      return 0;
    },
    cdf: (x, par) => {
      const pv = p(par, 'p', 0.5);
      if (x < 0) return 0;
      if (x < 1) return 1 - pv;
      return 1;
    },
    support: () => ({ min: -0.5, max: 1.5 }),
  },
  {
    id: 'binomial',
    name: 'Binomial',
    nameZh: '二项',
    kind: 'discrete',
    params: [
      { id: 'n', label: '试验次数 n', default: 10, min: 1, max: 50, step: 1 },
      { id: 'p', label: '成功概率 p', default: 0.4, min: 0.01, max: 0.99, step: 0.05 },
    ],
    latex: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}',
    mean: (par) => p(par, 'n', 10) * p(par, 'p', 0.5),
    variance: (par) => {
      const n = p(par, 'n', 10);
      const pv = p(par, 'p', 0.5);
      return n * pv * (1 - pv);
    },
    pmf: (k, par) => {
      const n = Math.round(p(par, 'n', 10));
      const pv = p(par, 'p', 0.5);
      if (k < 0 || k > n || k % 1 !== 0) return 0;
      return comb(n, k) * pv ** k * (1 - pv) ** (n - k);
    },
    cdf: (x, par) => {
      const n = Math.round(p(par, 'n', 10));
      let s = 0;
      for (let k = 0; k <= Math.min(n, Math.floor(x)); k++) s += binomialPmf(k, par);
      return s;
    },
    support: (par) => ({ min: -0.5, max: p(par, 'n', 10) + 0.5 }),
  },
  {
    id: 'poisson',
    name: 'Poisson',
    nameZh: '泊松',
    kind: 'discrete',
    params: [{ id: 'lambda', label: '率 λ', default: 3, min: 0.1, max: 20, step: 0.5 }],
    latex: 'P(X=k)=\\frac{\\lambda^k e^{-\\lambda}}{k!}',
    mean: (par) => p(par, 'lambda', 3),
    variance: (par) => p(par, 'lambda', 3),
    pmf: (k, par) => {
      const lam = p(par, 'lambda', 3);
      if (k < 0 || k % 1 !== 0) return 0;
      return (lam ** k * Math.exp(-lam)) / gamma(k + 1);
    },
    cdf: (x, par) => {
      let s = 0;
      for (let k = 0; k <= Math.floor(x); k++) s += poissonPmf(k, par);
      return s;
    },
    support: (par) => ({ min: -0.5, max: Math.max(10, p(par, 'lambda', 3) + 4 * Math.sqrt(p(par, 'lambda', 3))) }),
  },
  {
    id: 'geometric',
    name: 'Geometric',
    nameZh: '几何',
    kind: 'discrete',
    params: [{ id: 'p', label: '成功概率 p', default: 0.3, min: 0.01, max: 0.99, step: 0.05 }],
    latex: 'P(X=k)=(1-p)^{k-1}p,\\ k=1,2,\\ldots',
    mean: (par) => 1 / p(par, 'p', 0.3),
    variance: (par) => {
      const pv = p(par, 'p', 0.3);
      return (1 - pv) / (pv * pv);
    },
    pmf: (k, par) => {
      const pv = p(par, 'p', 0.3);
      if (k < 1 || k % 1 !== 0) return 0;
      return (1 - pv) ** (k - 1) * pv;
    },
    cdf: (x, par) => {
      const pv = p(par, 'p', 0.3);
      if (x < 1) return 0;
      return 1 - (1 - pv) ** Math.floor(x);
    },
    support: (par) => ({ min: 0.5, max: Math.min(30, 3 / p(par, 'p', 0.3)) }),
  },
  {
    id: 'negbin',
    name: 'Negative Binomial',
    nameZh: '负二项',
    kind: 'discrete',
    params: [
      { id: 'r', label: '成功次数 r', default: 3, min: 1, max: 20, step: 1 },
      { id: 'p', label: '成功概率 p', default: 0.4, min: 0.01, max: 0.99, step: 0.05 },
    ],
    latex: 'P(X=k)=\\binom{k+r-1}{r-1}p^r(1-p)^k',
    mean: (par) => (p(par, 'r', 3) * (1 - p(par, 'p', 0.4))) / p(par, 'p', 0.4),
    variance: (par) => {
      const rv = p(par, 'r', 3);
      const pv = p(par, 'p', 0.4);
      return (rv * (1 - pv)) / (pv * pv);
    },
    pmf: (k, par) => {
      const rv = Math.round(p(par, 'r', 3));
      const pv = p(par, 'p', 0.4);
      if (k < 0 || k % 1 !== 0) return 0;
      return comb(k + rv - 1, rv - 1) * pv ** rv * (1 - pv) ** k;
    },
    cdf: (x, par) => {
      let s = 0;
      for (let k = 0; k <= Math.floor(x); k++) s += negbinPmf(k, par);
      return s;
    },
    support: (par) => ({ min: -0.5, max: Math.min(40, 5 * p(par, 'r', 3) / p(par, 'p', 0.4)) }),
  },
  {
    id: 'hypergeo',
    name: 'Hypergeometric',
    nameZh: '超几何',
    kind: 'discrete',
    params: [
      { id: 'N', label: '总体 N', default: 20, min: 2, max: 100, step: 1 },
      { id: 'K', label: '成功状态 K', default: 8, min: 0, max: 100, step: 1 },
      { id: 'n', label: '抽取 n', default: 5, min: 1, max: 50, step: 1 },
    ],
    latex: 'P(X=k)=\\frac{\\binom{K}{k}\\binom{N-K}{n-k}}{\\binom{N}{n}}',
    mean: (par) => (p(par, 'n', 5) * p(par, 'K', 8)) / p(par, 'N', 20),
    variance: (par) => {
      const N = p(par, 'N', 20);
      const K = p(par, 'K', 8);
      const n = p(par, 'n', 5);
      return (n * K * (N - K) * (N - n)) / (N * N * (N - 1));
    },
    pmf: (k, par) => {
      const N = Math.round(p(par, 'N', 20));
      const K = Math.round(p(par, 'K', 8));
      const n = Math.round(p(par, 'n', 5));
      if (k < 0 || k % 1 !== 0 || k > n || k > K || n - k > N - K) return 0;
      return (comb(K, k) * comb(N - K, n - k)) / comb(N, n);
    },
    cdf: (x, par) => {
      const n = Math.round(p(par, 'n', 5));
      let s = 0;
      for (let k = 0; k <= Math.min(n, Math.floor(x)); k++) s += hypergeoPmf(k, par);
      return s;
    },
    support: (par) => ({ min: -0.5, max: p(par, 'n', 5) + 0.5 }),
  },
  {
    id: 'discreteUniform',
    name: 'Discrete Uniform',
    nameZh: '离散均匀',
    kind: 'discrete',
    params: [
      { id: 'a', label: '最小值 a', default: 1, min: 0, max: 20, step: 1 },
      { id: 'b', label: '最大值 b', default: 6, min: 1, max: 30, step: 1 },
    ],
    latex: 'P(X=k)=\\frac{1}{b-a+1}',
    mean: (par) => (p(par, 'a', 1) + p(par, 'b', 6)) / 2,
    variance: (par) => {
      const a = p(par, 'a', 1);
      const b = p(par, 'b', 6);
      return ((b - a + 1) ** 2 - 1) / 12;
    },
    pmf: (k, par) => {
      const a = Math.round(p(par, 'a', 1));
      const b = Math.round(p(par, 'b', 6));
      if (k < a || k > b || k % 1 !== 0) return 0;
      return 1 / (b - a + 1);
    },
    cdf: (x, par) => {
      const a = Math.round(p(par, 'a', 1));
      const b = Math.round(p(par, 'b', 6));
      if (x < a) return 0;
      return Math.min(1, (Math.floor(x) - a + 1) / (b - a + 1));
    },
    support: (par) => ({ min: p(par, 'a', 1) - 0.5, max: p(par, 'b', 6) + 0.5 }),
  },
  {
    id: 'normal',
    name: 'Normal',
    nameZh: '正态',
    kind: 'continuous',
    params: [
      { id: 'mu', label: '均值 μ', default: 0, min: -10, max: 10, step: 0.5 },
      { id: 'sigma', label: '标准差 σ', default: 1, min: 0.1, max: 5, step: 0.1 },
    ],
    latex: 'f(x)=\\frac{1}{\\sqrt{2\\pi\\sigma^2}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
    mean: (par) => p(par, 'mu', 0),
    variance: (par) => p(par, 'sigma', 1) ** 2,
    pdf: (x, par) => normalPdf(x, p(par, 'mu', 0), p(par, 'sigma', 1)),
    cdf: (x, par) => normalCdf(x, p(par, 'mu', 0), p(par, 'sigma', 1)),
    support: (par) => ({ min: p(par, 'mu', 0) - 4 * p(par, 'sigma', 1), max: p(par, 'mu', 0) + 4 * p(par, 'sigma', 1) }),
  },
  {
    id: 'lognormal',
    name: 'Log-normal',
    nameZh: '对数正态',
    kind: 'continuous',
    params: [
      { id: 'mu', label: 'ln X 均值 μ', default: 0, min: -3, max: 3, step: 0.2 },
      { id: 'sigma', label: 'ln X 标准差 σ', default: 1, min: 0.1, max: 3, step: 0.1 },
    ],
    latex: 'f(x)=\\frac{1}{x\\sigma\\sqrt{2\\pi}}e^{-\\frac{(\\ln x-\\mu)^2}{2\\sigma^2}}',
    mean: (par) => Math.exp(p(par, 'mu', 0) + p(par, 'sigma', 1) ** 2 / 2),
    variance: (par) => {
      const mu = p(par, 'mu', 0);
      const sig = p(par, 'sigma', 1);
      return (Math.exp(sig ** 2) - 1) * Math.exp(2 * mu + sig ** 2);
    },
    pdf: (x, par) => {
      if (x <= 0) return 0;
      const mu = p(par, 'mu', 0);
      const sig = p(par, 'sigma', 1);
      const z = (Math.log(x) - mu) / sig;
      return Math.exp(-0.5 * z * z) / (x * sig * Math.sqrt(2 * Math.PI));
    },
    cdf: (x, par) => {
      if (x <= 0) return 0;
      return normalCdf(Math.log(x), p(par, 'mu', 0), p(par, 'sigma', 1));
    },
    support: (par) => ({ min: 0.01, max: Math.exp(p(par, 'mu', 0) + 4 * p(par, 'sigma', 1)) }),
  },
  {
    id: 't',
    name: 'Student t',
    nameZh: 't 分布',
    kind: 'continuous',
    params: [{ id: 'df', label: '自由度 df', default: 5, min: 1, max: 30, step: 1 }],
    latex: 'f(x)=\\frac{\\Gamma((\\nu+1)/2)}{\\sqrt{\\nu\\pi}\\,\\Gamma(\\nu/2)}\\left(1+\\frac{x^2}{\\nu}\\right)^{-(\\nu+1)/2}',
    mean: (par) => (p(par, 'df', 5) > 1 ? 0 : NaN),
    variance: (par) => {
      const df = p(par, 'df', 5);
      return df > 2 ? df / (df - 2) : NaN;
    },
    pdf: (x, par) => {
      const df = p(par, 'df', 5);
      const c = gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * gamma(df / 2));
      return c * (1 + (x * x) / df) ** (-(df + 1) / 2);
    },
    cdf: (x, par) => tCdf(x, p(par, 'df', 5)),
    support: () => ({ min: -6, max: 6 }),
  },
  {
    id: 'chi2',
    name: 'Chi-square',
    nameZh: '卡方',
    kind: 'continuous',
    params: [{ id: 'df', label: '自由度 df', default: 4, min: 1, max: 30, step: 1 }],
    latex: 'f(x)=\\frac{x^{k/2-1}e^{-x/2}}{2^{k/2}\\Gamma(k/2)}',
    mean: (par) => p(par, 'df', 4),
    variance: (par) => 2 * p(par, 'df', 4),
    pdf: (x, par) => {
      const df = p(par, 'df', 4);
      if (x <= 0) return 0;
      return (x ** (df / 2 - 1) * Math.exp(-x / 2)) / (2 ** (df / 2) * gamma(df / 2));
    },
    cdf: (x, par) => chi2Cdf(x, p(par, 'df', 4)),
    support: (par) => ({ min: 0, max: Math.max(15, p(par, 'df', 4) + 4 * Math.sqrt(2 * p(par, 'df', 4))) }),
  },
  {
    id: 'f',
    name: 'F',
    nameZh: 'F 分布',
    kind: 'continuous',
    params: [
      { id: 'd1', label: '分子 df₁', default: 5, min: 1, max: 30, step: 1 },
      { id: 'd2', label: '分母 df₂', default: 10, min: 1, max: 30, step: 1 },
    ],
    latex: 'F_{d_1,d_2}(x)',
    mean: (par) => {
      const d2 = p(par, 'd2', 10);
      return d2 > 2 ? d2 / (d2 - 2) : NaN;
    },
    variance: (par) => {
      const d1 = p(par, 'd1', 5);
      const d2 = p(par, 'd2', 10);
      if (d2 <= 4) return NaN;
      return (2 * d2 ** 2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4));
    },
    pdf: (x, par) => {
      const d1 = p(par, 'd1', 5);
      const d2 = p(par, 'd2', 10);
      if (x <= 0) return 0;
      const num = Math.sqrt(
        (Math.pow((d1 * x) / d2, d1) * Math.pow(d2, d2)) / Math.pow(d1 * x + d2, d1 + d2)
      );
      return num / (x * betaFn(d1 / 2, d2 / 2));
    },
    cdf: (x, par) => fCdf(x, p(par, 'd1', 5), p(par, 'd2', 10)),
    support: (par) => ({ min: 0, max: Math.max(5, 3 * p(par, 'd2', 10) / p(par, 'd1', 5)) }),
  },
  {
    id: 'exponential',
    name: 'Exponential',
    nameZh: '指数',
    kind: 'continuous',
    params: [{ id: 'lambda', label: '率 λ', default: 1, min: 0.1, max: 5, step: 0.1 }],
    latex: 'f(x)=\\lambda e^{-\\lambda x},\\ x\\ge0',
    mean: (par) => 1 / p(par, 'lambda', 1),
    variance: (par) => 1 / p(par, 'lambda', 1) ** 2,
    pdf: (x, par) => {
      const lam = p(par, 'lambda', 1);
      return x < 0 ? 0 : lam * Math.exp(-lam * x);
    },
    cdf: (x, par) => {
      const lam = p(par, 'lambda', 1);
      return x < 0 ? 0 : 1 - Math.exp(-lam * x);
    },
    support: (par) => ({ min: 0, max: 5 / p(par, 'lambda', 1) }),
  },
  {
    id: 'gamma',
    name: 'Gamma',
    nameZh: 'Gamma',
    kind: 'continuous',
    params: [
      { id: 'shape', label: '形状 k', default: 2, min: 0.5, max: 10, step: 0.5 },
      { id: 'rate', label: '率 θ', default: 1, min: 0.1, max: 5, step: 0.1 },
    ],
    latex: 'f(x)=\\frac{\\theta^k x^{k-1}e^{-\\theta x}}{\\Gamma(k)}',
    mean: (par) => p(par, 'shape', 2) / p(par, 'rate', 1),
    variance: (par) => p(par, 'shape', 2) / p(par, 'rate', 1) ** 2,
    pdf: (x, par) => {
      const k = p(par, 'shape', 2);
      const rate = p(par, 'rate', 1);
      if (x <= 0) return 0;
      return (rate ** k * x ** (k - 1) * Math.exp(-rate * x)) / gamma(k);
    },
    cdf: (x, par) => {
      const k = p(par, 'shape', 2);
      const rate = p(par, 'rate', 1);
      if (x <= 0) return 0;
      return regLowerGamma(k, rate * x);
    },
    support: (par) => ({ min: 0, max: (p(par, 'shape', 2) + 4 * Math.sqrt(p(par, 'shape', 2))) / p(par, 'rate', 1) }),
  },
  {
    id: 'beta',
    name: 'Beta',
    nameZh: 'Beta',
    kind: 'continuous',
    params: [
      { id: 'alpha', label: 'α', default: 2, min: 0.5, max: 10, step: 0.5 },
      { id: 'beta', label: 'β', default: 5, min: 0.5, max: 10, step: 0.5 },
    ],
    latex: 'f(x)=\\frac{x^{\\alpha-1}(1-x)^{\\beta-1}}{B(\\alpha,\\beta)}',
    mean: (par) => p(par, 'alpha', 2) / (p(par, 'alpha', 2) + p(par, 'beta', 5)),
    variance: (par) => {
      const a = p(par, 'alpha', 2);
      const b = p(par, 'beta', 5);
      return (a * b) / ((a + b) ** 2 * (a + b + 1));
    },
    pdf: (x, par) => {
      const a = p(par, 'alpha', 2);
      const b = p(par, 'beta', 5);
      if (x <= 0 || x >= 1) return 0;
      return (x ** (a - 1) * (1 - x) ** (b - 1)) / betaFn(a, b);
    },
    cdf: (x, par) => {
      const a = p(par, 'alpha', 2);
      const b = p(par, 'beta', 5);
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return regBeta(a, b, x);
    },
    support: () => ({ min: 0, max: 1 }),
  },
  {
    id: 'uniform',
    name: 'Uniform',
    nameZh: '连续均匀',
    kind: 'continuous',
    params: [
      { id: 'a', label: '下限 a', default: 0, min: -10, max: 10, step: 0.5 },
      { id: 'b', label: '上限 b', default: 1, min: -9, max: 20, step: 0.5 },
    ],
    latex: 'f(x)=\\frac{1}{b-a},\\ a\\le x\\le b',
    mean: (par) => (p(par, 'a', 0) + p(par, 'b', 1)) / 2,
    variance: (par) => {
      const a = p(par, 'a', 0);
      const b = p(par, 'b', 1);
      return ((b - a) ** 2) / 12;
    },
    pdf: (x, par) => {
      const a = p(par, 'a', 0);
      const b = p(par, 'b', 1);
      if (x < a || x > b) return 0;
      return 1 / (b - a);
    },
    cdf: (x, par) => {
      const a = p(par, 'a', 0);
      const b = p(par, 'b', 1);
      if (x <= a) return 0;
      if (x >= b) return 1;
      return (x - a) / (b - a);
    },
    support: (par) => ({ min: p(par, 'a', 0), max: p(par, 'b', 1) }),
  },
  {
    id: 'weibull',
    name: 'Weibull',
    nameZh: '威布尔',
    kind: 'continuous',
    params: [
      { id: 'k', label: '形状 k', default: 1.5, min: 0.5, max: 5, step: 0.1 },
      { id: 'lambda', label: '尺度 λ', default: 2, min: 0.5, max: 10, step: 0.5 },
    ],
    latex: 'f(x)=\\frac{k}{\\lambda}\\left(\\frac{x}{\\lambda}\\right)^{k-1}e^{-(x/\\lambda)^k}',
    mean: (par) => {
      const k = p(par, 'k', 1.5);
      const lam = p(par, 'lambda', 2);
      return lam * gamma(1 + 1 / k);
    },
    variance: (par) => {
      const k = p(par, 'k', 1.5);
      const lam = p(par, 'lambda', 2);
      return lam * lam * (gamma(1 + 2 / k) - Math.pow(gamma(1 + 1 / k), 2));
    },
    pdf: (x, par) => {
      const k = p(par, 'k', 1.5);
      const lam = p(par, 'lambda', 2);
      if (x <= 0) return 0;
      const base = x / lam;
      return (k / lam) * Math.pow(base, k - 1) * Math.exp(-Math.pow(base, k));
    },
    cdf: (x, par) => {
      const k = p(par, 'k', 1.5);
      const lam = p(par, 'lambda', 2);
      if (x <= 0) return 0;
      return 1 - Math.exp(-Math.pow(x / lam, k));
    },
    support: (par) => ({ min: 0, max: p(par, 'lambda', 2) * 3 }),
  },
];

function binomialPmf(k: number, par: Record<string, number>): number {
  const n = Math.round(p(par, 'n', 10));
  const pv = p(par, 'p', 0.5);
  if (k < 0 || k > n || k % 1 !== 0) return 0;
  return comb(n, k) * pv ** k * (1 - pv) ** (n - k);
}

function poissonPmf(k: number, par: Record<string, number>): number {
  const lam = p(par, 'lambda', 3);
  if (k < 0 || k % 1 !== 0) return 0;
  return (lam ** k * Math.exp(-lam)) / gamma(k + 1);
}

function negbinPmf(k: number, par: Record<string, number>): number {
  const rv = Math.round(p(par, 'r', 3));
  const pv = p(par, 'p', 0.4);
  if (k < 0 || k % 1 !== 0) return 0;
  return comb(k + rv - 1, rv - 1) * pv ** rv * (1 - pv) ** k;
}

function hypergeoPmf(k: number, par: Record<string, number>): number {
  const N = Math.round(p(par, 'N', 20));
  const K = Math.round(p(par, 'K', 8));
  const n = Math.round(p(par, 'n', 5));
  if (k < 0 || k % 1 !== 0 || k > n || k > K || n - k > N - K) return 0;
  return (comb(K, k) * comb(N - K, n - k)) / comb(N, n);
}

export function getDistribution(id: DistId): DistributionDef {
  return DISTRIBUTIONS.find((d) => d.id === id)!;
}

export function defaultParams(def: DistributionDef): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pr of def.params) out[pr.id] = pr.default;
  return out;
}

export function sampleDistribution(
  def: DistributionDef,
  params: Record<string, number>,
  xMin: number,
  xMax: number,
  n = 300,
  plotCdf = false
): { x: number[]; y: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  if (def.kind === 'discrete') {
    const a = Math.ceil(xMin);
    const b = Math.floor(xMax);
    for (let k = a; k <= b; k++) {
      xs.push(k);
      ys.push(plotCdf ? def.cdf(k, params) : def.pmf!(k, params));
    }
    return { x: xs, y: ys };
  }
  const step = (xMax - xMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = xMin + i * step;
    xs.push(x);
    ys.push(plotCdf ? def.cdf(x, params) : def.pdf!(x, params));
  }
  return { x: xs, y: ys };
}

export function probInInterval(
  def: DistributionDef,
  params: Record<string, number>,
  a: number,
  b: number
): number {
  if (def.kind === 'discrete') {
    let s = 0;
    for (let k = Math.ceil(a); k <= Math.floor(b); k++) s += def.pmf!(k, params);
    return s;
  }
  return def.cdf(b, params) - def.cdf(a, params);
}

export function criticalNormal(alpha: number, twoTailed = true): number {
  const target = twoTailed ? 1 - alpha / 2 : 1 - alpha;
  let lo = 0;
  let hi = 4;
  while (hi - lo > 1e-6) {
    const mid = (lo + hi) / 2;
    if (normalCdf(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
