import {
  PreTrainedTokenizer,
  Tensor,
  VisionEncoderDecoderModel,
  env,
  type ProgressInfo,
} from '@huggingface/transformers';
import {
  FORMULA_GENERATION,
  FORMULA_GENERATION_LITE,
  FORMULA_INPUT_SIZE,
  FORMULA_MODEL_ID,
} from './types';
import type { WorkerInputMessage, WorkerOutputMessage } from './types';
import { preprocessImageBlob, preprocessImageVariants } from './image-preprocess';
import { latexQualityScore, sanitizeLatex } from './latex-sanitize';

env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm!.proxy = true;

let model: VisionEncoderDecoderModel | null = null;
let tokenizer: PreTrainedTokenizer | null = null;
let activeDevice: 'webgpu' | 'wasm' = 'wasm';
let useLiteGeneration = false;

function post(data: WorkerOutputMessage) {
  self.postMessage(data);
}

function postProgress(info: ProgressInfo) {
  post({
    type: 'progress',
    phase: 'model',
    file: info.file,
    name: info.name,
    status: info.status,
    progress: info.progress,
    loaded: info.loaded,
    total: info.total,
  });
}

async function loadWithDevice(device: 'webgpu' | 'wasm') {
  model = await VisionEncoderDecoderModel.from_pretrained(FORMULA_MODEL_ID, {
    dtype: 'fp32',
    device,
    progress_callback: postProgress,
  });
  tokenizer = await PreTrainedTokenizer.from_pretrained(FORMULA_MODEL_ID, {
    progress_callback: postProgress,
  });
  activeDevice = device;
}

async function initModel(preferWasm = false) {
  if (model && tokenizer) return;

  if (preferWasm) {
    await loadWithDevice('wasm');
    return;
  }

  try {
    await loadWithDevice('webgpu');
  } catch {
    model = null;
    tokenizer = null;
    try {
      await loadWithDevice('wasm');
    } catch (err) {
      throw err instanceof Error ? err : new Error('模型加载失败');
    }
  }
}

function greyToRgbTensor(array: Float32Array): Tensor {
  const size = FORMULA_INPUT_SIZE;
  const plane = size * size;
  const rgb = new Float32Array(plane * 3);
  for (let i = 0; i < plane; i++) {
    const v = array[i]!;
    rgb[i] = v;
    rgb[i + plane] = v;
    rgb[i + 2 * plane] = v;
  }
  return new Tensor('float32', rgb, [1, 3, size, size]);
}

async function decodeFromTensor(array: Float32Array): Promise<string> {
  if (!model || !tokenizer) throw new Error('模型尚未就绪');

  const pixelValues = greyToRgbTensor(array);
  const genConfig = useLiteGeneration ? FORMULA_GENERATION_LITE : FORMULA_GENERATION;
  const outputs = await model.generate({
    inputs: pixelValues,
    ...genConfig,
  });
  const raw = tokenizer.batch_decode(outputs, { skip_special_tokens: true })[0] ?? '';
  return sanitizeLatex(raw);
}

async function predict(blob: Blob, highAccuracy: boolean): Promise<string> {
  if (!model || !tokenizer) throw new Error('模型尚未就绪');

  post({ type: 'progress', phase: 'recognize', message: '预处理图像…' });

  if (!highAccuracy) {
    const array = await preprocessImageBlob(blob);
    post({ type: 'progress', phase: 'recognize', message: '推理中…' });
    return decodeFromTensor(array);
  }

  const variants = await preprocessImageVariants(blob);
  let best = '';
  let bestScore = -Infinity;

  for (let i = 0; i < variants.length; i++) {
    post({
      type: 'progress',
      phase: 'recognize',
      message: `高精度推理 ${i + 1}/${variants.length}…`,
    });
    const latex = await decodeFromTensor(variants[i]!);
    const score = latexQualityScore(latex);
    if (score > bestScore) {
      bestScore = score;
      best = latex;
    }
  }

  return best;
}

self.onmessage = async (event: MessageEvent<WorkerInputMessage>) => {
  const data = event.data;

  if (data.type === 'init') {
    try {
      useLiteGeneration = data.liteGeneration ?? false;
      await initModel(data.preferWasm ?? false);
      post({ type: 'ready', device: activeDevice });
    } catch (err) {
      post({
        type: 'error',
        message: err instanceof Error ? err.message : '模型加载失败',
      });
    }
    return;
  }

  if (data.type === 'recognize') {
    try {
      if (!model || !tokenizer) await initModel(false);
      const latex = await predict(data.image, data.highAccuracy ?? false);
      post({ type: 'result', key: data.key, latex });
    } catch (err) {
      post({
        type: 'error',
        key: data.key,
        message: err instanceof Error ? err.message : '识别失败，请重试',
      });
    }
  }
};

export {};
