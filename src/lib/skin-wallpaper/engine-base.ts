/** 沉浸式皮肤 Canvas 壁纸 · RAF 循环基座 */

export type SkinWallpaperEngine = {
  resize: () => void;
  stop: () => void;
};

export type SkinDrawFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  dt: number,
) => void;

export function createSkinWallpaperEngine(
  canvas: HTMLCanvasElement,
  draw: SkinDrawFn,
): SkinWallpaperEngine {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    return { resize: () => {}, stop: () => {} };
  }

  let raf = 0;
  let last = performance.now();
  let running = true;
  let dpr = 1;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const tick = (now: number) => {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const w = window.innerWidth;
    const h = window.innerHeight;
    draw(ctx, w, h, now / 1000, dt);
    raf = requestAnimationFrame(tick);
  };

  resize();
  raf = requestAnimationFrame(tick);

  return {
    resize,
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
