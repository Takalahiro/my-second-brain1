<script lang="ts">
  import { onMount } from 'svelte';
  import { SITE_NAV_LINKS } from '../../lib/site-nav';
  import PixelIcon from '../PixelIcon.svelte';

  interface Props {
    controlCenterOpen?: boolean;
    onOpenControlCenter?: () => void;
    onOpenManual?: () => void;
  }

  let {
    controlCenterOpen = false,
    onOpenControlCenter,
    onOpenManual,
  }: Props = $props();

  let show = $state(false);

  const dockLinks = SITE_NAV_LINKS.filter((l) =>
    ['/notes', '/python', '/graph'].includes(l.href),
  );

  onMount(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => {
      show = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
</script>

{#if show}
  <nav class="mobile-home-dock" aria-label="主界面快捷操作">
    <div class="dock-inner glass-container">
      {#each dockLinks as item (item.href)}
        <a href={item.href} class="dock-link" title={item.title}>
          <span class="dock-icon" aria-hidden="true">
            {#if item.icon}<PixelIcon name={item.icon} size={18} />{:else}·{/if}
          </span>
          <span class="dock-label">{item.label}</span>
        </a>
      {/each}
      <button
        type="button"
        class="dock-link"
        title="使用说明"
        aria-label="使用说明"
        onclick={() => onOpenManual?.()}
      >
        <span class="dock-icon" aria-hidden="true"><PixelIcon name="book" size={18} /></span>
        <span class="dock-label">说明</span>
      </button>
      <button
        type="button"
        class="dock-link"
        class:is-active={controlCenterOpen}
        title="控制中心"
        aria-label={controlCenterOpen ? '关闭控制中心' : '打开控制中心'}
        aria-pressed={controlCenterOpen}
        onclick={() => onOpenControlCenter?.()}
      >
        <span class="dock-icon" aria-hidden="true"><PixelIcon name="gear" size={18} /></span>
        <span class="dock-label">组件</span>
      </button>
    </div>
  </nav>
{/if}

<style>
  .mobile-home-dock {
    position: fixed;
    z-index: 115;
    left: max(env(safe-area-inset-left, 0px), 10px);
    right: max(env(safe-area-inset-right, 0px), 10px);
    bottom: max(env(safe-area-inset-bottom, 0px), 10px);
    pointer-events: none;
  }

  .dock-inner {
    pointer-events: auto;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 20px;
    border: 1px solid var(--chrome-border);
    background: var(--glass-bg-strong);
    backdrop-filter: blur(22px) saturate(160%);
    -webkit-backdrop-filter: blur(22px) saturate(160%);
    box-shadow: var(--shadow-normal);
  }

  .dock-link {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    padding: 4px 2px;
    border: 0;
    border-radius: 14px;
    background: transparent;
    color: var(--chrome-text);
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease, transform 0.12s ease;
  }

  .dock-link:active {
    transform: scale(0.96);
    background: var(--chrome-active);
  }

  .dock-link.is-active {
    background: rgb(180 140 255 / 0.22);
    box-shadow: inset 0 0 0 1px rgb(180 140 255 / 0.28);
  }

  .dock-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .dock-label {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    opacity: 0.92;
  }
</style>
