<script lang="ts">
  import { untrack } from 'svelte';
  import { clampFabPosition, loadFabPosition, saveFabPosition } from '../../lib/draggable-fab';

  type ToolKey = 'python' | 'matlab' | 'whiteboard';

  interface ToolItem {
    id: ToolKey;
    name: string;
    icon: string;
    desc: string;
  }

  interface Props {
    enabled: Record<ToolKey, boolean>;
    onToggle: (key: ToolKey, drop?: { x: number; y: number }) => void;
  }
  let { enabled, onToggle }: Props = $props();

  let open = $state(false);
  let dragKey = $state<ToolKey | null>(null);
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

  function defaultFabPos() {
    const w = fabEl?.offsetWidth ?? 40;
    const h = fabEl?.offsetHeight ?? 40;
    const narrow = window.matchMedia('(max-width: 640px)').matches;
    const top = narrow ? 140 : 88;
    const right = narrow ? 12 : 64;
    return clampFabPosition(window.innerWidth - w - right, top, w, h);
  }

  function initFabPos() {
    const stored = untrack(() => loadFabPosition(FAB_POS_KEY));
    if (stored) {
      const c = clampFabPosition(stored.left, stored.top, fabEl?.offsetWidth ?? 40, fabEl?.offsetHeight ?? 40);
      fabLeft = c.left;
      fabTop = c.top;
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
    { id: 'python', name: 'Python', icon: '🐍', desc: 'Pyodide 在线运行' },
    { id: 'matlab', name: 'MATLAB', icon: '🧮', desc: '表达式 · 函数绘图' },
    { id: 'whiteboard', name: '白板', icon: '✏️', desc: 'Excalidraw 手绘' },
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

  function onTilePointerDown(e: PointerEvent, w: ToolItem) {
    dragKey = w.id;
    ensureGhost(`${w.icon} ${w.name}`);
    moveGhost(e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onTilePointerMove(e: PointerEvent) {
    if (!dragKey) return;
    moveGhost(e.clientX, e.clientY);
  }
  function onTilePointerUp(e: PointerEvent, w: ToolItem) {
    if (!dragKey) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const onDrawer = !!target?.closest('.notes-tool-drawer, .notes-tool-btn');
    if (!onDrawer) onToggle(w.id, { x: e.clientX, y: e.clientY });
    clearGhost();
    dragKey = null;
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
  <span aria-hidden="true">🛠</span>
</button>

{#if open}
  <button type="button" class="notes-tool-mask" aria-label="关闭" onclick={() => (open = false)}></button>
{/if}

<aside class="notes-tool-drawer" class:is-open={open} aria-label="笔记工具抽屉">
  <header class="ntd-head">
    <h2>笔记工具</h2>
    <button type="button" class="ntd-x" onclick={() => (open = false)}>×</button>
  </header>
  <p class="ntd-hint">拖到笔记页任意位置即可打开；可拖动、缩放、旋转</p>
  <ul class="ntd-list">
    {#each items as w (w.id)}
      <li>
        <div
          class="ntd-tile {dragKey === w.id ? 'is-dragging' : ''} {enabled[w.id] ? 'is-on' : ''}"
          role="button"
          tabindex="0"
          onpointerdown={(e) => onTilePointerDown(e, w)}
          onpointermove={onTilePointerMove}
          onpointerup={(e) => onTilePointerUp(e, w)}
          onpointercancel={(e) => {
            (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
            clearGhost();
            dragKey = null;
          }}
        >
          <span class="ntd-icon" aria-hidden="true">{w.icon}</span>
          <div>
            <div class="ntd-name">{w.name}</div>
            <div class="ntd-desc">{w.desc}</div>
          </div>
          <label class="switch" data-no-drag>
            <input
              type="checkbox"
              checked={enabled[w.id]}
              onchange={() => onToggle(w.id)}
              aria-label={`${w.name} 开关`}
            />
            <span></span>
          </label>
        </div>
      </li>
    {/each}
  </ul>
</aside>

<style>
  .notes-tool-btn {
    position: fixed;
    top: max(env(safe-area-inset-top, 0px), 88px);
    right: max(env(safe-area-inset-right, 0px), 64px);
    z-index: 60;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--chrome-border);
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    backdrop-filter: blur(14px);
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
    z-index: 55;
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
    z-index: 58;
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
  .ntd-tile.is-on {
    border-color: rgb(180 140 255 / 0.55);
  }
  .ntd-tile.is-dragging {
    opacity: 0.5;
  }
  .ntd-icon {
    font-size: 1.25rem;
    text-align: center;
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
      top: calc(max(env(safe-area-inset-top, 0px), 88px) + 52px);
    }
  }
</style>
