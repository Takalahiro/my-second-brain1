import { clamp, clampPosition, spawnPosition } from '../../../lib/floating-widget-layout';

export type SkinLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  a?: number;
};

const ALPHA_MIN = 0.05;
const ALPHA_MAX = 0.95;
const DEFAULT_ALPHA = 0.88;

export function clampSkinAlpha(value: number): number {
  return clamp(value, ALPHA_MIN, ALPHA_MAX);
}

export function loadSkinLayout(
  key: string,
  defaultW: number,
  defaultH: number,
  minW = 220,
  minH = 160,
  maxW = 1200,
  maxH = 900,
  defaultAlpha = DEFAULT_ALPHA,
): SkinLayout {
  let x = -1;
  let y = -1;
  let w = defaultW;
  let h = defaultH;
  let r = 0;
  let a = clampSkinAlpha(defaultAlpha);
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
      if (typeof s.a === 'number') a = clampSkinAlpha(s.a);
      else if (typeof s.bgAlpha === 'number') a = clampSkinAlpha(s.bgAlpha);
    }
  } catch {
    /* ignore */
  }
  if (x < 0 || y < 0) {
    const sp = spawnPosition(w, h);
    x = sp.x;
    y = sp.y;
  }
  const p = clampPosition(x, y, w, h);
  return { x: p.x, y: p.y, w, h, r, a };
}

export function saveSkinLayout(key: string, layout: SkinLayout) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
        r: layout.r ?? 0,
        a: clampSkinAlpha(layout.a ?? DEFAULT_ALPHA),
      }),
    );
  } catch {
    /* ignore */
  }
}
