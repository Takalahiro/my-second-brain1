// 280×280 画板常量
export const CANVAS_SIZE = 280;
export const MNIST_SIZE = 28;

export function setupDrawingContext(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#ffffff';
}

export function clearCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function initCanvas(canvas: HTMLCanvasElement) {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  clearCanvas(canvas);
}

export function canvasHasInk(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 10) return true;
  }
  return false;
}

// 程序化画几个示例数字
export function drawSampleDigit(canvas: HTMLCanvasElement, digit: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearCanvas(canvas);
  setupDrawingContext(ctx);
  ctx.lineWidth = 22;

  const s = CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.28;

  ctx.beginPath();
  switch (digit) {
    case 0:
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 1:
      ctx.moveTo(cx, cy - r * 1.2);
      ctx.lineTo(cx, cy + r * 1.2);
      break;
    case 2:
      ctx.arc(cx, cy - r * 0.3, r * 0.85, Math.PI * 1.1, Math.PI * 0.1);
      ctx.lineTo(cx - r * 0.7, cy + r * 1.1);
      ctx.lineTo(cx + r * 0.9, cy + r * 1.1);
      break;
    case 3:
      for (let i = 0; i < 2; i++) {
        ctx.moveTo(cx - r, cy - r * 0.6 + i * r * 0.9);
        ctx.arc(cx, cy - r * 0.15 + i * r * 0.75, r * 0.75, Math.PI * 0.85, Math.PI * 2.15);
      }
      break;
    case 4:
      ctx.moveTo(cx + r * 0.5, cy - r * 1.1);
      ctx.lineTo(cx - r * 0.6, cy + r * 0.1);
      ctx.lineTo(cx + r * 0.9, cy + r * 0.1);
      ctx.moveTo(cx + r * 0.3, cy - r * 0.9);
      ctx.lineTo(cx + r * 0.3, cy + r * 1.1);
      break;
    case 5:
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r * 0.7, cy - r);
      ctx.lineTo(cx - r * 0.7, cy);
      ctx.arc(cx, cy + r * 0.35, r * 0.75, Math.PI, 0);
      break;
    case 6:
      ctx.arc(cx, cy + r * 0.15, r, Math.PI * 0.35, Math.PI * 1.65);
      ctx.moveTo(cx - r * 0.15, cy - r * 0.55);
      ctx.arc(cx + r * 0.15, cy - r * 0.35, r * 0.45, Math.PI, 0);
      break;
    case 7:
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy - r);
      ctx.lineTo(cx - r * 0.2, cy + r);
      break;
    case 8:
      ctx.arc(cx, cy - r * 0.45, r * 0.55, 0, Math.PI * 2);
      ctx.arc(cx, cy + r * 0.45, r * 0.55, 0, Math.PI * 2);
      break;
    case 9:
      ctx.arc(cx, cy - r * 0.15, r, -Math.PI * 0.65, Math.PI * 0.65);
      ctx.arc(cx + r * 0.05, cy - r * 0.55, r * 0.45, Math.PI * 0.2, Math.PI * 1.1);
      break;
    default:
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.stroke();
}

export function getPointerPos(
  canvas: HTMLCanvasElement,
  e: PointerEvent | TouchEvent
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX: number;
  let clientY: number;
  if ('touches' in e) {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (!t) return null;
    clientX = t.clientX;
    clientY = t.clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
