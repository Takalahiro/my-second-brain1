/**
 * 移动端小组件手势：
 * - 双指：旋转
 * - 三指：以窗口中心缩放
 */

import type { Action } from 'svelte/action';
import { clamp } from './floating-widget-layout';

export type WidgetTouchLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
};

export interface WidgetTouchGestureOptions {
  disabled?: () => boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  getLayout: () => WidgetTouchLayout;
  setLayout: (layout: Partial<WidgetTouchLayout>) => void;
  onEnd?: () => void;
}

type GestureMode = 'none' | 'rotate' | 'scale';

function touchSpread(touches: Touch[]): number {
  if (touches.length < 2) return 0;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < touches.length; i++) {
    for (let j = i + 1; j < touches.length; j++) {
      const dx = touches[i].clientX - touches[j].clientX;
      const dy = touches[i].clientY - touches[j].clientY;
      sum += Math.hypot(dx, dy);
      n++;
    }
  }
  return n ? sum / n : 0;
}

function touchAngleDeg(touches: Touch[]): number {
  const dx = touches[1].clientX - touches[0].clientX;
  const dy = touches[1].clientY - touches[0].clientY;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function normalizeDeg(deg: number): number {
  let next = deg;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return Math.round(next * 10) / 10;
}

export function attachWidgetTouchGestures(
  node: HTMLElement,
  options: WidgetTouchGestureOptions
) {
  let opts = options;
  let mode: GestureMode = 'none';
  /** 落在小组件上的触点 id */
  const trackedIds = new Set<number>();

  let startAngle = 0;
  let startRot = 0;
  let startSpread = 0;
  let startW = 0;
  let startH = 0;
  let centerX = 0;
  let centerY = 0;

  const minW = () => opts.minWidth ?? 200;
  const minH = () => opts.minHeight ?? 160;
  const maxW = () => opts.maxWidth ?? 2000;
  const maxH = () => opts.maxHeight ?? 1600;

  function isDisabled() {
    return opts.disabled?.() ?? false;
  }

  function touchOnNode(t: Touch) {
    const r = node.getBoundingClientRect();
    return (
      t.clientX >= r.left &&
      t.clientX <= r.right &&
      t.clientY >= r.top &&
      t.clientY <= r.bottom
    );
  }

  function activeTouches(e: TouchEvent): Touch[] {
    return Array.from(e.touches).filter((t) => trackedIds.has(t.identifier));
  }

  function endGesture() {
    if (mode === 'none') return;
    mode = 'none';
    opts.onEnd?.();
  }

  function beginRotate(touches: Touch[]) {
    const layout = opts.getLayout();
    startRot = layout.r;
    startAngle = touchAngleDeg(touches);
    mode = 'rotate';
  }

  function beginScale(touches: Touch[]) {
    const layout = opts.getLayout();
    startW = layout.w;
    startH = layout.h;
    startSpread = touchSpread(touches);
    centerX = layout.x + layout.w / 2;
    centerY = layout.y + layout.h / 2;
    mode = 'scale';
  }

  function onTouchStart(e: TouchEvent) {
    if (isDisabled()) return;

    for (const t of Array.from(e.changedTouches)) {
      if (touchOnNode(t)) trackedIds.add(t.identifier);
    }

    const touches = activeTouches(e);
    if (touches.length >= 3) {
      beginScale(touches);
      e.preventDefault();
    } else if (touches.length >= 2 && mode === 'none') {
      beginRotate(touches);
      e.preventDefault();
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (isDisabled() || mode === 'none') return;

    const touches = activeTouches(e);
    if (mode === 'rotate') {
      if (touches.length < 2) return;
      e.preventDefault();
      const delta = touchAngleDeg(touches) - startAngle;
      opts.setLayout({ r: normalizeDeg(startRot + delta) });
      return;
    }

    if (mode === 'scale') {
      if (touches.length < 3) return;
      e.preventDefault();
      const spread = touchSpread(touches);
      if (startSpread <= 0) return;
      const ratio = spread / startSpread;
      const nw = clamp(startW * ratio, minW(), maxW());
      const nh = clamp(startH * ratio, minH(), maxH());
      opts.setLayout({
        w: nw,
        h: nh,
        x: centerX - nw / 2,
        y: centerY - nh / 2,
      });
    }
  }

  function onTouchEnd(e: TouchEvent) {
    for (const t of Array.from(e.changedTouches)) {
      trackedIds.delete(t.identifier);
    }
    const remaining = activeTouches(e);
    if (mode === 'rotate' && remaining.length < 2) endGesture();
    if (mode === 'scale' && remaining.length < 3) endGesture();
    if (trackedIds.size === 0) endGesture();
  }

  node.addEventListener('touchstart', onTouchStart, { passive: false });
  node.addEventListener('touchmove', onTouchMove, { passive: false });
  node.addEventListener('touchend', onTouchEnd);
  node.addEventListener('touchcancel', onTouchEnd);

  return () => {
    node.removeEventListener('touchstart', onTouchStart);
    node.removeEventListener('touchmove', onTouchMove);
    node.removeEventListener('touchend', onTouchEnd);
    node.removeEventListener('touchcancel', onTouchEnd);
    trackedIds.clear();
    mode = 'none';
  };
}

/** Svelte action：绑定到小组件根节点 */
export const widgetTouchGestures: Action<HTMLElement, WidgetTouchGestureOptions> = (
  node,
  options
) => {
  let opts = options;
  let detach = attachWidgetTouchGestures(node, opts);

  return {
    update(newOptions: WidgetTouchGestureOptions) {
      detach();
      opts = newOptions;
      detach = attachWidgetTouchGestures(node, opts);
    },
    destroy() {
      detach();
    },
  };
};

export default widgetTouchGestures;
