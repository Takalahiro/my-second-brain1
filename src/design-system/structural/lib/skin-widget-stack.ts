const BASE_Z = 90;
const STEP = 1;

type StackListener = () => void;
const stacks = new Map<string, string[]>();
const listeners = new Map<string, Set<StackListener>>();

function stackKey(skin: string) {
  return `second-brain:${skin}:widget-stack`;
}

function readOrder(skin: string): string[] {
  try {
    const raw = localStorage.getItem(stackKey(skin));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((k) => typeof k === 'string');
    }
  } catch {
    /* ignore */
  }
  return stacks.get(skin) ?? [];
}

function writeOrder(skin: string, order: string[]) {
  stacks.set(skin, order);
  try {
    localStorage.setItem(stackKey(skin), JSON.stringify(order));
  } catch {
    /* ignore */
  }
  listeners.get(skin)?.forEach((fn) => fn());
}

export function subscribeSkinStack(skin: string, fn: StackListener): () => void {
  if (!listeners.has(skin)) listeners.set(skin, new Set());
  listeners.get(skin)!.add(fn);
  return () => listeners.get(skin)?.delete(fn);
}

export function registerSkinWidget(skin: string, layoutKey: string) {
  const order = readOrder(skin);
  if (!order.includes(layoutKey)) {
    order.push(layoutKey);
    writeOrder(skin, order);
  }
}

export function unregisterSkinWidget(skin: string, layoutKey: string) {
  writeOrder(
    skin,
    readOrder(skin).filter((k) => k !== layoutKey),
  );
}

export function getSkinZIndex(skin: string, layoutKey: string): number {
  const order = readOrder(skin);
  const i = order.indexOf(layoutKey);
  if (i < 0) return BASE_Z;
  return BASE_Z + i * STEP;
}

export function bringSkinToFront(skin: string, layoutKey: string): number {
  const order = readOrder(skin).filter((k) => k !== layoutKey);
  order.push(layoutKey);
  writeOrder(skin, order);
  return getSkinZIndex(skin, layoutKey);
}
