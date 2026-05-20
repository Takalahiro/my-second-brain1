/**
 * MATLAB 风格计算器引擎（基于 mathjs）
 */
import { create, all } from 'mathjs';

const math = create(all, {});

/** 将 MATLAB 风格表达式预处理为 mathjs 可解析形式 */
export function matlabToMath(expr: string): string {
  let s = expr.trim();
  // 矩阵 [1 2; 3 4] -> [1,2;3,4] 已由 mathjs 支持分号
  s = s.replace(/\^/g, '^');
  s = s.replace(/(\d+)\s*([ij])\b/gi, (_, n, u) => `${n}${u.toLowerCase() === 'i' ? 'i' : 'j'}`);
  // 隐式乘法：2pi -> 2*pi, 3sin -> 3*sin
  s = s.replace(/(\d)([a-z(])/gi, '$1*$2');
  s = s.replace(/\)([a-z\d(])/gi, ')*$1');
  return s;
}

export type CalcResult =
  | { ok: true; value: unknown; formatted: string; type: 'scalar' | 'matrix' | 'complex' }
  | { ok: false; error: string };

export function evaluate(expr: string): CalcResult {
  try {
    const code = matlabToMath(expr);
    const value = math.evaluate(code);
    const formatted = math.format(value, { precision: 14 });
    let type: 'scalar' | 'matrix' | 'complex' = 'scalar';
    if (math.isMatrix(value)) type = 'matrix';
    else if (math.isComplex(value)) type = 'complex';
    return { ok: true, value, formatted, type };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 生成 2D 函数曲线数据 y = f(x) */
export function plotFunction(
  fn: string,
  xMin = -10,
  xMax = 10,
  points = 200
): { x: number[]; y: number[] } | { error: string } {
  try {
    const compiled = math.compile(matlabToMath(fn));
    const x: number[] = [];
    const y: number[] = [];
    const step = (xMax - xMin) / (points - 1);
    for (let i = 0; i < points; i++) {
      const xv = xMin + i * step;
      x.push(xv);
      try {
        const yv = compiled.evaluate({ x: xv });
        y.push(typeof yv === 'number' && isFinite(yv) ? yv : NaN);
      } catch {
        y.push(NaN);
      }
    }
    return { x, y };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export const CALC_HELP = [
  'sin(x), cos(x), tan(x), exp(x), log(x), sqrt(x)',
  '矩阵: [1 2; 3 4]  ·  inv(A)  ·  det(A)  ·  A\'',
  '复数: 2+3i  ·  abs(1+2i)',
  '绘图: 在「可视化」输入 sin(x) 或 x^2',
];
