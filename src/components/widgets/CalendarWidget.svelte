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
  import { hudCountdown, isUrgentEvent } from '../../lib/hud-widget-ui';
  import { getWidgetTier, tierClass } from '../../lib/widget-size-tier';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type CalEvent = {
    id: string;
    title: string;
    start: number; // ms
    end: number;   // ms
    allDay: boolean;
  };

  const STATE_KEY = 'second-brain:cal-state';
  const LAYOUT_KEY = 'second-brain:cal-layout';

  let cursorYM = $state<{ y: number; m: number }>({ y: new Date().getFullYear(), m: new Date().getMonth() });
  let icsUrl = $state('');
  let urlInput = $state('');
  let events = $state<CalEvent[]>([]);
  let lastSync = $state<number | null>(null);
  let loading = $state(false);
  let syncError = $state<string | null>(null);
  let minimized = $state(false);
  let maximized = $state(false);
  let showSettings = $state(false);
  let bgAlpha = $state(0.7);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(380);
  let height = $state(460);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let nowMs = $state(Date.now());

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.icsUrl === 'string') icsUrl = s.icsUrl;
        if (Array.isArray(s.events)) events = s.events;
        if (typeof s.lastSync === 'number') lastSync = s.lastSync;
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
        if (typeof s.w === 'number') width = clamp(s.w, 300, 900);
        if (typeof s.h === 'number') height = clamp(s.h, 320, 900);
        rotation = layoutRotation(s);
      }
    } catch {}
    urlInput = icsUrl;
    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 100));
      posY = Math.max(24, Math.min(window.innerHeight - height - 24, 140));
    }
    clampPos();

    if (icsUrl && (!lastSync || Date.now() - lastSync > 30 * 60 * 1000)) {
      void syncIcs();
    }

    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    const tick = window.setInterval(() => { nowMs = Date.now(); }, 30_000);
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(tick);
    };
  });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    if (typeof window === 'undefined') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    posX = clamp(posX, 4, Math.max(4, W - width - 4));
    posY = clamp(posY, 4, Math.max(4, H - 80));
  }
  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ icsUrl, events, lastSync, minimized, maximized, bgAlpha }));
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

  async function syncIcs() {
    if (!icsUrl) return;
    loading = true;
    syncError = null;
    try {
      const res = await fetch(icsUrl, { credentials: 'omit' });
      if (!res.ok) throw new Error('http_' + res.status);
      const text = await res.text();
      events = parseIcs(text);
      lastSync = Date.now();
      persist();
    } catch (e) {
      syncError = '同步失败（很多日历服务跨域限制；请确认 URL 支持 CORS）';
    } finally {
      loading = false;
    }
  }

  function saveUrl() {
    icsUrl = urlInput.trim();
    persist();
    if (icsUrl) void syncIcs();
    else { events = []; lastSync = null; persist(); }
  }
  function clearUrl() {
    icsUrl = '';
    urlInput = '';
    events = [];
    lastSync = null;
    persist();
  }

  function parseIcs(text: string): CalEvent[] {
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);
    const out: CalEvent[] = [];
    let cur: Partial<CalEvent> & { _start?: string; _end?: string; _allDay?: boolean } | null = null;
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
      if (line === 'END:VEVENT') {
        if (cur && cur._start) {
          const start = parseIcsDate(cur._start);
          const end = cur._end ? parseIcsDate(cur._end) : start + (cur._allDay ? 86400000 : 3600000);
          out.push({
            id: (cur as any).id || `${start}-${cur.title || ''}`,
            title: cur.title || '(无标题)',
            start,
            end,
            allDay: !!cur._allDay,
          });
        }
        cur = null;
        continue;
      }
      if (!cur) continue;
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const keyRaw = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = keyRaw.split(';')[0].toUpperCase();
      const allDay = /VALUE=DATE/i.test(keyRaw);
      if (key === 'SUMMARY') cur.title = unescapeIcs(value);
      else if (key === 'DTSTART') { cur._start = value; if (allDay) cur._allDay = true; }
      else if (key === 'DTEND')   { cur._end = value; }
      else if (key === 'UID')      (cur as any).id = value;
    }
    return out.sort((a, b) => a.start - b.start);
  }
  function unescapeIcs(s: string) {
    return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }
  function parseIcsDate(v: string): number {
    // 20250601 (all-day) | 20250601T093000Z | 20250601T093000
    if (/^\d{8}$/.test(v)) {
      const y = +v.slice(0, 4), m = +v.slice(4, 6), d = +v.slice(6, 8);
      return new Date(y, m - 1, d).getTime();
    }
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (m) {
      const [, Y, M, D, h, mi, s, z] = m;
      if (z === 'Z') return Date.UTC(+Y, +M - 1, +D, +h, +mi, +s);
      return new Date(+Y, +M - 1, +D, +h, +mi, +s).getTime();
    }
    return Date.now();
  }

  // ---- 月历构建 ----
  type Cell = { date: Date; inMonth: boolean; events: CalEvent[]; today: boolean };

  const cells = $derived.by<Cell[]>(() => {
    const { y, m } = cursorYM;
    const first = new Date(y, m, 1);
    const firstWeekday = first.getDay(); // 0=Sun
    const startOffset = firstWeekday;
    const totalCells = 42;
    const grid: Cell[] = [];
    const todayY = new Date().getFullYear();
    const todayM = new Date().getMonth();
    const todayD = new Date().getDate();
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(y, m, i - startOffset + 1);
      const inMonth = d.getMonth() === m;
      const isToday = d.getFullYear() === todayY && d.getMonth() === todayM && d.getDate() === todayD;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dayEvents = events.filter((e) => e.start < dayEnd && e.end > dayStart);
      grid.push({ date: d, inMonth, events: dayEvents, today: isToday });
    }
    return grid;
  });

  const upcoming = $derived.by<CalEvent[]>(() => {
    const now = Date.now();
    return events.filter((e) => e.end >= now).sort((a, b) => a.start - b.start).slice(0, 6);
  });

  function prevMonth() {
    let { y, m } = cursorYM;
    m -= 1;
    if (m < 0) { m = 11; y -= 1; }
    cursorYM = { y, m };
  }
  function nextMonth() {
    let { y, m } = cursorYM;
    m += 1;
    if (m > 11) { m = 0; y += 1; }
    cursorYM = { y, m };
  }
  function today() {
    const d = new Date();
    cursorYM = { y: d.getFullYear(), m: d.getMonth() };
  }
  const monthLabel = $derived(`${cursorYM.y} 年 ${cursorYM.m + 1} 月`);
  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 320, expandedMin: 520 }));

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
  function fmtRange(e: CalEvent) {
    const s = new Date(e.start), en = new Date(e.end);
    if (e.allDay) {
      return `${s.getMonth() + 1}/${s.getDate()} 全天`;
    }
    const sd = `${s.getMonth() + 1}/${s.getDate()} ${pad(s.getHours())}:${pad(s.getMinutes())}`;
    const ed = `${pad(en.getHours())}:${pad(en.getMinutes())}`;
    return `${sd} - ${ed}`;
  }
  function pad(n: number) { return n < 10 ? '0' + n : '' + n; }
  function fmtSync(ts: number | null) {
    if (!ts) return '尚未同步';
    const diff = Date.now() - ts;
    if (diff < 60_000) return '刚刚';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    return `${Math.floor(diff / 3600_000)} 小时前`;
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
      { minWidth: 300, minHeight: 320, maxWidth: 900, maxHeight: 900 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="cal-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="日历"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="cal-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="cal-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.calendar} size={14} /></span>
      <span>日历</span>
    </div>
    <button
      type="button"
      class="cal-settings-btn"
      onclick={toggleSettings}
      aria-label="日历设置"
      title="日历设置"
      data-no-drag
    >⚙</button>
  </header>

  {#if !minimized && showSettings}
    <div class="cal-bg-cfg" data-no-drag>
      <label class="cal-bg-row">
        <span>毛玻璃透明度</span>
        <input type="range" min="0.05" max="0.95" step="0.05"
               value={bgAlpha}
               oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
        <span>{Math.round(bgAlpha * 100)}%</span>
      </label>
    </div>
  {/if}

  {#if !minimized}
    <div class="cal-toolbar" data-no-drag>
      <button type="button" class="cal-nav" onclick={prevMonth} aria-label="上个月">‹</button>
      <span class="cal-month">{monthLabel}</span>
      <button type="button" class="cal-nav" onclick={nextMonth} aria-label="下个月">›</button>
      <button type="button" class="cal-today" onclick={today}>今天</button>
    </div>

    {#if showSettings}
      <div class="cal-cfg" data-no-drag>
        <label class="cal-cfg-label">iCal URL（支持 .ics / Google 日历公开订阅地址）</label>
        <div class="cal-cfg-row">
          <input
            type="url"
            class="cal-url"
            placeholder="https://calendar.google.com/calendar/ical/..."
            bind:value={urlInput}
          />
          <button type="button" class="cal-save" onclick={saveUrl} disabled={!urlInput.trim()}>保存</button>
          {#if icsUrl}
            <button type="button" class="cal-clear" onclick={clearUrl}>清除</button>
          {/if}
        </div>
        <div class="cal-cfg-row">
          <button type="button" class="cal-sync" onclick={syncIcs} disabled={!icsUrl || loading}>
            {loading ? '同步中…' : '立即同步'}
          </button>
          <span class="cal-sync-meta">最后同步：{fmtSync(lastSync)} · 事件 {events.length} 条</span>
        </div>
        {#if syncError}
          <div class="cal-err">{syncError}</div>
        {/if}
      </div>
    {/if}

    <div class="cal-grid" data-no-drag>
      <div class="cal-row weekday">
        {#each ['日', '一', '二', '三', '四', '五', '六'] as w}
          <div class="cal-wd">{w}</div>
        {/each}
      </div>
      <div class="cal-month-grid">
        {#each cells as c}
          <div class="cal-cell {c.inMonth ? '' : 'is-out'} {c.today ? 'is-today' : ''}" title={c.events.map((e) => e.title).join('\n')}>
            <span class="cal-day">{c.date.getDate()}</span>
            {#if c.events.length > 0}
              <span class="cal-dots">
                {#each c.events.slice(0, 3) as _}<span class="cal-dot"></span>{/each}
                {#if c.events.length > 3}<span class="cal-more">+{c.events.length - 3}</span>{/if}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="cal-upcoming" data-no-drag>
      <header class="cal-up-head">即将到来</header>
      {#if upcoming.length === 0}
        <p class="cal-up-empty">{icsUrl ? '近期没有事件' : '点击右上角 ⚙ 添加 iCal URL'}</p>
      {:else}
        <ul>
          {#each upcoming as e (e.id)}
            {@const urgent = isUrgentEvent(e.start, nowMs)}
            <li class:cal-mission-urgent={urgent}>
              <span class="cal-hud-mark" aria-hidden="true">{urgent ? '◢' : '▶'}</span>
              <span class="cal-up-title">{e.title}</span>
              <span class="cal-up-time">
                <span class="cal-hud-countdown">{urgent ? hudCountdown(e.start, nowMs) : fmtRange(e)}</span>
                <span class="cal-hud-plain">{fmtRange(e)}</span>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={300} minHeight={320}
      maxWidth={900} maxHeight={900}
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
  .cal-widget {
    --w-bg-alpha: 0.7;
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
    overflow: hidden;
    touch-action: none;
  }
  .cal-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .cal-widget.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .cal-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .cal-widget.is-active-drag .cal-header { cursor: grabbing; }
  .cal-widget.is-maximized .cal-header { cursor: default; }
  .cal-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .cal-settings-btn {
    margin-left: auto;
    width: 26px; height: 26px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .cal-settings-btn:hover { background: rgb(255 255 255 / 0.14); }

  .cal-bg-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
  }
  .cal-bg-row {
    display: grid;
    grid-template-columns: minmax(110px, 35%) 1fr 42px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .cal-bg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .cal-bg-row input[type='range']::-webkit-slider-thumb,
  .cal-bg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }

  .cal-toolbar {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px 4px;
  }
  .cal-nav {
    width: 28px; height: 28px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; border-radius: 8px;
    font-size: 0.95rem;
  }
  .cal-nav:hover { background: rgb(255 255 255 / 0.14); }
  .cal-month { font-weight: 600; font-size: 0.92rem; flex: 1; text-align: center; }
  .cal-today {
    background: rgb(124 92 200 / 0.32);
    border: 1px solid rgb(180 140 255 / 0.5);
    color: #f8eeff;
    padding: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.74rem;
  }

  .cal-cfg {
    padding: 10px 12px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
    display: flex; flex-direction: column; gap: 8px;
    font-size: 0.78rem;
  }
  .cal-cfg-label { color: #c8b9e2; font-size: 0.72rem; }
  .cal-cfg-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .cal-url {
    flex: 1;
    min-width: 160px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 8px;
    color: #f3ecff;
    padding: 4px 10px;
    font-size: 0.76rem;
    outline: none;
  }
  .cal-save, .cal-sync {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    border: 1px solid rgb(255 255 255 / 0.4);
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.74rem;
  }
  .cal-save:disabled, .cal-sync:disabled { opacity: 0.5; cursor: not-allowed; }
  .cal-clear {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff;
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.74rem;
  }
  .cal-sync-meta { font-size: 0.72rem; color: #aa97cf; }
  .cal-err { color: #ffb3b3; font-size: 0.74rem; }

  .cal-grid {
    padding: 6px 12px 0;
  }
  .cal-row.weekday {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 0.72rem;
    color: #b6a8d3;
    padding-bottom: 4px;
  }
  .cal-month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: minmax(40px, 1fr);
    gap: 2px;
  }
  .cal-cell {
    position: relative;
    padding: 4px 6px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 0;
  }
  .cal-cell.is-out { opacity: 0.35; }
  .cal-cell.is-today {
    background: rgb(124 92 200 / 0.32);
    border-color: rgb(180 140 255 / 0.5);
    color: #fff;
  }
  .cal-day {
    font-size: 0.78rem;
    font-weight: 500;
  }
  .cal-dots {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }
  .cal-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #ffb1de;
    box-shadow: 0 0 4px rgb(255 177 222 / 0.7);
  }
  .cal-more { font-size: 0.62rem; color: #d6c7ee; }

  .cal-upcoming {
    margin-top: auto;
    padding: 10px 12px 12px;
    overflow: auto;
    border-top: 1px solid rgb(255 255 255 / 0.08);
    flex: 0 0 auto;
    max-height: 35%;
  }
  .cal-up-head {
    font-size: 0.72rem;
    color: #b6a8d3;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .cal-up-empty { color: #b6a8d3; font-size: 0.82rem; margin: 0; }
  .cal-upcoming ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .cal-upcoming li {
    display: flex; align-items: center; gap: 10px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.08);
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 0.76rem;
  }
  .cal-hud-mark,
  .cal-hud-countdown { display: none; }
  .cal-up-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #ece4ff; }
  .cal-up-time { color: #cbb9e6; font-size: 0.7rem; flex-shrink: 0; }

  @media (max-width: 768px) {
    .cal-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 90px) !important;
      width: auto !important; height: 65vh !important;
    }
  }
</style>
