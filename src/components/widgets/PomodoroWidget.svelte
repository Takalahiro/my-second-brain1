<script lang="ts">
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import PixelIcon from '../PixelIcon.svelte';
  import { WIDGET_ICON_MAP } from '../../lib/pixel-icons';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type Phase = 'focus' | 'short' | 'long';
  const STATE_KEY = 'second-brain:pomo-state';
  const LAYOUT_KEY = 'second-brain:pomo-layout';

  // 配置（分钟）
  let focusMin = $state(25);
  let shortMin = $state(5);
  let longMin = $state(15);
  let cyclesBeforeLong = $state(4);
  let autoStart = $state(false);
  let soundOn = $state(true);

  // 运行状态
  let phase = $state<Phase>('focus');
  let running = $state(false);
  let remainingMs = $state(25 * 60_000);
  let completedFocus = $state(0); // 已完成的专注次数
  let lastTick = 0;
  let raf: number | null = null;

  // 视图
  let minimized = $state(false);
  let maximized = $state(false);
  let showSettings = $state(false);
  let bgAlpha = $state(0.72);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(340);
  let height = $state(380);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.focusMin === 'number') focusMin = clamp(s.focusMin, 1, 180);
        if (typeof s.shortMin === 'number') shortMin = clamp(s.shortMin, 1, 60);
        if (typeof s.longMin === 'number') longMin = clamp(s.longMin, 1, 120);
        if (typeof s.cyclesBeforeLong === 'number') cyclesBeforeLong = clamp(s.cyclesBeforeLong, 1, 12);
        if (typeof s.autoStart === 'boolean') autoStart = s.autoStart;
        if (typeof s.soundOn === 'boolean') soundOn = s.soundOn;
        if (s.phase === 'focus' || s.phase === 'short' || s.phase === 'long') phase = s.phase;
        if (typeof s.remainingMs === 'number') remainingMs = s.remainingMs;
        if (typeof s.completedFocus === 'number') completedFocus = s.completedFocus;
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      } else {
        remainingMs = focusMin * 60_000;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 260, 720);
        if (typeof s.h === 'number') height = clamp(s.h, 300, 900);
        rotation = layoutRotation(s);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 120));
      posY = Math.max(24, Math.min(window.innerHeight - height - 40, 220));
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf != null) cancelAnimationFrame(raf);
    };
  });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    if (typeof window === 'undefined' || !rootEl) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const h = rootEl.offsetHeight || 280;
    posX = clamp(posX, 4, Math.max(4, W - width - 4));
    posY = clamp(posY, 4, Math.max(4, H - h - 4));
  }
  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({
        focusMin, shortMin, longMin, cyclesBeforeLong, autoStart, soundOn,
        phase, remainingMs, completedFocus, minimized, maximized, bgAlpha,
      }));
    } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function phaseLengthMs(p: Phase = phase) {
    return (p === 'focus' ? focusMin : p === 'short' ? shortMin : longMin) * 60_000;
  }
  const totalMs = $derived(phaseLengthMs(phase));
  const progress = $derived(1 - Math.max(0, Math.min(1, remainingMs / totalMs)));
  const timeStr = $derived.by(() => {
    const total = Math.max(0, Math.ceil(remainingMs / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  });
  const phaseLabel = $derived(phase === 'focus' ? '专注' : phase === 'short' ? '小憩' : '长休息');

  function tick(ts: number) {
    if (!running) return;
    const dt = ts - lastTick;
    lastTick = ts;
    remainingMs = Math.max(0, remainingMs - dt);
    if (remainingMs <= 0) {
      onPhaseEnd();
      return;
    }
    if (Math.floor(remainingMs / 1000) % 5 === 0) persist();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    lastTick = performance.now();
    raf = requestAnimationFrame(tick);
    persist();
  }
  function pause() {
    if (!running) return;
    running = false;
    if (raf != null) cancelAnimationFrame(raf);
    raf = null;
    persist();
  }
  function reset() {
    pause();
    remainingMs = phaseLengthMs();
    persist();
  }
  function skip() {
    onPhaseEnd();
  }

  function onPhaseEnd() {
    pause();
    if (soundOn) ding();
    let nextPhase: Phase;
    if (phase === 'focus') {
      completedFocus += 1;
      nextPhase = completedFocus % cyclesBeforeLong === 0 ? 'long' : 'short';
    } else {
      nextPhase = 'focus';
    }
    phase = nextPhase;
    remainingMs = phaseLengthMs(nextPhase);
    persist();
    if (autoStart) start();
  }

  function ding() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = phase === 'focus' ? 660 : 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => ctx.close(), 1000);
    } catch {}
  }

  function setPhase(p: Phase) {
    pause();
    phase = p;
    remainingMs = phaseLengthMs(p);
    persist();
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
    posX = x; posY = y; width = w; height = h; clampPos();
  }

  function doMinimize() { minimized = !minimized; if (minimized) maximized = false; persist(); }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persist(); }
  function toggleSettings() { showSettings = !showSettings; }

  // 设置变更 → 重置当前阶段
  $effect(() => {
    if (!running) {
      const cur = phaseLengthMs();
      if (remainingMs > cur) remainingMs = cur;
    }
  });

  // 计时环跟随 widget 宽度等比缩放
  const ringSize = $derived(clamp(Math.min(width - 56, height - 200), 140, 320));
  const ringR = $derived(ringSize / 2 - 10);
  const ringCirc = $derived(2 * Math.PI * ringR);
  const ringOffset = $derived(ringCirc * (1 - progress));

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
      { minWidth: 260, minHeight: 300, maxWidth: 720, maxHeight: 900 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="pomo-widget phase-{phase} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="番茄钟"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="pw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="pw-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.pomodoro} size={14} /></span>
      <span>番茄钟</span>
    </div>
    <button
      type="button"
      class="pw-settings-btn"
      onclick={toggleSettings}
      aria-label="设置"
      title="设置"
      data-no-drag
    >⚙</button>
  </header>

  {#if !minimized && showSettings}
    <div class="pw-bg-cfg" data-no-drag>
      <label class="pw-bg-row">
        <span>毛玻璃透明度</span>
        <input type="range" min="0.05" max="0.95" step="0.05"
               value={bgAlpha}
               oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
        <span>{Math.round(bgAlpha * 100)}%</span>
      </label>
    </div>
  {/if}

  {#if !minimized}
    <div class="pw-body">
      <div class="pw-tabs" data-no-drag>
        <button type="button" class:active={phase === 'focus'} onclick={() => setPhase('focus')}>专注 {focusMin}m</button>
        <button type="button" class:active={phase === 'short'} onclick={() => setPhase('short')}>小憩 {shortMin}m</button>
        <button type="button" class:active={phase === 'long'} onclick={() => setPhase('long')}>长休 {longMin}m</button>
      </div>

      <div class="pw-ring-wrap">
        <svg class="pw-ring" width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
          <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} class="pw-ring-bg" />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringR}
            class="pw-ring-fg"
            stroke-dasharray={ringCirc}
            stroke-dashoffset={ringOffset}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          />
        </svg>
        <div class="pw-ring-content">
          <div class="pw-phase">{phaseLabel}</div>
          <div class="pw-time">{timeStr}</div>
          <div class="pw-cycle">完成 {completedFocus} · 下次长休再做 {cyclesBeforeLong - (completedFocus % cyclesBeforeLong)} 次</div>
        </div>
      </div>

      <div class="pw-controls" data-no-drag>
        {#if running}
          <button type="button" class="pw-primary" onclick={pause}>暂停</button>
        {:else}
          <button type="button" class="pw-primary" onclick={start}>开始</button>
        {/if}
        <button type="button" class="pw-second" onclick={reset} aria-label="重置">↺ 重置</button>
        <button type="button" class="pw-second" onclick={skip} aria-label="跳过">⏭ 跳过</button>
      </div>

      {#if showSettings}
        <div class="pw-cfg" data-no-drag>
          <label>
            <span>专注</span>
            <input type="number" min="1" max="180" bind:value={focusMin} onchange={() => { if (!running && phase === 'focus') remainingMs = phaseLengthMs(); persist(); }} />
            <span class="unit">分</span>
          </label>
          <label>
            <span>小憩</span>
            <input type="number" min="1" max="60" bind:value={shortMin} onchange={() => { if (!running && phase === 'short') remainingMs = phaseLengthMs(); persist(); }} />
            <span class="unit">分</span>
          </label>
          <label>
            <span>长休</span>
            <input type="number" min="1" max="120" bind:value={longMin} onchange={() => { if (!running && phase === 'long') remainingMs = phaseLengthMs(); persist(); }} />
            <span class="unit">分</span>
          </label>
          <label>
            <span>每多少专注后长休</span>
            <input type="number" min="1" max="12" bind:value={cyclesBeforeLong} onchange={persist} />
          </label>
          <label class="checkbox">
            <input type="checkbox" bind:checked={autoStart} onchange={persist} /> 自动开始下个阶段
          </label>
          <label class="checkbox">
            <input type="checkbox" bind:checked={soundOn} onchange={persist} /> 阶段结束提示音
          </label>
          <button type="button" class="pw-second pw-reset-all" onclick={() => { completedFocus = 0; persist(); }}>重置已完成计数</button>
        </div>
      {/if}
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={260} minHeight={300}
      maxWidth={720} maxHeight={900}
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
  {/if}
</section>

<style>
  .pomo-widget {
    --w-bg-alpha: 0.72;
    position: fixed;
    z-index: 38;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.36);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    touch-action: none;
  }
  .pomo-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important;
  }
  .pomo-widget.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .pw-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    background: rgb(0 0 0 / 0.18);
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    cursor: grab;
  }
  .pomo-widget.is-active-drag .pw-header { cursor: grabbing; }
  .pomo-widget.is-maximized .pw-header { cursor: default; }
  .pw-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .pw-settings-btn {
    margin-left: auto;
    width: 26px; height: 26px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.85rem;
  }
  .pw-settings-btn:hover { background: rgb(255 255 255 / 0.14); }

  .pw-bg-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
  }
  .pw-bg-row {
    display: grid;
    grid-template-columns: minmax(110px, 35%) 1fr 42px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .pw-bg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .pw-bg-row input[type='range']::-webkit-slider-thumb,
  .pw-bg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }

  .pw-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .pw-tabs {
    display: inline-flex;
    background: rgb(255 255 255 / 0.06);
    border-radius: 999px;
    padding: 3px;
    gap: 0;
  }
  .pw-tabs button {
    border: 0;
    background: transparent;
    color: #d4c8ee;
    cursor: pointer;
    font-size: 0.72rem;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .pw-tabs button.active {
    background: rgb(255 255 255 / 0.16);
    color: #fff;
  }

  .pw-ring-wrap { position: relative; }
  .pw-ring-bg { fill: none; stroke: rgb(255 255 255 / 0.1); stroke-width: 8; }
  .pw-ring-fg {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.4s linear, stroke 0.3s ease;
  }
  .phase-focus .pw-ring-fg { stroke: #ff7eb3; filter: drop-shadow(0 0 6px rgb(255 126 179 / 0.5)); }
  .phase-short .pw-ring-fg { stroke: #5ef7a1; filter: drop-shadow(0 0 6px rgb(94 247 161 / 0.5)); }
  .phase-long  .pw-ring-fg { stroke: #6fb1ff; filter: drop-shadow(0 0 6px rgb(111 177 255 / 0.5)); }

  .pw-ring-content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
  }
  .pw-phase { font-size: 0.7rem; letter-spacing: 3px; color: #b6a8d3; }
  .pw-time {
    font-size: clamp(1.6rem, 6vw, 3rem);
    font-weight: 700;
    color: #fff5ff;
    letter-spacing: 3px;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .pw-cycle { font-size: 0.66rem; color: #b6a8d3; margin-top: 2px; }

  .pw-controls { display: inline-flex; gap: 8px; }
  .pw-primary {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    border: 1px solid rgb(255 255 255 / 0.4);
    border-radius: 999px;
    padding: 7px 24px;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
  }
  .pw-primary:hover { filter: brightness(1.05); }
  .pw-second {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f0e6ff;
    border-radius: 999px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 0.74rem;
  }
  .pw-second:hover { background: rgb(255 255 255 / 0.16); }

  .pw-cfg {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px dashed rgb(255 255 255 / 0.12);
    font-size: 0.74rem;
  }
  .pw-cfg label {
    display: flex; align-items: center; gap: 6px;
    color: #d6c7ee;
  }
  .pw-cfg label.checkbox { grid-column: span 2; }
  .pw-cfg input[type='number'] {
    width: 64px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 0.78rem;
  }
  .pw-cfg .unit { color: #aa97cf; font-size: 0.7rem; }
  .pw-reset-all { grid-column: span 2; justify-self: start; }

  @media (max-width: 768px) {
    .pomo-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 100px) !important;
      width: auto !important;
    }
    .pw-cfg { grid-template-columns: 1fr; }
    .pw-cfg label.checkbox { grid-column: span 1; }
  }
</style>
