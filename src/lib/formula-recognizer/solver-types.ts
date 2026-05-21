export type SolveStep = {
  title: string;
  latex: string;
  note?: string;
};

export type SolveResult = {
  ok: boolean;
  task?: string;
  answerLatex?: string;
  steps: SolveStep[];
  error?: string;
};

export type SolverPhase = 'idle' | 'loading' | 'ready' | 'solving' | 'error';
