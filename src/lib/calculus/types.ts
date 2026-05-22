export type CalcVizStep = {
  id: string;
  title: string;
  explanation: string;
  latex: string;
  phase?: 'intro' | 'compute' | 'term' | 'sum' | 'remainder' | 'eliminate' | 'result';
  // 这步绘图用的附加参数
  viz?: {
    taylorOrder?: number;
    riemannN?: number;
    derivH?: number;
    highlightX?: number;
  };
};

export type CalcStepSequence = {
  mode: 'derivative' | 'integral' | 'taylor';
  steps: CalcVizStep[];
  resultText: string;
  resultLatex: string;
};
