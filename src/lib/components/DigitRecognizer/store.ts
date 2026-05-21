import type { FlowState, InferenceResult, ModelState } from './model/types';

/** 共享状态（Svelte 5 组件内通过 import 重置） */
export function createInitialModelState(): ModelState {
  return { status: 'idle', error: null, model: null, vizModel: null };
}

export function createInitialFlowState(): FlowState {
  return { activeLayerIndex: 0, playing: false, speed: 1 };
}

export type DigitRecognizerState = {
  model: ModelState;
  inference: InferenceResult | null;
  flow: FlowState;
  inferring: boolean;
  hoverLayer: number | null;
};

export function createAppState(): DigitRecognizerState {
  return {
    model: createInitialModelState(),
    inference: null,
    flow: createInitialFlowState(),
    inferring: false,
    hoverLayer: null,
  };
}
