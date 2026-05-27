/** 从 CSS 自定义属性读取主题值（SSR 安全） */

export function readCssVar(name: string, fallback = '', root?: Element | null): string {
  if (typeof document === 'undefined') return fallback;
  const el = root ?? document.documentElement;
  const val = getComputedStyle(el).getPropertyValue(name).trim();
  return val || fallback;
}

export function readCssVarList(prefix: string, count: number, fallback: string[], root?: Element | null): string[] {
  return Array.from({ length: count }, (_, i) =>
    readCssVar(`${prefix}${i}`, fallback[i] ?? fallback[fallback.length - 1] ?? '#888', root),
  );
}
