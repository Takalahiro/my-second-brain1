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
    height: 38px;
    box-sizing: border-box;
    padding: 0 8px;
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
    background: #15101e;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 4px 10px rgba(0, 0, 0, 0.35);
  }
  :global(.dark) .font-switcher-icon {
    color: #b3a4d4;
  }
  :global(.dark) .font-switcher-select {
    color: #ece4ff;
  }
  /* 下拉项在深色模式下保持深底浅字（Edge/Chrome/Firefox 都支持） */
  :global(.dark) .font-switcher-select option {
    background: #15101e;
    color: #ece4ff;
  }
  @media (max-width: 768px) {
    .font-switcher {
      padding: 0 6px;
      gap: 3px;
      min-width: 38px;
    }
    .font-switcher-icon {
      font-size: 0.72rem;
    }
    .font-switcher-select {
      min-width: 2.8rem;
      max-width: 3.6rem;
      font-size: 0.68rem;
      padding: 0;
    }
  }
</style>
