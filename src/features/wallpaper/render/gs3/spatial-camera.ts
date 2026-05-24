import type * as THREE from 'three';
import { createWebcamTiltTracker } from './webcam-tilt-tracker';

export type { SpatialTilt } from './webcam-tilt-tracker';
import type { SpatialTilt } from './webcam-tilt-tracker';

export type SpatialCameraBase = {
  x: number;
  y: number;
  z: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
};

export type SpatialMotionOptions = {
  speed?: number;
  base: SpatialCameraBase;
  signal?: AbortSignal;
  enableBreath?: boolean;
  breath?: { x: number; y: number; z: number };
  enablePointerFallback?: boolean;
  /** 桌面端用摄像头跟踪头部（需用户授权） */
  enableWebcam?: boolean;
};

const GYRO_MAX_TILT = 0.14;
const GYRO_POS = { roll: 0.85, pitch: 0.55 };
const GYRO_LOOK = { roll: 0.18, pitch: 0.12 };
/** 移动端无陀螺仪时的弱鼠标回退 */
const POINTER_FALLBACK_MAX_TILT = 0.006;
const POINTER_FALLBACK_SENSITIVITY = 0.004;
const POINTER_FALLBACK_POS = { roll: 0.1, pitch: 0.06 };
const POINTER_FALLBACK_LOOK = { roll: 0.018, pitch: 0.01 };
const DEFAULT_BREATH = { x: 0.004, y: 0.002, z: 0.003 };

import { isMobileWallpaperDevice } from '../../device/is-mobile';

function prefersFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  if (isMobileWallpaperDevice()) return false;
  return window.matchMedia('(pointer: fine)').matches;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// 机位轻微晃，不然壁纸太死板
export function sampleBreathOffset(t: number, speed: number, amp = DEFAULT_BREATH) {
  const s = speed;
  return {
    x: Math.sin(t * 0.00025 * s) * amp.x * s,
    y: Math.sin(t * 0.00018 * s) * amp.y * s,
    z: Math.cos(t * 0.00014 * s) * amp.z * s,
  };
}

