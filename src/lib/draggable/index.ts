/**
 * 通用 Svelte action：让任意 DOM 元素可拖动。
 *
 * 性能要点：
 * - pointermove 用 rAF 合并，避免每帧多次写 transform
 * - 拖动中才加 will-change: transform
 * - update() 仅在结构性选项变化时重绑，忽略 onEnd 回调引用变化
 */

import type { Action } from 'svelte/action';

export interface DraggableOptions {
  /** false 时不附加任何 listener；运行期切换 enabled 会动态 attach/detach */
  enabled?: boolean;
  handle?: string;
  storageKey?: string;
  boundary?: 'viewport' | HTMLElement | null;
  draggingClass?: string;
  onEnd?: (result: { x: number; y: number; moved: boolean }) => void;
  doubleClickReset?: boolean;
}

interface Offset {
  x: number;
  y: number;
}

const STRUCT_KEYS = ['handle', 'storageKey', 'boundary', 'draggingClass', 'doubleClickReset', 'enabled'] as const;

function structChanged(a: DraggableOptions, b: DraggableOptions): boolean {
  for (const k of STRUCT_KEYS) {
    if (a[k] !== b[k]) return true;
  }
  return false;
}

function readStored(key: string | undefined): Offset | null {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStored(key: string | undefined, offset: Offset) {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(offset));
  } catch {
    /* ignore */
  }
}

