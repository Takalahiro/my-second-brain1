const STACK_KEY = 'second-brain:pixel-widget-stack';
const BASE_Z = 90;
const STEP = 1;

type StackListener = () => void;
const listeners = new Set<StackListener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribePixelStack(fn: StackListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function loadStackOrder(): string[] {
  try {
    const raw = localStorage.getItem(STACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((k) => typeof k === 'string');
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveStackOrder(order: string[]) {
  try {
    localStorage.setItem(STACK_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
  notify();
}

export function registerWidget(layoutKey: string) {
  const order = loadStackOrder();
  if (!order.includes(layoutKey)) {
    order.push(layoutKey);
    saveStackOrder(order);
  }
}

export function unregisterWidget(layoutKey: string) {
  const order = loadStackOrder().filter((k) => k !== layoutKey);
  saveStackOrder(order);
}

export function getZIndex(layoutKey: string): number {
  const order = loadStackOrder();
  const i = order.indexOf(layoutKey);
  if (i < 0) return BASE_Z;
  return BASE_Z + i * STEP;
}

export function bringToFront(layoutKey: string): number {
  const order = loadStackOrder().filter((k) => k !== layoutKey);
  order.push(layoutKey);
  saveStackOrder(order);
  return getZIndex(layoutKey);
}

export function bringForward(layoutKey: string): number {
  const order = loadStackOrder();
  const i = order.indexOf(layoutKey);
  if (i < 0) {
    registerWidget(layoutKey);
    return getZIndex(layoutKey);
  }
  if (i >= order.length - 1) return getZIndex(layoutKey);
  const next = [...order];
  [next[i], next[i + 1]] = [next[i + 1], next[i]];
  saveStackOrder(next);
  return getZIndex(layoutKey);
}

export function sendBackward(layoutKey: string): number {
  const order = loadStackOrder();
  const i = order.indexOf(layoutKey);
  if (i <= 0) return getZIndex(layoutKey);
  const next = [...order];
  [next[i - 1], next[i]] = [next[i], next[i - 1]];
  saveStackOrder(next);
  return getZIndex(layoutKey);
}
