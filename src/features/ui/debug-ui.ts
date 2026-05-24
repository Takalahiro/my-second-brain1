export const UI_DEBUG_STORAGE_KEY = 'second-brain:ui-debug';

export function isUiDebugEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(UI_DEBUG_STORAGE_KEY) === '1';
}

export function applyUiDebug(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('ui-debug', enabled);
  document.documentElement.classList.toggle('debug', enabled);
  localStorage.setItem(UI_DEBUG_STORAGE_KEY, enabled ? '1' : '0');
}

export function initUiDebug(): boolean {
  const enabled = isUiDebugEnabled();
  applyUiDebug(enabled);
  return enabled;
}

export function toggleUiDebug(): boolean {
  const next = !isUiDebugEnabled();
  applyUiDebug(next);
  return next;
}
