export type SpatialTilt = { pitch: number; roll: number };

export type WebcamTiltTrackerOptions = {
  maxTilt?: number;
  signal?: AbortSignal;
  /** 检测间隔（ms），降低 CPU */
  detectIntervalMs?: number;
};

export type WebcamTiltTracker = {
  /** 当前平滑后的倾斜；无跟踪时返回 {0,0} */
  getTilt: () => SpatialTilt;
  /** 是否已检测到头部/运动 */
  hasTracking: () => boolean;
  /** 摄像头流已开启（含等待首帧检测） */
  isActive: () => boolean;
  /** 需用户手势后调用（浏览器摄像头策略） */
  requestStart: () => Promise<'granted' | 'denied' | 'unsupported'>;
  dispose: () => void;
};

const ZERO: SpatialTilt = { pitch: 0, roll: 0 };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

type FaceDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<{ boundingBox: DOMRectReadOnly }[]>;
};

function getFaceDetector(): FaceDetectorLike | null {
  if (typeof window === 'undefined') return null;
  const Ctor = (window as Window & { FaceDetector?: new (opts?: object) => FaceDetectorLike })
    .FaceDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ fastMode: true, maxDetectedFaces: 1 });
  } catch {
    return null;
  }
}

export function createWebcamTiltTracker(opts: WebcamTiltTrackerOptions = {}): WebcamTiltTracker {
  const maxTilt = opts.maxTilt ?? 0.14;
  const detectIntervalMs = opts.detectIntervalMs ?? 48;

  let disposed = false;
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let detector: FaceDetectorLike | null = null;
  let rafId = 0;
  let lastDetectAt = 0;
  let active = false;
  let tracking = false;
  let baseline: { x: number; y: number } | null = null;
  let rawTilt: SpatialTilt = { ...ZERO };
  let smoothTilt: SpatialTilt = { ...ZERO };
  let prevGray: Uint8ClampedArray | null = null;
  let startPromise: Promise<'granted' | 'denied' | 'unsupported'> | null = null;

  function stopStream() {
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
    }
    active = false;
    tracking = false;
    baseline = null;
    prevGray = null;
    rawTilt = { ...ZERO };
  }

  function teardownDom() {
    stopStream();
    video?.remove();
    canvas?.remove();
    video = null;
    canvas = null;
    ctx = null;
  }

  function sampleMotionTilt(w: number, h: number): SpatialTilt | null {
    if (!ctx || !video || video.readyState < 2) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    if (!prevGray || prevGray.length !== data.length) {
      prevGray = new Uint8ClampedArray(w * h);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        prevGray[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      return null;
    }
    let sumX = 0;
    let sumY = 0;
    let mass = 0;
    const step = 2;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const p = y * w + x;
        const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const d = Math.abs(lum - prevGray[p]);
        if (d > 18) {
          sumX += x;
          sumY += y;
          mass += 1;
        }
        prevGray[p] = lum;
      }
    }
    if (mass < 24) return null;
    const cx = sumX / mass;
    const cy = sumY / mass;
    if (!baseline) {
      baseline = { x: cx, y: cy };
      return { ...ZERO };
    }
    const nx = clamp(((cx - baseline.x) / (w * 0.22)) * maxTilt, -maxTilt, maxTilt);
    const ny = clamp(((cy - baseline.y) / (h * 0.22)) * maxTilt, -maxTilt, maxTilt);
    return { pitch: -ny, roll: nx };
  }

  async function detectFaceTilt(): Promise<SpatialTilt | null> {
    if (!video || video.readyState < 2) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    if (detector) {
      try {
        const faces = await detector.detect(video);
        const box = faces[0]?.boundingBox;
        if (!box) return null;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        if (!baseline) {
          baseline = { x: cx, y: cy };
          return { ...ZERO };
        }
        const nx = clamp(((cx - baseline.x) / (w * 0.25)) * maxTilt, -maxTilt, maxTilt);
        const ny = clamp(((cy - baseline.y) / (h * 0.25)) * maxTilt, -maxTilt, maxTilt);
        return { pitch: -ny, roll: nx };
      } catch {
        return sampleMotionTilt(w, h);
      }
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    }
    return sampleMotionTilt(160, 120);
  }

  const tick = async () => {
    if (disposed) return;
    rafId = requestAnimationFrame(() => void tick());
    if (!stream || !video) return;

    const now = performance.now();
    if (now - lastDetectAt < detectIntervalMs) {
      smoothTilt.pitch += (rawTilt.pitch - smoothTilt.pitch) * 0.12;
      smoothTilt.roll += (rawTilt.roll - smoothTilt.roll) * 0.12;
      return;
    }
    lastDetectAt = now;

    const next = await detectFaceTilt();
    if (next) {
      tracking = true;
      rawTilt = next;
    } else {
      tracking = false;
      rawTilt = { ...ZERO };
    }
    smoothTilt.pitch += (rawTilt.pitch - smoothTilt.pitch) * 0.18;
    smoothTilt.roll += (rawTilt.roll - smoothTilt.roll) * 0.18;
  };

  async function startInternal(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (disposed) return 'denied';
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unsupported';
    }
    if (stream) return 'granted';

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      });
    } catch {
      return 'denied';
    }

    video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.autoplay = true;
    video.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px';
    video.srcObject = stream;
    document.body.appendChild(video);

    await new Promise<void>((resolve, reject) => {
      if (!video) return reject();
      video.onloadedmetadata = () => {
        void video?.play().then(resolve).catch(reject);
      };
      video.onerror = () => reject();
    });

    detector = getFaceDetector();
    baseline = null;
    active = true;
    tracking = false;
    lastDetectAt = 0;
    cancelAnimationFrame(rafId);
    void tick();
    return 'granted';
  }

  function requestStart() {
    if (!startPromise) startPromise = startInternal();
    return startPromise;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    teardownDom();
    opts.signal?.removeEventListener('abort', onAbort);
  }

  const onAbort = () => dispose();
  opts.signal?.addEventListener('abort', onAbort, { once: true });

  return {
    getTilt: () => (active ? smoothTilt : ZERO),
    hasTracking: () => tracking,
    isActive: () => active,
    requestStart,
    dispose,
  };
}
