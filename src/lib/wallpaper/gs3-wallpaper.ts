/**
 * @mkkellogg/gaussian-splats-3d 壁纸渲染器
 * 固定机位 + 陀螺仪视差 · 全量加载后显示
 */
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';
import { createSpatialMotionController } from './spatial-camera';

export type GS3WallpaperStatus = 'loading' | 'ready' | 'failed';

export type GS3WallpaperOptions = {
  url: string;
  speed?: number;
  signal?: AbortSignal;
  onStatus?: (status: GS3WallpaperStatus, message?: string) => void;
};

function resolveUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

/** 解析 manifest 中的点云 URL（不再把 .sog 重映射到未部署的 .ply） */
export function splatAssetUrl(url: string): string {
  return resolveUrl(url);
}

function sceneFormatFromUrl(url: string): GaussianSplats3D.SceneFormat {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.ksplat')) return GaussianSplats3D.SceneFormat.KSplat;
  if (path.endsWith('.splat')) return GaussianSplats3D.SceneFormat.Splat;
  // PlayCanvas 压缩 PLY / INRIA PLY 均由 PlyLoader 按 header 自动识别
  return GaussianSplats3D.SceneFormat.Ply;
}

/** MLSharp 导出 PLY 需绕 X 轴翻转 180° */
const ML_SHARP_ROTATION: [number, number, number, number] = (() => {
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  return [q.x, q.y, q.z, q.w];
})();

const CAMERA_DISTANCE = 0.275 / 1.5;
const CAMERA_PITCH_UP_DEG = 5;
const CAMERA_HEIGHT = 0.05;
const LOAD_TIMEOUT_MS = 120_000;

type AbortableLoad = Promise<void> & { abort?: () => void };

export function createGS3Wallpaper(host: HTMLElement, opts: GS3WallpaperOptions) {
  const report = (status: GS3WallpaperStatus, message?: string) => opts.onStatus?.(status, message);
  const pitchUp = THREE.MathUtils.degToRad(CAMERA_PITCH_UP_DEG);
  const lookAtY = CAMERA_HEIGHT + CAMERA_DISTANCE * Math.tan(pitchUp);

  let disposed = false;
  let readyReported = false;
  let renderStarted = false;
  let running = !document.hidden;
  let rafId = 0;
  let loadTimeoutId = 0;
  let activeLoad: AbortableLoad | null = null;

  const gyro = createSpatialMotionController({
    speed: opts.speed ?? 1,
    signal: opts.signal,
    enableBreath: false,
    base: {
      x: 0,
      y: CAMERA_HEIGHT,
      z: CAMERA_DISTANCE,
      lookAtX: 0,
      lookAtY,
      lookAtZ: 0,
    },
  });

  const viewer = new GaussianSplats3D.Viewer({
    rootElement: host,
    selfDrivenMode: false,
    useBuiltInControls: false,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    integerBasedSort: false,
    enableSIMDInSort: true,
    splatSortDistanceMapPrecision: 17,
    logLevel: GaussianSplats3D.LogLevel.None,
    webXRMode: GaussianSplats3D.WebXRMode.None,
    sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
    renderMode: GaussianSplats3D.RenderMode.OnChange,
    antialiased: false,
    sphericalHarmonicsDegree: 0,
    halfPrecisionCovariancesOnGPU: true,
    optimizeSplatData: true,
    initialCameraPosition: [0, CAMERA_HEIGHT, CAMERA_DISTANCE],
    initialCameraLookAt: [0, lookAtY, 0],
    cameraUp: [0, 1, 0],
  });

  function applyCamera() {
    const cam = viewer.camera as THREE.PerspectiveCamera;
    if (!cam) return;
    cam.up.set(0, 1, 0);
    gyro.applyToCamera(cam);
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (!running || disposed || !renderStarted) return;
    applyCamera();
    viewer.update();
    viewer.render();
  }

  function startRenderLoop() {
    if (disposed || renderStarted) return;
    renderStarted = true;
    applyCamera();
    rafId = requestAnimationFrame(frame);
  }

  function markReady() {
    if (disposed || readyReported) return;
    readyReported = true;
    window.clearTimeout(loadTimeoutId);
    applyCamera();
    startRenderLoop();
    report('ready');
  }

  function abortActiveLoad() {
    try {
      activeLoad?.abort?.();
    } catch {}
    activeLoad = null;
  }

  function beginLoad(): AbortableLoad {
    abortActiveLoad();
    const path = splatAssetUrl(opts.url);
    const loadPromise = viewer.addSplatScene(path, {
      format: sceneFormatFromUrl(path),
      splatAlphaRemovalThreshold: 5,
      showLoadingUI: false,
      progressiveLoad: false,
      rotation: ML_SHARP_ROTATION,
    }) as AbortableLoad;
    activeLoad = loadPromise;
    return loadPromise;
  }

  async function loadScene() {
    report('loading');
    loadTimeoutId = window.setTimeout(() => {
      if (disposed || readyReported) return;
      report('failed', '点云加载超时，请刷新重试');
    }, LOAD_TIMEOUT_MS);

    try {
      await beginLoad();
      if (disposed) return;
      applyCamera();
      markReady();
    } catch (e) {
      if (disposed || opts.signal?.aborted) return;
      report('failed', e instanceof Error ? e.message : '点云加载失败');
    }
  }

  const onAbort = () => {
    void teardown();
  };
  opts.signal?.addEventListener('abort', onAbort, { once: true });

  const canvas = host.querySelector('canvas');
  if (canvas) canvas.style.pointerEvents = 'none';

  const onVis = () => {
    running = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVis);

  void loadScene();

  async function teardown() {
    if (disposed) return;
    disposed = true;
    running = false;
    window.clearTimeout(loadTimeoutId);
    cancelAnimationFrame(rafId);
    rafId = 0;
    document.removeEventListener('visibilitychange', onVis);
    opts.signal?.removeEventListener('abort', onAbort);
    gyro.dispose();
    abortActiveLoad();
    try {
      await viewer.dispose();
    } catch {}
    host.replaceChildren();
  }

  return { dispose: teardown };
}
