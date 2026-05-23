<script lang="ts">
  import { onMount } from 'svelte';
  import { getMessages, initLocale, localeState, toggleLocale } from '../lib/i18n/locale.svelte';

  onMount(() => {
    initLocale();
  });

  const label = $derived(localeState.current === 'zh' ? getMessages().locale.switchToEn : getMessages().locale.switchToZh);
</script>

<button
  type="button"
  class="locale-toggle"
  class:is-en={localeState.current === 'en'}
  onclick={toggleLocale}
  aria-label={getMessages().locale.aria}
  title={label}
>
  <span class="locale-toggle-track">
    <span class="locale-toggle-thumb"></span>
    <span class="locale-toggle-zh">中</span>
    <span class="locale-toggle-en">EN</span>
  </span>
</button>

<style>
  .locale-toggle {
    --h: 22px;
    --w: 44px;
    width: calc(var(--w) + 14px);
    height: calc(var(--h) + 14px);
    padding: 7px;
    border: 0;
    border-radius: 14px;
    background: var(--neo-surface);
    box-shadow: var(--neo-raised);
    cursor: pointer;
    flex-shrink: 0;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: box-shadow 0.25s ease, transform 0.18s ease;
  }
  .locale-toggle:hover {
    box-shadow: var(--neo-raised-hover);
  }
  .locale-toggle:active {
    transform: scale(0.96);
    box-shadow: var(--neo-pressed);
  }
  .locale-toggle-track {
    position: relative;
    display: block;
    width: var(--w);
    height: var(--h);
    border-radius: 999px;
    background: var(--neo-track);
    box-shadow: var(--neo-inset);
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: rgb(255 255 255 / 0.55);
  }
  .locale-toggle-zh,
  .locale-toggle-en {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    line-height: 1;
    pointer-events: none;
    transition: color 0.25s ease, opacity 0.25s ease;
  }
  .locale-toggle-zh {
    left: 7px;
  }
  .locale-toggle-en {
    right: 6px;
  }
  .locale-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--neo-thumb);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.22), inset 0 1px 0 rgb(255 255 255 / 0.85);
    transition: left 0.35s cubic-bezier(0.34, 1.15, 0.64, 1);
  }
  .locale-toggle.is-en .locale-toggle-thumb {
    left: calc(100% - 20px);
  }
  .locale-toggle:not(.is-en) .locale-toggle-zh {
    color: #fff;
    opacity: 1;
  }
  .locale-toggle.is-en .locale-toggle-en {
    color: #fff;
    opacity: 1;
  }
  :global(.dark) .locale-toggle {
    --neo-surface: #2a2634;
    --neo-track: #14121a;
    --neo-thumb: #ece8f4;
  }
</style>
