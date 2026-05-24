<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
  import { applyUiSkin, getStoredUiSkin, UI_SKINS, type UiSkinId } from '../index';
  import { isUiDebugEnabled, toggleUiDebug } from '../debug-ui';
  import { getMessages, initLocale } from '../../../lib/i18n/locale.svelte';

  let activeId = $state<UiSkinId>('mac');
  let debugOn = $state(false);

  const m = $derived(getMessages());

  onMount(() => {
    initLocale();
    activeId = getStoredUiSkin();
    debugOn = isUiDebugEnabled();
  });

  function pick(id: UiSkinId) {
    activeId = id;
    applyUiSkin(id);
  }

  function onDebugToggle() {
    debugOn = toggleUiDebug();
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
          style={skin.id === 'hud'
            ? `background: ${skin.preview}; background-size: 28px 28px, 12px 12px, 12px 12px, auto;`
            : `background: ${skin.preview}`}
          aria-hidden="true"
        >
          {#if skin.id === 'mac'}
            <span class="ui-demo-chrome ui-demo-chrome--mac">
              <span class="ui-demo-dots"><span></span><span></span><span></span></span>
              <span class="ui-demo-bar"></span>
            </span>
            <span class="ui-demo-icon"><PixelIcon name="puzzle" size={20} /></span>
          {:else if skin.id === 'glass'}
            <span class="ui-demo-chrome ui-demo-chrome--glass">
              <span class="ui-demo-glass-pane"></span>
            </span>
            <span class="ui-demo-icon"><PixelIcon name="palette" size={20} /></span>
          {:else if skin.id === 'hud'}
            <span class="ui-demo-chrome ui-demo-chrome--hud">
              <span class="ui-demo-hud-label">NAV</span>
              <span class="ui-demo-hud-panel">
                <span class="ui-demo-hud-ring" aria-hidden="true"></span>
                <span class="ui-demo-hud-patch" aria-hidden="true"></span>
              </span>
            </span>
            <span class="ui-demo-icon"><PixelIcon name="orbit" size={20} /></span>
          {:else}
            <span class="ui-demo-chrome ui-demo-chrome--pixel">
              <span class="ui-demo-pixel-block"></span>
              <span class="ui-demo-pixel-block"></span>
            </span>
            <span class="ui-demo-icon"><PixelIcon name="gear" size={20} /></span>
          {/if}
        </span>
        <span class="ui-skin-text">
          <span class="ui-skin-name">{m.drawer[skin.nameKey]}</span>
          <span class="ui-skin-desc">{m.drawer[skin.descKey]}</span>
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
    gap: 10px;
  }
  .ui-skin-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px;
    border: 1px solid var(--chrome-border);
    border-radius: var(--radius-small);
    background: var(--chrome-subtle);
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
  .ui-skin-preview {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 72px;
    overflow: hidden;
    border-radius: calc(var(--radius-small) - 2px);
    border: 1px solid var(--chrome-border);
  }
  .ui-skin-card--pixel .ui-skin-preview,
  .ui-skin-card--pixel .ui-demo-icon,
  .ui-skin-card--pixel .ui-demo-chrome--mac .ui-demo-bar,
  .ui-skin-card--pixel .ui-demo-chrome--glass .ui-demo-glass-pane {
    border-radius: 0;
  }
  .ui-skin-preview--glass {
    backdrop-filter: blur(12px) saturate(1.4);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
  }
  .ui-demo-chrome {
    position: absolute;
    inset: 10px 12px auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ui-demo-chrome--mac .ui-demo-dots {
    display: flex;
    gap: 5px;
  }
  .ui-demo-chrome--mac .ui-demo-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff5f57;
  }
  .ui-demo-chrome--mac .ui-demo-dots span:nth-child(2) { background: #febc2e; }
  .ui-demo-chrome--mac .ui-demo-dots span:nth-child(3) { background: #28c840; }
  .ui-demo-chrome--mac .ui-demo-bar {
    width: 72px;
    height: 8px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.75);
    box-shadow: 0 1px 0 rgb(255 255 255 / 0.9) inset;
  }
  .ui-demo-chrome--glass .ui-demo-glass-pane {
    width: 100%;
    height: 36px;
    border-radius: 14px;
    background: rgb(255 255 255 / 0.35);
    border: 1px solid rgb(255 255 255 / 0.55);
    box-shadow: 0 8px 24px rgb(80 120 200 / 0.15);
  }
  .ui-demo-chrome--pixel {
    flex-direction: row;
    gap: 6px;
  }
  .ui-demo-chrome--pixel .ui-demo-pixel-block {
    width: 22px;
    height: 22px;
    border: 2px solid #1a1c2c;
    background: #e0e8d8;
    box-shadow: 3px 3px 0 #1a1c2c;
  }
  .ui-demo-chrome--hud .ui-demo-hud-label {
    font-family: 'Barlow Condensed', 'IBM Plex Sans', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #c8102e;
    text-transform: uppercase;
  }
  .ui-demo-chrome--hud .ui-demo-hud-label::before { content: '[ '; }
  .ui-demo-chrome--hud .ui-demo-hud-label::after { content: ' ]'; }
  .ui-demo-hud-panel {
    position: relative;
    width: 100%;
    height: 28px;
    border: 1px solid #0f1f3d;
    background: rgb(245 242 235 / 0.92);
    overflow: hidden;
  }
  .ui-demo-hud-ring {
    position: absolute;
    right: -8px;
    bottom: -14px;
    width: 36px;
    height: 36px;
    border: 1px solid rgb(15 31 61 / 0.35);
    border-radius: 50%;
    box-shadow: 0 0 0 6px transparent, 0 0 0 7px rgb(15 31 61 / 0.12);
  }
  .ui-demo-hud-patch {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 14px;
    height: 14px;
    border: 1px solid #0f1f3d;
    border-radius: 50%;
    background:
      radial-gradient(circle at 35% 40%, #c8102e 2px, transparent 2.5px),
      radial-gradient(circle at 62% 58%, #0f1f3d 2.5px, transparent 3px);
  }
  .ui-demo-icon {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: var(--text-primary);
  }
  .ui-skin-card--mac .ui-demo-icon {
    border-radius: 10px;
    background: rgb(255 255 255 / 0.82);
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.1);
  }
  .ui-skin-card--glass .ui-demo-icon {
    border-radius: 12px;
    background: rgb(255 255 255 / 0.55);
    border: 1px solid rgb(26 39 68 / 0.14);
  }
  .ui-skin-card--pixel .ui-demo-icon {
    border-radius: 0;
    border: 2px solid #1a1c2c;
    background: #e8f0e0;
    box-shadow: 3px 3px 0 #1a1c2c;
  }
  .ui-skin-card--hud .ui-demo-icon {
    border-radius: 0;
    border: 1px solid #0f1f3d;
    background: rgb(245 242 235 / 0.94);
    box-shadow: none;
    color: #0f1f3d;
  }
  .ui-skin-preview--hud {
    border: 1px solid #0f1f3d;
    border-radius: 0;
    background-color: #f5f2eb;
  }
  .ui-skin-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .ui-skin-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--chrome-text);
  }
  .ui-skin-desc {
    font-size: 11px;
    line-height: 1.35;
    color: var(--chrome-text-muted);
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
