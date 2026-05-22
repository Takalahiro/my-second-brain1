import { MNIST_SIZE } from '../canvas/canvasUtils';

export type PreprocessPath = 'direct' | 'centered';

export type PreprocessOptions = {
  path: PreprocessPath;
  thicken?: boolean;
};

const INK_THRESHOLD = 18;
const CROP_PADDING_RATIO = 0.12;

function imageDataFromCanvas(source: HTMLCanvasElement): ImageData {
  const ctx = source.getContext('2d')!;
  return ctx.getImageData(0, 0, source.width, source.height);
}

function findInkBounds(data: Uint8ClampedArray, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx]! > INK_THRESHOLD) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!found) return null;
  return { minX, minY, maxX, maxY };
}

function thickenInk(data: Uint8ClampedArray, width: number, height: number, radius = 2) {
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx]! <= INK_THRESHOLD) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = (ny * width + nx) * 4;
          out[nidx] = 255;
          out[nidx + 1] = 255;
          out[nidx + 2] = 255;
          out[nidx + 3] = 255;
        }
      }
    }
  }
  return out;
}

function renderToMnist(
  source: ImageData | { data: Uint8ClampedArray; width: number; height: number },
  sx: number,
  sy: number,
  sw: number,
  sh: number
): Float32Array {
  const off = document.createElement('canvas');
  off.width = MNIST_SIZE;
  off.height = MNIST_SIZE;
  const ctx = off.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, MNIST_SIZE, MNIST_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const temp = document.createElement('canvas');
  temp.width = source.width;
  temp.height = source.height;
  const tctx = temp.getContext('2d')!;
  if (source instanceof ImageData) {
    tctx.putImageData(source, 0, 0);
  } else {
    const img = new ImageData(source.data, source.width, source.height);
    tctx.putImageData(img, 0, 0);
  }

  ctx.drawImage(temp, sx, sy, sw, sh, 0, 0, MNIST_SIZE, MNIST_SIZE);

  const img = ctx.getImageData(0, 0, MNIST_SIZE, MNIST_SIZE);
  const gray = new Float32Array(MNIST_SIZE * MNIST_SIZE);
  for (let i = 0; i < MNIST_SIZE * MNIST_SIZE; i++) {
    gray[i] = img.data[i * 4]! / 255;
  }
  return gray;
}

// 直接缩到 28×28，跟原版一样
export function preprocessDirect(source: HTMLCanvasElement): Float32Array {
  return renderToMnist(imageDataFromCanvas(source), 0, 0, source.width, source.height);
}

// 裁墨迹、留白、可选加粗，再缩放
export function preprocessCentered(
  source: HTMLCanvasElement,
  options: { thicken?: boolean } = {}
): Float32Array {
  const { width, height, data } = imageDataFromCanvas(source);
  const bounds = findInkBounds(data, width, height);
  if (!bounds) return preprocessDirect(source);

  const padX = Math.max(8, Math.round((bounds.maxX - bounds.minX + 1) * CROP_PADDING_RATIO));
  const padY = Math.max(8, Math.round((bounds.maxY - bounds.minY + 1) * CROP_PADDING_RATIO));
  const sx = Math.max(0, bounds.minX - padX);
  const sy = Math.max(0, bounds.minY - padY);
  const ex = Math.min(width - 1, bounds.maxX + padX);
  const ey = Math.min(height - 1, bounds.maxY + padY);
  const sw = ex - sx + 1;
  const sh = ey - sy + 1;

  if (!options.thicken) {
    return renderToMnist(imageDataFromCanvas(source), sx, sy, sw, sh);
  }

  const crop = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const src = ((y + sy) * width + (x + sx)) * 4;
      const dst = (y * sw + x) * 4;
      crop[dst] = data[src]!;
      crop[dst + 1] = data[src + 1]!;
      crop[dst + 2] = data[src + 2]!;
      crop[dst + 3] = data[src + 3]!;
    }
  }
  const thickened = thickenInk(crop, sw, sh, 2);
  return renderToMnist({ data: thickened, width: sw, height: sh }, 0, 0, sw, sh);
}

export type VariantSpec = {
  label: string;
  path: PreprocessPath;
  thicken: boolean;
};

export const MNIST_VARIANTS_STANDARD: VariantSpec[] = [
  { label: '直接缩放', path: 'direct', thicken: false },
];

export const MNIST_VARIANTS_HIGH_ACCURACY: VariantSpec[] = [
  { label: '直接缩放', path: 'direct', thicken: false },
  { label: '居中裁剪 + 加粗', path: 'centered', thicken: true },
];

export function preprocessVariant(source: HTMLCanvasElement, spec: VariantSpec): Float32Array {
  if (spec.path === 'direct') return preprocessDirect(source);
  return preprocessCentered(source, { thicken: spec.thicken });
}

export function preprocessVariants(
  source: HTMLCanvasElement,
  highAccuracy: boolean
): Array<{ spec: VariantSpec; gray: Float32Array }> {
  const specs = highAccuracy ? MNIST_VARIANTS_HIGH_ACCURACY : MNIST_VARIANTS_STANDARD;
  return specs.map((spec) => ({ spec, gray: preprocessVariant(source, spec) }));
}

// 双路评分：先看置信度，平局再看 top-1 和 top-2 差多少
export function scorePrediction(probabilities: number[]): number {
  const sorted = [...probabilities].sort((a, b) => b - a);
  const top = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;
  return top + (top - second) * 0.25;
}
