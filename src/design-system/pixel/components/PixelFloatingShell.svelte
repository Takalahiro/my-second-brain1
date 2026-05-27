<script lang="ts">
  import { onMount } from 'svelte';
  import PixelCloseX from './PixelCloseX.svelte';
  import ResizeHandles from '../../../components/widgets/ResizeHandles.svelte';
  import RotateHandle from '../../../components/widgets/RotateHandle.svelte';
  import { clampPosition } from '../../../lib/floating-widget-layout';
  import { widgetTouchGestures } from '../../../lib/widget-touch-gestures';
  import { rotationStyle } from '../../../lib/widget-rotation';
  import { clampPixelAlpha, loadPixelLayout, savePixelLayout } from '../lib/pixel-floating-layout';
  import {
    bringToFront,
    getZIndex,
    registerWidget,
    subscribePixelStack,
    unregisterWidget,
  } from '../lib/pixel-widget-stack';
  import { getPixelUi } from '../pixel-i18n';

  interface Props {
    layoutKey: string;
    title: string;
    subtitle?: string;
    defaultW?: number;
    defaultH?: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    defaultAlpha?: number;
    compact?: boolean;
    onClose?: () => void;
    children?: import('svelte').Snippet;
    settings?: import('svelte').Snippet;
  }

  let {
    layoutKey,
    title,
    subtitle = '',
    defaultW = 360,
    defaultH = 420,
    minW = 240,
    minH = 180,
    maxW = 1100,
    maxH = 900,
    defaultAlpha = 0.88,
    compact = false,
    onClose,
    children,
    settings,
  }: Props = $props();

  const ui = $derived(getPixelUi());

  let posX = $state(0);
  let posY = $state(0);
  let width = $state(defaultW);
  let height = $state(defaultH);
  let rotation = $state(0);
  let bgAlpha = $state(0.88);
  let zIndex = $state(90);
  let dragging = $state(false);
  let showSettings = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let rootEl: HTMLDivElement | null = null;
  let isResizing = false;
  let isRotating = false;

  function syncZ() {
    zIndex = getZIndex(layoutKey);
  }

  function clampPos() {
    const p = clampPosition(posX, posY, width, height);
    posX = p.x;
    posY = p.y;
  }

  function persist() {
    savePixelLayout(layoutKey, { x: posX, y: posY, w: width, h: height, r: rotation, a: bgAlpha });
  }

  function onAlphaInput(e: Event) {
    bgAlpha = clampPixelAlpha(Number((e.currentTarget as HTMLInputElement).value));
    persist();
  }

  function onHeaderDown(e: PointerEvent) {
    const t = e.target as HTMLElement;
    if (t.closest('[data-no-drag], button, input, select, textarea, label, a, .ctl-switch, .ctl-slider, .pixel-nes-window__settings')) {
      return;
    }
    bringToFront(layoutKey);
    syncZ();
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHeaderMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }

  function onHeaderUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    persist();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent) {
    onHeaderMove(e);
  }

  function onPointerUp(e: PointerEvent) {
    onHeaderUp(e);
  }

  function onResize(next: { x: number; y: number; w: number; h: number }) {
    if (!isResizing) {
      isResizing = true;
      bringToFront(layoutKey);
      syncZ();
    }
    posX = next.x;
    posY = next.y;
    width = next.w;
    height = next.h;
    clampPos();
  }

  function onResizeEnd() {
    isResizing = false;
    persist();
  }

  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  const touchOpts = $derived({
    disabled: () => false,
    minWidth: minW,
    minHeight: minH,
    maxWidth: maxW,
    maxHeight: maxH,
    getLayout: () => ({ x: posX, y: posY, w: width, h: height, r: rotation }),
    setLayout: (p: Partial<{ x: number; y: number; w: number; h: number; r: number }>) => {
      if (p.x !== undefined) posX = p.x;
      if (p.y !== undefined) posY = p.y;
      if (p.w !== undefined) width = p.w;
      if (p.h !== undefined) height = p.h;
      if (p.r !== undefined) rotation = p.r;
      clampPos();
    },
    onEnd: persist,
  });

  const frameTransform = $derived(rotationStyle(rotation));

  onMount(() => {
    registerWidget(layoutKey);
    const l = loadPixelLayout(layoutKey, defaultW, defaultH, minW, minH, maxW, maxH, defaultAlpha);
    posX = l.x;
    posY = l.y;
    width = l.w;
    height = l.h;
    rotation = l.r ?? 0;
    bgAlpha = l.a ?? defaultAlpha;
    syncZ();

    const offStack = subscribePixelStack(syncZ);
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);

    return () => {
      offStack();
      window.removeEventListener('resize', onResize);
      unregisterWidget(layoutKey);
    };
  });
</script>

<div
  bind:this={rootEl}
  class="pixel-nes-window-root"
  class:is-dragging={dragging}
  class:is-compact={compact}
  class:has-settings-open={showSettings}
  style="left:{posX}px;top:{posY}px;width:{width}px;height:{height}px;z-index:{zIndex};{frameTransform}"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <div class="pixel-nes-window" style="opacity:{bgAlpha}">
    <header
      class="pixel-nes-window__titlebar"
      onpointerdown={onHeaderDown}
      onpointermove={onHeaderMove}
      onpointerup={onHeaderUp}
      onpointercancel={onHeaderUp}
    >
      <span class="pixel-nes-window__icon" aria-hidden="true"></span>
      <div class="pixel-nes-window__titles">
        <h2 class="pixel-nes-window__title">{title}</h2>
        {#if subtitle}
          <span class="pixel-nes-window__subtitle">{subtitle}</span>
        {/if}
      </div>
      <div class="pixel-nes-window__actions" data-no-drag>
        <button
          type="button"
          class="pixel-nes-chrome-btn"
          class:is-active={showSettings}
          title={ui.settings}
          aria-label={ui.settings}
          aria-expanded={showSettings}
          onclick={() => { showSettings = !showSettings; }}
        >⚙</button>
        {#if onClose}
          <PixelCloseX variant="titlebar" onclick={onClose} />
        {/if}
      </div>
    </header>

    {#if showSettings}
      <div class="pixel-nes-window__settings" data-no-drag>
        <label class="pixel-nes-setting-row">
          <span class="pixel-nes-setting-row__label">{ui.windowOpacity}</span>
          <input
            type="range"
            class="pixel-nes-setting-row__range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={bgAlpha}
            oninput={onAlphaInput}
          />
          <span class="pixel-nes-setting-row__val">{Math.round(bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="pixel-nes-settings-extra">
            {@render settings()}
          </div>
        {/if}
      </div>
    {/if}

    <div class="pixel-nes-window__body">
      {@render children?.()}
    </div>
  </div>

  <ResizeHandles
    disabled={showSettings}
    width={width}
    height={height}
    x={posX}
    y={posY}
    minWidth={minW}
    minHeight={minH}
    maxWidth={maxW}
    maxHeight={maxH}
    onResize={onResize}
    onResizeEnd={onResizeEnd}
  />
  <RotateHandle
    disabled={showSettings}
    rotation={rotation}
    getCenter={widgetCenter}
    onRotate={(deg) => {
      if (!isRotating) {
        isRotating = true;
        bringToFront(layoutKey);
        syncZ();
      }
      rotation = deg;
    }}
    onRotateEnd={() => {
      isRotating = false;
      persist();
    }}
  />
</div>
