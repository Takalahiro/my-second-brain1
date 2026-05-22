export type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  // 旋转角度（度）
  r?: number;
};

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function readLayout(
  key: string,
  defaults: { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number }
): WidgetLayout & { posUnset: boolean } {
  const minW = defaults.minW ?? 200;
  const minH = defaults.minH ?? 160;
  const maxW = defaults.maxW ?? 2000;
  const maxH = defaults.maxH ?? 1600;
  let x = -1;
  let y = -1;
  let w = defaults.w;
  let h = defaults.h;
  let r = 0;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const s = JSON.parse(raw);
      if (typeof s.x === 'number') x = s.x;
      if (typeof s.y === 'number') y = s.y;
      if (typeof s.w === 'number') w = clamp(s.w, minW, maxW);
      if (typeof s.h === 'number') h = clamp(s.h, minH, maxH);
      if (typeof s.width === 'number') w = clamp(s.width, minW, maxW);
      if (typeof s.height === 'number') h = clamp(s.height, minH, maxH);
      if (typeof s.r === 'number') r = s.r;
    }
  } catch {
    /* ignore */
  }
  return { x, y, w, h, r, posUnset: x < 0 || y < 0 };
}

export function writeLayout(key: string, layout: WidgetLayout) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ x: layout.x, y: layout.y, w: layout.w, h: layout.h, r: layout.r ?? 0 })
    );
  } catch {
    /* ignore */
  }
}

export function defaultPosition(w: number, h: number, offsetX = 80, offsetY = 120) {
  if (typeof window === 'undefined') return { x: offsetX, y: offsetY };
  return {
    x: Math.max(24, Math.min(window.innerWidth - w - 24, offsetX)),
    y: Math.max(24, Math.min(window.innerHeight - h - 24, offsetY)),
  };
}

export function clampPosition(x: number, y: number, w: number, bottomMargin = 80) {
  if (typeof window === 'undefined') return { x, y };
  return {
    x: clamp(x, 4, Math.max(4, window.innerWidth - w - 4)),
    y: clamp(y, 4, Math.max(4, window.innerHeight - bottomMargin)),
  };
}
