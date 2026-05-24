<script lang="ts">
  import { clampPosition, spawnPosition, getWidgetSafeTop } from '../../lib/floating-widget-layout';
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { getWidgetTier, tierClass, TIER_LABEL } from '../../lib/widget-size-tier';
  import {
    createNetworkTrafficMonitor,
    formatBytes,
    formatBitrate,
    effectiveTypeLabel,
    type NetworkTrafficMonitor,
    type NetworkTrafficSnapshot,
  } from '../../lib/network-traffic';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  const STATE_KEY = 'second-brain:network-state';
  const LAYOUT_KEY = 'second-brain:network-layout';
  const DISC_KEY = 'second-brain:network-disc';

  let minimized = $state(false);
  let maximized = $state(false);
  let bgAlpha = $state(0.78);
  let showSettings = $state(false);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(400);
  let height = $state(460);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  let discX = $state(-1);
  let discY = $state(-1);
  let discEl: HTMLButtonElement | null = null;
  let discDragging = $state(false);
  let discMoved = false;
  let discDragStart = { x: 0, y: 0, px: 0, py: 0 };

  let monitor: NetworkTrafficMonitor | null = null;
  let snap = $state<NetworkTrafficSnapshot | null>(null);
  let matrixCanvas: HTMLCanvasElement | null = null;
  let matrixRaf = 0;

  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 380, expandedMin: 560 }));
  const loadRing = $derived.by(() => {
    if (!snap) return 0;
    const peak = Math.max(snap.peakBytesPerSecond, 1);
    return Math.min(1, snap.bytesPerSecond / peak);
  });
  const sessionLabel = $derived.by(() => {
    if (!snap) return '—';
    const mins = Math.floor((Date.now() - snap.sessionStarted) / 60_000);
    if (mins < 1) return '< 1 分钟';
    if (mins < 60) return `${mins} 分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} 时 ${m} 分` : `${h} 小时`;
  });
  const DISC_SIZE_DESKTOP = 84;
  const DISC_SIZE_MOBILE = 72;
    function discSize() {
    if (typeof window === 'undefined') return DISC_SIZE_DESKTOP;
    return window.matchMedia('(max-width: 768px)').matches ? DISC_SIZE_MOBILE : DISC_SIZE_DESKTOP;
  }

  function syncDiscFromPanel() {
    const size = discSize();
    discX = posX + width / 2 - size / 2;
    discY = posY + height / 2 - size / 2;
    clampDisc();
    persistDisc();
  }

  function syncPanelFromDisc() {
    const size = discSize();
    posX = discX + size / 2 - width / 2;
    posY = discY + size / 2 - height / 2;
    clampPos();
    persistLayout();
  }

  onMount(() => {
    monitor = createNetworkTrafficMonitor();
    snap = monitor.getSnapshot();
    const tick = window.setInterval(() => {
      snap = monitor?.getSnapshot() ?? null;
    }, 1000);

    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 320, 720);
        if (typeof s.h === 'number') height = clamp(s.h, 300, 720);
        rotation = layoutRotation(s);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(DISC_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') discX = s.x;
        if (typeof s.y === 'number') discY = s.y;
      }
    } catch {}

    if (posX < 0 || posY < 0) {
      const sp = spawnPosition(width, height);
      posX = sp.x;
      posY = sp.y;
    }
    if (discX < 0 || discY < 0) {
      discX = window.innerWidth - 88 - 24;
      discY = window.innerHeight - 88 - 280;
    }
    clampPos();
    clampDisc();

    const onResize = () => {
      clampPos();
      clampDisc();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.clearInterval(tick);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(matrixRaf);
      monitor?.destroy();
      monitor = null;
    };
  });

  $effect(() => {
    if (!minimized || !matrixCanvas) return;
    const canvas = matrixCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 84;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = 14;
    const fontSize = 7;
    const drops = Array.from({ length: cols }, () => Math.random() * size);
    const chars = '01アイウエオカキクケコ0123456789';
    let running = true;

    const draw = () => {
      if (!running) return;
      ctx.fillStyle = 'rgba(0, 8, 2, 0.22)';
      ctx.fillRect(0, 0, size, size);
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < cols; i++) {
        const x = i * (size / cols);
        const y = drops[i] * fontSize;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const bright = Math.random() > 0.92;
        ctx.fillStyle = bright ? '#c8ffdc' : '#00ff41';
        ctx.fillText(ch, x, y);
        if (y > size && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.55 + Math.random() * 0.35;
      }
      matrixRaf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      running = false;
      cancelAnimationFrame(matrixRaf);
    };
  });

  function clamp(v: number, min: number, max: number) {
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
  }
  function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }
  function clampDisc() {
    if (typeof window === 'undefined') return;
    const size = discSize();
    discX = clamp(discX, 8, Math.max(8, window.innerWidth - size - 8));
    discY = clamp(discY, getWidgetSafeTop(), Math.max(getWidgetSafeTop(), window.innerHeight - size - 8));
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function persistState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ minimized, maximized, bgAlpha })); } catch {}
  }
  function persistDisc() {
    try { localStorage.setItem(DISC_KEY, JSON.stringify({ x: discX, y: discY })); } catch {}
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
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    if (Number.isFinite(x)) posX = x;
    if (Number.isFinite(y)) posY = y;
    if (Number.isFinite(w)) width = w;
    if (Number.isFinite(h)) height = h;
    clampPos();
  }
  function doMinimize() {
    syncDiscFromPanel();
    minimized = true;
    maximized = false;
    persistState();
  }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persistState(); }
  function toggleSettings() { showSettings = !showSettings; }
  function resetSession() { monitor?.reset(); snap = monitor?.getSnapshot() ?? null; }

  function onDiscPointerDown(e: PointerEvent) {
    if (!discEl) return;
    e.preventDefault();
    discDragging = true;
    discMoved = false;
    discDragStart = { x: e.clientX, y: e.clientY, px: discX, py: discY };
    discEl.setPointerCapture?.(e.pointerId);
  }
  function onDiscPointerMove(e: PointerEvent) {
    if (!discDragging) return;
    const dx = e.clientX - discDragStart.x;
    const dy = e.clientY - discDragStart.y;
    if (!discMoved && Math.hypot(dx, dy) > 4) discMoved = true;
    discX = discDragStart.px + dx;
    discY = discDragStart.py + dy;
    clampDisc();
  }
  function onDiscPointerUp(e: PointerEvent) {
    if (!discDragging) return;
    discDragging = false;
    discEl?.releasePointerCapture?.(e.pointerId);
    if (discMoved) persistDisc();
    else {
      syncPanelFromDisc();
      minimized = false;
      persistState();
    }
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
      { minWidth: 320, minHeight: 300, maxWidth: 720, maxHeight: 720 }
    )
  );
