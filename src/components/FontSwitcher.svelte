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
