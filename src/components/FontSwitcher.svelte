<script lang="ts">
  import { onMount } from 'svelte';
  import { getMessages, initLocale } from '../lib/i18n/locale.svelte';

  const KEY = 'second-brain:font-family';
  const OPTIONS = ['wenkai', 'inter', 'serif', 'plex', 'jp-pixel'] as const;
  type FontKey = (typeof OPTIONS)[number];

  let font = $state<FontKey>('wenkai');

  function apply(next: FontKey) {
    font = next;
    document.documentElement.setAttribute('data-font', next);
    localStorage.setItem(KEY, next);
  }

  onMount(() => {
    initLocale();
    const current = document.documentElement.getAttribute('data-font');
    const saved = localStorage.getItem(KEY);
    const next = ([saved, current].find((v) => OPTIONS.includes(v as FontKey)) ?? 'wenkai') as FontKey;
    apply(next);
  });

  const m = $derived(getMessages());
</script>

<label class="font-switcher" aria-label={m.font.label}>
  <span class="font-switcher-icon" aria-hidden="true">Aa</span>
  <select
    class="font-switcher-select"
    bind:value={font}
    onchange={(e) => apply((e.currentTarget as HTMLSelectElement).value as FontKey)}
  >
    <option value="wenkai">{m.font.wenkai}</option>
    <option value="inter">{m.font.inter}</option>
    <option value="serif">{m.font.serif}</option>
    <option value="plex">{m.font.plex}</option>
    <option value="jp-pixel">{m.font.jpPixel}</option>
  </select>
</label>

<style>
  .font-switcher {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    box-sizing: border-box;
    padding: 0 10px;
    border: 0;
    border-radius: 14px;
    background: var(--neo-surface);
    box-shadow: var(--neo-raised);
    transition: box-shadow 0.2s ease, transform 0.18s ease;
  }
  .font-switcher:hover {
    box-shadow: var(--neo-raised-hover);
  }
  .font-switcher:active {
    transform: scale(0.98);
    box-shadow: var(--neo-pressed);
  }
  .font-switcher-icon {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    user-select: none;
  }
  .font-switcher-select {
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.78rem;
    font-weight: 500;
    outline: none;
    min-width: 68px;
    cursor: pointer;
  }
  :global(.dark) .font-switcher-select option {
    background: #1e1b26;
    color: #ece8f4;
  }
  @media (max-width: 768px) {
    .font-switcher {
      height: 38px;
      padding: 0 8px;
      gap: 4px;
    }
    .font-switcher-select {
      min-width: 2.8rem;
      max-width: 3.6rem;
      font-size: 0.68rem;
    }
  }
</style>
