<script lang="ts">
  import { clampPosition, spawnPosition } from '../../lib/floating-widget-layout';
  import { onMount, tick } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { getWidgetTier, tierClass, TIER_LABEL } from '../../lib/widget-size-tier';
  import PixelIcon from '../PixelIcon.svelte';
  import { WIDGET_ICON_MAP } from '../../lib/pixel-icons';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type TodoItem = {
    id: string;
    text: string;
    done: boolean;       // 在方框勾选 → 已完成
    cancelled: boolean;  // 一键划掉 → 取消
    createdAt: number;
  };

  const STATE_KEY = 'second-brain:todo-state';
  const LAYOUT_KEY = 'second-brain:todo-layout';

  let items = $state<TodoItem[]>([]);
  let draft = $state('');
  let minimized = $state(false);
  let maximized = $state(false);
  let bgAlpha = $state(0.7);
  let showSettings = $state(false);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(380);
  let height = $state(460);
  let rootEl: HTMLElement | null = null;
  let inputEl: HTMLInputElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  const stats = $derived.by(() => {
    const total = items.length;
    const done = items.filter((i) => i.done).length;
    const cancelled = items.filter((i) => i.cancelled).length;
    const active = items.filter((i) => !i.done && !i.cancelled).length;
    return { total, done, cancelled, active };
  });

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.items)) {
          // 兼容老数据（没有 cancelled 字段）
          items = s.items.map((it: any) => ({
            id: String(it.id ?? cryptoId()),
            text: String(it.text ?? ''),
            done: !!it.done,
            cancelled: !!it.cancelled,
            createdAt: typeof it.createdAt === 'number' ? it.createdAt : Date.now(),
          }));
        }
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
        if (typeof s.w === 'number') width = clamp(s.w, 260, 800);
        if (typeof s.h === 'number') height = clamp(s.h, 260, 800);
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
    return () => window.removeEventListener('resize', onResize);
  });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }
  function persist() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ items, minimized, maximized, bgAlpha })); } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  async function addItem() {
    const text = draft.trim();
    if (!text) return;
    items = [...items, { id: cryptoId(), text, done: false, cancelled: false, createdAt: Date.now() }];
    draft = '';
    persist();
    await tick();
    inputEl?.focus();
  }
  function toggleDone(id: string) {
    items = items.map((i) => i.id === id ? { ...i, done: !i.done, cancelled: i.done ? i.cancelled : false } : i);
    persist();
  }
  function toggleCancel(id: string) {
    items = items.map((i) => i.id === id ? { ...i, cancelled: !i.cancelled, done: i.cancelled ? i.done : false } : i);
    persist();
  }
  function removeItem(id: string) {
    items = items.filter((i) => i.id !== id);
    persist();
  }
  function clearFinished() {
    items = items.filter((i) => !i.done && !i.cancelled);
    persist();
  }

  function cryptoId() {
    try { return crypto.randomUUID(); } catch { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
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
      { minWidth: 260, minHeight: 260, maxWidth: 900, maxHeight: 900 }
    )
  );

  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 280 }));
</script>

