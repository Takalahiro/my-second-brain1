<script lang="ts">
  import { onMount } from 'svelte';

  const KEY = 'second-brain:mobile-view-mode';
  const READ_CLASS = 'mobile-reading';
  const MQ = '(max-width: 768px)';

  let isMobile = $state(false);
  let reading = $state(false);
  let ready = $state(false);

  function applyMode(nextReading: boolean) {
    reading = nextReading;
    const html = document.documentElement;
    html.classList.toggle(READ_CLASS, nextReading);
    localStorage.setItem(KEY, nextReading ? 'reading' : 'compact');
  }

  function toggleMode() {
    applyMode(!reading);
  }

  onMount(() => {
    const mql = window.matchMedia(MQ);
    isMobile = mql.matches;

    const saved = localStorage.getItem(KEY);
    applyMode(saved === 'reading');
    ready = true;

    const onChange = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
    };

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // @ts-expect-error legacy Safari
    mql.addListener(onChange);
    return () => {
      // @ts-expect-error legacy Safari
      mql.removeListener(onChange);
    };
  });
</script>

{#if ready && isMobile}
  <button
    type="button"
    class="pixel-button mobile-mode-toggle"
    onclick={toggleMode}
    aria-label="切换移动端阅读模式"
    title={reading ? '当前：阅读模式' : '当前：紧凑模式'}
  >
    {reading ? '阅读' : '紧凑'}
  </button>
{/if}

<style>
  .mobile-mode-toggle {
    position: fixed;
    right: 10px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
    z-index: 70;
    min-width: 62px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1;
    background: var(--bg-secondary);
    border-color: var(--border-color);
    box-shadow: var(--shadow-normal);
  }
  .mobile-mode-toggle:hover {
    box-shadow: var(--shadow-hover);
  }
</style>
