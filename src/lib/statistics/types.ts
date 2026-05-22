// 统计可视化步骤，跟 CalcStepPlayer 兼容
export type StatVizStep = {
  id: string;
  title: string;
  explanation: string;
  latex: string;
  phase?: string;
  viz?: Record<string, number | string | boolean | undefined>;
};

export type StatStepSequence = {
  mode: string;
  steps: StatVizStep[];
  resultText: string;
  resultLatex: string;
};

export type DistKind = 'discrete' | 'continuous';

export type DistParam = {
  id: string;
  label: string;
  default: number;
  min: number;
  max: number;
  step: number;
};

export type DistId =
  | 'bernoulli'
  | 'binomial'
  | 'poisson'
  | 'geometric'
  | 'negbin'
  | 'hypergeo'
  | 'discreteUniform'
  | 'normal'
  | 'lognormal'
  | 't'
  | 'chi2'
  | 'f'
  | 'exponential'
  | 'gamma'
  | 'beta'
  | 'uniform'
  | 'weibull';

export type HypothesisTestId =
  | 'z-mean'
  | 't-one'
  | 't-two'
  | 'z-prop'
  | 'chi2-gof'
  | 'chi2-indep'
  | 'anova';

export type ProbTopicId = 'conditional' | 'bayes' | 'total' | 'clt' | 'independence';

export type DistributionDef = {
  id: DistId;
  name: string;
  nameZh: string;
  kind: DistKind;
  params: DistParam[];
  latex: string;
  mean: (p: Record<string, number>) => number;
  variance: (p: Record<string, number>) => number;
  pmf?: (x: number, p: Record<string, number>) => number;
  pdf?: (x: number, p: Record<string, number>) => number;
  cdf: (x: number, p: Record<string, number>) => number;
  support: (p: Record<string, number>) => { min: number; max: number };
};