function clearStored(key: string | undefined) {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function applyTransform(node: HTMLElement, offset: Offset) {
  node.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
}

function clampToBoundary(
  desired: Offset,
  startRect: DOMRect,
  boundary: DraggableOptions['boundary']
): Offset {
  if (boundary === null) return desired;
  let bw: number;
  let bh: number;
  if (boundary instanceof HTMLElement) {
    const br = boundary.getBoundingClientRect();
    bw = br.width;
    bh = br.height;
  } else {
    bw = window.innerWidth;
    bh = window.innerHeight;
  }
  const margin = 8;
  const minX = -startRect.left + margin;
  const maxX = bw - startRect.right - margin;
  const minY = -startRect.top + margin;
  const maxY = bh - startRect.bottom - margin;
  return {
    x: Math.max(minX, Math.min(maxX, desired.x)),
    y: Math.max(minY, Math.min(maxY, desired.y)),
  };
}

export const draggable: Action<HTMLElement, DraggableOptions | undefined> = (
  node: HTMLElement,
  options: DraggableOptions = {}
) => {
  let opts: DraggableOptions = options;
  let offset: Offset = readStored(opts.storageKey) ?? { x: 0, y: 0 };
  let dragging = false;
  let startPointer = { x: 0, y: 0 };
  let startOffset: Offset = { x: 0, y: 0 };
  let baseRect: DOMRect | null = null;
  let pointerId = -1;
  let didMove = false;

  let rafId = 0;
  let pendingX = 0;
  let pendingY = 0;

  /**
   * Handle 解析：返回所有匹配元素。支持「顶部 + 底部 + 边缘多个 handle」的场景。
   * 用 querySelectorAll，对每个元素都会附加 cursor 样式，并在 hit-test 时检查
   * pointerdown 落在任意一个 handle 内即可开始拖动。
   */
  function getHandles(): HTMLElement[] {
    if (opts.handle) {
      const list = node.querySelectorAll<HTMLElement>(opts.handle);
      if (list.length > 0) return Array.from(list);
    }
    return [node];
  }

  function getPrimaryHandle(): HTMLElement {
    return getHandles()[0] ?? node;
  }

  function isInHandle(target: EventTarget | null): boolean {
    if (!target) return false;
    for (const h of getHandles()) {
      if (h.contains(target as Node)) return true;
    }
    return false;
  }

  function flushTransform() {
    rafId = 0;
    if (!baseRect) return;
    const desired = {
      x: startOffset.x + (pendingX - startPointer.x),
      y: startOffset.y + (pendingY - startPointer.y),
    };
    offset = clampToBoundary(desired, baseRect, opts.boundary ?? 'viewport');
    applyTransform(node, offset);
  }

  function scheduleTransform(clientX: number, clientY: number) {
    pendingX = clientX;
    pendingY = clientY;
    if (rafId) return;
    rafId = requestAnimationFrame(flushTransform);
  }

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    if (!isInHandle(e.target)) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT') return;

    dragging = true;
    didMove = false;
    pointerId = e.pointerId;
    startPointer = { x: e.clientX, y: e.clientY };
    startOffset = { ...offset };
    pendingX = e.clientX;
    pendingY = e.clientY;

    const r = node.getBoundingClientRect();
    baseRect = new DOMRect(r.left - offset.x, r.top - offset.y, r.width, r.height);

    // 在实际触发的 handle 上 setPointerCapture，确保 pointermove 路由正确
    const captureHost = (e.currentTarget as HTMLElement) || getPrimaryHandle();
    try {
      captureHost.setPointerCapture(pointerId);
    } catch {
      /* 老浏览器没 pointer capture，pointermove 仍会通过 window listener 收到 */
    }
    node.style.willChange = 'transform';
    if (opts.draggingClass) node.classList.add(opts.draggingClass);
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId || !baseRect) return;
    if (Math.abs(e.clientX - startPointer.x) > 4 || Math.abs(e.clientY - startPointer.y) > 4) {
      didMove = true;
    }
    scheduleTransform(e.clientX, e.clientY);
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      flushTransform();
    }
    // 尝试在每个 handle 上 release（不知道当时 capture 在哪个上）
    for (const h of getHandles()) {
      try {
        h.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
    node.style.willChange = '';
    if (opts.draggingClass) node.classList.remove(opts.draggingClass);
    writeStored(opts.storageKey, offset);
    opts.onEnd?.({ ...offset, moved: didMove });
  }

  function onDoubleClick(e: MouseEvent) {
    if (opts.doubleClickReset === false) return;
    if (!isInHandle(e.target)) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'A' || tag === 'BUTTON') return;
    offset = { x: 0, y: 0 };
    applyTransform(node, offset);
    clearStored(opts.storageKey);
  }

  function onWindowResize() {
    const r = node.getBoundingClientRect();
    const base = new DOMRect(r.left - offset.x, r.top - offset.y, r.width, r.height);
    offset = clampToBoundary(offset, base, opts.boundary ?? 'viewport');
    applyTransform(node, offset);
  }

  let attached = false;

  function attach() {
    if (attached) return;
    if (opts.enabled === false) {
      // 移动端抽屉：不附加 listener，也不 transform；CSS 自然布局接管。
      return;
    }
    attached = true;
    for (const h of getHandles()) {
      h.style.cursor = 'grab';
      h.style.touchAction = 'none';
    }
    node.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    node.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', onWindowResize, { passive: true });

    // 同步 clamp + apply transform。之前用 rAF 会留下「element 已 mount
    // 但 transform 还没生效」的窗口；如果 CSS 用 visibility 控制可见性，
    // 这个窗口会让浏览器（Chrome/Edge）渲染出隐藏的 panel。同步 apply
    // 后浏览器在第一帧就能拿到最终位置。
    try {
      const r = node.getBoundingClientRect();
      if (r.width > 0) {
        const base = new DOMRect(r.left - offset.x, r.top - offset.y, r.width, r.height);
        offset = clampToBoundary(offset, base, opts.boundary ?? 'viewport');
      }
    } catch {
      /* getBoundingClientRect 在极个别情况下抛错，保守跳过 clamp */
    }
    applyTransform(node, offset);
    node.dataset.dragReady = '1';
  }

  function detach() {
    if (rafId) cancelAnimationFrame(rafId);
    node.style.willChange = '';
    if (!attached) return;
    attached = false;
    for (const h of getHandles()) {
      h.style.cursor = '';
      h.style.touchAction = '';
    }
    node.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    node.removeEventListener('dblclick', onDoubleClick);
    window.removeEventListener('resize', onWindowResize);
    // 禁用时去掉之前的 transform，让 CSS 自然布局接管
    node.style.transform = '';
    delete node.dataset.dragReady;
  }

  attach();

  return {
    update(newOptions: DraggableOptions = {}) {
      opts.onEnd = newOptions.onEnd;
      if (!structChanged(opts, newOptions)) return;
      detach();
      opts = { ...opts, ...newOptions };
      offset = readStored(opts.storageKey) ?? offset;
      attach();
    },
    destroy() {
      detach();
    },
  };
};

export default draggable;
