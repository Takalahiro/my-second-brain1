<script lang="ts">
  import { onMount } from 'svelte';
  import { untrack } from 'svelte';
  import { clampFabPosition, loadFabPosition, saveFabPosition } from '../../lib/draggable-fab';
  import PixelIcon from '../PixelIcon.svelte';
  import type { PixelIconName } from '../../lib/pixel-icons';

  type ToolKey = 'python' | 'matlab' | 'whiteboard';

  interface ToolItem {
    id: ToolKey;
    name: string;
    icon: PixelIconName;
    desc: string;
  }

  interface Props {
    enabled: Record<ToolKey, boolean>;
    onToggle: (key: ToolKey, drop?: { x: number; y: number }) => void;
  }
  let { enabled, onToggle }: Props = $props();

  let open = $state(false);
  let dragKey = $state<ToolKey | null>(null);
  let tileDidMove = false;
  let suppressTileClick = false;
  let dragGhost: HTMLDivElement | null = null;

  const FAB_POS_KEY = 'second-brain:notes-tool-btn-pos';
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

  function navClearance() {
    const header = document.querySelector('.site-header');
    if (header) return Math.ceil(header.getBoundingClientRect().bottom) + 10;
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--widget-safe-top').trim();
    if (raw) {
      const probe = document.createElement('div');
      probe.style.position = 'fixed';
      probe.style.top = raw;
      probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      const y = probe.getBoundingClientRect().top;
      probe.remove();
      if (Number.isFinite(y) && y > 0) return y + 8;
    }
    return window.matchMedia('(max-width: 640px)').matches ? 140 : 96;
  }

  function defaultFabPos() {
    const w = fabEl?.offsetWidth ?? 40;
    const h = fabEl?.offsetHeight ?? 40;
    const narrow = window.matchMedia('(max-width: 640px)').matches;
    const top = Math.max(navClearance(), narrow ? 120 : 88);
    const right = narrow ? 12 : 64;
    return clampFabPosition(window.innerWidth - w - right, top, w, h);
  }

  function initFabPos() {
    const stored = untrack(() => loadFabPosition(FAB_POS_KEY));
    const w = fabEl?.offsetWidth ?? 40;
    const h = fabEl?.offsetHeight ?? 40;
    const minTop = navClearance();
    if (stored) {
      const safeTop = Math.max(stored.top, minTop);
      const c = clampFabPosition(stored.left, safeTop, w, h);
      fabLeft = c.left;
      fabTop = c.top;
      if (safeTop !== stored.top) saveFabPosition(FAB_POS_KEY, fabLeft, fabTop);
    } else {
      const c = defaultFabPos();
      fabLeft = c.left;
      fabTop = c.top;
    }
    fabReady = true;
  }

  function onFabResize() {
    if (!fabReady) return;
    const c = clampFabPosition(fabLeft, fabTop, fabEl?.offsetWidth ?? 40, fabEl?.offsetHeight ?? 40);
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

  onMount(() => {
    if (fabEl) initFabPos();
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
      fabEl?.offsetWidth ?? 40,
      fabEl?.offsetHeight ?? 40,
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

  function toggleFab() {
    if (fabSuppressClick) {
      fabSuppressClick = false;
      return;
    }
    open = !open;
  }

  const items: ToolItem[] = [
    { id: 'python', name: 'Python', icon: 'python', desc: 'Pyodide 在线运行' },
    { id: 'matlab', name: 'MATLAB', icon: 'matlab', desc: '表达式 · 函数绘图' },
    { id: 'whiteboard', name: '白板', icon: 'pen', desc: 'Excalidraw 手绘' },
  ];

  function ensureGhost(label: string) {
    if (!dragGhost) {
      dragGhost = document.createElement('div');
      dragGhost.className = 'widget-drag-ghost';
      document.body.appendChild(dragGhost);
    }
    dragGhost.textContent = label;
  }
  function clearGhost() {
    dragGhost?.remove();
    dragGhost = null;
  }
  function moveGhost(x: number, y: number) {
    if (dragGhost) {
      dragGhost.style.left = x + 'px';
      dragGhost.style.top = y + 'px';
    }
  }

  function openTool(key: ToolKey) {
    if (!enabled[key]) onToggle(key);
  }

  function onTilePointerDown(e: PointerEvent, w: ToolItem) {
    if ((e.target as HTMLElement).closest('.ntd-actions, [data-no-drag]')) return;
    dragKey = w.id;
    tileDidMove = false;
    const sx = e.clientX;
    const sy = e.clientY;
    ensureGhost(w.name);
    moveGhost(e.clientX, e.clientY);
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - sx) > 4 || Math.abs(ev.clientY - sy) > 4) tileDidMove = true;
      moveGhost(ev.clientX, ev.clientY);
    };
    const onUp = (ev: PointerEvent) => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      try {
        el.releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      onTilePointerUp(ev, w);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    e.preventDefault();
  }
  function onTilePointerUp(e: PointerEvent, w: ToolItem) {
    if (!dragKey) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (tileDidMove) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const onDrawer = !!target?.closest('.notes-tool-drawer, .notes-tool-btn');
      if (!onDrawer) onToggle(w.id, { x: e.clientX, y: e.clientY });
      suppressTileClick = true;
    } else if (suppressTileClick) {
      suppressTileClick = false;
    } else {
      openTool(w.id);
    }
    clearGhost();
    dragKey = null;
    tileDidMove = false;
  }
