<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
  import { applyUiSkin, getStoredUiSkin } from '../apply-ui';
  import { UI_SKINS } from '../registry';
  import type { UiSkinId, UiSkinMeta } from '../types';
  import { isUiDebugEnabled, toggleUiDebug } from '../debug-ui';
  import { getMessages, initLocale } from '../../../lib/i18n/locale.svelte';

  let activeId = $state<UiSkinId>(getStoredUiSkin());
  let debugOn = $state(false);

  const m = $derived(getMessages());

  const PREVIEW_ICONS: Partial<Record<UiSkinId, 'puzzle' | 'palette' | 'gear' | 'orbit' | 'python'>> = {
    mac: 'puzzle',
    glass: 'palette',
    pixel: 'gear',
    hud: 'orbit',
    terminal: 'python',
  };

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
    debugOn = isUiDebugEnabled();
  });

  function skinName(skin: UiSkinMeta): string {
    const key = skin.nameKey as keyof typeof m.drawer;
    return (m.drawer[key] as string | undefined) ?? FALLBACK_NAMES[skin.id] ?? skin.id;
  }

  function skinDesc(skin: UiSkinMeta): string {
    const key = skin.descKey as keyof typeof m.drawer;
    return (m.drawer[key] as string | undefined) ?? skin.id;
  }

  function pick(id: UiSkinId) {
    activeId = id;
    applyUiSkin(id);
  }

  function onDebugToggle() {
    debugOn = toggleUiDebug();
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

<section class="ui-skin-picker">
  <p class="ui-skin-hint">{m.drawer.uiSwitchHint}</p>
  <div class="ui-skin-grid" role="listbox" aria-label={m.drawer.uiSwitch}>
    {#each UI_SKINS as skin (skin.id)}
      <button
        type="button"
        class="ui-skin-card ui-skin-card--{skin.id}"
        class:is-active={activeId === skin.id}
        role="option"
        aria-selected={activeId === skin.id}
        onclick={() => pick(skin.id)}
      >
        <span
          class="ui-skin-preview ui-skin-preview--{skin.id}"
          style={previewStyle(skin)}
          aria-hidden="true"
        >
          <span class="ui-demo-chip ui-demo-chip--{skin.id}"></span>
          <span class="ui-demo-icon">
            <PixelIcon name={PREVIEW_ICONS[skin.id] ?? 'gear'} size={18} />
          </span>
        </span>
        <span class="ui-skin-text">
          <span class="ui-skin-name">{skinName(skin)}</span>
          <span class="ui-skin-desc">{skinDesc(skin)}</span>
        </span>
      </button>
    {/each}
  </div>

  <label class="ui-debug-row">
    <span class="ui-debug-text">
      <span class="ui-label ui-skin-name">{m.drawer.uiDebug}</span>
      <span class="ui-annotation ui-skin-desc">{m.drawer.uiDebugSub}</span>
    </span>
    <span class="mac-toggle mac-toggle-inline">
      <input type="checkbox" checked={debugOn} onchange={onDebugToggle} aria-label={m.drawer.uiDebug} />
      <span></span>
    </span>
  </label>
</section>

<style>
  .ui-skin-picker {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }
  .ui-skin-hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--chrome-text-muted);
  }
  .ui-skin-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    min-height: 0;
  }
  @media (min-width: 360px) {
    .ui-skin-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .ui-skin-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 8px;
    border: 1px solid var(--chrome-border);
    border-radius: var(--radius-small);
    background: var(--chrome-subtle);
    color: var(--chrome-text);
    cursor: pointer;
    text-align: left;
    transition:
      border-color var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      transform var(--motion-fast) var(--motion-ease);
  }
  .ui-skin-card:hover {
    border-color: var(--chrome-active);
    box-shadow: var(--shadow-soft);
  }
  .ui-skin-card.is-active {
    border-color: var(--ui-accent, var(--chrome-active));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ui-accent, #007aff) 25%, transparent);
  }
  .ui-skin-preview {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    overflow: hidden;
    border-radius: calc(var(--radius-small) - 2px);
    border: 1px solid var(--chrome-border);
  }
  .ui-demo-chip {
    position: absolute;
    inset: 8px 10px auto;
    height: 10px;
    border-radius: 999px;
    opacity: 0.85;
  }
  :global(.ui-demo-chip--mac) { background: rgb(255 255 255 / 0.75); width: 48px; }
  :global(.ui-demo-chip--glass) { background: rgb(255 255 255 / 0.4); width: 100%; height: 28px; border-radius: 10px; inset: 8px; }
  :global(.ui-demo-chip--pixel) { background: #e0e8d8; width: 22px; height: 22px; border-radius: 0; border: 2px solid #1a1c2c; }
  :global(.ui-demo-chip--hud) { background: rgb(245 242 235 / 0.9); width: 100%; height: 20px; border-radius: 0; border: 1px solid #0f1f3d; inset: 8px; }
  :global(.ui-demo-chip--blueprint) { background: rgb(255 255 255 / 0.2); width: 100%; height: 100%; inset: 0; border-radius: 0; border: 1px dashed rgb(255 255 255 / 0.35); }
  :global(.ui-demo-chip--scholar) { background: rgb(139 90 43 / 0.12); width: 60%; border-radius: 50%; height: 24px; }
  :global(.ui-demo-chip--terminal) { background: rgb(0 255 65 / 0.15); width: 70%; height: 3px; box-shadow: 0 6px 0 rgb(0 255 65 / 0.1), 0 12px 0 rgb(0 255 65 / 0.08); }
  :global(.ui-demo-chip--crt) { background: rgb(255 176 0 / 0.25); width: 80%; height: 18px; box-shadow: 0 0 12px rgb(255 176 0 / 0.3); }
  :global(.ui-demo-chip--observatory) { background: rgb(232 197 71 / 0.35); width: 8px; height: 8px; border-radius: 50%; inset: auto; top: 12px; left: 16px; }
  :global(.ui-demo-chip--herbarium) { background: rgb(45 90 61 / 0.2); width: 55%; height: 22px; border: 1px solid rgb(45 90 61 / 0.25); }
  :global(.ui-demo-chip--ink) { background: rgb(192 57 43 / 0.2); width: 16px; height: 16px; border: 2px solid #c0392b; border-radius: 2px; inset: auto; top: 10px; right: 12px; transform: rotate(-8deg); }
  :global(.ui-demo-chip--rpg) { background: linear-gradient(90deg, #6495ed 42%, rgb(212 175 55 / 0.3) 42%); width: 100%; height: 4px; inset: 0 0 auto; border-radius: 0; }
  :global(.ui-demo-chip--spacecraft) { background: rgb(74 144 217 / 0.25); width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgb(74 144 217 / 0.35); inset: auto; top: 8px; right: 10px; }
  .ui-demo-icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--text-primary);
    border-radius: 8px;
    background: rgb(255 255 255 / 0.55);
    border: 1px solid rgb(0 0 0 / 0.06);
  }
  .ui-skin-card--pixel .ui-demo-icon,
  .ui-skin-card--hud .ui-demo-icon,
  .ui-skin-card--blueprint .ui-demo-icon,
  .ui-skin-card--terminal .ui-demo-icon,
  .ui-skin-card--crt .ui-demo-icon {
    border-radius: 0;
  }
  .ui-skin-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ui-skin-name {
    font-size: 12px;
    font-weight: 600;
    color: inherit;
    line-height: 1.25;
  }
  .ui-skin-desc {
    font-size: 10px;
    line-height: 1.35;
    color: var(--chrome-text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .ui-debug-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--chrome-border);
    border-radius: var(--radius-small);
    background: var(--chrome-subtle);
    cursor: pointer;
  }
  .ui-debug-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
</style>
