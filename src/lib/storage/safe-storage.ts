/**
 * 统一 localStorage 读写：SSR 安全、JSON 容错、损坏时回退默认值。
 * 大数据请用 IndexedDB（见 ./idb.ts）；此处只放设置类小状态。
 */

export function canUseLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const k = '__sb_ls_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function lsGet(key: string): string | null {
  if (!canUseLocalStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function lsSet(key: string, value: string): boolean {
  if (!canUseLocalStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function lsRemove(key: string): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** 解析 JSON；失败或校验不通过时返回 fallback，并可选择清除损坏数据 */
export function lsGetJson<T>(
  key: string,
  fallback: T,
  opts?: { validate?: (v: unknown) => v is T; clearOnBad?: boolean },
): T {
  const raw = lsGet(key);
  if (raw == null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (opts?.validate && !opts.validate(parsed)) {
      if (opts.clearOnBad !== false) lsRemove(key);
      return fallback;
    }
    return parsed as T;
  } catch {
    if (opts?.clearOnBad !== false) lsRemove(key);
    return fallback;
  }
}

export function lsSetJson(key: string, value: unknown): boolean {
  try {
    return lsSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