</script>

<button
  type="button"
  bind:this={fabEl}
  class="notes-tool-btn"
  class:is-ready={fabReady}
  class:is-dragging={fabDragging}
  style:left={fabReady ? `${fabLeft}px` : undefined}
  style:top={fabReady ? `${fabTop}px` : undefined}
  aria-label={open ? '关闭笔记工具' : '打开笔记工具'}
  title="拖动移动 · 点击打开笔记工具"
  onpointerdown={onFabPointerDown}
  onpointermove={onFabPointerMove}
  onpointerup={onFabPointerUp}
  onpointercancel={onFabPointerUp}
  onclick={toggleFab}
>
  <PixelIcon name="gear" size={18} />
</button>

{#if open}
  <button type="button" class="notes-tool-mask" aria-label="关闭" onclick={() => (open = false)}></button>
{/if}

<aside class="notes-tool-drawer" class:is-open={open} aria-label="笔记工具抽屉">
  <header class="ntd-head">
    <h2>笔记工具</h2>
    <button type="button" class="ntd-x" onclick={() => (open = false)}>×</button>
  </header>
  <p class="ntd-hint">点击工具卡片打开 · 拖到页面可指定位置 · 开关可隐藏窗口</p>
  <ul class="ntd-list">
    {#each items as w (w.id)}
      <li>
        <div
          class="ntd-tile {dragKey === w.id ? 'is-dragging' : ''} {enabled[w.id] ? 'is-on' : ''}"
          role="button"
          tabindex="0"
          onpointerdown={(e) => onTilePointerDown(e, w)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openTool(w.id);
            }
          }}
        >
          <span class="ntd-icon" aria-hidden="true"><PixelIcon name={w.icon} size={18} /></span>
          <div>
            <div class="ntd-name">{w.name}</div>
            <div class="ntd-desc">{w.desc}</div>
          </div>
          <div class="ntd-actions" data-no-drag>
            <button
              type="button"
              class="ntd-open"
              onclick={(e) => {
                e.stopPropagation();
                openTool(w.id);
              }}
              onpointerdown={(e) => e.stopPropagation()}
            >
              打开
            </button>
            <label
              class="switch"
              data-no-drag
              onclick={(e) => e.stopPropagation()}
              onpointerdown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={enabled[w.id]}
                onclick={(e) => {
                  e.stopPropagation();
                  suppressTileClick = true;
                  onToggle(w.id);
                }}
                aria-label={`${w.name} 开关`}
              />
              <span></span>
            </label>
          </div>
        </div>
      </li>
    {/each}
  </ul>