<section
  bind:this={rootEl}
  class="todo-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="待办清单"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="tw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="tw-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.todo} size={14} /></span>
      <span>待办</span>
      <span class="tw-tier">{TIER_LABEL[tier]}</span>
    </div>
    <div class="tw-stats" data-no-drag title={`已完成 ${stats.done} · 已取消 ${stats.cancelled} · 未完成 ${stats.active}`}>
      {stats.done + stats.cancelled}/{stats.total}
    </div>
    <button type="button" class="tw-cog" onclick={toggleSettings} aria-label="设置" data-no-drag>⚙</button>
  </header>

  {#if !minimized && showSettings}
    <div class="tw-cfg" data-no-drag>
      <label class="tw-cfg-row">
        <span>毛玻璃透明度</span>
        <input type="range" min="0.05" max="0.95" step="0.05"
               value={bgAlpha}
               oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
        <span>{Math.round(bgAlpha * 100)}%</span>
      </label>
    </div>
  {/if}

  {#if !minimized}
    <div class="tw-input-bar" data-no-drag>
      <input
        type="text"
        class="tw-input"
        placeholder="新增待办，回车提交"
        bind:value={draft}
        bind:this={inputEl}
        onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
      />
      <button type="button" class="tw-add" onclick={addItem} aria-label="添加">＋</button>
    </div>

    {#if stats.done + stats.cancelled > 0}
      {#if tier !== 'compact'}
      <div class="tw-actions" data-no-drag>
        <button type="button" class="tw-clear" onclick={clearFinished}>清除已完成 / 已划掉</button>
      </div>
      {/if}
    {/if}

    <ul class="tw-list" data-no-drag>
      {#each items as it (it.id)}
        <li class="tw-item {it.done ? 'is-done' : ''} {it.cancelled ? 'is-cancelled' : ''}">
          <label class="tw-check" title="勾选标记为已完成">
            <input type="checkbox" checked={it.done} onchange={() => toggleDone(it.id)} aria-label={`完成: ${it.text}`} />
            <span class="tw-box" aria-hidden="true"></span>
          </label>
          <span class="tw-text">{it.text}</span>
          <button
            type="button"
            class="tw-strike {it.cancelled ? 'is-active' : ''}"
            onclick={() => toggleCancel(it.id)}
            title={it.cancelled ? '恢复' : '划掉 / 取消'}
            aria-label={it.cancelled ? '恢复' : '划掉'}
          >⌐</button>
          <button type="button" class="tw-del" onclick={() => removeItem(it.id)} aria-label="删除" title="删除">×</button>
        </li>
      {:else}
        <li class="tw-empty">还没有待办，敲一条试试</li>
      {/each}
    </ul>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={260} minHeight={260}
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
  .todo-widget {
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
  .todo-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .todo-widget.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .tw-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .todo-widget.is-active-drag .tw-header { cursor: grabbing; }
  .todo-widget.is-maximized .tw-header { cursor: default; }
  .tw-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .tw-cog {
    width: 24px; height: 24px; border-radius: 7px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.78rem;
  }
  .tw-cog:hover { background: rgb(255 255 255 / 0.16); }
  .tw-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
  }
  .tw-cfg-row {
    display: grid;
    grid-template-columns: minmax(110px, 35%) 1fr 42px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .tw-cfg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .tw-cfg-row input[type='range']::-webkit-slider-thumb,
  .tw-cfg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }

  .tw-stats {
    margin-left: 4px;
    font-size: 0.74rem;
    color: #cbb9e6;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 999px;
    padding: 2px 10px;
  }

  .tw-input-bar {
    display: flex; gap: 8px;
    padding: 10px 12px 0;
  }
  .tw-input {
    flex: 1;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 10px;
    padding: 6px 12px;
    color: #f3ecff;
    font-size: 0.86rem;
    outline: none;
  }
  .tw-input:focus { border-color: rgb(180 140 255 / 0.5); background: rgb(255 255 255 / 0.14); }
  .tw-add {
    width: 34px; height: 34px;
    border-radius: 10px;
    border: 1px solid rgb(255 255 255 / 0.2);
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }
  .tw-add:hover { filter: brightness(1.05); }

  .tw-actions {
    display: flex; justify-content: flex-end;
    padding: 8px 12px 0;
  }
  .tw-clear {
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.12);
    color: #d4c8ee;
    border-radius: 999px;
    padding: 4px 12px;
    cursor: pointer;
    font-size: 0.72rem;
  }
  .tw-clear:hover { background: rgb(255 255 255 / 0.12); }

  .tw-list {
    list-style: none;
    margin: 0;
    padding: 8px;
    overflow: auto;
    flex: 1;
    min-height: 0;
  }
  .tw-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 8px;
    border-radius: 10px;
    transition: background 0.15s ease;
  }
  .tw-item:hover { background: rgb(255 255 255 / 0.06); }

  .tw-check { position: relative; flex: 0 0 auto; width: 18px; height: 18px; cursor: pointer; }
  .tw-check input { opacity: 0; position: absolute; inset: 0; cursor: pointer; }
  .tw-box {
    display: block;
    width: 18px; height: 18px;
    border-radius: 6px;
    background: rgb(255 255 255 / 0.06);
    border: 1.5px solid rgb(255 255 255 / 0.3);
    transition: background 0.15s ease, border-color 0.15s ease;
    position: relative;
  }
  .tw-check input:checked + .tw-box {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    border-color: rgb(255 255 255 / 0.6);
  }
  .tw-check input:checked + .tw-box::after {
    content: '';
    position: absolute;
    left: 5px; top: 2px;
    width: 5px; height: 9px;
    border-right: 2px solid #1b0f2e;
    border-bottom: 2px solid #1b0f2e;
    transform: rotate(45deg);
  }

  .tw-text {
    flex: 1;
    min-width: 0;
    font-size: 0.88rem;
    color: #ece4ff;
    word-break: break-word;
    line-height: 1.45;
    transition: color 0.15s ease, opacity 0.15s ease;
  }
  /* 已完成：勾选 + 实心删除线 */
  .tw-item.is-done .tw-text {
    color: rgb(255 255 255 / 0.42);
    text-decoration: line-through;
    text-decoration-thickness: 2px;
    text-decoration-color: rgb(180 140 255 / 0.6);
  }
  /* 已划掉：仅删除线 + 灰化（视为放弃 / 取消） */
  .tw-item.is-cancelled .tw-text {
    color: rgb(255 255 255 / 0.32);
    text-decoration: line-through;
    text-decoration-thickness: 2px;
    text-decoration-color: rgb(255 130 130 / 0.7);
    font-style: italic;
  }

  .tw-strike,
  .tw-del {
    width: 26px; height: 26px;
    border: 1px solid transparent;
    background: transparent;
    color: rgb(255 255 255 / 0.5);
    cursor: pointer;
    border-radius: 6px;
    font-size: 0.95rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tw-strike { font-size: 0.78rem; font-weight: 700; }
  .tw-strike:hover { background: rgb(255 130 130 / 0.16); color: #ffd4d4; border-color: rgb(255 130 130 / 0.3); }
  .tw-strike.is-active {
    background: rgb(255 130 130 / 0.22);
    color: #ffe2e2;
    border-color: rgb(255 130 130 / 0.5);
  }
  .tw-del:hover { background: rgb(255 92 92 / 0.18); color: #ffdada; }
  .tw-empty { color: #b6a8d3; font-size: 0.82rem; padding: 22px 8px; text-align: center; list-style: none; }

  @media (max-width: 768px) {
    .todo-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 80px) !important;
      width: auto !important; height: 60vh !important;
    }
  }
</style>
