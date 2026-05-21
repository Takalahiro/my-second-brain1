import Fraction from 'fraction.js';
import type { Matrix } from './types';

export function formatNumber(x: number, useFraction: boolean): string {
  if (!Number.isFinite(x)) return String(x);
  if (Math.abs(x) < 1e-12) return '0';
  if (!useFraction) {
    const rounded = Math.round(x * 1e6) / 1e6;
    return String(rounded).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  try {
    const f = new Fraction(x).simplify(0.0001);
    if (f.d === 1) return String(f.n);
    return `${f.n}/${f.d}`;
  } catch {
    return formatNumber(x, false);
  }
}

export function formatMatrix(m: Matrix, useFraction = false): string {
  if (m.length === 0) return '[]';
  const colWidths = m[0].map((_, j) =>
    Math.max(...m.map((row) => formatNumber(row[j], useFraction).length))
  );
  return m
    .map((row) =>
      row
        .map((v, j) => formatNumber(v, useFraction).padStart(colWidths[j], ' '))
        .join('  ')
    )
    .join('\n');
}

export function matrixToLatex(m: Matrix, useFraction = false): string {
  const body = m
    .map((row) => row.map((v) => formatNumberLatex(v, useFraction)).join(' & '))
    .join(' \\\\ ');
  return `\\begin{bmatrix}${body}\\end{bmatrix}`;
}

export function formatNumberLatex(x: number, useFraction: boolean): string {
  if (!Number.isFinite(x)) return String(x);
  if (Math.abs(x) < 1e-12) return '0';
  if (!useFraction) return formatNumber(x, false);
  try {
    const f = new Fraction(x).simplify(0.0001);
    if (f.d === 1) return String(f.n);
    return `\\frac{${f.n}}{${f.d}}`;
  } catch {
    return formatNumber(x, false);
  }
}

export function eigenvaluesToText(values: number[]): string {
  return values.map((v, i) => `λ${i + 1} = ${formatNumber(v, false)}`).join('\n');
}

export function eigenvaluesToLatex(values: number[]): string {
  return values.map((v, i) => `\\lambda_{${i + 1}} = ${formatNumberLatex(v, false)}`).join(',\\quad ');
}
