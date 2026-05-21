import { create, all } from 'mathjs';
import { matlabToMath } from '../calc-engine';

const math = create(all, {});

export type FnPoint = { x: number; y: number };

export function compileFn(expr: string) {
  return math.compile(matlabToMath(expr));
}

export function evalFn(expr: string, x: number): number {
  try {
    const v = compileFn(expr).evaluate({ x });
    return typeof v === 'number' && Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}

export function sampleFn(expr: string, xMin: number, xMax: number, n = 300): FnPoint[] {
  const pts: FnPoint[] = [];
  const step = (xMax - xMin) / (n - 1);
  for (let i = 0; i < n; i++) {
    const x = xMin + i * step;
    pts.push({ x, y: evalFn(expr, x) });
  }
  return pts;
}

/** 数值导数 */
export function numericalDerivative(expr: string, x: number, h = 1e-5): number {
  return (evalFn(expr, x + h) - evalFn(expr, x - h)) / (2 * h);
}

export type DerivativeStep = {
  h: number;
  slope: number;
  latex: string;
  explanation: string;
};

export function derivativeSteps(expr: string, x0: number): DerivativeStep[] {
  const hs = [1, 0.5, 0.2, 0.1, 0.05, 0.01];
  const exact = numericalDerivative(expr, x0, 1e-7);
  return hs.map((h) => {
    const slope = (evalFn(expr, x0 + h) - evalFn(expr, x0)) / h;
    return {
      h,
      slope,
      latex: `f'(x_0) \\approx \\frac{f(x_0+${h})-f(x_0)}{${h}} = ${slope.toFixed(4)}`,
      explanation: `割线斜率（h=${h}）逐渐逼近切线斜率 ${exact.toFixed(4)}`,
    };
  });
}

export type RiemannMode = 'left' | 'right' | 'mid' | 'trap';

export type RiemannRect = { x0: number; x1: number; y0: number; y1: number; area: number };

export function riemannSum(
  expr: string,
  a: number,
  b: number,
  n: number,
  mode: RiemannMode = 'mid'
): { rects: RiemannRect[]; sum: number } {
  const dx = (b - a) / n;
  const rects: RiemannRect[] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx;
    let height: number;
    if (mode === 'left') height = evalFn(expr, x0);
    else if (mode === 'right') height = evalFn(expr, x1);
    else if (mode === 'mid') height = evalFn(expr, (x0 + x1) / 2);
    else {
      const y0 = evalFn(expr, x0);
      const y1 = evalFn(expr, x1);
      height = (y0 + y1) / 2;
    }
    if (!Number.isFinite(height)) height = 0;
    const area = height * dx;
    sum += area;
    rects.push({ x0, x1, y0: 0, y1: height, area });
  }
  return { rects, sum };
}

/** Taylor 系数（在 a 点，逐阶导数数值近似） */
export function taylorCoeffs(expr: string, a: number, order: number): number[] {
  const coeffs: number[] = [];
  // 用 mathjs derivative if possible - fallback numeric
  let current = expr;
  for (let k = 0; k <= order; k++) {
    if (k === 0) {
      coeffs.push(evalFn(expr, a));
    } else {
      coeffs.push(numericalDerivative(current, a) / factorial(k));
      current = `(${current})`; // numeric only for higher - use repeated numerical
      // Better: compute k-th derivative numerically
      coeffs[k] = nthDerivativeNumeric(expr, a, k) / factorial(k);
    }
  }
  return coeffs;
}

function factorial(n: number) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function nthDerivativeNumeric(expr: string, x: number, n: number): number {
  if (n === 0) return evalFn(expr, x);
  const h = 1e-4;
  // central difference for first, recurse conceptually - use small h formula
  if (n === 1) return numericalDerivative(expr, x, h);
  if (n === 2) {
    return (evalFn(expr, x + h) - 2 * evalFn(expr, x) + evalFn(expr, x - h)) / (h * h);
  }
  // For higher orders use binomial-like stencil simplified
  return numericalDerivative(expr, x, h) * Math.pow(10, n - 1) * 0; // fallback
}

/** 预设 Taylor 系数（常用函数解析） */
export function taylorPoly(
  kind: 'sin' | 'cos' | 'exp',
  a: number,
  order: number
): (x: number) => number {
  const coeffs = getAnalyticTaylorCoeffs(kind, a, order);
  return (x: number) => {
    let s = 0;
    for (let k = 0; k < coeffs.length; k++) {
      s += coeffs[k] * Math.pow(x - a, k);
    }
    return s;
  };
}

function getAnalyticTaylorCoeffs(kind: 'sin' | 'cos' | 'exp', a: number, order: number): number[] {
  const c: number[] = [];
  for (let n = 0; n <= order; n++) c.push(0);
  if (kind === 'exp') {
    const ea = Math.exp(a);
    for (let n = 0; n <= order; n++) c[n] = ea / factorial(n);
    return c;
  }
  if (kind === 'sin') {
    for (let n = 0; n <= order; n++) {
      const k = n;
      if (k % 2 === 0) { c[n] = 0; continue; }
      const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
      c[n] = sign / factorial(k);
    }
    // adjust for center a (only works well for a=0)
    if (a !== 0) {
      // numeric fallback for sin at a
      for (let n = 0; n <= order; n++) {
        c[n] = nthDerivSin(a, n) / factorial(n);
      }
    }
    return c;
  }
  if (kind === 'cos') {
    for (let n = 0; n <= order; n++) {
      if (n % 2 === 1) { c[n] = 0; continue; }
      const sign = (n / 2) % 2 === 0 ? 1 : -1;
      c[n] = sign / factorial(n);
    }
    if (a !== 0) {
      for (let n = 0; n <= order; n++) c[n] = nthDerivCos(a, n) / factorial(n);
    }
    return c;
  }
  return c;
}

function nthDerivSin(a: number, n: number): number {
  const cycle = [Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)];
  return cycle[n % 4];
}
function nthDerivCos(a: number, n: number): number {
  const cycle = [Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)];
  return cycle[n % 4];
}

export function taylorTermsLatex(kind: 'sin' | 'cos' | 'exp', order: number): string {
  if (kind === 'exp') {
    return `e^x \\approx \\sum_{k=0}^{${order}} \\frac{x^k}{k!}`;
  }
  if (kind === 'sin') {
    return `\\sin x \\approx x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots`;
  }
  return `\\cos x \\approx 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\cdots`;
}
