<script lang="ts">
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
  class="notes-tool-btn"
  aria-label={open ? '关闭笔记工具' : '打开笔记工具'}
  title="笔记工具：Python / MATLAB / 白板"
  onclick={() => (open = !open)}
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
    border: 1px solid rgb(255 255 255 / 0.22);
    background: rgb(20 16 32 / 0.55);
    color: #fff;
    backdrop-filter: blur(14px);
    cursor: pointer;
    font-size: 1.05rem;
    box-shadow: 0 8px 22px rgb(0 0 0 / 0.3);
  }
  .notes-tool-btn:hover {
    background: rgb(40 28 60 / 0.65);
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
    background: rgb(20 16 32 / 0.82);
    color: #f3ecff;
    border-left: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: -14px 0 36px rgb(0 0 0 / 0.38);
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
    background: rgb(255 255 255 / 0.08);
    color: inherit;
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 8px;
    width: 28px;
    height: 28px;
    cursor: pointer;
  }
  .ntd-hint {
    margin: 0 0 12px;
    font-size: 0.72rem;
    color: #c8b9e2;
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
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.12);
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
    color: #c8b9e2;
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
    .notes-tool-btn {
      right: max(env(safe-area-inset-right, 0px), 12px);
      top: calc(max(env(safe-area-inset-top, 0px), 88px) + 52px);
    }
  }
</style>
