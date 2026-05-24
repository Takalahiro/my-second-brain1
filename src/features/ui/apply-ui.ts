import { DEFAULT_UI_SKIN, isUiSkinId, UI_STORAGE_KEY } from './registry';
import type { UiSkinId } from './types';
import { UI_SKIN_CHANGE_EVENT } from './hud-mode.svelte';

export function getStoredUiSkin(): UiSkinId {
  if (typeof localStorage === 'undefined') return DEFAULT_UI_SKIN;
  const stored = localStorage.getItem(UI_STORAGE_KEY);
  return isUiSkinId(stored) ? stored : DEFAULT_UI_SKIN;
}

export function applyUiSkin(id: UiSkinId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-ui', id);
  localStorage.setItem(UI_STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(UI_SKIN_CHANGE_EVENT, { detail: id }));
}

export function initUiSkin(): UiSkinId {
  const id = getStoredUiSkin();
  applyUiSkin(id);
  return id;
}
