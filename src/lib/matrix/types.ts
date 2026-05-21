export type Matrix = number[][];

export type MatrixHighlight = {
  matrixKey: string;
  rows?: number[];
  cols?: number[];
  cells?: Array<[number, number]>;
  activeCell?: [number, number];
};

export type StepMatrix = {
  key: string;
  label: string;
  data: Matrix;
};

export type VizStep = {
  id: string;
  title: string;
  explanation: string;
  latex: string;
  matrices: StepMatrix[];
  highlights: MatrixHighlight[];
  phase?: string;
};

export type OperationId =
  | 'inverse'
  | 'determinant'
  | 'multiply'
  | 'eigenvalues'
  | 'rref'
  | 'lu'
  | 'solve'
  | 'rank'
  | 'transpose';

export type MethodOption = { id: string; label: string; desc: string };

export type StepSequence = {
  operation: OperationId;
  method: string;
  steps: VizStep[];
  result: unknown;
  resultText: string;
  resultLatex: string;
};

export type MatrixInput = {
  rows: number;
  cols: number;
  data: Matrix;
};
