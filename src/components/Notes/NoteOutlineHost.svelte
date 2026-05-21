<script lang="ts">
  import type { MarkdownHeading } from 'astro';
  import { lockBodyScroll, unlockBodyScroll } from '../../lib/body-scroll-lock';
  import NoteOutline from './NoteOutline.svelte';

  interface Props {
    headings: MarkdownHeading[];
    /** sidebar = 桌面侧栏内联；mobile = 触屏浮动抽屉 */
    variant?: 'sidebar' | 'mobile';
  }

  let { headings, variant = 'sidebar' }: Props = $props();

  let drawerOpen = $state(false);

  function setDrawer(open: boolean) {
    drawerOpen = open;
    if (open) lockBodyScroll();
    else unlockBodyScroll();
  }

  function closeDrawer() {
    setDrawer(false);
  }

  $effect(() => {
    return () => {
      if (drawerOpen) unlockBodyScroll();
    };
  });
</script>

{#if headings.length > 0}
  {#if variant === 'sidebar'}
    <div class="outline-host-sidebar">
      <NoteOutline {headings} />
    </div>
  {:else}
    <button
      type="button"
      class="outline-fab pixel-button"
      aria-label="打开文章大纲"
      aria-expanded={drawerOpen}
      onclick={() => setDrawer(!drawerOpen)}
    >
      📋 大纲
    </button>

    {#if drawerOpen}
      <button
        type="button"
        class="outline-backdrop"
        aria-label="关闭大纲"
        onclick={closeDrawer}
      ></button>
      <aside class="outline-drawer pixel-card glass-container" aria-label="文章大纲">
        <header class="outline-drawer-head">
          <h3 class="outline-drawer-title">📋 大纲</h3>
          <button type="button" class="outline-close pixel-button" onclick={closeDrawer} aria-label="关闭">
            ✕
          </button>
        </header>
        <div class="outline-drawer-body">
          <NoteOutline {headings} onAfterNavigate={closeDrawer} />
        </div>
      </aside>
    {/if}
  {/if}
{/if}

<style>
  .outline-host-sidebar {
    min-height: 0;
  }

  .outline-fab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 12px);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
    z-index: 65;
    min-width: 56px;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 0.82rem;
    touch-action: manipulation;
    box-shadow: var(--shadow-normal);
  }

  .outline-backdrop {
    position: fixed;
    inset: 0;
    z-index: 66;
    border: none;
    padding: 0;
    background: rgb(0 0 0 / 0.42);
    touch-action: none;
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
  }

  .outline-drawer {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 4.5rem);
    right: max(env(safe-area-inset-right, 0px), 8px);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
    width: min(88vw, 320px);
    z-index: 67;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-width: var(--border-thin);
    touch-action: pan-y;
  }

  .outline-drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: var(--border-thin) solid var(--border-color);
    flex-shrink: 0;
  }
  .outline-drawer-title {
    margin: 0;
    font-size: 0.95rem;
  }
  .outline-close {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    touch-action: manipulation;
  }

  .outline-drawer-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 10px 12px 14px;
  }

  @media (min-width: 1024px) {
    .outline-fab,
    .outline-backdrop,
    .outline-drawer {
      display: none !important;
    }
  }
</style>
