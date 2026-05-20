<script lang="ts">
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type Folder = { name: string; count: number; words: number };
  type Month  = { month: string; label: string; count: number };
  type Tag    = { name: string; count: number };
  type Day    = { date: string; count: number };
  type Stats  = {
    generatedAt: string;
    totalNotes: number;
    totalWords: number;
    byFolder: Folder[];
    byMonth: Month[];
    topTags: Tag[];
    heatmap: Day[];
  };

  const LAYOUT_KEY = 'second-brain:stats-layout';
  const STATE_KEY  = 'second-brain:stats-state';

  let stats = $state<Stats | null>(null);
  let loadErr = $state<string | null>(null);
  let minimized = $state(false);
  let maximized = $state(false);
  let bgAlpha = $state(0.72);
  let showSettings = $state(false);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(560);
  let height = $state(520);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  onMount(() => {
    void loadStats();
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 380, 1100);
        if (typeof s.h === 'number') height = clamp(s.h, 320, 900);
        rotation = layoutRotation(s);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 90));
      posY = Math.max(24, Math.min(window.innerHeight - height - 24, 90));
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  async function loadStats() {
    try {
      // 走构建时静态资源（src/data 通过 import 才能拿到）；这里用 dynamic import 注入。
      const mod = await import('../../data/stats.json');
      stats = (mod.default ?? mod) as Stats;
    } catch (e) {
      loadErr = '尚未生成 stats.json，请运行 pnpm prepare:vault';
    }
  }

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    if (typeof window === 'undefined') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    posX = clamp(posX, 4, Math.max(4, W - width - 4));
    posY = clamp(posY, 4, Math.max(4, H - 80));
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function persistState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ minimized, maximized, bgAlpha })); } catch {}
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
  function doMinimize() { minimized = !minimized; if (minimized) maximized = false; persistState(); }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persistState(); }
  function toggleSettings() { showSettings = !showSettings; }

  /** 三档自适应：small / medium / large */
  const sizeMode = $derived<'sm' | 'md' | 'lg'>(width < 460 ? 'sm' : width < 780 ? 'md' : 'lg');

  // ---- 图表计算 ----
  const maxFolder = $derived<number>(stats ? Math.max(1, ...stats.byFolder.map((f) => f.count)) : 1);
  const maxMonth  = $derived<number>(stats ? Math.max(1, ...stats.byMonth.map((m) => m.count)) : 1);
  const maxTag    = $derived<number>(stats ? Math.max(1, ...stats.topTags.map((t) => t.count)) : 1);
  const maxDay    = $derived<number>(stats ? Math.max(1, ...stats.heatmap.map((d) => d.count)) : 1);

  // 月度趋势 polyline 点
  const monthPath = $derived.by<string>(() => {
    if (!stats) return '';
    const w = 100, h = 100;
    const xs = stats.byMonth;
    return xs.map((m, i) => {
      const x = (i / Math.max(1, xs.length - 1)) * w;
      const y = h - (m.count / maxMonth) * (h - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  });
  const monthArea = $derived.by<string>(() => {
    if (!stats) return '';
    const w = 100, h = 100;
    const pts = stats.byMonth.map((m, i) => {
      const x = (i / Math.max(1, stats.byMonth.length - 1)) * w;
      const y = h - (m.count / maxMonth) * (h - 4) - 2;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return `0,${h} ${pts.join(' ')} ${w},${h}`;
  });

  function dayColor(c: number) {
    if (c === 0) return 'rgb(255 255 255 / 0.06)';
    const t = Math.min(1, c / maxDay);
    // 紫粉渐变
    const lightness = 30 + 35 * t;
    return `hsl(${300 - 40 * t} 80% ${lightness}%)`;
  }

  // 把 84 天分成 12 列 × 7 行（按星期）
  const heatmapCols = $derived.by<Day[][]>(() => {
    if (!stats) return [];
    const cols: Day[][] = [];
    // 第一天对齐到星期
    const first = stats.heatmap[0];
    const firstDate = first ? new Date(first.date) : new Date();
    const firstDow = firstDate.getDay();
    // 在前面填充空白
    const padded: (Day | null)[] = [];
    for (let i = 0; i < firstDow; i++) padded.push(null);
    padded.push(...stats.heatmap);
    while (padded.length % 7 !== 0) padded.push(null);
    for (let c = 0; c < padded.length / 7; c++) {
      cols.push(padded.slice(c * 7, c * 7 + 7) as Day[]);
    }
    return cols;
  });

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
      { minWidth: 320, minHeight: 300, maxWidth: 1400, maxHeight: 1100 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="stats-widget size-{sizeMode} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="学习统计"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="sw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="sw-title">
      <span aria-hidden="true">📊</span>
      <span>学习统计</span>
      <span class="sw-mode-tag">{sizeMode === 'sm' ? '紧凑' : sizeMode === 'md' ? '标准' : '宽屏'}</span>
    </div>
    {#if stats}
      <span class="sw-meta" data-no-drag>更新于 {new Date(stats.generatedAt).toLocaleDateString()}</span>
    {/if}
    <button type="button" class="sw-cog" onclick={toggleSettings} aria-label="设置" data-no-drag>⚙</button>
  </header>

  {#if !minimized}
    {#if showSettings}
      <div class="sw-cfg" data-no-drag>
        <label class="sw-cfg-row">
          <span>毛玻璃透明度</span>
          <input type="range" min="0.05" max="0.95" step="0.05"
                 value={bgAlpha}
                 oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persistState(); }} />
          <span class="sw-cfg-val">{Math.round(bgAlpha * 100)}%</span>
        </label>
        <p class="sw-cfg-tip">提示：拖动边缘改变大小，可触发 紧凑 / 标准 / 宽屏 三种布局。当前 {width}×{height}px</p>
      </div>
    {/if}
    <div class="sw-body" data-no-drag>
      {#if loadErr}
        <p class="sw-empty">{loadErr}</p>
      {:else if !stats}
        <p class="sw-empty">载入中…</p>
      {:else}
        <!-- KPI -->
        <div class="sw-kpis">
          {#if sizeMode === 'sm'}
            <div class="kpi big">
              <div class="kpi-num">{stats.totalNotes}</div>
              <div class="kpi-label">笔记总数</div>
              <div class="kpi-sub">{(stats.totalWords / 1000).toFixed(1)}k 字 · {stats.byFolder.length} 目录</div>
            </div>
          {:else}
            <div class="kpi">
              <div class="kpi-num">{stats.totalNotes}</div>
              <div class="kpi-label">笔记总数</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">{(stats.totalWords / 1000).toFixed(1)}<small>k</small></div>
              <div class="kpi-label">字符总量</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">{stats.topTags.length}</div>
              <div class="kpi-label">活跃标签</div>
            </div>
            <div class="kpi">
              <div class="kpi-num">{stats.byMonth.reduce((s, m) => s + m.count, 0)}</div>
              <div class="kpi-label">近 12 月活跃</div>
            </div>
          {/if}
        </div>

        <div class="sw-grid">
        <!-- 月度趋势折线 -->
        <section class="card card-trend">
          <header class="card-head">
            <h3>月度活跃趋势</h3>
            <span class="card-sub">最近 12 个月</span>
          </header>
          <svg viewBox="0 0 100 110" class="chart" preserveAspectRatio="none" aria-label="月度活跃趋势">
            <defs>
              <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ffd0e6" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#b48cff" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon points={monthArea} fill="url(#line-fill)" />
            <polyline points={monthPath} fill="none" stroke="#ffd0e6" stroke-width="0.8" stroke-linejoin="round" stroke-linecap="round" />
            {#each stats.byMonth as m, i}
              <circle
                cx={(i / Math.max(1, stats.byMonth.length - 1)) * 100}
                cy={100 - (m.count / maxMonth) * 96 - 2}
                r="1.2"
                fill="#fff"
              >
                <title>{m.month} · {m.count} 笔</title>
              </circle>
            {/each}
          </svg>
          <div class="chart-x">
            {#each stats.byMonth as m}
              <span>{m.label}</span>
            {/each}
          </div>
        </section>

        <!-- 顶层目录 -->
        <section class="card card-folders">
          <header class="card-head">
            <h3>知识结构</h3>
            <span class="card-sub">按顶层目录</span>
          </header>
          <ul class="bars">
            {#each stats.byFolder as f}
              <li>
                <span class="bar-label" title={f.name}>{f.name}</span>
                <span class="bar-track">
                  <span class="bar-fill" style={`width: ${(f.count / maxFolder) * 100}%`}></span>
                </span>
                <span class="bar-val">{f.count}</span>
              </li>
            {/each}
          </ul>
        </section>

        <!-- 热力图 -->
        <section class="card card-heat">
          <header class="card-head">
            <h3>编辑热力图</h3>
            <span class="card-sub">最近 12 周</span>
          </header>
          <div class="heatmap">
            {#each heatmapCols as col}
              <div class="hm-col">
                {#each col as d}
                  {#if d == null}
                    <span class="hm-cell hm-empty"></span>
                  {:else}
                    <span class="hm-cell" style={`background:${dayColor(d.count)}`} title={`${d.date} · ${d.count} 次编辑`}></span>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        </section>

        <!-- 标签 -->
        <section class="card card-tags">
          <header class="card-head">
            <h3>常用标签</h3>
            <span class="card-sub">Top {stats.topTags.length}</span>
          </header>
          {#if stats.topTags.length === 0}
            <p class="sw-empty">笔记里还没有 frontmatter tags</p>
          {:else}
            <div class="tag-cloud">
              {#each stats.topTags as t}
                <span
                  class="tag-chip"
                  style={`font-size:${0.7 + (t.count / maxTag) * 0.7}rem; opacity:${0.55 + (t.count / maxTag) * 0.45};`}
                  title={`${t.count} 次`}
                >#{t.name} <em>{t.count}</em></span>
              {/each}
            </div>
          {/if}
        </section>
        </div>
      {/if}
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={320} minHeight={300}
      maxWidth={1400} maxHeight={1100}
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
  .stats-widget {
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
    overflow: hidden;
    touch-action: none;
  }
  .stats-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .stats-widget.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .sw-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .stats-widget.is-active-drag .sw-header { cursor: grabbing; }
  .stats-widget.is-maximized .sw-header { cursor: default; }
  .sw-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .sw-mode-tag {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 999px;
    padding: 1px 8px;
    font-size: 0.62rem;
    color: #d6c7ee;
    letter-spacing: 0.5px;
  }
  .sw-meta { margin-left: auto; color: #b6a8d3; font-size: 0.72rem; }
  .sw-cog {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.85rem;
  }
  .sw-cog:hover { background: rgb(255 255 255 / 0.16); }

  .sw-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
    display: flex; flex-direction: column; gap: 6px;
  }
  .sw-cfg-row {
    display: grid;
    grid-template-columns: minmax(120px, 35%) 1fr 56px;
    gap: 10px;
    align-items: center;
    font-size: 0.76rem;
    color: #ddd0f1;
  }
  .sw-cfg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .sw-cfg-row input[type='range']::-webkit-slider-thumb,
  .sw-cfg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }
  .sw-cfg-val { text-align: right; font-variant-numeric: tabular-nums; }
  .sw-cfg-tip { margin: 2px 0 0; font-size: 0.66rem; color: #9e8fc0; }

  .sw-body {
    padding: 14px 16px 16px;
    overflow: auto;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sw-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr;
  }
  /* 大屏：2 列网格 */
  .stats-widget.size-lg .sw-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    grid-template-areas:
      'trend  folders'
      'heat   tags';
  }
  .stats-widget.size-lg .card-trend   { grid-area: trend; }
  .stats-widget.size-lg .card-folders { grid-area: folders; }
  .stats-widget.size-lg .card-heat    { grid-area: heat; }
  .stats-widget.size-lg .card-tags    { grid-area: tags; }
  /* 小尺寸隐藏次要面板 */
  .stats-widget.size-sm .card-tags { display: none; }
  .stats-widget.size-sm .card-folders .bars { max-height: 140px; overflow: auto; }
  .stats-widget.size-sm .chart { height: 70px; }
  .stats-widget.size-sm .chart-x span:nth-child(odd) { visibility: hidden; }
  .stats-widget.size-sm .heatmap { transform: scale(0.85); transform-origin: top left; }

  .sw-empty { color: #b6a8d3; font-size: 0.85rem; padding: 16px; text-align: center; }

  .sw-kpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .stats-widget.size-sm .sw-kpis { grid-template-columns: 1fr; }
  .stats-widget.size-md .sw-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .kpi.big { padding: 16px 20px; }
  .kpi.big .kpi-num { font-size: 2.6rem; }
  .kpi-sub { color: #b6a8d3; font-size: 0.74rem; margin-top: 6px; }
  .kpi {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 12px;
    padding: 10px 12px;
    text-align: center;
  }
  .kpi-num {
    font-size: 1.55rem;
    font-weight: 700;
    color: #fff5ff;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
  }
  .kpi-num small { font-size: 0.7em; color: #d4c6f7; margin-left: 1px; }
  .kpi-label { font-size: 0.7rem; color: #c8b9e2; margin-top: 4px; letter-spacing: 1px; }

  .card {
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .card-head {
    display: flex; align-items: baseline; justify-content: space-between;
    border-bottom: 1px dashed rgb(255 255 255 / 0.08);
    padding-bottom: 6px;
  }
  .card-head h3 { margin: 0; font-size: 0.86rem; color: #fff; letter-spacing: 1px; font-weight: 600; }
  .card-sub { color: #b6a8d3; font-size: 0.72rem; }

  /* 折线 */
  .chart {
    width: 100%;
    height: 120px;
    background: linear-gradient(180deg, rgb(255 255 255 / 0.02), transparent);
    border-radius: 8px;
  }
  .chart-x {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    font-size: 0.65rem;
    color: #b6a8d3;
  }
  .chart-x span { text-align: center; }

  /* 横向 bar */
  .bars {
    list-style: none;
    margin: 0; padding: 0;
    display: flex; flex-direction: column;
    gap: 6px;
  }
  .bars li {
    display: grid;
    grid-template-columns: minmax(70px, 26%) 1fr 36px;
    align-items: center;
    gap: 10px;
    font-size: 0.78rem;
  }
  .bar-label {
    color: #ece4ff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bar-track {
    height: 8px;
    background: rgb(255 255 255 / 0.06);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 0.06);
  }
  .bar-fill {
    display: block; height: 100%;
    background: linear-gradient(90deg, #ffd0e6, #b48cff);
    border-radius: 999px;
    box-shadow: 0 0 6px rgb(180 140 255 / 0.6);
    transition: width 0.6s ease;
  }
  .bar-val { color: #d6c7ee; text-align: right; font-variant-numeric: tabular-nums; }

  /* 热力图 */
  .heatmap {
    display: grid;
    grid-auto-flow: column;
    gap: 3px;
    overflow-x: auto;
  }
  .hm-col { display: grid; grid-template-rows: repeat(7, 1fr); gap: 3px; }
  .hm-cell {
    width: 12px; height: 12px;
    border-radius: 3px;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.05);
    display: block;
  }
  .hm-empty { visibility: hidden; }

  /* tag 云 */
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag-chip {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    color: #ece4ff;
    border-radius: 999px;
    padding: 3px 10px;
    line-height: 1.6;
  }
  .tag-chip em { color: #b48cff; font-style: normal; margin-left: 4px; font-size: 0.85em; }

  @media (max-width: 768px) {
    .stats-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 80px) !important;
      width: auto !important; height: 70vh !important;
    }
    .sw-kpis { grid-template-columns: repeat(2, 1fr); }
  }
</style>
