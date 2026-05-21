import type * as tf from '@tensorflow/tfjs';
import type { ModelState } from './types';
import { tf as tfRuntime } from '../../../tfjs-client';

/** 本地托管 LeNet 风格 MNIST 模型 — 见 scripts/export-mnist-model.py */
export const MNIST_MODEL_URL = '/models/mnist/model.json';

function getTf() {
  return Promise.resolve(tfRuntime);
}

export async function loadMnistModel(): Promise<{
  model: tf.LayersModel;
  vizModel: tf.LayersModel;
}> {
  const tf = await getTf();
  let model: tf.LayersModel;

  try {
    model = await tf.loadLayersModel(MNIST_MODEL_URL);
  } catch (localErr) {
    const detail = localErr instanceof Error ? localErr.message : String(localErr);
    throw new Error(
      `无法加载 MNIST 模型。请确认 public/models/mnist/ 存在，或运行 pnpm model:export-mnist 重新生成。(${detail})`
    );
  }

  const outputs = model.layers
    .map((layer) => layer.output)
    .filter((o): o is tf.SymbolicTensor => o != null);

  const vizModel = tf.model({
    inputs: model.inputs[0],
    outputs,
  });

  return { model, vizModel };
}

export function disposeModels(state: ModelState) {
  state.model?.dispose();
  state.vizModel?.dispose();
}

/** 离开 CNN 页时释放 TF.js 引擎，避免 WebGL 与主界面争抢 GPU */
export async function disposeTfEngine() {
  try {
    const tf = await getTf();
    tf.engine().reset();
  } catch {
    /* ignore */
  }
}
