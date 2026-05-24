import { DEFAULT_UI_SKIN, isUiSkinId, UI_STORAGE_KEY } from './registry';
import type { UiSkinId } from './types';
import { UI_SKIN_CHANGE_EVENT } from './hud-mode.svelte';
import { initSkinEffects, teardownSkinEffects } from './skin-effects';
import { invalidateWidgetSafeZoneCache } from '../../lib/floating-widget-layout';
import { getSkinChrome, isImmersiveSkin } from './skin-chrome';

export function getStoredUiSkin(): UiSkinId {
  if (typeof localStorage === 'undefined') return DEFAULT_UI_SKIN;
  const stored = localStorage.getItem(UI_STORAGE_KEY);
  return isUiSkinId(stored) ? stored : DEFAULT_UI_SKIN;
}

function applySkinChromeVars(id: UiSkinId): void {
  const profile = getSkinChrome(id);
  const root = document.documentElement;
  root.toggleAttribute('data-ui-immersive', isImmersiveSkin(id));
  root.toggleAttribute('data-skin-wallpaper', profile.immersive && profile.canvasWallpaper);
  root.style.setProperty('--skin-strip-h', `${profile.statusStripHeight}px`);
  root.style.setProperty('--skin-menu-h', `${profile.menuBarHeight}px`);
  root.style.setProperty(
    '--cc-anchor-top',
    profile.immersive
      ? `calc(${profile.statusStripHeight}px + ${profile.menuBarHeight}px + max(env(safe-area-inset-top, 0px), 4px))`
      : `max(env(safe-area-inset-top, 0px), 58px)`,
  );
  root.style.setProperty(
    '--desktop-stage-top',
    profile.immersive
      ? `calc(${profile.statusStripHeight}px + ${profile.menuBarHeight}px + max(env(safe-area-inset-top, 0px), 4px))`
      : `calc(max(env(safe-area-inset-top, 0px), 12px) + 44px)`,
  );
  root.style.setProperty(
    '--widget-safe-top',
    profile.immersive
      ? `calc(${profile.statusStripHeight}px + ${profile.menuBarHeight}px + max(env(safe-area-inset-top, 0px), 8px) + 8px)`
      : `calc(max(env(safe-area-inset-top, 0px), 8px) + 52px + 8px)`,
  );
  invalidateWidgetSafeZoneCache();
}

export function applyUiSkin(id: UiSkinId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-ui', id);
  applySkinChromeVars(id);
  localStorage.setItem(UI_STORAGE_KEY, id);
  teardownSkinEffects();
  initSkinEffects(id);
  window.dispatchEvent(new CustomEvent(UI_SKIN_CHANGE_EVENT, { detail: id }));
}

export function initUiSkin(): UiSkinId {
  const id = getStoredUiSkin();
  applyUiSkin(id);
  return id;
}
