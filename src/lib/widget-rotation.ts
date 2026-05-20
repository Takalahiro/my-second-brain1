/** 从 layout JSON 读取旋转角度（度） */
export function layoutRotation(s: Record<string, unknown> | null | undefined): number {
  return s && typeof s.r === 'number' ? s.r : 0;
}

/** 拼接到 widget 内联 style */
export function rotationStyle(deg: number, extra = ''): string {
  const rot = `transform: rotate(${deg}deg); transform-origin: center center;`;
  return extra ? `${extra} ${rot}` : rot;
}
