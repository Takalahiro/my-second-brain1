<script lang="ts">
  import { onMount } from 'svelte';

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
    const current = document.documentElement.getAttribute('data-font');
    const saved = localStorage.getItem(KEY);
    const next = ([saved, current].find((v) => OPTIONS.includes(v as FontKey)) ?? 'wenkai') as FontKey;
    apply(next);
  });
</script>

<label class="font-switcher" aria-label="字体切换">
  <span class="font-switcher-icon" aria-hidden="true">Aa</span>
  <select
    class="font-switcher-select"
    bind:value={font}
    onchange={(e) => apply((e.currentTarget as HTMLSelectElement).value as FontKey)}
  >
    <option value="wenkai">温楷</option>
    <option value="inter">Inter</option>
    <option value="serif">思源宋体</option>
    <option value="plex">Plex Sans</option>
    <option value="jp-pixel">日式像素</option>
  </select>
</label>

<style>
  .font-switcher {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: var(--border-thin) solid var(--border-color);
    border-radius: var(--radius-button);
    background: var(--glass-bg);
    box-shadow: var(--shadow-pixel);
  }
  .font-switcher-icon {
    font-family: 'Pixelify Sans', monospace;
    font-size: 0.8rem;
    color: var(--text-secondary);
    user-select: none;
  }
  .font-switcher-select {
    border: 0;
    background: transparent;
    color: var(--text-primary);
    font-size: 0.8rem;
    outline: none;
    min-width: 70px;
    cursor: pointer;
  }
  :global(.dark) .font-switcher {
    background: #2a2138;
    border-color: #594d73;
  }
  :global(.dark) .font-switcher-icon {
    color: #c5b9df;
  }
</style>