</aside>

<style>
  .notes-tool-btn {
    position: fixed;
    top: calc(var(--widget-safe-top, 72px) + 10px);
    right: max(env(safe-area-inset-right, 0px), 64px);
    z-index: 125;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--chrome-border);
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    cursor: grab;
    font-size: 1.05rem;
    box-shadow: var(--shadow-normal);
    touch-action: none;
    user-select: none;
    transition: box-shadow 0.15s, transform 0.15s;
  }
  .notes-tool-btn.is-ready {
    right: auto;
  }
  .notes-tool-btn.is-dragging {
    cursor: grabbing;
    box-shadow: var(--shadow-hover);
    transition: none;
  }
  .notes-tool-btn:hover:not(.is-dragging) {
    background: var(--glass-bg-hover);
    transform: scale(1.05);
  }
  .notes-tool-mask {
    position: fixed;
    inset: 0;
    z-index: 124;
    border: 0;
    background: rgb(0 0 0 / 0.12);
    cursor: default;
  }
  .notes-tool-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    width: min(300px, 88vw);
    z-index: 126;
    padding: 16px 14px;
    background: var(--chrome-dropdown-bg);
    color: var(--chrome-text);
    border-left: 1px solid var(--chrome-border);
    box-shadow: var(--chrome-shadow);
    backdrop-filter: blur(16px);
    transform: translateX(100%);
    transition: transform 0.22s ease;
    overflow: auto;
  }
  .notes-tool-drawer.is-open {
    transform: translateX(0);
  }
  .ntd-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .ntd-head h2 {
    margin: 0;
    font-size: 0.95rem;
  }
  .ntd-x {
    background: var(--chrome-subtle);
    color: inherit;
    border: 1px solid var(--chrome-border);
    border-radius: 8px;
    width: 28px;
    height: 28px;
    cursor: pointer;
  }
  .ntd-hint {
    margin: 0 0 12px;
    font-size: 0.72rem;
    color: var(--chrome-text-muted);
    line-height: 1.4;
  }
  .ntd-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ntd-tile {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 10px;
    border-radius: 12px;
    background: var(--chrome-subtle);
    border: 1px solid var(--chrome-border);
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  .ntd-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .ntd-open {
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--chrome-border);
    background: rgb(180 140 255 / 0.15);
    color: inherit;
    font-size: 0.65rem;
    cursor: pointer;
  }
  .ntd-open:hover {
    background: rgb(180 140 255 / 0.28);
  }
  .ntd-tile.is-on {
    border-color: rgb(180 140 255 / 0.55);
  }
  .ntd-tile.is-dragging {
    opacity: 0.5;
  }
  .ntd-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .ntd-name {
    font-weight: 600;
    font-size: 0.86rem;
  }
  .ntd-desc {
    font-size: 0.68rem;
    color: var(--chrome-text-muted);
    margin-top: 2px;
  }
  .switch {
    position: relative;
    width: 34px;
    height: 20px;
    display: inline-block;
  }
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .switch span {
    position: absolute;
    inset: 0;
    background: rgb(255 255 255 / 0.18);
    border-radius: 999px;
    cursor: pointer;
  }
  .switch span::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    top: 3px;
    left: 3px;
    transition: transform 0.2s ease;
  }
  .switch input:checked + span {
    background: rgb(180 140 255 / 0.75);
  }
  .switch input:checked + span::before {
    transform: translateX(14px);
  }
  @media (max-width: 640px) {
    .notes-tool-btn:not(.is-ready) {
      right: max(env(safe-area-inset-right, 0px), 12px);
      top: calc(var(--widget-safe-top, 72px) + 56px);
    }
  }
</style>
