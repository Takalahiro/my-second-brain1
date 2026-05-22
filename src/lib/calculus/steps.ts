import { create, all } from 'mathjs';
import { matlabToMath } from '../calc-engine';
import type { CalcStepSequence, CalcVizStep } from './types';
import { evalFn, numericalDerivative, riemannSum, type RiemannMode } from './engine';

const math = create(all, {});

let stepId = 0;
function step(partial: Omit<CalcVizStep, 'id'>): CalcVizStep {
  stepId += 1;
  return { id: `c${stepId}`, ...partial };
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// n 阶导数在 x 处，能符号就符号，不行再数值
export function nthDerivativeAt(expr: string, x: number, n: number): number {
  if (n === 0) return evalFn(expr, x);
  try {
    let node = math.parse(matlabToMath(expr));
    for (let i = 0; i < n; i++) node = math.derivative(node, 'x');
    const v = node.compile().evaluate({ x });
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  } catch {
    // 符号求导不行就数值算
  }
  const h = 1e-4;
  if (n === 1) return numericalDerivative(expr, x, h);
  if (n === 2) {
    return (evalFn(expr, x + h) - 2 * evalFn(expr, x) + evalFn(expr, x - h)) / (h * h);
  }
  return numericalDerivative(expr, x, h);
}

export function taylorCoeffsAt(expr: string, a: number, order: number): number[] {
  const c: number[] = [];
  for (let k = 0; k <= order; k++) {
    c.push(nthDerivativeAt(expr, a, k) / factorial(k));
  }
  return c;
}

export function evalTaylorPoly(coeffs: number[], a: number, x: number): number {
  let s = 0;
  for (let k = 0; k < coeffs.length; k++) {
    s += coeffs[k] * Math.pow(x - a, k);
  }
  return s;
}

function derivSymbol(k: number): string {
  if (k === 0) return 'f';
  if (k === 1) return "f'";
  if (k === 2) return "f''";
  return `f^{(${k})}`;
}

export function buildTaylorSteps(
  expr: string,
  a: number,
  order: number,
  evalAt: number
): CalcStepSequence {
  stepId = 0;
  const steps: CalcVizStep[] = [];
  const fa = evalFn(expr, a);

  steps.push(
    step({
      title: 'Taylor 展开式',
      explanation: `在 x=a=${a} 附近，用各阶导数构造多项式逼近 f(x)。`,
      latex: `f(x)=\\sum_{k=0}^{n}\\frac{f^{(k)}(a)}{k!}(x-a)^k + R_n(x)`,
      phase: 'intro',
      viz: { taylorOrder: 0 },
    })
  );

  steps.push(
    step({
      title: `计算 f(a) = f(${a})`,
      explanation: '零阶项是常数项，即函数在展开点的值。',
      latex: `f(${a}) = ${fa.toFixed(6)}`,
      phase: 'term',
      viz: { taylorOrder: 0, highlightX: a },
    })
  );

  const coeffs = taylorCoeffsAt(expr, a, order);
  let partialLatex = `${fa.toFixed(4)}`;

  for (let k = 1; k <= order; k++) {
    const dk = nthDerivativeAt(expr, a, k);
    const ck = coeffs[k];
    const sign = ck >= 0 ? '+' : '-';
    const absCk = Math.abs(ck);
    const term =
      k === 1
        ? `${absCk.toFixed(4)}(x-${a})`
        : `${absCk.toFixed(4)}(x-${a})^{${k}}`;
    partialLatex += ` ${sign} ${term}`;

    steps.push(
      step({
        title: `第 ${k} 阶项`,
        explanation: `先求 ${derivSymbol(k)}(${a}) = ${dk.toFixed(4)}，再除以 ${k}! 得系数 ${ck.toFixed(4)}。`,
        latex: `\\frac{${derivSymbol(k)}(${a})}{${k}!}(x-${a})^{${k}} = ${ck.toFixed(4)}(x-${a})^{${k}}`,
        phase: 'term',
        viz: { taylorOrder: k },
      })
    );

    steps.push(
      step({
        title: `部分和 P_${k}(x)`,
        explanation: `累加到第 ${k} 项，得到当前近似多项式。`,
        latex: `P_${k}(x) = ${partialLatex}`,
        phase: 'sum',
        viz: { taylorOrder: k },
      })
    );
  }

  const px = evalTaylorPoly(coeffs, a, evalAt);
  const fx = evalFn(expr, evalAt);
  const err = Math.abs(fx - px);

  steps.push(
    step({
      title: '拉格朗日余项',
      explanation: `余项 R_n(x)=\\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-a)^{n+1}，ξ 在 a 与 x 之间。用于估计近似误差。`,
      latex: `R_{${order}}(x)=\\frac{f^{(${order + 1})}(\\xi)}{${order + 1}!}(x-${a})^{${order + 1}}`,
      phase: 'remainder',
      viz: { taylorOrder: order },
    })
  );

  steps.push(
    step({
      title: '皮亚诺余项（小 o 记号）',
      explanation: `当 x→a 时，余项比 (x-a)^${order + 1} 更快趋于 0，记作 o((x-a)^${order + 1})。`,
      latex: `R_{${order}}(x)=o\\big((x-${a})^{${order + 1}}\\big)`,
      phase: 'remainder',
      viz: { taylorOrder: order },
    })
  );

  steps.push(
    step({
      title: `在 x=${evalAt} 处验证`,
      explanation: `P_${order}(${evalAt})=${px.toFixed(4)}，f(${evalAt})=${fx.toFixed(4)}，|误差|≈${err.toFixed(4)}。`,
      latex: `|f(${evalAt})-P_${order}(${evalAt})| \\approx ${err.toFixed(4)}`,
      phase: 'result',
      viz: { taylorOrder: order, highlightX: evalAt },
    })
  );

  return {
    mode: 'taylor',
    steps,
    resultText: `P_${order}(${evalAt}) = ${px.toFixed(6)}\nf(${evalAt}) = ${fx.toFixed(6)}\n误差 ≈ ${err.toFixed(6)}`,
    resultLatex: `P_{${order}}(${evalAt})=${px.toFixed(4)},\\quad |R_${order}|\\approx${err.toFixed(4)}`,
  };
}

export function buildDerivativeSteps(expr: string, x0: number): CalcStepSequence {
  stepId = 0;
  const hs = [1, 0.5, 0.2, 0.1, 0.05, 0.01];
  const exact = numericalDerivative(expr, x0, 1e-7);
  const y0 = evalFn(expr, x0);

  const steps: CalcVizStep[] = [
    step({
      title: '导数定义',
      explanation: '导数是割线斜率在 h→0 时的极限。',
      latex: `f'(${x0})=\\lim_{h\\to0}\\frac{f(${x0}+h)-f(${x0})}{h}`,
      phase: 'intro',
      viz: { highlightX: x0 },
    }),
    step({
      title: `切点 (${x0}, ${y0.toFixed(4)})`,
      explanation: '绿点标记切点，后续割线从此出发。',
      latex: `f(${x0})=${y0.toFixed(4)}`,
      phase: 'compute',
      viz: { highlightX: x0 },
    }),
  ];

  for (const h of hs) {
    const slope = (evalFn(expr, x0 + h) - y0) / h;
    steps.push(
      step({
        title: `割线 h = ${h}`,
        explanation: `斜率 ≈ ${slope.toFixed(4)}，随 h 减小趋近 ${exact.toFixed(4)}。`,
        latex: `\\frac{f(${x0}+${h})-f(${x0})}{${h}}=${slope.toFixed(4)}`,
        phase: 'eliminate',
        viz: { derivH: h, highlightX: x0 },
      })
    );
  }

  steps.push(
    step({
      title: '切线斜率',
      explanation: '极限意义下的导数值。',
      latex: `f'(${x0})\\approx ${exact.toFixed(6)}`,
      phase: 'result',
      viz: { derivH: 0, highlightX: x0 },
    })
  );

  return {
    mode: 'derivative',
    steps,
    resultText: `f'(${x0}) ≈ ${exact.toFixed(6)}`,
    resultLatex: `f'(${x0})\\approx ${exact.toFixed(6)}`,
  };
}

export function buildIntegralSteps(
  expr: string,
  a: number,
  b: number,
  mode: RiemannMode
): CalcStepSequence {
  stepId = 0;
  const ns = [2, 4, 8, 16, 32];
  const steps: CalcVizStep[] = [
    step({
      title: '定积分与黎曼和',
      explanation: '将区间分成 n 个小矩形，面积之和逼近 ∫f(x)dx。',
      latex: `\\int_{${a}}^{${b}} f(x)\\,dx \\approx \\sum_{i=1}^{n} f(x_i^*)\\Delta x`,
      phase: 'intro',
    }),
  ];

  let lastSum = 0;
  for (const n of ns) {
    const { sum } = riemannSum(expr, a, b, n, mode);
    lastSum = sum;
    steps.push(
      step({
        title: `n = ${n} 个矩形`,
        explanation: `矩形越多，近似越精确。当前和 ≈ ${sum.toFixed(4)}。`,
        latex: `S_{${n}} = ${sum.toFixed(4)}`,
        phase: n === ns[ns.length - 1] ? 'result' : 'compute',
        viz: { riemannN: n },
      })
    );
  }

  return {
    mode: 'integral',
    steps,
    resultText: `≈ ${lastSum.toFixed(6)}`,
    resultLatex: `\\int_{${a}}^{${b}} f(x)\\,dx \\approx ${lastSum.toFixed(4)}`,
  };
}

// 给用户看的表达式，别整太数学
export function displayExpr(internal: string): string {
  return internal
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\*/g, '·')
    .replace(/pi/g, 'π');
}

