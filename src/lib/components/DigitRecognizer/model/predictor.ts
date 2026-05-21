import type * as tf from '@tensorflow/tfjs';
import type { InferenceResult, LayerActivation, LayerKind, LayerMeta, PredictionResult } from './types';
import { ARCH_LAYERS } from './types';

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

function preprocessCanvas(source: HTMLCanvasElement, tf: Awaited<ReturnType<typeof getTf>>): tf.Tensor4D {
  const off = document.createElement('canvas');
  off.width = 28;
  off.height = 28;
  const ctx = off.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 28, 28);
  ctx.drawImage(source, 0, 0, 28, 28);
  const img = ctx.getImageData(0, 0, 28, 28);
  const gray = new Float32Array(28 * 28);
  for (let i = 0; i < 28 * 28; i++) {
    gray[i] = img.data[i * 4] / 255;
  }
  return tf.tensor4d(gray, [1, 28, 28, 1]);
}

export async function runInference(
  model: tf.LayersModel,
  vizModel: tf.LayersModel,
  sourceCanvas: HTMLCanvasElement
): Promise<InferenceResult> {
  const tf = await getTf();
  const input = preprocessCanvas(sourceCanvas, tf);
  const inputPreview = input.dataSync() as Float32Array;

  const inputMeta: LayerMeta = {
    id: 'input',
    name: '输入层',
    kind: 'input',
    typeLabel: 'Input 28×28×1',
    shapeLabel: '28×28×1',
    detail: '手写数字缩放到 MNIST 尺寸',
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
    const probs = last.flatten().dataSync() as Float32Array;
    const probabilities = Array.from(probs);
    let predicted = 0;
    let confidence = probabilities[0] ?? 0;
    for (let d = 1; d < 10; d++) {
      if ((probabilities[d] ?? 0) > confidence) {
        confidence = probabilities[d] ?? 0;
        predicted = d;
      }
    }
    prediction = { probabilities, predicted, confidence };
  });

  input.dispose();

  return { layers, prediction, inputPreview };
}
