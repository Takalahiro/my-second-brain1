/**
 * 2D 绘图坐标与网格工具
 */
export type PlotBounds = { xMin: number; xMax: number; yMin: number; yMax: number };

export type PlotPadding = { left: number; right: number; top: number; bottom: number };

export const DEFAULT_PAD: PlotPadding = { left: 44, right: 16, top: 20, bottom: 28 };

export function autoYBounds(values: number[], pad = 0.1): { yMin: number; yMax: number } {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return { yMin: -1, yMax: 1 };
  let yMin = Math.min(...valid);
  let yMax = Math.max(...valid);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const yr = yMax - yMin;
  return { yMin: yMin - yr * pad, yMax: yMax + yr * pad };
}

export function makeMappers(
  cw: number,
  ch: number,
  bounds: PlotBounds,
  pad: PlotPadding = DEFAULT_PAD
) {
  const pw = cw - pad.left - pad.right;
  const ph = ch - pad.top - pad.bottom;
  const toX = (x: number) => pad.left + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * pw;
  const toY = (y: number) => pad.top + ph - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * ph;
  const fromX = (px: number) => bounds.xMin + ((px - pad.left) / pw) * (bounds.xMax - bounds.xMin);
  return { toX, toY, fromX, pw, ph };
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  bounds: PlotBounds,
  pad: PlotPadding = DEFAULT_PAD
) {
  const { toX, toY } = makeMappers(cw, ch, bounds, pad);
  ctx.fillStyle = '#0e0816';
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const y = pad.top + ((ch - pad.top - pad.bottom) * i) / 8;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(cw - pad.right, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const x = pad.left + ((cw - pad.left - pad.right) * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, ch - pad.bottom);
    ctx.stroke();
  }

  if (bounds.yMin < 0 && bounds.yMax > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(0));
    ctx.lineTo(cw - pad.right, toY(0));
    ctx.stroke();
  }
  if (bounds.xMin < 0 && bounds.xMax > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(toX(0), pad.top);
    ctx.lineTo(toX(0), ch - pad.bottom);
    ctx.stroke();
  }
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  ys: number[],
  cw: number,
  ch: number,
  bounds: PlotBounds,
  style: { stroke?: string; width?: number; dash?: number[] } = {},
  pad: PlotPadding = DEFAULT_PAD
) {
  const { toX, toY } = makeMappers(cw, ch, bounds, pad);
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i++) {
    const yv = ys[i];
    if (!Number.isFinite(yv)) { started = false; continue; }
    const px = toX(xs[i]);
    const py = toY(yv);
    if (!started) { ctx.moveTo(px, py); started = true; }
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = style.stroke ?? '#b48cff';
  ctx.lineWidth = style.width ?? 2;
  ctx.setLineDash(style.dash ?? []);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, cw, ch };
}

/** 0–1 脉冲因子，周期约 1.2s */
export function pulseT(now = performance.now(), periodMs = 1200): number {
  return 0.5 + 0.5 * Math.sin((now / periodMs) * Math.PI * 2);
}

/** 带光晕脉冲的标记点 */
export function drawPulsePoint(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  color: string,
  baseR = 5,
  now = performance.now()
) {
  const p = pulseT(now);
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, baseR + 4 + p * 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.14 + p * 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(px, py, baseR + p * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