export const EXPR_PRESETS: Array<{ label: string; expr: string }> = [
  { label: 'x²', expr: 'x^2' },
  { label: 'x³', expr: 'x^3' },
  { label: 'sin x', expr: 'sin(x)' },
  { label: 'cos x', expr: 'cos(x)' },
  { label: 'eˣ', expr: 'exp(x)' },
  { label: 'ln x', expr: 'log(x)' },
  { label: '1/(1+x²)', expr: '1/(1+x^2)' },
  { label: 'x·sin x', expr: 'x*sin(x)' },
];

export const KEYPAD_ROWS: string[][] = [
  ['7', '8', '9', '÷', '^'],
  ['4', '5', '6', '×', 'x'],
  ['1', '2', '3', '−', '('],
  ['0', '.', '+', ')', '⌫'],
  ['sin(', 'cos(', 'tan(', 'exp(', 'log('],
  ['sqrt(', 'π', 'e', '←', 'C'],
];

export function insertKeypadToken(current: string, key: string): string {
  if (key === 'C') return '';
  if (key === '⌫') return current.slice(0, -1);
  if (key === '←') return current.slice(0, -1);
  const map: Record<string, string> = {
    '÷': '/',
    '×': '*',
    '−': '-',
    'π': 'pi',
  };
  return current + (map[key] ?? key);
}
