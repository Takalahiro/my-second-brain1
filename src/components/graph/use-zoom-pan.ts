/**
 * 共享的 zoom + pan 控制：所有 SVG 视图复用
 * - 鼠标滚轮缩放（中心向鼠标位置聚焦）
 * - 空白区域 pointer 拖动平移
 * - 提供 zoomIn/zoomOut/reset 工具方法
 */

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
