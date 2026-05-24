import { onMount } from 'svelte';
import { UI_SKIN_CHANGE_EVENT } from './hud-mode.svelte';
import { getSkinChrome, isImmersiveSkin, type SkinChromeProfile } from './skin-chrome';
import type { UiSkinId } from './types';

function readSkinId(): UiSkinId {
  if (typeof document === 'undefined') return 'mac';
  const id = document.documentElement.dataset.ui;
  if (id) return id as UiSkinId;
  return 'mac';
}

export function useSkinChrome(): {
  readonly id: UiSkinId;
  readonly profile: SkinChromeProfile;
  readonly immersive: boolean;
  readonly canvasWallpaper: boolean;
} {
  let id = $state<UiSkinId>(readSkinId());
  let profile = $derived(getSkinChrome(id));

  onMount(() => {
    const sync = () => {
      id = readSkinId();
    };
    sync();
    window.addEventListener(UI_SKIN_CHANGE_EVENT, sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui'] });
    return () => {
      window.removeEventListener(UI_SKIN_CHANGE_EVENT, sync);
      obs.disconnect();
    };
  });

  return {
    get id() {
      return id;
    },
    get profile() {
      return profile;
    },
    get immersive() {
      return isImmersiveSkin(id);
    },
    get canvasWallpaper() {
      return profile.canvasWallpaper;
    },
  };
}
