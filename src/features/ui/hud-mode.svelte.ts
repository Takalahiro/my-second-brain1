import { onMount } from 'svelte';

export const UI_SKIN_CHANGE_EVENT = 'second-brain:ui-skin-change';

export function isHudSkinActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.ui === 'hud';
}

export function isDarkThemeActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function subscribeThemeDom(onChange: () => void): () => void {
  window.addEventListener(UI_SKIN_CHANGE_EVENT, onChange);
  const obs = new MutationObserver(onChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-ui'] });
  return () => {
    window.removeEventListener(UI_SKIN_CHANGE_EVENT, onChange);
    obs.disconnect();
  };
}

export function subscribeHudMode(onChange: (active: boolean) => void): () => void {
  const sync = () => onChange(isHudSkinActive());
  sync();
  return subscribeThemeDom(sync);
}

export function useHudMode(): { readonly current: boolean } {
  let hudMode = $state(isHudSkinActive());
  onMount(() => subscribeHudMode((v) => { hudMode = v; }));
  return {
    get current() {
      return hudMode;
    },
  };
}

/** 图谱 HUD 主题：监听皮肤 + 深色切换 */
export function useGraphHudTheme() {
  let hud = $state(isHudSkinActive());
  let dark = $state(isDarkThemeActive());

  onMount(() => {
    const sync = () => {
      hud = isHudSkinActive();
      dark = document.documentElement.classList.contains('dark');
    };
    sync();
    return subscribeThemeDom(sync);
  });

  return {
    get hud() {
      return hud;
    },
    get dark() {
      return dark;
    },
    get cockpit() {
      return hud && dark;
    },
  };
}
