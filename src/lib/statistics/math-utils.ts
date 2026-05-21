/** 数值统计工具：erf、不完全 Gamma/Beta 等 */

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

export function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278687905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function gamma(z: number): number {
  if (z <= 0 && Math.abs(z - Math.round(z)) < 1e-10) return Infinity;
  return Math.exp(logGamma(z));
}

export function regLowerGamma(s: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;
  if (s <= 0) return NaN;

  if (x < s + 1) {
    let sum = 1 / s;
    let term = 1 / s;
    for (let n = 1; n < 200; n++) {
      term *= x / (s + n);
      sum += term;
      if (Math.abs(term) < 1e-12 * Math.abs(sum)) break;
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
  }

  let f = 1e30;
  let c = 1e30;
  let h = 1 - s + x;
  if (h === 0) h = 1e-30;
  let d = 0;
  for (let i = 1; i <= 200; i++) {
    const an = i * (s - i);
    d = an * d + h;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = h + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = c * d;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }
  return 1 - Math.exp(-x + s * Math.log(x) - logGamma(s)) / f;
}

export function regBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;

  if (x < (a + 1) / (a + b + 2)) {
    let f = 1;
    let c = 1;
    let d = 0;
    for (let m = 1; m <= 200; m++) {
      const num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1 + num * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + num / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      f *= c * d;
      if (Math.abs(c * d - 1) < 1e-12) break;
    }
    return front * f;
  }
  return 1 - regBeta(b, a, 1 - x);
}

export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const p = 0.5 * regBeta(df / 2, 0.5, x);
  return t >= 0 ? 1 - p : p;
}

export function chi2Cdf(x: number, df: number): number {
  if (x <= 0) return 0;
  return regLowerGamma(df / 2, x / 2);
}

export function fCdf(x: number, d1: number, d2: number): number {
  if (x <= 0) return 0;
  const z = (d1 * x) / (d1 * x + d2);
  return regBeta(d1 / 2, d2 / 2, z);
}

export function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function variance(arr: number[], sample = true): number {
  if (arr.length < 2) return NaN;
  const m = mean(arr);
  const s = arr.reduce((a, v) => a + (v - m) ** 2, 0);
  return s / (sample ? arr.length - 1 : arr.length);
}

export function std(arr: number[], sample = true): number {
  return Math.sqrt(variance(arr, sample));
}

export function integratePdf(pdf: (x: number) => number, a: number, b: number, n = 400): number {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let s = 0.5 * (pdf(a) + pdf(b));
  for (let i = 1; i < n; i++) s += pdf(a + i * h);
  return s * h;
}

export function parseDataInput(raw: string): number[] {
  return raw
    .split(/[,，\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((v) => Number.isFinite(v));
}

export function parseMatrixInput(raw: string): number[][] {
  const rows = raw.trim().split(/\n+/).filter(Boolean);
  return rows.map((r) => parseDataInput(r));
}

export function fmt(n: number, d = 4): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(d);
}

export function fmtP(p: number): string {
  if (p < 0.0001) return '< 0.0001';
  return p.toFixed(4);
}
