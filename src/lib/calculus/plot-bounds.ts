/**
 * 按模式预先算好 y 轴范围，步骤切换时不再缩放 —— 避免画面抖动。
 */
import type { PlotBounds } from '../plot/canvas2d';
import { autoYBounds } from '../plot/canvas2d';
import {
  evalFn,
  numericalDerivative,
  riemannSum,
  sampleFn,
  type RiemannMode,
} from '../calculus/engine';
import { evalTaylorPoly, taylorCoeffsAt } from '../calculus/steps';

const DERIV_HS = [1, 0.5, 0.2, 0.1, 0.05, 0.01];
const RIEMANN_NS = [2, 4, 8, 16, 32];

export function stablePlotBounds(
  mode: 'derivative' | 'integral' | 'taylor',
  expr: string,
  xMin: number,
  xMax: number,
  opts: {
    x0?: number;
    aInt?: number;
    bInt?: number;
    riemannMode?: RiemannMode;
    taylorCenter?: number;
    taylorOrder?: number;
  } = {},
): PlotBounds {
  const pts = sampleFn(expr, xMin, xMax, 280);
  const yVals = pts.map((p) => p.y).filter(Number.isFinite);

  if (mode === 'derivative') {
    const x0 = opts.x0 ?? 0;
    const y0 = evalFn(expr, x0);
    if (Number.isFinite(y0)) yVals.push(y0);
    const slope = numericalDerivative(expr, x0);
    const dx = (xMax - xMin) * 0.35;
    yVals.push(y0 - slope * dx, y0 + slope * dx);
    for (const h of DERIV_HS) {
      const y1 = evalFn(expr, x0 + h);
      if (Number.isFinite(y1)) yVals.push(y1);
    }
  } else if (mode === 'integral') {
    const a = opts.aInt ?? 0;
    const b = opts.bInt ?? 1;
    const rm = opts.riemannMode ?? 'mid';
    for (const n of RIEMANN_NS) {
      const { rects } = riemannSum(expr, a, b, n, rm);
      for (const r of rects) yVals.push(r.y1);
    }
    yVals.push(0);
  } else {
    const a = opts.taylorCenter ?? 0;
    const order = opts.taylorOrder ?? 5;
    for (let k = 0; k <= order; k++) {
      const coeffs = taylorCoeffsAt(expr, a, k);
      const poly = (x: number) => evalTaylorPoly(coeffs, a, x);
      for (const p of pts) {
        const y = poly(p.x);
        if (Number.isFinite(y)) yVals.push(y);
      }
    }
    const ya = evalFn(expr, a);
    if (Number.isFinite(ya)) yVals.push(ya);
  }

  const { yMin, yMax } = autoYBounds(yVals, 0.12);
  return { xMin, xMax, yMin, yMax };
}
