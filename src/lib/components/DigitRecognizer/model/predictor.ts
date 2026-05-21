import type * as tf from '@tensorflow/tfjs';
import type {
  InferenceOptions,
  InferenceResult,
  LayerActivation,
  LayerKind,
  LayerMeta,
  PredictionResult,
  VariantSummary,
} from './types';
import { ARCH_LAYERS } from './types';
import {
  preprocessVariants,
  scorePrediction,
  type VariantSpec,
} from './mnist-preprocess';

async function getTf() {
  return import('@tensorflow/tfjs');
}

function layerKind(className: string): LayerKind {
  const c = className.toLowerCase();
  if (c.includes('conv2d')) return 'conv2d';
  if (c.includes('maxpool')) return 'pool';
  if (c.includes('flatten')) return 'flatten';
  if (c.includes('dense')) return 'dense';
  if (c.includes('dropout')) return 'dropout';
  return 'unknown';
}

function shapeLabel(shape: number[]): string {
  const s = shape.filter((d) => d > 0 && d !== 1);
  if (s.length === 0) return 'scalar';
  if (s.length === 1) return `${s[0]}`;
  return s.join('×');
}

function buildMeta(
  layer: tf.layers.Layer,
  shape: number[],
  priorKinds: LayerKind[]
): LayerMeta {
  const kind = layerKind(layer.getClassName());
  const base = ARCH_LAYERS.find((a) => a.match.test(layer.getClassName()))?.meta;
  const convCount = priorKinds.filter((k) => k === 'conv2d').length + 1;
  const poolCount = priorKinds.filter((k) => k === 'pool').length + 1;
  const denseCount = priorKinds.filter((k) => k === 'dense').length + 1;
  const name =
    kind === 'conv2d'
      ? `卷积层 ${convCount}`
      : kind === 'pool'
        ? `池化层 ${poolCount}`
        : kind === 'flatten'
          ? '展平层'
          : kind === 'dense'
            ? shape[shape.length - 1] === 10
              ? '输出层 Softmax'
              : `全连接层 ${denseCount}`
            : (base?.name ?? layer.name);

  let typeLabel = base?.typeLabel ?? layer.getClassName();
  if (kind === 'conv2d') {
    const cfg = layer.getConfig() as { filters?: number; kernelSize?: number | number[] };
    const k = Array.isArray(cfg.kernelSize) ? cfg.kernelSize[0] : cfg.kernelSize ?? 3;
    typeLabel = `Conv2D · ${cfg.filters ?? '?'} filters · ${k}×${k}`;
  }
  if (kind === 'dense') {
    const cfg = layer.getConfig() as { units?: number };
    typeLabel = `Dense · ${cfg.units ?? shape[shape.length - 1]}`;
  }

  return {
    id: layer.name,
    name,
    kind,
    typeLabel,
    shapeLabel: shapeLabel(shape.slice(1)),
    detail: base?.detail ?? layer.getClassName(),
  };
}

function tensorToActivation(meta: LayerMeta, tensor: tf.Tensor): LayerActivation {
  const shape = tensor.shape.slice();
  const kind = meta.kind;

  if (kind === 'conv2d' || kind === 'pool') {
    const data = tensor.dataSync() as Float32Array;
    return { meta, data, shape: [...shape] };
  }

  if (kind === 'flatten' || kind === 'dense') {
    const flat = tensor.flatten().dataSync() as Float32Array;
    return { meta, data: Array.from(flat), shape: [...shape] };
  }

  const data = tensor.dataSync() as Float32Array;
  return { meta, data: Array.from(data), shape: [...shape] };
}

function probabilitiesFromTensor(last: tf.Tensor): number[] {
  const probs = last.flatten().dataSync() as Float32Array;
  return Array.from(probs);
}

function predictionFromProbabilities(probabilities: number[]): PredictionResult {
  let predicted = 0;
  let confidence = probabilities[0] ?? 0;
  for (let d = 1; d < 10; d++) {
    if ((probabilities[d] ?? 0) > confidence) {
      confidence = probabilities[d] ?? 0;
      predicted = d;
    }
  }
  return { probabilities, predicted, confidence };
}

function runFromGray(
  model: tf.LayersModel,
  vizModel: tf.LayersModel,
  gray: Float32Array,
  tf: Awaited<ReturnType<typeof getTf>>,
  variantLabel?: string
): InferenceResult {
  const input = tf.tensor4d(gray, [1, 28, 28, 1]);
  const inputPreview = gray.slice();

  const inputMeta: LayerMeta = {
    id: 'input',
    name: '输入层',
    kind: 'input',
    typeLabel: 'Input 28×28×1',
    shapeLabel: '28×28×1',
    detail: variantLabel
      ? `MNIST 预处理 · ${variantLabel}`
      : '手写数字缩放到 MNIST 尺寸',
  };

  const layers: LayerActivation[] = [
    { meta: inputMeta, data: inputPreview, shape: [1, 28, 28, 1] },
  ];

  let prediction: PredictionResult = {
    probabilities: Array(10).fill(0),
    predicted: 0,
    confidence: 0,
  };

  tf.tidy(() => {
    const outputs = vizModel.predict(input) as tf.Tensor | tf.Tensor[];
    const list = Array.isArray(outputs) ? outputs : [outputs];
    const modelLayers = model.layers.filter((l) => l.getClassName() !== 'InputLayer');

    const priorKinds: LayerKind[] = [];
    list.forEach((tensor, i) => {
      const layer = modelLayers[i];
      if (!layer) return;
      const meta = buildMeta(layer, tensor.shape, priorKinds);
      priorKinds.push(meta.kind);
      layers.push(tensorToActivation(meta, tensor));
    });

    const last = list[list.length - 1];
    prediction = predictionFromProbabilities(probabilitiesFromTensor(last));
  });

  input.dispose();

  return { layers, prediction, inputPreview };
}

export async function runInference(
  model: tf.LayersModel,
  vizModel: tf.LayersModel,
  sourceCanvas: HTMLCanvasElement,
  options: InferenceOptions = {}
): Promise<InferenceResult> {
  const tf = await getTf();
  const highAccuracy = options.highAccuracy ?? false;
  const onProgress = options.onProgress;

  const variants = preprocessVariants(sourceCanvas, highAccuracy);

  if (variants.length === 1) {
    const only = variants[0]!;
    onProgress?.(1, 1, only.spec.label);
    return runFromGray(model, vizModel, only.gray, tf, only.spec.label);
  }

  const summaries: VariantSummary[] = [];
  let best: InferenceResult | null = null;
  let bestScore = -Infinity;
  let bestIndex = 0;

  for (let i = 0; i < variants.length; i++) {
    const { spec, gray } = variants[i]!;
    onProgress?.(i + 1, variants.length, spec.label);
    const result = runFromGray(model, vizModel, gray, tf, spec.label);
    const score = scorePrediction(result.prediction.probabilities);
    summaries.push({
      label: spec.label,
      predicted: result.prediction.predicted,
      confidence: result.prediction.confidence,
      score,
    });
    if (score > bestScore) {
      bestScore = score;
      best = result;
      bestIndex = i;
    }
  }

  if (!best) {
    const fallback = variants[0]!;
    return runFromGray(model, vizModel, fallback.gray, tf, fallback.spec.label);
  }

  return {
    ...best,
    variantIndex: bestIndex,
    variantLabel: variants[bestIndex]!.spec.label,
    variantSummaries: summaries,
    highAccuracy,
  };
}

export type { VariantSpec };
