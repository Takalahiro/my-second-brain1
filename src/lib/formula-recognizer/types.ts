// Texo / FormulaNet 模型配置
export const FORMULA_MODEL_ID = 'alephpi/FormulaNet' as const;

// 模型输入尺寸，跟 FormulaNet 训练时一样
export const FORMULA_INPUT_SIZE = 384;

// 画板内部分辨率，导出时再缩到 FORMULA_INPUT_SIZE
export const FORMULA_DRAW_SIZE = 512;

// 生成参数，beam 稍微宽一点换精度
export const FORMULA_GENERATION = {
  max_new_tokens: 768,
  num_beams: 2,
  early_stopping: true,
  do_sample: false,
} as const;

// 移动端 / 低内存：单 beam、短输出，压推理峰值内存
export const FORMULA_GENERATION_LITE = {
  max_new_tokens: 384,
  num_beams: 1,
  early_stopping: true,
  do_sample: false,
} as const;

// Hugging Face 运行时下载体积（不进 git）：
// - onnx/encoder_model.onnx ≈ 52 MiB
// - onnx/decoder_model_merged.onnx ≈ 25 MiB
//
// 更大的 OCR（UniMERNet-T 107M）总下载通常 >200 MiB，单文件也常超 25 MiB，
// 纯前端默认方案扛不住。现在是 FormulaNet OCR + SymPy 符号求解。
export const FORMULA_MODEL_REMOTE_SIZES_MIB = {
  encoder: 51.7,
  decoderMerged: 24.7,
} as const;

// 以后可能换更大的 OCR 模型（还没启用）
export const FORMULA_MODEL_LARGE_CANDIDATES = [
  'alephpi/FormulaNet',
  // UniMERNet 等需自托管量化 ONNX，体积与精度需权衡
] as const;

export type ModelLoadPhase = 'idle' | 'loading' | 'ready' | 'error';

export type ModelProgress = {
  status: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

export type RecognizeProgress = {
  phase: 'loading-model' | 'recognizing';
  message: string;
  progress?: ModelProgress;
};

export type WorkerInitMessage = {
  type: 'init';
  preferWasm?: boolean;
  liteGeneration?: boolean;
};

export type WorkerRecognizeMessage = {
  type: 'recognize';
  key: string;
  image: Blob;
  highAccuracy?: boolean;
};

export type WorkerInputMessage = WorkerInitMessage | WorkerRecognizeMessage;

export type WorkerReadyMessage = { type: 'ready'; device?: 'webgpu' | 'wasm' };

export type WorkerProgressMessage = {
  type: 'progress';
  phase: 'model' | 'recognize';
  file?: string;
  name?: string;
  status?: string;
  message?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

export type WorkerResultMessage = {
  type: 'result';
  key: string;
  latex: string;
};

export type WorkerErrorMessage = {
  type: 'error';
  key?: string;
  message: string;
};

export type WorkerOutputMessage =
  | WorkerReadyMessage
  | WorkerProgressMessage
  | WorkerResultMessage
  | WorkerErrorMessage;

export type ProgressCallback = (progress: RecognizeProgress) => void;
