import type { InferenceResult, LayerActivation } from '../model/types';

export type DiagramNode = {
  x: number;
  y: number;
  act: number;
  layerIndex: number;
  nodeIndex: number;
};

export type DiagramEdge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sign: 1 | -1;
  layerIndex: number;
};

export type DiagramLayer = {
  layerIndex: number;
  label: string;
  countLabel: string;
  y: number;
  nodes: DiagramNode[];
};

export type DiagramLayout = {
  width: number;
  height: number;
  centerX: number;
  inputImageUrl: string;
  layers: DiagramLayer[];
  edges: DiagramEdge[];
  logits: { digit: number; prob: number; predicted: boolean }[];
  predicted: number;
};

function sampleValues(layer: LayerActivation, maxNodes: number): number[] {
  const raw =
    layer.data instanceof Float32Array ? Array.from(layer.data) : [...layer.data];
  if (raw.length <= maxNodes) return raw.map((v) => Math.max(0, v));

  const step = raw.length / maxNodes;
  const out: number[] = [];
  for (let i = 0; i < maxNodes; i++) {
    const idx = Math.min(raw.length - 1, Math.floor(i * step));
    out.push(Math.max(0, raw[idx] ?? 0));
  }
  return out;
}

function maxNodesForLayer(layer: LayerActivation): number {
  switch (layer.meta.kind) {
    case 'input':
      return 20;
    case 'conv2d':
    case 'pool':
      return 10;
    case 'flatten':
      return 12;
    case 'dense':
      return layer.meta.name.includes('Softmax') || layer.meta.shapeLabel === '10' ? 10 : 12;
    default:
      return 8;
  }
}

function countLabel(layer: LayerActivation): string {
  if (layer.meta.shapeLabel) return layer.meta.shapeLabel;
  const n = layer.data instanceof Float32Array ? layer.data.length : layer.data.length;
  return String(n);
}

function normalizeActs(values: number[]): number[] {
  const max = Math.max(...values, 1e-6);
  return values.map((v) => v / max);
}

function edgeSign(a: number, b: number, layerIndex: number): 1 | -1 {
  const h = Math.sin(a * 12.9898 + b * 78.233 + layerIndex * 0.31) * 43758.5453;
  return h - Math.floor(h) > 0.5 ? 1 : -1;
}

export function buildDiagramLayout(inference: InferenceResult): DiagramLayout {
  const { layers: acts, prediction, inputPreview } = inference;
  const centerX = 220;
  const nodeGap = 14;
  const layerGap = 56;
  let y = 88;

  const inputCanvas = document.createElement('canvas');
  inputCanvas.width = 56;
  inputCanvas.height = 56;
  const ictx = inputCanvas.getContext('2d')!;
  ictx.fillStyle = '#000';
  ictx.fillRect(0, 0, 56, 56);
  for (let i = 0; i < 28 * 28; i++) {
    const v = Math.floor((inputPreview[i] ?? 0) * 255);
    const x = i % 28;
    const row = Math.floor(i / 28);
    ictx.fillStyle = `rgb(${v},${v},${v})`;
    ictx.fillRect(x * 2, row * 2, 2, 2);
  }
  const inputImageUrl = inputCanvas.toDataURL();

  const layers: DiagramLayer[] = [];
  const edges: DiagramEdge[] = [];

  acts.forEach((layer, layerIndex) => {
    const values = normalizeActs(sampleValues(layer, maxNodesForLayer(layer)));
    const n = values.length;
    const colH = (n - 1) * nodeGap;
    const startY = y;
    const nodes: DiagramNode[] = values.map((act, nodeIndex) => ({
      x: centerX,
      y: startY + nodeIndex * nodeGap,
      act,
      layerIndex,
      nodeIndex,
    }));
    layers.push({
      layerIndex,
      label: layer.meta.name,
      countLabel: countLabel(layer),
      y: startY + colH / 2,
      nodes,
    });
    y = startY + colH + layerGap;
  });

  for (let li = 0; li < layers.length - 1; li++) {
    const from = layers[li].nodes;
    const to = layers[li + 1].nodes;
    for (const a of from) {
      for (const b of to) {
        edges.push({
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          sign: edgeSign(a.nodeIndex, b.nodeIndex, li),
          layerIndex: li,
        });
      }
    }
  }

  const logits = prediction.probabilities.map((prob, digit) => ({
    digit,
    prob,
    predicted: digit === prediction.predicted,
  }));

  return {
    width: 480,
    height: Math.max(y + 40, 420),
    centerX,
    inputImageUrl,
    layers,
    edges,
    logits,
    predicted: prediction.predicted,
  };
}

export function nodeFill(act: number, reached: boolean): string {
  const t = Math.min(1, Math.max(0, act));
  const g = Math.floor(30 + t * 225);
  const alpha = reached ? 1 : 0.25;
  return `rgba(${g},${g},${g},${alpha})`;
}

export function nodeStroke(active: boolean, hovered: boolean): string {
  if (active) return '#00ff9d';
  if (hovered) return '#7ec8ff';
  return 'rgba(255,255,255,0.35)';
}
