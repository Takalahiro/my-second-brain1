import type * as THREE from 'three';

export type SpatialTilt = { pitch: number; roll: number };

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
  /** 默认关闭呼吸，仅陀螺仪/鼠标微视差 */
  enableBreath?: boolean;
  breath?: { x: number; y: number; z: number };
  /** 无陀螺仪时用鼠标位置模拟（桌面） */
  enablePointerFallback?: boolean;
};

/** 桌面鼠标跟随：极轻微 */
const POINTER_SENSITIVITY = 0.004;
const POINTER_MAX_TILT = 0.006;
/** 陀螺仪应用到机位的增益 */
const GYRO_POS = { roll: 0.85, pitch: 0.55 };
const GYRO_LOOK = { roll: 0.18, pitch: 0.12 };
/** 鼠标应用到机位的增益（比陀螺仪弱很多） */
const POINTER_POS = { roll: 0.1, pitch: 0.06 };
const POINTER_LOOK = { roll: 0.018, pitch: 0.01 };

const DEFAULT_BREATH = { x: 0.004, y: 0.002, z: 0.003 };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** 三频 sin/cos 叠加，模拟自然头部微摆 */
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
  const breath = opts.breath ?? DEFAULT_BREATH;
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let disposed = false;
  let tilt: SpatialTilt = { pitch: 0, roll: 0 };
  let pointerTilt: SpatialTilt = { pitch: 0, roll: 0 };
  let hasDeviceTilt = false;
  const smoothTilt = { pitch: 0, roll: 0 };

  function applyToCamera(cam: THREE.PerspectiveCamera) {
    const { base } = opts;
    if (reducedMotion) {
      cam.position.set(base.x, base.y, base.z);
      cam.lookAt(base.lookAtX, base.lookAtY, base.lookAtZ);
      cam.updateMatrixWorld();
      return;
    }

    const target = hasDeviceTilt ? tilt : enablePointerFallback ? pointerTilt : { pitch: 0, roll: 0 };
    const smooth = hasDeviceTilt ? 0.07 : 0.045;
    smoothTilt.pitch += (target.pitch - smoothTilt.pitch) * smooth;
    smoothTilt.roll += (target.roll - smoothTilt.roll) * smooth;

    const posGain = hasDeviceTilt ? GYRO_POS : POINTER_POS;
    const lookGain = hasDeviceTilt ? GYRO_LOOK : POINTER_LOOK;
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
    if (disposed || reducedMotion) return;
    const beta = e.beta;
    const gamma = e.gamma;
    if (beta == null || gamma == null) return;
    hasDeviceTilt = true;
    tilt = {
      pitch: clamp((beta - 42) * 0.0018, -0.14, 0.14),
      roll: clamp(gamma * 0.0028, -0.14, 0.14),
    };
  };

  const onPointer = (e: PointerEvent) => {
    if (disposed || reducedMotion || !enablePointerFallback || hasDeviceTilt) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    pointerTilt = {
      pitch: clamp(-ny * POINTER_SENSITIVITY, -POINTER_MAX_TILT, POINTER_MAX_TILT),
      roll: clamp(nx * POINTER_SENSITIVITY, -POINTER_MAX_TILT, POINTER_MAX_TILT),
    };
  };

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
    } catch {}
  }

  function start() {
    if (disposed || reducedMotion) return;
    window.addEventListener('deviceorientation', onOrient, { passive: true });
    if (enablePointerFallback) {
      window.addEventListener('pointermove', onPointer, { passive: true });
    }
    const unlock = () => {
      void requestOrientationPermission();
    };
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.removeEventListener('deviceorientation', onOrient);
    window.removeEventListener('pointermove', onPointer);
    opts.signal?.removeEventListener('abort', onAbort);
  }

  const onAbort = () => dispose();
  opts.signal?.addEventListener('abort', onAbort, { once: true });
  start();

  return { applyToCamera, dispose };
}
