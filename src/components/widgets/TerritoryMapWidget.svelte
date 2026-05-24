<script lang="ts">
  import { clampPosition, spawnPosition } from '../../lib/floating-widget-layout';
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import TerritoryMapCanvas from '../graph/TerritoryMapCanvas.svelte';
  import { loadWiki, watchWikiRefresh, type WikiData } from '../graph/graph-data';
  import { getWidgetTier, tierClass, TIER_LABEL } from '../../lib/widget-size-tier';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import PixelIcon from '../PixelIcon.svelte';
  import { WIDGET_ICON_MAP } from '../../lib/pixel-icons';
  import { starCoords } from '../../lib/hud-widget-ui';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  const LAYOUT_KEY = 'second-brain:territory-layout';

  let data = $state<WikiData | null>(null);
  let loadErr = $state<string | null>(null);
  let selectedPath = $state<string | null>(null);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(720);
  let height = $state(520);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let minimized = $state(false);
  let maximized = $state(false);

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  onMount(() => {
    void load();
    const stopWatch = watchWikiRefresh((d) => {
      data = d;
    });
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 380, 1400);
        if (typeof s.h === 'number') height = clamp(s.h, 320, 1100);
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        rotation = layoutRotation(s);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      const sp = spawnPosition(width, height);
      posX = sp.x;
      posY = sp.y;
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => {
      stopWatch();
      window.removeEventListener('resize', onResize);
    };
  });

  const tier = $derived(getWidgetTier({ width, height, minimized, maximized }));
  const starHud = $derived(starCoords((selectedPath ?? 'vault').split('').reduce((a, c) => a + c.charCodeAt(0), 0)));

  async function load() {
    try {
      data = await loadWiki();
    } catch {
      loadErr = '尚未生成 wikilinks.json，请运行 pnpm prepare:vault';
    }
  }

  function persistLayout() {
    try {
      localStorage.setItem(
        LAYOUT_KEY,
        JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation, minimized, maximized }),
      );
    } catch {}
  }

  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
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
  function onResizeCb({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x;
    posY = y;
    width = w;
    height = h;
    clampPos();
  }
  function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }
  function doMinimize() {
    minimized = !minimized;
    if (minimized) maximized = false;
    persistLayout();
  }
  function doMaximize() {
    maximized = !maximized;
    if (maximized) minimized = false;
    persistLayout();
  }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 380, minHeight: 320, maxWidth: 1400, maxHeight: 1100 },
    ),
  );
</script>

<section
  bind:this={rootEl}
  class="territory-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(
    rotation,
    (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) ,
  )}
  aria-label="文件夹地图"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="tw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="tw-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.territory} size={14} /></span>
      <span>文件夹地图</span>
    </div>
    <span class="tw-sub" data-no-drag>{TIER_LABEL[tier]} · 国家 · 州 · 城市 · 孤岛</span>
    <a href="/graph" class="tw-link" data-no-drag title="打开完整图谱页">↗</a>
  </header>

  {#if !minimized}
    <div class="tw-body" data-no-drag>
      <div class="tw-star-hud hud-readout" aria-hidden="true">
          <div>[ STAR CHART ]</div>
          <div>RA · {starHud.ra}</div>
          <div>DEC · {starHud.dec}</div>
          <div>SEC · {starHud.sector}</div>
          {#if selectedPath}
            <div style="margin-top:4px;opacity:0.85;">LOCK · {selectedPath}</div>
          {/if}
      </div>
      {#if loadErr}
        <p class="tw-empty">{loadErr}</p>
      {:else if !data}
        <p class="tw-empty">载入中…</p>
      {:else}
        <TerritoryMapCanvas {data} compact={tier === 'compact'} onSelectPath={(p) => (selectedPath = p)} />
      {/if}
    </div>

    <ResizeHandles
      {width}
      {height}
      x={posX}
      y={posY}
      minWidth={380}
      minHeight={320}
      maxWidth={1400}
      maxHeight={1100}
      disabled={maximized}
      onResize={onResizeCb}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .territory-widget {
    position: fixed;
    z-index: 38;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    background: rgb(12 20 36 / 0.82);
    color: #eef4ff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.42);
    backdrop-filter: blur(16px);
    overflow: hidden;
    touch-action: none;
  }
  .territory-widget.is-maximized {
    left: 24px !important;
    top: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    width: auto !important;
    height: auto !important;
  }
  .tw-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .territory-widget.is-active-drag .tw-header { cursor: grabbing; }
  .tw-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    color: rgb(255 255 255 / 0.82);
  }
  .tw-sub {
    margin-left: auto;
    font-size: 0.68rem;
    color: rgb(180 200 230 / 0.75);
  }
  .tw-link {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #eef4ff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .tw-body {
    flex: 1;
    min-height: 280px;
    position: relative;
  }
  .tw-empty {
    padding: 48px 20px;
    text-align: center;
    color: rgb(180 200 230 / 0.8);
    font-size: 0.84rem;
  }
  @media (max-width: 768px) {
    .territory-widget:not(.is-maximized) {
      left: 10px !important;
      right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 70px) !important;
      width: auto !important;
      height: 72vh !important;
    }
  }
</style>
