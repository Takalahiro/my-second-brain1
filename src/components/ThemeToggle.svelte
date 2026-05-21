<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggle() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
</script>

<button
  type="button"
  class="theme-switch"
  class:is-dark={isDark}
  onclick={toggle}
  role="switch"
  aria-checked={isDark}
  aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
  title={isDark ? '浅色模式' : '深色模式'}
>
  <span class="theme-switch-shell">
    <span class="theme-switch-track">
      <svg class="theme-switch-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 13.5A7.5 7.5 0 0 1 10.5 5 6.5 6.5 0 1 0 19 13.5Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="theme-switch-thumb">
        <svg class="theme-switch-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6" />
          <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
            <line x1="12" y1="3.5" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="20.5" />
            <line x1="3.5" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="20.5" y2="12" />
            <line x1="5.8" y1="5.8" x2="7.6" y2="7.6" />
            <line x1="16.4" y1="16.4" x2="18.2" y2="18.2" />
            <line x1="16.4" y1="7.6" x2="18.2" y2="5.8" />
            <line x1="5.8" y1="18.2" x2="7.6" y2="16.4" />
          </g>
        </svg>
      </span>
    </span>
  </span>
</button>

<style>
  .theme-switch {
    --switch-size: 42px;
    --track-h: 22px;
    --thumb: 18px;
    width: var(--switch-size);
    height: var(--switch-size);
    min-width: var(--switch-size);
    padding: 0;
    border: 0;
    border-radius: 14px;
    background: var(--neo-surface);
    box-shadow: var(--neo-raised);
    cursor: pointer;
    flex-shrink: 0;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      box-shadow 0.25s ease,
      transform 0.18s ease;
  }
  .theme-switch:hover {
    box-shadow: var(--neo-raised-hover);
  }
  .theme-switch:active {
    transform: scale(0.96);
    box-shadow: var(--neo-pressed);
  }
  .theme-switch-shell {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 7px;
    box-sizing: border-box;
  }
  .theme-switch-track {
    position: relative;
    width: 100%;
    height: var(--track-h);
    border-radius: 999px;
    background: var(--neo-track);
    box-shadow: var(--neo-inset);
    overflow: hidden;
  }
  .theme-switch-moon {
    position: absolute;
    left: 7px;
    top: 50%;
    width: 11px;
    height: 11px;
    transform: translateY(-50%);
    color: rgb(255 255 255 / 0.72);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.15, 0.64, 1);
  }
  .theme-switch-thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    width: var(--thumb);
    height: var(--thumb);
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--neo-thumb);
    box-shadow:
      0 2px 6px rgb(0 0 0 / 0.22),
      inset 0 1px 0 rgb(255 255 255 / 0.85);
    display: grid;
    place-items: center;
    transition: left 0.38s cubic-bezier(0.34, 1.15, 0.64, 1);
  }
  .theme-switch:not(.is-dark) .theme-switch-thumb {
    left: calc(100% - var(--thumb) - 2px);
  }
  .theme-switch.is-dark .theme-switch-moon {
    opacity: 0.35;
    transform: translateY(-50%) scale(0.88);
  }
  .theme-switch-sun {
    width: 13px;
    height: 13px;
    color: #5a5a62;
    transition: transform 0.38s cubic-bezier(0.34, 1.15, 0.64, 1);
  }
  .theme-switch.is-dark .theme-switch-sun {
    transform: rotate(-28deg) scale(0.92);
    opacity: 0.55;
  }
  :global(.dark) .theme-switch {
    --neo-surface: #2a2634;
    --neo-track: #14121a;
    --neo-thumb: #ece8f4;
  }
  :global(.dark) .theme-switch-sun {
    color: #6b6578;
  }
</style>
