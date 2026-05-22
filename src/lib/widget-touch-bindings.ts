// 给老小组件拼 widgetTouchGestures 的绑定参数
import type { WidgetTouchGestureOptions } from './widget-touch-gestures';

export type WidgetLayoutState = {
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  maximized?: boolean;
  minimized?: boolean;
  pinned?: boolean;
};

export function makeWidgetTouchBindings(
  getState: () => WidgetLayoutState,
  setters: {
    setPosX: (v: number) => void;
    setPosY: (v: number) => void;
    setWidth: (v: number) => void;
    setHeight: (v: number) => void;
    setRotation: (v: number) => void;
    clampPos: () => void;
    persistLayout: () => void;
  },
  bounds: { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }
): WidgetTouchGestureOptions {
  return {
    disabled: () => {
      const s = getState();
      return !!(s.maximized || s.minimized || s.pinned);
    },
    ...bounds,
    getLayout: () => {
      const s = getState();
      return { x: s.posX, y: s.posY, w: s.width, h: s.height, r: s.rotation };
    },
    setLayout: (p) => {
      if (p.x !== undefined) setters.setPosX(p.x);
      if (p.y !== undefined) setters.setPosY(p.y);
      if (p.w !== undefined) setters.setWidth(p.w);
      if (p.h !== undefined) setters.setHeight(p.h);
      if (p.r !== undefined) setters.setRotation(p.r);
      setters.clampPos();
    },
    onEnd: setters.persistLayout,
  };
}
