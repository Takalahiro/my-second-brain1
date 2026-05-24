export type SpatialTilt = { pitch: number; roll: number };

export type WebcamTiltTrackerOptions = {
  maxTilt?: number;
  signal?: AbortSignal;
  /** 检测间隔（ms），降低 CPU */
  detectIntervalMs?: number;
};

export type WebcamTiltTracker = {
  getTilt: () => SpatialTilt;
  hasTracking: () => boolean;
  isActive: () => boolean;
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

function tiltFromCenter(cx: number, cy: number, w: number, h: number, maxTilt: number): SpatialTilt {
  const nx = clamp(((cx / w) - 0.5) * 2, -1, 1);
  const ny = clamp(((cy / h) - 0.5) * 2, -1, 1);
  return {
    pitch: clamp(-ny * maxTilt, -maxTilt, maxTilt),
    roll: clamp(-nx * maxTilt, -maxTilt, maxTilt),
  };
}

export function createWebcamTiltTracker(opts: WebcamTiltTrackerOptions = {}): WebcamTiltTracker {
  const maxTilt = opts.maxTilt ?? 0.14;
  const detectIntervalMs = opts.detectIntervalMs ?? 40;

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
  let rawTilt: SpatialTilt = { ...ZERO };
  let smoothTilt: SpatialTilt = { ...ZERO };
  let prevGray: Uint8ClampedArray | null = null;
  let startPromise: Promise<'granted' | 'denied' | 'unsupported'> | null = null;

  function ensureCanvas(w: number, h: number) {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText =
        'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }

  function stopStream() {
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
    }
    active = false;
    tracking = false;
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
    ensureCanvas(w, h);
    ctx.drawImage(video, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    if (!prevGray || prevGray.length !== w * h) {
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
        if (d > 12) {
          sumX += x;
          sumY += y;
          mass += 1;
        }
        prevGray[p] = lum;
      }
    }
    if (mass < 16) return null;
    return tiltFromCenter(sumX / mass, sumY / mass, w, h, maxTilt);
  }

  async function detectFaceTilt(): Promise<SpatialTilt | null> {
    if (!video || video.readyState < 2) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    const sampleW = 160;
    const sampleH = 120;

    if (detector) {
      try {
        ensureCanvas(sampleW, sampleH);
        ctx!.drawImage(video, 0, 0, sampleW, sampleH);
        const faces = await detector.detect(canvas!);
        const box = faces[0]?.boundingBox;
        if (!box) return sampleMotionTilt(sampleW, sampleH);
        return tiltFromCenter(box.x + box.width / 2, box.y + box.height / 2, sampleW, sampleH, maxTilt);
      } catch {
        return sampleMotionTilt(sampleW, sampleH);
      }
    }

    return sampleMotionTilt(sampleW, sampleH);
  }

  const tick = async () => {
    if (disposed) return;
    rafId = requestAnimationFrame(() => void tick());
    if (!stream || !video) return;

    const now = performance.now();
    if (now - lastDetectAt < detectIntervalMs) {
      smoothTilt.pitch += (rawTilt.pitch - smoothTilt.pitch) * 0.14;
      smoothTilt.roll += (rawTilt.roll - smoothTilt.roll) * 0.14;
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
    smoothTilt.pitch += (rawTilt.pitch - smoothTilt.pitch) * 0.22;
    smoothTilt.roll += (rawTilt.roll - smoothTilt.roll) * 0.22;
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
      const done = () => void video?.play().then(resolve).catch(reject);
      video.onloadedmetadata = done;
      if (video.readyState >= 1) done();
      video.onerror = () => reject();
    });

    detector = getFaceDetector();
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
    getTilt: () => (tracking ? smoothTilt : ZERO),
    hasTracking: () => tracking,
    isActive: () => active,
    requestStart,
    dispose,
  };
}
