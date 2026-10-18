import { highlightAvr } from './highlight';
import type { AvrTraceStep } from './engine';

export type LineTraceState = 'idle' | 'pending' | 'executed' | 'active' | 'error';

export type LineTraceRow = {
  line: number;
  html: string;
  state: LineTraceState;
  stepIndices: number[];
};

export function buildLineTraceModel(code: string, steps: AvrTraceStep[], activeStep: number): LineTraceRow[] {
  const lines = code.split('\n');
  const active = steps[activeStep];
  const activeLine = active?.line ?? 0;
  const lineToSteps = new Map<number, number[]>();
  const executed = new Set<number>();

  steps.forEach((s, i) => {
    if (!s.line) return;
    const arr = lineToSteps.get(s.line) ?? [];
    arr.push(i);
    lineToSteps.set(s.line, arr);
    if (i <= activeStep) executed.add(s.line);
  });

  const htmlLines = highlightAvr(code).split('\n');

  return lines.map((_, i) => {
    const line = i + 1;
    const stepIndices = lineToSteps.get(line) ?? [];
    let state: LineTraceState = 'idle';
    if (active?.event === 'exception' && line === activeLine) state = 'error';
    else if (line === activeLine && stepIndices.length) state = 'active';
    else if (executed.has(line)) state = 'executed';
    else if (stepIndices.length) state = 'pending';
    return { line, html: htmlLines[i] ?? ' ', state, stepIndices };
  });
}

export function stepIndexForLine(steps: AvrTraceStep[], line: number): number {
  const idx = steps.findIndex((s) => s.line === line);
  return idx;
}
