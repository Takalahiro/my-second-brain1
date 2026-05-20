<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import {
    readLayout,
    writeLayout,
    defaultPosition,
    clampPosition,
    clamp,
  } from '../../lib/floating-widget-layout';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';

  interface Props {
    layoutKey: string;
    ariaLabel: string;
    title: string;
    icon?: string;
    href?: string;
    className?: string;
    zIndex?: number;
    defaultWidth: number;
    defaultHeight: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    defaultOffsetX?: number;
    defaultOffsetY?: number;
    aspectLock?: boolean;
    onClose?: () => void;
    /** 窗口状态（最小化/最大化等）由父组件持久化时可传入 */
    minimized?: boolean;
    maximized?: boolean;
    onMinimize?: () => void;
    onMaximize?: () => void;
    headerExtra?: Snippet;
    children: Snippet;
  }

  let {
    layoutKey,
    ariaLabel,
    title,
    icon = '',
    href,
    className = '',
    zIndex = 38,
    defaultWidth,
    defaultHeight,
    minWidth = 260,
    minHeight = 200,
    maxWidth = 1400,
    maxHeight = 1100,
    defaultOffsetX = 80,
    defaultOffsetY = 120,
    aspectLock = false,
    onClose,
    minimized = false,
    maximized = false,
    onMinimize,
    onMaximize,
    headerExtra,
    children,
  }: Props = $props();

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(defaultWidth);
  let height = $state(defaultHeight);
  let rotation = $state(0);
  let rootEl: HTMLElement | null = null;
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  onMount(() => {
    const layout = readLayout(layoutKey, {
      w: defaultWidth,
      h: defaultHeight,
      minW: minWidth,
      minH: minHeight,
      maxW: maxWidth,
      maxH: maxHeight,
    });
    width = layout.w;
    height = layout.h;
    rotation = layout.r ?? 0;
    if (layout.posUnset) {
      const p = defaultPosition(layout.w, layout.h, defaultOffsetX, defaultOffsetY);
      posX = p.x;
      posY = p.y;
    } else {
      posX = layout.x;
      posY = layout.y;
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  function clampPos() {
    const p = clampPosition(posX, posY, width);
    posX = p.x;
    posY = p.y;
  }

  function persistLayout() {
    writeLayout(layoutKey, { x: posX, y: posY, w: width, h: height, r: rotation });
  }

  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, textarea, a, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x;
    posY = y;
    width = w;
    height = h;
    clampPos();
  }

  const frameStyle = $derived.by(() => {
    if (maximized) return `transform: rotate(${rotation}deg); transform-origin: center center;`;
    const pos = `left:${posX}px;top:${posY}px;width:${width}px;height:${minimized ? 'auto' : height + 'px'};`;
    return `${pos} transform: rotate(${rotation}deg); transform-origin: center center;`;
  });

  const touchOpts = $derived({
    disabled: () => maximized || minimized,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    getLayout: () => ({ x: posX, y: posY, w: width, h: height, r: rotation }),
    setLayout: (p: Partial<{ x: number; y: number; w: number; h: number; r: number }>) => {
      if (p.x !== undefined) posX = p.x;
      if (p.y !== undefined) posY = p.y;
      if (p.w !== undefined) width = p.w;
      if (p.h !== undefined) height = p.h;
      if (p.r !== undefined) rotation = p.r;
      clampPos();
    },
    onEnd: persistLayout,
  });
</script>

<section
  bind:this={rootEl}
  class="floating-widget {className} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style="{frameStyle}; z-index: {zIndex};"
  aria-label={ariaLabel}
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="fw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome
      onClose={() => onClose?.()}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      maximized={maximized}
    />
    <span class="fw-title">
      {#if icon}<span aria-hidden="true">{icon}</span>{/if}
      {title}
    </span>
    {#if headerExtra}
      {@render headerExtra()}
    {/if}
    {#if href}
      <a {href} class="fw-link" data-no-drag title="全屏打开">↗</a>
    {/if}
  </header>

  {#if !minimized}
    <div class="fw-body" data-no-drag>
      {@render children()}
    </div>
    <ResizeHandles
      {width}
      {height}
      x={posX}
      y={posY}
      {minWidth}
      {minHeight}
      {maxWidth}
      {maxHeight}
      disabled={maximized}
      {aspectLock}
      onResize={onResize}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      rotation={rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .floating-widget {
    position: fixed;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    background: rgb(20 16 32 / 0.78);
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.42);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    overflow: hidden;
    color: #f3ecff;
  }
  .floating-widget.is-maximized {
    left: 24px !important;
    top: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    width: auto !important;
    height: auto !important;
  }
  .fw-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    cursor: grab;
    background: rgb(0 0 0 / 0.18);
    flex-shrink: 0;
  }
  .floating-widget.is-active-drag .fw-header {
    cursor: grabbing;
  }
  .fw-title {
    font-size: 0.78rem;
    font-weight: 600;
    color: rgb(255 255 255 / 0.75);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .fw-link {
    margin-left: auto;
    color: #c2b3df;
    text-decoration: none;
    font-size: 0.85rem;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgb(255 255 255 / 0.08);
  }
  .fw-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    position: relative;
    touch-action: pan-y;
  }
</style>
