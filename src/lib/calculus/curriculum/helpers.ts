import type { CalcStepSequence, CalcVizStep } from '../types';

let stepId = 0;

export function resetStepId() {
  stepId = 0;
}

export function mkStep(
  partial: Omit<CalcVizStep, 'id'>,
): CalcVizStep {
  stepId += 1;
  return { id: `cur${stepId}`, ...partial };
}

export type LessonDef = {
  id: string;
  title: string;
  /** 可跳转到 CalculusLab 交互演示 */
  interactive?: 'derivative' | 'integral' | 'taylor';
  steps: Array<Omit<CalcVizStep, 'id'>>;
  resultText?: string;
  resultLatex?: string;
};

export type PartDef = {
  id: string;
  title: string;
  topics: LessonDef[];
};

export function buildFromLesson(lesson: LessonDef): CalcStepSequence {
  resetStepId();
  const steps = lesson.steps.map((s) => mkStep(s));
  const last = steps[steps.length - 1];
  return {
    mode: 'course',
    steps,
    resultText: lesson.resultText ?? last?.title ?? '完成',
    resultLatex: lesson.resultLatex ?? last?.latex ?? '',
  };
}

/** 快速写 3～4 步教学 */
export function lesson(
  title: string,
  rows: Array<[string, string, string?]>,
  result?: { text?: string; latex?: string },
): Omit<CalcVizStep, 'id'>[] {
  return rows.map(([t, exp, latex]) => ({
    title: t,
    explanation: exp,
    latex: latex ?? '',
    phase: 'compute' as const,
  }));
}

export function L(title: string, explanation: string, latex = ''): Omit<CalcVizStep, 'id'> {
  return { title, explanation, latex, phase: 'intro' };
}
