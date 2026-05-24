export type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
};

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

let cachedSafeTop = -1;
let cachedSafeBottom = -1;
let cacheWidth = 0;

function measureSafeAreaTop(): number {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  return h;
}

/** 菜单栏 + 状态条下方，小组件不得进入该区域 */
export function getWidgetSafeTop(): number {
  if (typeof window === 'undefined') return 72;
  const w = window.innerWidth;
  if (cachedSafeTop >= 0 && cacheWidth === w) return cachedSafeTop;

  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const mobile = w <= 768;
  const immersive = root.hasAttribute('data-ui-immersive');
  const strip = parseFloat(cs.getPropertyValue('--skin-strip-h')) || (immersive ? (mobile ? 20 : 22) : 0);
  const menu = parseFloat(cs.getPropertyValue('--skin-menu-h')) || (mobile ? 48 : 44);
  const sat = measureSafeAreaTop();
  const edge = mobile ? 6 : 8;

  cachedSafeTop = Math.ceil(Math.max(sat, edge) + strip + menu + 8);
  cacheWidth = w;
  return cachedSafeTop;
}

export function getWidgetSafeBottom(): number {
  if (typeof window === 'undefined') return 80;
  const w = window.innerWidth;
  if (cachedSafeBottom >= 0 && cacheWidth === w) return cachedSafeBottom;
  const mobile = w <= 768;
  cachedSafeBottom = mobile ? 88 : 80;
  return cachedSafeBottom;
}

export function invalidateWidgetSafeZoneCache() {
  cachedSafeTop = -1;
  cachedSafeBottom = -1;
  cacheWidth = 0;
}

export function readLayout(
  key: string,
  defaults: { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number },
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
      JSON.stringify({ x: layout.x, y: layout.y, w: layout.w, h: layout.h, r: layout.r ?? 0 }),
    );
  } catch {
    /* ignore */
  }
}

export function defaultPosition(w: number, h: number, offsetX = 80, offsetY?: number) {
  if (typeof window === 'undefined') return { x: offsetX, y: offsetY ?? getWidgetSafeTop() + 12 };
  const minY = getWidgetSafeTop();
  const y = offsetY ?? minY + 12;
  return {
    x: Math.max(24, Math.min(window.innerWidth - w - 24, offsetX)),
    y: Math.max(minY, Math.min(window.innerHeight - h - getWidgetSafeBottom(), y)),
  };
}

/** 首次启用小组件时的错开落点 */
export function spawnPosition(w: number, h: number, column = 0, row = 0) {
  return defaultPosition(w, h, 72 + column * 36, getWidgetSafeTop() + 12 + row * 52);
}

export function clampPosition(x: number, y: number, w: number, h = 200, bottomMargin?: number) {
  if (typeof window === 'undefined') return { x, y };
  const minY = getWidgetSafeTop();
  const bottom = bottomMargin ?? getWidgetSafeBottom();
  const maxY = Math.max(minY, window.innerHeight - bottom - Math.max(h, 80));
  return {
    x: clamp(x, 4, Math.max(4, window.innerWidth - w - 4)),
    y: clamp(y, minY, maxY),
  };
}

export function clampDropPoint(x: number, y: number) {
  const minY = getWidgetSafeTop();
  return {
    x: Math.max(8, x - 24),
    y: Math.max(minY, y - 16),
  };
}