</script>

{#if minimized}
  <button
    type="button"
    bind:this={discEl}
    class="net-disc {discDragging ? 'is-dragging' : ''}"
    style="left: {discX}px; top: {discY}px;"
    onpointerdown={onDiscPointerDown}
    onpointermove={onDiscPointerMove}
    onpointerup={onDiscPointerUp}
    onpointercancel={onDiscPointerUp}
    aria-label="展开网络流量"
    title="网络流量 · 点击展开"
  >
    <canvas bind:this={matrixCanvas} class="net-disc-canvas" aria-hidden="true"></canvas>
    <span class="net-disc-ring" style="--load: {loadRing}"></span>
    <span class="net-disc-core">
      <span class="net-disc-rate">{snap ? formatBytes(snap.bytesPerSecond, 0).replace(' ', '') : '0B'}</span>
      <span class="net-disc-sub">/s</span>
    </span>
  </button>
{:else}
  <section
    bind:this={rootEl}
    class="network-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''}"
    style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${height}px;`) + ` --nw-bg-alpha: ${bgAlpha};`)}
    aria-label="网络流量"
    use:widgetTouchGestures={touchOpts}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  >
    <header class="nw-header" onpointerdown={onHeaderPointerDown}>
      <WindowChrome
        onClose={() => onClose?.()}
        onMinimize={doMinimize}
        onMaximize={doMaximize}
        maximized={maximized}
      />
      <div class="nw-title-block">
        <div class="nw-title">网络流量</div>
        <div class="nw-sub">{TIER_LABEL[tier]} · 本会话</div>
      </div>
      <div class="nw-actions" data-no-drag>
        <button type="button" class="icon-btn" onclick={toggleSettings} aria-label="设置">⚙</button>
      </div>
    </header>

    <div class="nw-body">
      <div class="nw-hero">
        <div class="nw-hero-main">
          <span class="nw-hero-val">{snap ? formatBytes(snap.bytesDown) : '0 B'}</span>
          <span class="nw-hero-label">已下载</span>
        </div>
        <div class="nw-hero-side">
          <div>
            <span class="nw-k">实时</span>
            <strong>{snap ? formatBitrate(snap.bytesPerSecond) : '0 B/s'}</strong>
          </div>
          <div>
            <span class="nw-k">峰值</span>
            <strong>{snap ? formatBitrate(snap.peakBytesPerSecond) : '0 B/s'}</strong>
          </div>
        </div>
      </div>

      {#if tier !== 'compact'}
        <div class="nw-spark" aria-hidden="true">
          {#each snap?.sparkline ?? [] as v, i}
            <span class="nw-bar" style="height: {Math.max(4, (v / sparkMax) * 100)}%"></span>
          {/each}
        </div>
      {/if}

      <div class="nw-grid">
        <div class="nw-card">
          <span class="nw-k">请求数</span>
          <strong>{snap?.requestCount ?? 0}</strong>
        </div>
        <div class="nw-card">
          <span class="nw-k">会话时长</span>
          <strong>{sessionLabel}</strong>
        </div>
        <div class="nw-card">
          <span class="nw-k">连接类型</span>
          <strong>{effectiveTypeLabel(snap?.connection.effectiveType)}</strong>
        </div>
        <div class="nw-card">
          <span class="nw-k">下行带宽</span>
          <strong>{snap?.connection.downlinkMbps != null ? `${snap.connection.downlinkMbps} Mbps` : '—'}</strong>
        </div>
        {#if tier === 'expanded'}
          <div class="nw-card">
            <span class="nw-k">RTT</span>
            <strong>{snap?.connection.rttMs != null ? `${snap.connection.rttMs} ms` : '—'}</strong>
          </div>
          <div class="nw-card">
            <span class="nw-k">省流模式</span>
            <strong>{snap?.connection.saveData ? '已开启' : '关闭'}</strong>
          </div>
        {/if}
      </div>

      {#if tier === 'expanded'}
        <p class="nw-note">
          数据来自浏览器 Performance API，统计本标签页会话内的资源加载量，无法读取系统级总流量。
        </p>
      {/if}
    </div>

    {#if showSettings}
      <aside class="nw-settings" data-no-drag>
        <div class="nw-set-row">
          <label for="nw-alpha">面板透明度</label>
          <input id="nw-alpha" type="range" min="0.05" max="0.95" step="0.01" bind:value={bgAlpha} onchange={persistState} />
        </div>
        <button type="button" class="nw-reset" onclick={resetSession}>重置会话统计</button>
      </aside>
    {/if}

    <ResizeHandles
      width={width}
      height={height}
      x={posX}
      y={posY}
      minWidth={320}
      minHeight={300}
      maxWidth={720}
      maxHeight={720}
      disabled={maximized}
      onResize={onResize}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  </section>
{/if}

<style>
  .network-widget {
    position: fixed;
    z-index: 36;
    display: flex;
    flex-direction: column;
    border-radius: 14px;
    border: 1px solid var(--widget-border, rgb(255 255 255 / 0.14));
    background: rgb(var(--widget-bg-rgb, 18 18 22) / var(--nw-bg-alpha, 0.78));
    backdrop-filter: blur(18px) saturate(1.2);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.28);
    color: var(--widget-fg, #ececf1);
    overflow: hidden;
    touch-action: none;
    user-select: none;
  }
  .network-widget.is-maximized {
    inset: 12px !important;
    width: auto !important;
    height: auto !important;
  }
  .network-widget.is-active-drag { cursor: grabbing; }

  .nw-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 8px 10px 6px;
    border-bottom: 1px solid var(--widget-border, rgb(255 255 255 / 0.08));
    cursor: grab;
  }
  .nw-title { font-size: 0.92rem; font-weight: 650; letter-spacing: 0.02em; }
  .nw-sub { font-size: 0.68rem; opacity: 0.62; margin-top: 2px; }
  .nw-actions { display: flex; gap: 4px; }
  .icon-btn {
    width: 28px; height: 28px; border-radius: 8px;
    border: 1px solid var(--widget-border, rgb(255 255 255 / 0.12));
    background: rgb(255 255 255 / 0.06);
    color: inherit; cursor: pointer;
  }
  .icon-btn:hover { background: rgb(255 255 255 / 0.12); }

  .nw-body {
    flex: 1;
    min-height: 0;
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: auto;
  }

  .nw-hero {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 10px;
    align-items: end;
  }
  .nw-hero-val {
    display: block;
    font-size: clamp(1.35rem, 4vw, 1.85rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #6dff9a;
    text-shadow: 0 0 18px rgb(0 255 65 / 0.25);
  }
  .nw-hero-label { font-size: 0.72rem; opacity: 0.65; }
  .nw-hero-side {
    display: grid; gap: 6px;
    font-size: 0.78rem;
  }
  .nw-hero-side strong { font-variant-numeric: tabular-nums; }

  .nw-spark {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 56px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgb(0 0 0 / 0.22);
    border: 1px solid rgb(0 255 65 / 0.12);
  }
  .nw-bar {
    flex: 1;
    min-width: 3px;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(180deg, #b8ffd0, #00ff41 55%, #007a20);
    opacity: 0.88;
    transition: height 0.35s ease;
  }

  .nw-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .network-widget.widget-tier-expanded .nw-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .nw-card {
    padding: 8px 10px;
    border-radius: 10px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.06);
  }
  .nw-k {
    display: block;
    font-size: 0.66rem;
    opacity: 0.58;
    margin-bottom: 4px;
  }
  .nw-card strong {
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
  }

  .nw-note {
    margin: 0;
    font-size: 0.68rem;
    line-height: 1.45;
    opacity: 0.55;
  }

  .nw-settings {
    padding: 10px 14px 14px;
    border-top: 1px solid var(--widget-border, rgb(255 255 255 / 0.08));
  }
  .nw-set-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    font-size: 0.78rem;
    margin-bottom: 10px;
  }
  .nw-reset {
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgb(0 255 65 / 0.25);
    background: rgb(0 255 65 / 0.08);
    color: #9dffb8;
    cursor: pointer;
  }
  .nw-reset:hover { background: rgb(0 255 65 / 0.14); }

  /* Matrix 圆盘 */
  .net-disc {
    position: fixed;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    padding: 0;
    border: 1px solid rgb(0 255 65 / 0.45);
    background: radial-gradient(circle at 35% 30%, #0a1f12, #020805 68%);
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 0.5),
      0 0 24px rgb(0 255 65 / 0.18),
      0 14px 32px rgb(0 0 0 / 0.45);
    cursor: grab;
    z-index: 125;
    touch-action: none;
    user-select: none;
    overflow: hidden;
  }
  .net-disc.is-dragging { cursor: grabbing; }
  .net-disc-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    opacity: 0.55;
    pointer-events: none;
  }
  .net-disc-ring {
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    border: 2px solid transparent;
    background:
      conic-gradient(#00ff41 calc(var(--load, 0) * 360deg), rgb(0 255 65 / 0.08) 0)
      border-box;
    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.85;
  }
  .net-disc-core {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    text-shadow: 0 0 10px rgb(0 255 65 / 0.45);
  }
  .net-disc-rate {
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: #c8ffdc;
    line-height: 1;
  }
  .net-disc-sub {
    font-size: 0.58rem;
    color: #6dff9a;
    opacity: 0.85;
  }

  @media (max-width: 768px) {
    .net-disc { width: 72px; height: 72px; }
    .network-widget:not(.is-maximized) {
      left: 10px !important;
      right: 10px !important;
      top: auto !important;
      bottom: max(env(safe-area-inset-bottom, 0px), 12px);
      width: auto !important;
      max-height: min(72vh, 520px);
    }
    .network-widget.widget-tier-expanded .nw-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