export function createSpatialMotionController(opts: SpatialMotionOptions) {
  const speed = opts.speed ?? 1;
  const enableBreath = opts.enableBreath ?? false;
  const enablePointerFallback = opts.enablePointerFallback ?? true;
  const enableWebcam = opts.enableWebcam ?? true;
  const breath = opts.breath ?? DEFAULT_BREATH;
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let disposed = false;
  let tilt: SpatialTilt = { pitch: 0, roll: 0 };
  let pointerTilt: SpatialTilt = { pitch: 0, roll: 0 };
  let hasDeviceTilt = false;
  let webcamActive = false;
  let webcamDenied = false;
  const smoothTilt = { pitch: 0, roll: 0 };
  const desktopInput = prefersFinePointer();
  const webcam =
    desktopInput && enableWebcam && !reducedMotion
      ? createWebcamTiltTracker({ maxTilt: GYRO_MAX_TILT, signal: opts.signal })
      : null;

  function refreshWebcamState() {
    webcamActive = webcam?.isActive() ?? false;
  }

  function applyToCamera(cam: THREE.PerspectiveCamera) {
    const { base } = opts;
    if (reducedMotion) {
      cam.position.set(base.x, base.y, base.z);
      cam.lookAt(base.lookAtX, base.lookAtY, base.lookAtZ);
      cam.updateMatrixWorld();
      return;
    }

    refreshWebcamState();
    const webcamTracking = webcam?.hasTracking() ?? false;

    const useGyro = hasDeviceTilt && !desktopInput;
    const useWebcam = webcamTracking && desktopInput && !webcamDenied;
    const target = useGyro
      ? tilt
      : useWebcam
        ? webcam!.getTilt()
        : enablePointerFallback
          ? pointerTilt
          : { pitch: 0, roll: 0 };
    const smooth = useGyro || useWebcam ? 0.07 : desktopInput ? 0.06 : 0.045;
    smoothTilt.pitch += (target.pitch - smoothTilt.pitch) * smooth;
    smoothTilt.roll += (target.roll - smoothTilt.roll) * smooth;

    const useFullGain = useGyro || useWebcam;
    const posGain = useFullGain ? GYRO_POS : desktopInput ? GYRO_POS : POINTER_FALLBACK_POS;
    const lookGain = useFullGain ? GYRO_LOOK : desktopInput ? GYRO_LOOK : POINTER_FALLBACK_LOOK;
    const b = enableBreath ? sampleBreathOffset(performance.now(), speed, breath) : { x: 0, y: 0, z: 0 };
    cam.position.set(
      base.x + b.x + smoothTilt.roll * posGain.roll,
      base.y + b.y + smoothTilt.pitch * posGain.pitch,
      base.z + b.z,
    );
    cam.lookAt(
      base.lookAtX + smoothTilt.roll * lookGain.roll,
      base.lookAtY + smoothTilt.pitch * lookGain.pitch,
      base.lookAtZ,
    );
    cam.updateMatrixWorld();
  }

  const onOrient = (e: DeviceOrientationEvent) => {
    if (disposed || reducedMotion || desktopInput) return;
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return;
    hasDeviceTilt = true;
    tilt = {
      pitch: clamp((beta - 42) * 0.0018, -GYRO_MAX_TILT, GYRO_MAX_TILT),
      roll: clamp(gamma * 0.0028, -GYRO_MAX_TILT, GYRO_MAX_TILT),
    };
  };

  const onPointer = (e: PointerEvent) => {
    if (disposed || reducedMotion || !enablePointerFallback) return;
    if (desktopInput && !webcamDenied && !webcamActive) tryStartWebcam();
    refreshWebcamState();
    if ((webcam?.hasTracking() ?? false) && !webcamDenied) return;
    if (!desktopInput && hasDeviceTilt) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    if (desktopInput) {
      pointerTilt = {
        pitch: clamp(-ny * GYRO_MAX_TILT, -GYRO_MAX_TILT, GYRO_MAX_TILT),
        roll: clamp(nx * GYRO_MAX_TILT, -GYRO_MAX_TILT, GYRO_MAX_TILT),
      };
      return;
    }
    pointerTilt = {
      pitch: clamp(
        -ny * POINTER_FALLBACK_SENSITIVITY,
        -POINTER_FALLBACK_MAX_TILT,
        POINTER_FALLBACK_MAX_TILT,
      ),
      roll: clamp(
        nx * POINTER_FALLBACK_SENSITIVITY,
        -POINTER_FALLBACK_MAX_TILT,
        POINTER_FALLBACK_MAX_TILT,
      ),
    };
  };

  const onPointerLeave = () => {
    if (disposed || reducedMotion || !desktopInput || (webcam?.hasTracking() ?? false)) return;
    pointerTilt = { pitch: 0, roll: 0 };
  };

  function tryStartWebcam() {
    if (!webcam || webcamDenied || disposed || reducedMotion) return;
    void webcam.requestStart().then((state) => {
      if (state === 'granted') refreshWebcamState();
      if (state === 'denied' || state === 'unsupported') webcamDenied = true;
    });
  }

  async function requestOrientationPermission() {
    if (reducedMotion) return;
    const req = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
      }
    ).requestPermission;
    if (!req) return;
    try {
      const state = await req();
      if (state === 'granted') window.addEventListener('deviceorientation', onOrient, { passive: true });
    } catch {
      // ios 拒绝权限就不管了
    }
  }

  function start() {
    if (disposed || reducedMotion) return;
    const unlock = () => {
      if (!desktopInput) void requestOrientationPermission();
      else tryStartWebcam();
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    if (!desktopInput) {
      window.addEventListener('deviceorientation', onOrient, { passive: true });
      void requestOrientationPermission();
    }
    if (enablePointerFallback) {
      window.addEventListener('pointermove', onPointer, { passive: true });
      if (desktopInput) {
        document.documentElement.addEventListener('mouseleave', onPointerLeave);
      }
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('deviceorientation', onOrient);
    window.removeEventListener('pointermove', onPointer);
    document.documentElement.removeEventListener('mouseleave', onPointerLeave);
    webcam?.dispose();
    opts.signal?.removeEventListener('abort', onAbort);
  }

  const onAbort = () => dispose();
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  start();

  return { applyToCamera, dispose };
}
