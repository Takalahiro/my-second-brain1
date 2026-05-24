<script lang="ts">
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { hudSolidBar, HUD_SEP } from '../../lib/hud-widget-ui';
  import { getWidgetTier, tierClass } from '../../lib/widget-size-tier';

  interface Props {
    onClose?: () => void;
    // true = 钉在 dock 右下角，不能拖；false = 自由浮窗，可拖可缩放
    pinned?: boolean;
  }
  let { onClose, pinned = false }: Props = $props();

  type Style = 'pixel' | 'neon' | 'nixie' | 'code' | 'altimeter';
  const STORAGE_KEY = 'second-brain:clock';
  const LAYOUT_KEY = 'second-brain:clock-layout';

  let now = $state(new Date());
  let hour24 = $state(true);
  let showSeconds = $state(true);
  let style = $state<Style>('pixel');
  let sizeScale = $state(1);
  let showSettings = $state(false);
  let bgAlpha = $state(0.5);
  // 世界时钟发过来的时区；null 就用本地时间
  let externalTz = $state<string | null>(null);
  let externalLabel = $state<string | null>(null);

  // 只有浮窗模式才需要记位置
  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(260);
  let height = $state(110);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  let timerId: number | null = null;

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.hour24 === 'boolean') hour24 = s.hour24;
        if (typeof s.showSeconds === 'boolean') showSeconds = s.showSeconds;
        // 老数据里 style 叫 glow，现在统一成 nixie
        const st = s.style === 'glow' ? 'nixie' : s.style;
        if (st === 'pixel' || st === 'neon' || st === 'nixie' || st === 'code' || st === 'altimeter') style = st;
        if (typeof s.sizeScale === 'number') sizeScale = clamp(s.sizeScale, 0.6, 2.4);
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 120, 1100);
        if (typeof s.h === 'number') height = clamp(s.h, 72, 800);
        rotation = layoutRotation(s);
      }
    } catch {}

    // 上次跟随时区选的，从 localStorage 捞回来
    try {
      const raw = localStorage.getItem(STORAGE_KEY + ':tz');
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.tz === 'string') externalTz = s.tz;
        if (typeof s.label === 'string') externalLabel = s.label;
      }
    } catch {}

    timerId = window.setInterval(() => { now = new Date(); }, 1000);
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);

    // 听 world clock 的事件：选城市就把主时钟时区切过去
    const onSetTz = (e: Event) => {
      const ev = e as CustomEvent<{ tz: string; label?: string }>;
      const d = ev.detail;
      if (!d?.tz) return;
      externalTz = d.tz;
      externalLabel = d.label ?? null;
      try { localStorage.setItem(STORAGE_KEY + ':tz', JSON.stringify({ tz: externalTz, label: externalLabel })); } catch {}
    };
    window.addEventListener('clock:setTimezone', onSetTz);

    return () => {
      if (timerId != null) clearInterval(timerId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('clock:setTimezone', onSetTz);
    };
  });

  function resetTimezone() {
    externalTz = null;
    externalLabel = null;
    try { localStorage.removeItem(STORAGE_KEY + ':tz'); } catch {}
  }

  // 浮窗第一次出现时给个默认位置（pinned 不走这套）
  $effect(() => {
    if (pinned) return;
    if (typeof window === 'undefined') return;
    if (posX < 0 || posY < 0) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      posX = Math.max(16, W - width - 24);
      posY = Math.max(16, H - 220);
    }
    clampPos();
  });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    if (pinned || typeof window === 'undefined' || !rootEl) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const h = rootEl.offsetHeight || 220;
    posX = clamp(posX, 4, Math.max(4, W - width - 4));
    posY = clamp(posY, 4, Math.max(4, H - h - 4));
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ hour24, showSeconds, style, sizeScale, bgAlpha })); } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function format2(n: number) { return n < 10 ? '0' + n : '' + n; }
  // 按指定时区拆出时/分/秒、星期几、月、日
  function tzParts(d: Date, tz: string | null) {
    if (!tz) {
      return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(), dow: d.getDay(), mo: d.getMonth() + 1, da: d.getDate() };
    }
    try {
      const f = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
        weekday: 'short', month: '2-digit', day: '2-digit', hour12: false,
      });
      const parts = f.formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
      const dows = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>;
      return {
        h: Number(get('hour')) || 0,
        m: Number(get('minute')) || 0,
        s: Number(get('second')) || 0,
        dow: dows[get('weekday')] ?? 0,
        mo: Number(get('month')) || 0,
        da: Number(get('day')) || 0,
      };
    } catch {
      return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(), dow: d.getDay(), mo: d.getMonth() + 1, da: d.getDate() };
    }
  }
  const tzNow = $derived.by(() => tzParts(now, externalTz));
  const timeText = $derived.by(() => {
    let h = tzNow.h;
    if (!hour24) h = ((h + 11) % 12) + 1;
    const base = `${format2(h)}:${format2(tzNow.m)}`;
    return showSeconds ? `${base}:${format2(tzNow.s)}` : base;
  });
  const timeChars = $derived(timeText.split(''));
  const ampm = $derived(tzNow.h >= 12 ? 'PM' : 'AM');
  const dateText = $derived.by(() => {
    const week = ['日', '一', '二', '三', '四', '五', '六'][tzNow.dow] ?? '';
    return `${tzNow.mo}/${tzNow.da} · 周${week}`;
  });

  function setStyle(s: Style) { style = s; persist(); }
  function setSize(v: number) { sizeScale = clamp(v, 0.6, 2.4); persist(); }
  function toggle24() { hour24 = !hour24; persist(); }
  function toggleSec() { showSeconds = !showSeconds; persist(); }
  function toggleSettings() { showSettings = !showSettings; }

  const timeFontRem = $derived(4.35 * sizeScale);
  const metaFontRem = $derived(0.95 * sizeScale);
  const altSecondBar = $derived(hudSolidBar(tzNow.s / 59, 12));
  const altMinuteBar = $derived(hudSolidBar(tzNow.m / 59, 8));

  const tier = $derived.by(() => {
    if (pinned) {
      if (sizeScale < 0.85) return 'compact' as const;
      if (sizeScale > 1.35) return 'expanded' as const;
      return 'medium' as const;
    }
    return getWidgetTier({ width, height, compactMax: 200, expandedMin: 420 });
  });

  // ---- 拖拽 / 缩放（pinned 时全跳过）----
  function onHeaderPointerDown(e: PointerEvent) {
    if (pinned) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (pinned || !dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (pinned || !dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    if (pinned) return;
    posX = x; posY = y; width = w; height = h; clampPos();
  }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, pinned }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 120, minHeight: 72, maxWidth: 1100, maxHeight: 800 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="pixel-clock style-{style} {tierClass(tier)} {pinned ? 'is-pinned' : 'is-free'} {dragging ? 'is-active-drag' : ''}"
  style={rotationStyle(rotation, (pinned ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${height}px;`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="时钟小组件"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="clock-bar" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={onClose} />
    <span class="clock-title">CLOCK</span>
    <button
      type="button"
      class="settings-btn {showSettings ? 'is-open' : ''}"
      onclick={toggleSettings}
      aria-label="打开时钟设置"
      aria-pressed={showSettings}
      title="时钟设置"
    >设置</button>
  </header>

  <div class="clock-body">
    {#if style === 'altimeter'}
      <div class="clock-altimeter hud-readout">
        <div class="alt-face">
          <div class="hud-readout-label">ALT · LOCAL TIME</div>
          <div class="hud-readout-lg">{timeText}</div>
          <div class="hud-bar-line">{HUD_SEP}</div>
          <div class="alt-row">
            <span>BAR {dateText}</span>
            <span>{hour24 ? '24H' : ampm}</span>
          </div>
          {#if externalTz}
            <div class="alt-row alt-tz">▲ TZ · {externalLabel ?? externalTz}</div>
          {/if}
        </div>
        <div class="alt-ticks">
          <span>MIN {altMinuteBar}</span>
          <span>SEC {altSecondBar}</span>
        </div>
      </div>
    {:else if style === 'nixie'}
      <div class="clock-time nixie-row" style={`font-size: ${timeFontRem}rem;`}>
        {#each timeChars as ch}
          {#if ch === ':'}
            <span class="nixie-colon" aria-hidden="true">
              <span class="dot"></span><span class="dot"></span>
            </span>
          {:else}
            <span class="nixie-cell">
              <span class="nixie-glow">{ch}</span>
              <span class="nixie-bg" aria-hidden="true">8</span>
            </span>
          {/if}
        {/each}
      </div>
    {:else if style === 'neon'}
      <div class="clock-time neon-time" data-text={timeText} style={`font-size: ${timeFontRem}rem;`}>
        <span class="neon-tube">{timeText}</span>
      </div>
    {:else}
      <div class="clock-time" style={`font-size: ${timeFontRem}rem;`}>{timeText}</div>
    {/if}

    {#if style !== 'altimeter'}
    <div class="clock-meta" style={`font-size: ${metaFontRem}rem;`}>
      <button type="button" class="clock-mode" onclick={toggle24}>{hour24 ? '24H' : ampm}</button>
      {#if externalTz}
        <button type="button" class="clock-tz" onclick={resetTimezone} title="点击恢复本地时间">{externalLabel ?? externalTz}</button>
      {/if}
      <span class="clock-date">{dateText}</span>
    </div>
    {/if}

    {#if showSettings}
      <div class="clock-settings">
        <div class="cs-row">
          <span class="cs-label">样式</span>
          <div class="cs-styles">
            <button type="button" class:active={style === 'altimeter'} onclick={() => setStyle('altimeter')}>高度表</button>
            <button type="button" class:active={style === 'pixel'} onclick={() => setStyle('pixel')}>像素</button>
            <button type="button" class:active={style === 'neon'}  onclick={() => setStyle('neon')}>霓虹</button>
            <button type="button" class:active={style === 'nixie'} onclick={() => setStyle('nixie')}>辉光管</button>
            <button type="button" class:active={style === 'code'}  onclick={() => setStyle('code')}>Code</button>
          </div>
        </div>
        <div class="cs-row">
          <span class="cs-label">时间制</span>
          <button type="button" class="cs-toggle" onclick={toggle24}>{hour24 ? '24 小时制' : '12 小时制'}</button>
          <button type="button" class="cs-toggle" onclick={toggleSec}>秒 {showSeconds ? '显示' : '隐藏'}</button>
        </div>
        <div class="cs-row">
          <span class="cs-label">大小</span>
          <input type="range" min="0.6" max="2.4" step="0.05" value={sizeScale} oninput={(e) => setSize(Number((e.currentTarget as HTMLInputElement).value))} />
          <span class="cs-val">{sizeScale.toFixed(2)}×</span>
        </div>
        <div class="cs-row">
          <span class="cs-label">背景透明度</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={bgAlpha}
                 oninput={(e) => { bgAlpha = clamp(Number((e.currentTarget as HTMLInputElement).value), 0.05, 0.95); persist(); }} />
          <span class="cs-val">{Math.round(bgAlpha * 100)}%</span>
        </div>
      </div>
    {/if}
  </div>

  <ResizeHandles
    width={width} height={height} x={posX} y={posY}
    minWidth={120} minHeight={72}
    maxWidth={1100} maxHeight={800}
    disabled={pinned}
    onResize={onResize}
    onResizeEnd={persistLayout}
  />
  <RotateHandle
    disabled={pinned}
    {rotation}
    getCenter={widgetCenter}
    onRotate={(deg) => { rotation = deg; }}
    onRotateEnd={persistLayout}
  />
</section>

<style>
  .pixel-clock {
    --w-bg-alpha: 0.5;
    position: fixed;
    z-index: 35;
    border-radius: 18px;
    border: 1px solid rgb(255 255 255 / 0.18);
    overflow: hidden;
    background: rgb(var(--widget-bg-rgb) / var(--w-bg-alpha));
    color: #f5edff;
    box-shadow: 0 14px 36px rgb(0 0 0 / 0.32), inset 0 1px 0 rgb(255 255 255 / 0.06);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    animation: clock-breath 5s ease-in-out infinite;
    touch-action: none;
  }
  :global(.dark) .pixel-clock { border-color: rgb(255 255 255 / 0.12); }

  /* pinned：钉右下角，宽高写死在 CSS，不用 inline style */
  .pixel-clock.is-pinned {
    right: max(env(safe-area-inset-right, 0px), 20px);
    bottom: max(env(safe-area-inset-bottom, 0px), 20px);
    min-width: 0;
    max-width: min(760px, calc(100vw - 40px));
  }
  .pixel-clock.is-free { min-width: 0; max-width: 1100px; }
  .pixel-clock.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .clock-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    background: var(--widget-header-bg);
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    cursor: grab;
  }
  .pixel-clock.is-pinned .clock-bar { cursor: default; }
  .pixel-clock.is-free.is-active-drag .clock-bar { cursor: grabbing; }
  .clock-title { font-size: 0.66rem; letter-spacing: 3px; color: rgb(255 255 255 / 0.55); text-transform: uppercase; flex: 1; }
  .settings-btn {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: var(--widget-fg); cursor: pointer; font-size: 0.95rem;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .settings-btn:hover { background: rgb(255 255 255 / 0.18); }
  .settings-btn.is-open { background: linear-gradient(180deg, #ffd0e6, #b48cff); color: #1c0f30; }

  .clock-body { padding: 10px 14px 12px; min-height: 0; overflow: auto; }

  .clock-altimeter .alt-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.62rem;
    margin-top: 4px;
    letter-spacing: 0.06em;
  }
  .clock-altimeter .alt-tz { opacity: 0.85; font-size: 0.55rem; }
  .clock-altimeter .alt-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 0.52rem;
    margin-top: 4px;
    opacity: 0.8;
  }
  .clock-altimeter .hud-readout-lg {
    font-size: clamp(1.25rem, 12vw, 2.4rem);
  }

  .clock-time {
    font-weight: 700;
    letter-spacing: 6px;
    line-height: 1.02;
    font-variant-numeric: tabular-nums;
  }
  .clock-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 14px; color: #d6c7ee; letter-spacing: 1.5px;
  }
  .clock-mode,
  .clock-tz {
    background: rgb(255 255 255 / 0.12);
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 8px;
    padding: 3px 12px; font-weight: 600; color: inherit; cursor: pointer;
    font-size: 0.78em;
  }
  .clock-tz {
    background: linear-gradient(180deg, rgb(255 208 230 / 0.4), rgb(180 140 255 / 0.4));
    border-color: rgb(255 255 255 / 0.3);
    color: #fff;
  }
  .clock-mode:hover,
  .clock-tz:hover { filter: brightness(1.1); }

  @keyframes clock-breath {
    0%, 100% { box-shadow: 0 14px 36px rgb(0 0 0 / 0.32), inset 0 1px 0 rgb(255 255 255 / 0.06); }
    50%      { box-shadow: 0 18px 44px rgb(0 0 0 / 0.4), inset 0 1px 0 rgb(255 255 255 / 0.08); }
  }

  /* ============ pixel 默认样式 ============ */
  .style-pixel .clock-time { color: #fff5ff; text-shadow: 0 0 8px rgb(255 220 245 / 0.25); }

  /* ============ neon：暗底 + 描边发光 + 轻微闪烁 ============ */
  .style-neon { background: #050410; border-color: rgb(255 92 220 / 0.4); }
  .style-neon .clock-bar { background: rgb(20 4 30 / 0.55); border-bottom-color: rgb(255 92 220 / 0.18); }
  .style-neon .clock-title { color: #ff8de8; letter-spacing: 4px; }

  .neon-time {
    position: relative;
    display: inline-block;
    text-align: left;
  }
  .neon-time .neon-tube {
    color: transparent;
    -webkit-text-stroke: 1.5px #ff5cdc;
    text-stroke: 1.5px #ff5cdc;
    text-shadow:
      0 0 4px  #ff5cdc,
      0 0 10px #ff5cdc,
      0 0 20px #c14bff,
      0 0 36px #6e3cff,
      0 0 56px rgb(110 60 255 / 0.6);
    filter: drop-shadow(0 0 8px rgb(255 92 220 / 0.25));
    animation: neon-flicker 6.5s infinite steps(40, end);
    display: inline-block;
  }
  /* 管子上方那层柔光 */
  .neon-time::before {
    content: '';
    position: absolute;
    inset: -6%;
    background: radial-gradient(ellipse at 30% 20%, rgb(255 200 240 / 0.18) 0%, transparent 60%);
    pointer-events: none;
    border-radius: 16px;
  }
  @keyframes neon-flicker {
    0%, 14%, 16%, 22%, 24%, 60%, 100% { opacity: 1; }
    15% { opacity: 0.85; }
    23% { opacity: 0.72; }
    61% { opacity: 0.9; }
  }
  .style-neon .clock-mode {
    background: rgb(255 92 220 / 0.16); border-color: rgb(255 92 220 / 0.5);
    color: #ffd6f7; box-shadow: 0 0 10px rgb(255 92 220 / 0.5);
  }
  .style-neon .clock-meta { color: #ffb1e0; }

  /* ============ nixie 辉光管：每位一格 + 冒号两点 ============ */
  .style-nixie { background: #0c0905; border-color: rgb(255 138 50 / 0.4); }
  .style-nixie .clock-bar { background: rgb(20 12 6 / 0.6); border-bottom-color: rgb(255 138 50 / 0.18); }
  .style-nixie .clock-title { color: #ffb874; letter-spacing: 4px; }

  .nixie-row {
    display: inline-flex;
    align-items: stretch;
    gap: 0.08em;
    letter-spacing: 0;
    line-height: 1;
  }
  .nixie-cell {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.78em;
    padding: 0.08em 0.12em 0.12em;
    border-radius: 0.18em;
    background:
      radial-gradient(ellipse at 50% 20%, rgb(255 160 80 / 0.18) 0%, transparent 55%),
      linear-gradient(180deg, #1a0e07, #06030a 70%);
    border: 1.5px solid rgb(255 150 70 / 0.45);
    box-shadow:
      inset 0 0 22px rgb(255 120 30 / 0.18),
      inset 0 0 6px rgb(255 100 20 / 0.35),
      0 0 14px rgb(255 110 30 / 0.18);
    overflow: hidden;
    font-variant-numeric: tabular-nums;
  }
  /* 玻璃罩高光 */
  .nixie-cell::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg, rgb(255 255 255 / 0.18) 0%, transparent 30%, transparent 80%, rgb(255 255 255 / 0.04) 100%),
      radial-gradient(ellipse at 50% 0%, rgb(255 255 255 / 0.18) 0%, transparent 40%);
    pointer-events: none;
    border-radius: inherit;
  }
  /* 熄灭的 "8" 垫底，亮数字叠在上面 */
  .nixie-bg {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(255 130 40 / 0.05);
    z-index: 1;
    text-shadow: 0 0 2px rgb(255 130 40 / 0.08);
  }
  .nixie-glow {
    position: relative;
    z-index: 2;
    color: #ffa54a;
    text-shadow:
      0 0 3px #ff8c2a,
      0 0 8px rgb(255 140 42 / 0.85),
      0 0 18px rgb(255 110 20 / 0.65),
      0 0 32px rgb(255 100 30 / 0.45);
    animation: nixie-pulse 3.6s ease-in-out infinite;
  }
  @keyframes nixie-pulse {
    0%, 100% { filter: brightness(1); }
    50%      { filter: brightness(1.12); }
  }
  .nixie-colon {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2em;
    padding: 0 0.12em;
  }
  .nixie-colon .dot {
    width: 0.14em; height: 0.14em; border-radius: 50%;
    background: #ffa54a;
    box-shadow:
      0 0 3px #ff8c2a,
      0 0 8px rgb(255 130 30 / 0.7),
      0 0 16px rgb(255 110 30 / 0.4);
    animation: nixie-blink 1.6s ease-in-out infinite;
  }
  @keyframes nixie-blink {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
  .style-nixie .clock-mode {
    background: rgb(255 150 70 / 0.16); border-color: rgb(255 150 70 / 0.5);
    color: #ffd2a0;
  }
  .style-nixie .clock-meta { color: #ffc99c; }

  /* ============ code 终端风 ============ */
  .style-code { background: rgb(8 14 12 / 0.85); border-color: rgb(80 200 130 / 0.3); }
  .style-code .clock-time {
    color: #5ef7a1;
    font-family: ui-monospace, 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    text-shadow: 0 0 6px rgb(94 247 161 / 0.55);
    letter-spacing: 3px;
  }
  .style-code .clock-meta { color: #9adfb6; font-family: ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace; }
  .style-code .clock-mode { background: rgb(80 200 130 / 0.16); border-color: rgb(80 200 130 / 0.4); color: #b8ffd2; }
  .style-code .clock-title { color: #6bdf91; }

  /* ============ 设置面板 ============ */
  .clock-settings {
    margin-top: 16px; padding-top: 14px;
    border-top: 1px dashed rgb(255 255 255 / 0.12);
    display: flex; flex-direction: column; gap: 12px;
  }
  .cs-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cs-label { width: 44px; font-size: 0.78rem; color: rgb(255 255 255 / 0.65); letter-spacing: 1px; }
  .cs-styles { display: inline-flex; gap: 6px; flex-wrap: wrap; }
  .cs-styles button,
  .cs-toggle {
    background: rgb(255 255 255 / 0.08);
    color: #f0e6ff;
    border: 1px solid rgb(255 255 255 / 0.14);
    padding: 5px 12px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.78rem;
  }
  .cs-styles button:hover,
  .cs-toggle:hover { background: rgb(255 255 255 / 0.16); }
  .cs-styles button.active {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1b1130; border-color: rgb(255 255 255 / 0.4);
  }
  .cs-row input[type='range'] {
    flex: 1; appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none; min-width: 140px;
  }
  .cs-row input[type='range']::-webkit-slider-thumb {
    appearance: none; -webkit-appearance: none;
    width: 14px; height: 14px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6);
  }
  .cs-val { font-size: 0.78rem; color: #d6c7ee; min-width: 46px; text-align: right; }

  @media (max-width: 768px) {
    .pixel-clock.is-pinned {
      /* 手机端 pinned 左右贴边，占满宽度 */
      left: max(env(safe-area-inset-left, 0px), 10px);
      right: max(env(safe-area-inset-right, 0px), 10px);
      bottom: max(env(safe-area-inset-bottom, 0px), 12px);
      min-width: 0; max-width: none;
    }
    .pixel-clock.is-free {
      left: 10px !important; right: 10px !important;
      width: auto !important;
      height: auto !important;
      min-width: 0;
    }
    .clock-time { letter-spacing: 3px; }
  }
</style>
