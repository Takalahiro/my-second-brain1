// 各 SVG 视图共用的缩放/平移：滚轮以鼠标为中心缩放，空白处拖动画布

export type ZoomPanState = {
  zoom: number;
  panX: number;
  panY: number;
};

export type ZoomPanController = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  setZoomCentered: (factor: number, cx: number, cy: number) => void;
};

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export const ZP_MIN = 0.3;
export const ZP_MAX = 8;
