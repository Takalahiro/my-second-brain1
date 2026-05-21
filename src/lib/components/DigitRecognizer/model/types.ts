import type * as tf from '@tensorflow/tfjs';

export type LayerKind = 'input' | 'conv2d' | 'pool' | 'flatten' | 'dense' | 'dropout' | 'unknown';

export type LayerMeta = {
  id: string;
  name: string;
  kind: LayerKind;
  typeLabel: string;
  shapeLabel: string;
  detail: string;
};

export type LayerActivation = {
  meta: LayerMeta;
  /** 卷积/池化: [h,w,c] 或 全连接: number[] */
  data: Float32Array | number[];
  shape: number[];
};

export type PredictionResult = {
  probabilities: number[];
  predicted: number;
  confidence: number;
};

export type VariantSummary = {
  label: string;
  predicted: number;
  confidence: number;
  score: number;
};

export type InferenceOptions = {
  highAccuracy?: boolean;
  onProgress?: (current: number, total: number, label: string) => void;
};

export type InferenceResult = {
  layers: LayerActivation[];
  prediction: PredictionResult;
  inputPreview: Float32Array;
  /** 双路推理时选中的路径 */
  variantIndex?: number;
  variantLabel?: string;
  variantSummaries?: VariantSummary[];
  highAccuracy?: boolean;
};

export type FlowState = {
  activeLayerIndex: number;
  playing: boolean;
  speed: number;
};

export type ModelState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  model: tf.LayersModel | null;
  vizModel: tf.LayersModel | null;
};

/** 展示用 LeNet 风格层描述（与 mnist_v1 实际结构映射） */
export const ARCH_LAYERS: Array<{ match: RegExp; meta: Omit<LayerMeta, 'id'> }> = [
  {
    match: /input/i,
    meta: {
      name: '输入层',
      kind: 'input',
      typeLabel: 'Input',
      shapeLabel: '28×28×1',
      detail: 'MNIST 灰度手写数字，归一化到 [0,1]',
    },
  },
  {
    match: /conv2d/i,
    meta: {
      name: '卷积层',
      kind: 'conv2d',
      typeLabel: 'Conv2D',
      shapeLabel: '',
      detail: '提取局部边缘与笔画特征',
    },
  },
  {
    match: /max.*pool|maxpool/i,
    meta: {
      name: '池化层',
      kind: 'pool',
      typeLabel: 'MaxPool 2×2',
      shapeLabel: '',
      detail: '下采样，保留最强激活，减少参数',
    },
  },
  {
    match: /flatten/i,
    meta: {
      name: '展平层',
      kind: 'flatten',
      typeLabel: 'Flatten',
      shapeLabel: '',
      detail: '将多维特征图展开为一维向量',
    },
  },
  {
    match: /dense|fully_connected/i,
    meta: {
      name: '全连接层',
      kind: 'dense',
      typeLabel: 'Dense',
      shapeLabel: '',
      detail: '组合高层特征',
    },
  },
];
