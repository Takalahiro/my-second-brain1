import type { Matrix, MatrixHighlight, StepMatrix, VizStep } from '../types';
import { cloneMatrix } from '../core';
import { formatNumberLatex, matrixToLatex } from '../format';

let stepCounter = 0;

export function resetStepCounter() {
  stepCounter = 0;
}

export function makeStep(
  partial: Omit<VizStep, 'id'> & { id?: string }
): VizStep {
  stepCounter += 1;
  return { id: `s${stepCounter}`, ...partial };
}

export function mat(key: string, label: string, data: Matrix): StepMatrix {
  return { key, label, data: cloneMatrix(data) };
}

export function hl(
  matrixKey: string,
  partial: Omit<MatrixHighlight, 'matrixKey'> = {}
): MatrixHighlight {
  return { matrixKey, ...partial };
}

export function swapRows(m: Matrix, r1: number, r2: number) {
  [m[r1], m[r2]] = [m[r2], m[r1]];
}

export function scaleRow(m: Matrix, r: number, k: number) {
  for (let c = 0; c < m[r].length; c++) m[r][c] *= k;
}

export function addRowMultiple(m: Matrix, target: number, source: number, k: number) {
  for (let c = 0; c < m[target].length; c++) {
    m[target][c] -= k * m[source][c];
  }
}

export function rowOpLatex(kind: 'swap' | 'scale' | 'add', a: number, b?: number, k?: number) {
  const rp = (r: number) => `R_{${r + 1}}`;
  if (kind === 'swap' && b !== undefined) return `${rp(a)} \\leftrightarrow ${rp(b)}`;
  if (kind === 'scale' && k !== undefined) return `${rp(a)} \\leftarrow ${formatNumberLatex(k, true)}\\,${rp(a)}`;
  if (kind === 'add' && b !== undefined && k !== undefined) {
    const sign = k >= 0 ? '-' : '+';
    const absK = Math.abs(k);
    return `${rp(a)} \\leftarrow ${rp(a)} ${sign} ${formatNumberLatex(absK, true)}\\,${rp(b)}`;
  }
  return '';
}

export function introStep(title: string, explanation: string, latex: string, matrices: StepMatrix[]): VizStep {
  return makeStep({ title, explanation, latex, matrices, highlights: [], phase: 'intro' });
}

export function resultStep(
  title: string,
  explanation: string,
  latex: string,
  matrices: StepMatrix[] = []
): VizStep {
  return makeStep({ title, explanation, latex, matrices, highlights: [], phase: 'result' });
}

export { matrixToLatex, formatNumberLatex };
