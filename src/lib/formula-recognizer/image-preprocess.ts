/** UniMER / FormulaNet 预处理常量（与 Texo-web 一致） */
export const INPUT_SIZE = 384;
const UNIMERNET_MEAN = 0.7931;
const UNIMERNET_STD = 0.1738;
const CROP_PADDING_RATIO = 0.1;

type GreyImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

function toGrey(imageData: ImageData): GreyImage {
  const { width, height, data } = imageData;
  const grey = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grey[i] = Math.round(data[idx]! * 0.299 + data[idx + 1]! * 0.587 + data[idx + 2]! * 0.114);
  }
  return { width, height, data: grey };
}

function greyToImageData(grey: GreyImage): ImageData {
  const imageData = new ImageData(grey.width, grey.height);
  for (let i = 0; i < grey.data.length; i++) {
    const v = grey.data[i]!;
    const idx = i * 4;
    imageData.data[idx] = v;
    imageData.data[idx + 1] = v;
    imageData.data[idx + 2] = v;
    imageData.data[idx + 3] = 255;
  }
  return imageData;
}

function maybeInvert(image: GreyImage): GreyImage {
  const histogram = new Array(256).fill(0);
  for (const v of image.data) histogram[v]!++;
  const threshold = 200;
  const blackPixels = histogram.slice(0, threshold).reduce((s, v) => s + v, 0);
  const whitePixels = histogram.slice(threshold).reduce((s, v) => s + v, 0);
  if (blackPixels >= whitePixels) {
    const data = new Uint8ClampedArray(image.data.length);
    for (let i = 0; i < image.data.length; i++) data[i] = 255 - image.data[i]!;
    return { ...image, data };
  }
  return image;
}

function cropMargin(image: GreyImage): GreyImage {
  const { width, height, data } = image;
  let max = -Infinity;
  let min = Infinity;
  for (const v of data) {
    if (v > max) max = v;
    if (v < min) min = v;
  }
  if (max === min) return image;

  const threshold = 200;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const normalized = ((data[y * width + x]! - min) / (max - min)) * 255;
      if (normalized < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return image;

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const cropped = new Uint8ClampedArray(cw * ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      cropped[y * cw + x] = data[(y + minY) * width + (x + minX)]!;
    }
  }
  return { width: cw, height: ch, data: cropped };
}

/** 裁剪后留白，避免笔画贴边被截断 */
function padCrop(image: GreyImage, ratio = CROP_PADDING_RATIO): GreyImage {
  const padX = Math.max(4, Math.round(image.width * ratio));
  const padY = Math.max(4, Math.round(image.height * ratio));
  const newW = image.width + padX * 2;
  const newH = image.height + padY * 2;
  const padded = new Uint8ClampedArray(newW * newH);
  padded.fill(255);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      padded[(y + padY) * newW + (x + padX)] = image.data[y * image.width + x]!;
    }
  }
  return { width: newW, height: newH, data: padded };
}

/** 轻微加粗笔画，提升细线识别率 */
function thickenStrokes(image: GreyImage, radius = 1): GreyImage {
  const { width, height, data } = image;
  const out = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (data[idx]! >= 200) continue;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nidx = ny * width + nx;
          if (data[idx]! < out[nidx]!) out[nidx] = data[idx]!;
        }
      }
    }
  }
  return { width, height, data: out };
}

/** 双线性缩放 + 居中填充（Canvas 高质量插值） */
function resizePad(image: GreyImage, targetW: number, targetH: number): GreyImage {
  const srcCanvas = new OffscreenCanvas(image.width, image.height);
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return image;
  srcCtx.putImageData(greyToImageData(image), 0, 0);

  const minDim = Math.min(targetW, targetH);
  const scale = minDim / Math.max(image.width, image.height);
  let newW = Math.max(1, Math.round(image.width * scale));
  let newH = Math.max(1, Math.round(image.height * scale));

  if (newW > targetW || newH > targetH) {
    const ratio = Math.min(targetW / newW, targetH / newH);
    newW = Math.max(1, Math.round(newW * ratio));
    newH = Math.max(1, Math.round(newH * ratio));
  }

  const padW = Math.floor((targetW - newW) / 2);
  const padH = Math.floor((targetH - newH) / 2);

  const dstCanvas = new OffscreenCanvas(targetW, targetH);
  const dstCtx = dstCanvas.getContext('2d');
  if (!dstCtx) return image;

  dstCtx.fillStyle = '#ffffff';
  dstCtx.fillRect(0, 0, targetW, targetH);
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'high';
  dstCtx.drawImage(srcCanvas, padW, padH, newW, newH);

  return toGrey(dstCtx.getImageData(0, 0, targetW, targetH));
}

function normalize(image: GreyImage, mean = UNIMERNET_MEAN, std = UNIMERNET_STD): Float32Array {
  const out = new Float32Array(image.data.length);
  for (let i = 0; i < image.data.length; i++) {
    out[i] = (image.data[i]! / 255 - mean) / std;
  }
  return out;
}

function runPipeline(bitmap: ImageBitmap, options?: { thicken?: boolean }): Float32Array {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布上下文');

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  let grey = toGrey(ctx.getImageData(0, 0, canvas.width, canvas.height));
  grey = maybeInvert(grey);
  grey = cropMargin(grey);
  grey = padCrop(grey);
  if (options?.thicken !== false) grey = thickenStrokes(grey, 1);
  grey = resizePad(grey, INPUT_SIZE, INPUT_SIZE);
  return normalize(grey);
}

/** 将图片 Blob 预处理为 FormulaNet 输入张量 */
export async function preprocessImageBlob(
  blob: Blob,
  options?: { thicken?: boolean }
): Promise<Float32Array> {
  const bitmap = await createImageBitmap(blob);
  try {
    return runPipeline(bitmap, options);
  } finally {
    bitmap.close();
  }
}

/**
 * 高精度：两种预处理各推理一次，取得分更高的结果。
 * 返回 [primary, alternate] 供 worker 选择。
 */
export async function preprocessImageVariants(blob: Blob): Promise<Float32Array[]> {
  const bitmap = await createImageBitmap(blob);
  try {
    return [
      runPipeline(bitmap, { thicken: true }),
      runPipeline(bitmap, { thicken: false }),
    ];
  } finally {
    bitmap.close();
  }
}

/** @deprecated 使用 sanitizeLatex */
export function formatLatex(code: string): string {
  return code.trim();
}
