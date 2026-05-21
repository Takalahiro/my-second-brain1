/** 四个锁定角度：0° / 90° / 180° / 270°（360° 归一为 0°） */
export const ROTATION_LOCKS = [0, 90, 180, 270] as const;

/** 从 layout JSON 读取旋转角度（度），并吸附到锁定角 */
export function layoutRotation(s: Record<string, unknown> | null | undefined): number {
  const raw = s && typeof s.r === 'number' ? s.r : 0;
  return snapRotation(raw);
}

/** 归一化到 [0, 360) */
export function normalizeRotation(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** 吸附到最近的 90° 锁定角 */
export function snapRotation(deg: number): number {
  const d = normalizeRotation(deg);
  let best: (typeof ROTATION_LOCKS)[number] = 0;
  let min = Infinity;
  for (const lock of ROTATION_LOCKS) {
    const dist = Math.min(Math.abs(d - lock), 360 - Math.abs(d - lock));
    if (dist < min) {
      min = dist;
      best = lock;
    }
  }
  return best;
}

/** 拼接到 widget 内联 style */
export function rotationStyle(deg: number, extra = ''): string {
  const rot = `transform: rotate(${deg}deg); transform-origin: center center;`;
  return extra ? `${extra} ${rot}` : rot;
}
