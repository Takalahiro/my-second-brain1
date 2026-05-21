/** 固定定位悬浮球：位置读写与边界约束 */

export function loadFabPosition(storageKey: string): { left: number; top: number } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const p = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof p.x !== 'number' || typeof p.y !== 'number') return null;
    return { left: p.x, top: p.y };
  } catch {
    return null;
  }
}

export function saveFabPosition(storageKey: string, left: number, top: number) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify({ x: left, y: top }));
}

export function clampFabPosition(
  left: number,
  top: number,
  width: number,
  height: number,
  margin = 8,
) {
  return {
    left: Math.max(margin, Math.min(left, window.innerWidth - width - margin)),
    top: Math.max(margin, Math.min(top, window.innerHeight - height - margin)),
  };
}
