<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
  import { applyUiSkin, getStoredUiSkin } from '../../../features/ui/apply-ui';
  import { UI_SKINS } from '../../../features/ui/registry';
  import type { UiSkinId, UiSkinMeta } from '../../../features/ui/types';
  import { initLocale } from '../../../lib/i18n/locale.svelte';
  import type { Messages } from '../../../lib/i18n/messages/zh';

  interface Props {
    m: Messages['drawer'];
  }

  let { m }: Props = $props();

  let activeId = $state<UiSkinId>(getStoredUiSkin());

  const FALLBACK_NAMES: Record<UiSkinId, string> = {
    mac: 'Mac',
    glass: 'Glass',
    pixel: 'Pixel',
    hud: 'HUD',
    blueprint: 'Blueprint',
    scholar: 'Scholar',
    terminal: 'Terminal',
    crt: 'CRT',
    observatory: 'Observatory',
    herbarium: 'Herbarium',
    ink: 'Ink',
    rpg: 'RPG',
    spacecraft: 'Spacecraft',
  };

  onMount(() => {
    initLocale();
    activeId = getStoredUiSkin();
  });

  function skinName(skin: UiSkinMeta): string {
    const key = skin.nameKey as keyof typeof m;
    return (m[key] as string | undefined) ?? FALLBACK_NAMES[skin.id] ?? skin.id;
  }

  function skinDesc(skin: UiSkinMeta): string {
    const key = skin.descKey as keyof typeof m;
    return (m[key] as string | undefined) ?? skin.id;
  }

  function pick(id: UiSkinId) {
    activeId = id;
    applyUiSkin(id);
  }

  function previewStyle(skin: UiSkinMeta): string {
    if (skin.id === 'hud') {
      return `background: ${skin.preview}; background-size: 28px 28px, 12px 12px, 12px 12px, auto;`;
    }
    if (skin.id === 'blueprint') {
      return `background: ${skin.preview}; background-size: 24px 24px, 24px 24px;`;
    }
    return `background: ${skin.preview}`;
  }
</script>

<div class="pixel-drawer-pane">
  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.uiSwitch}</h3>
    <p class="pixel-drawer-section__hint">{m.uiSwitchHint}</p>
    <div class="pixel-ui-shelf" role="listbox" aria-label={m.uiSwitch}>
      {#each UI_SKINS as skin (skin.id)}
        <button
          type="button"
          class="pixel-ui-cart"
          data-active={activeId === skin.id}
          role="option"
          aria-selected={activeId === skin.id}
          onclick={() => pick(skin.id)}
        >
          <div class="pixel-ui-cart__label">
            <span class="pixel-ui-cart__icon"><PixelIcon name="gear" size={14} /></span>
            <span class="pixel-ui-cart__title">{skinName(skin)}</span>
          </div>
          <div class="pixel-ui-cart__screen" style={previewStyle(skin)}></div>
          <p class="pixel-ui-cart__desc">{skinDesc(skin)}</p>
          <div class="pixel-ui-cart__pins" aria-hidden="true"></div>
        </button>
      {/each}
    </div>
  </section>
</div>
