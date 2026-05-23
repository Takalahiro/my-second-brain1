<script lang="ts">
  import { untrack, onMount } from 'svelte';
  import type { MarkdownHeading } from 'astro';
  import { lockBodyScroll, unlockBodyScroll } from '../../lib/body-scroll-lock';
  import { clampFabPosition, loadFabPosition, saveFabPosition } from '../../lib/draggable-fab';
  import PixelIcon from '../PixelIcon.svelte';
  import NoteOutline from './NoteOutline.svelte';
  import { getMessages, initLocale } from '../../lib/i18n/locale.svelte';

  interface Props {
    headings: MarkdownHeading[];
    // sidebar = 桌面侧栏内联；mobile = 手机浮动抽屉
    variant?: 'sidebar' | 'mobile';
  }

  let { headings, variant = 'sidebar' }: Props = $props();

  let drawerOpen = $state(false);

  const FAB_POS_KEY = 'second-brain:outline-fab-pos';
  let fabEl = $state<HTMLButtonElement | null>(null);
  let fabLeft = $state(0);
  let fabTop = $state(0);
  let fabReady = $state(false);
  let fabDragging = $state(false);
  let fabDidMove = false;
  let fabSuppressClick = false;
  let fabStartX = 0;
  let fabStartY = 0;
  let fabStartLeft = 0;
  let fabStartTop = 0;

  function defaultFabPos() {
    const w = fabEl?.offsetWidth ?? 56;
    const h = fabEl?.offsetHeight ?? 44;
    return clampFabPosition(12, Math.max(80, window.innerHeight - h - 64), w, h);
  }

  function initFabPos() {
    const stored = untrack(() => loadFabPosition(FAB_POS_KEY));
    if (stored) {
      const c = clampFabPosition(stored.left, stored.top, fabEl?.offsetWidth ?? 56, fabEl?.offsetHeight ?? 44);
      fabLeft = c.left;
      fabTop = c.top;
    } else {
      const c = defaultFabPos();
      fabLeft = c.left;
      fabTop = c.top;
    }
    fabReady = true;
  }

  function onFabResize() {
    if (!fabReady) return;
    const c = clampFabPosition(fabLeft, fabTop, fabEl?.offsetWidth ?? 56, fabEl?.offsetHeight ?? 44);
    if (c.left !== fabLeft || c.top !== fabTop) {
      fabLeft = c.left;
      fabTop = c.top;
      saveFabPosition(FAB_POS_KEY, fabLeft, fabTop);
    }
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', onFabResize, { passive: true });
    return () => window.removeEventListener('resize', onFabResize);
  });

  $effect(() => {
    if (fabEl && !fabReady) initFabPos();
  });

  function onFabPointerDown(e: PointerEvent) {
    if (e.button !== 0 || !fabEl) return;
    fabDragging = true;
    fabDidMove = false;
    fabStartX = e.clientX;
    fabStartY = e.clientY;
    fabStartLeft = fabLeft;
    fabStartTop = fabTop;
    try {
      fabEl.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onFabPointerMove(e: PointerEvent) {
    if (!fabDragging) return;
    const dx = e.clientX - fabStartX;
    const dy = e.clientY - fabStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      fabDidMove = true;
      e.preventDefault?.();
    }
    if (!fabDidMove) return;
    const c = clampFabPosition(
      fabStartLeft + dx,
      fabStartTop + dy,
      fabEl?.offsetWidth ?? 56,
      fabEl?.offsetHeight ?? 44,
    );
    fabLeft = c.left;
    fabTop = c.top;
  }

  function onFabPointerUp(e: PointerEvent) {
    if (!fabDragging || !fabEl) return;
    fabDragging = false;
    try {
      fabEl.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    saveFabPosition(FAB_POS_KEY, fabLeft, fabTop);
    if (fabDidMove) fabSuppressClick = true;
  }

  function toggleDrawer() {
    if (fabSuppressClick) {
      fabSuppressClick = false;
      return;
    }
    setDrawer(!drawerOpen);
  }

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

  onMount(() => initLocale());
  const m = $derived(getMessages());
</script>

{#if headings.length > 0}
  {#if variant === 'sidebar'}
    <div class="outline-host-sidebar">
      <NoteOutline {headings} />
    </div>
  {:else}
    <button
      type="button"
      bind:this={fabEl}
      class="outline-fab pixel-button"
      class:is-ready={fabReady}
      class:is-dragging={fabDragging}
      style:left={fabReady ? `${fabLeft}px` : undefined}
      style:top={fabReady ? `${fabTop}px` : undefined}
      aria-label={m.notes.outlineOpen}
      aria-expanded={drawerOpen}
      title={m.notes.outlineDrag}
      onpointerdown={onFabPointerDown}
      onpointermove={onFabPointerMove}
      onpointerup={onFabPointerUp}
      onpointercancel={onFabPointerUp}
      onclick={toggleDrawer}
    >
      <PixelIcon name="list" size={16} /> {m.notes.outline}
    </button>

    {#if drawerOpen}
      <button
        type="button"
        class="outline-backdrop"
        aria-label={m.notes.outlineClose}
        onclick={closeDrawer}
      ></button>
      <aside class="outline-drawer pixel-card glass-container" aria-label={m.notes.outlineArticle}>
        <header class="outline-drawer-head">
          <h3 class="outline-drawer-title"><PixelIcon name="list" size={16} /> {m.notes.outline}</h3>
          <button type="button" class="outline-close pixel-button" onclick={closeDrawer} aria-label={m.notes.outlineClose}>
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
    gap: 0.35rem;
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 12px);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
    z-index: 65;
    min-width: 56px;
    min-height: 44px;
    padding: 10px 14px;
    font-size: 0.82rem;
    touch-action: none;
    user-select: none;
    cursor: grab;
    box-shadow: var(--shadow-normal);
    transition: box-shadow 0.15s, transform 0.15s;
  }
  .outline-fab.is-ready {
    bottom: auto;
  }
  .outline-fab.is-dragging {
    cursor: grabbing;
    box-shadow: var(--shadow-hover);
    transition: none;
  }
  .outline-fab:hover:not(.is-dragging) {
    transform: scale(1.03);
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
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
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
