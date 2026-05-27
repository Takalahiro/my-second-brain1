<script lang="ts">
  import { onMount } from 'svelte';
  import SkinDrawerGlyph from '../components/SkinDrawerGlyph.svelte';
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

<div class="structural-drawer-pane">
  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.uiSwitch}</h3>
    <p class="structural-drawer-section__hint">{m.uiSwitchHint}</p>
    <div class="structural-ui-shelf" role="listbox" aria-label={m.uiSwitch}>
      {#each UI_SKINS as skin (skin.id)}
        <button
          type="button"
          class="structural-ui-cart"
          data-active={activeId === skin.id}
          role="option"
          aria-selected={activeId === skin.id}
          onclick={() => pick(skin.id)}
        >
          <div class="structural-ui-cart__label">
            <span class="structural-ui-cart__icon"><SkinDrawerGlyph name="gear" size={14} /></span>
            <span class="structural-ui-cart__title">{skinName(skin)}</span>
          </div>
          <div class="structural-ui-cart__screen" style={previewStyle(skin)}></div>
          <p class="structural-ui-cart__desc">{skinDesc(skin)}</p>
          <div class="structural-ui-cart__pins" aria-hidden="true"></div>
        </button>
      {/each}
    </div>
  </section>
</div>
