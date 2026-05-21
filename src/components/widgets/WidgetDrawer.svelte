<script lang="ts">
  type WidgetKey = 'background' | 'clock' | 'music' | 'notes' | 'todo' | 'calendar' | 'pomodoro' | 'weather' | 'stats' | 'world' | 'graph' | 'calculator' | 'python' | 'whiteboard' | 'whitenoise';

  interface Widget {
    id: WidgetKey;
    name: string;
    icon: string;
    desc: string;
    pinned?: boolean; // 不参与拖放，仅作开关
  }

  interface Props {
    enabled: Record<WidgetKey, boolean>;
    bg: {
      sceneId: string;
      useVideo: boolean;
      rain: boolean;
      brightness: number;
      speed: number;
    };
    scenes: Array<{ id: string; label: string; hasRain?: boolean }>;
    hasSnapshot?: boolean;
    isCleared?: boolean;
    onToggle: (key: WidgetKey, drop?: { x: number; y: number }) => void;
    onPatchBg: (p: Partial<Props['bg']>) => void;
    onClearAll?: () => void;
    onRestore?: () => void;
  }
  let {
    enabled,
    bg,
    scenes,
    hasSnapshot = false,
    isCleared = false,
    onToggle,
    onPatchBg,
    onClearAll,
    onRestore,
  }: Props = $props();

  let open = $state(false);
  let dragGhost: HTMLDivElement | null = null;

  const DRAG_THRESHOLD = 14;
  type DragSession = {
    key: WidgetKey | null;
    startX: number;
    startY: number;
    dragging: boolean;
    moved: boolean;
  };
  let drag: DragSession = {
    key: null,
    startX: 0,
    startY: 0,
    dragging: false,
    moved: false,
  };
  let suppressTileClick = false;

  function resetDrag() {
    drag = { key: null, startX: 0, startY: 0, dragging: false, moved: false };
    clearGhost();
  }

  const items: Widget[] = [
    { id: 'background', name: '背景', icon: '🌄', desc: '响应式视频/图片背景', pinned: true },
    { id: 'clock',      name: '时钟', icon: '🕒', desc: '视频背景时锁定；其他时可拖可缩', pinned: true },
    { id: 'music',      name: '音乐播放器', icon: '🎵', desc: '可拖拽缩放，内容等比' },
    { id: 'notes',      name: '笔记', icon: '📖', desc: '内嵌渲染笔记正文' },
    { id: 'todo',       name: '待办清单', icon: '✅', desc: '勾选完成 / 划掉取消' },
    { id: 'calendar',   name: '日历', icon: '📅', desc: 'iCal URL 同步事件' },
    { id: 'pomodoro',   name: '番茄钟', icon: '🍅', desc: '专注 / 小憩 / 长休' },
    { id: 'weather',    name: '天气', icon: '☁️', desc: 'Open-Meteo · 5 天预报' },
    { id: 'world',      name: '世界时钟', icon: '🌍', desc: '点击地图切城市/天气/主时钟' },
    { id: 'stats',      name: '学习统计', icon: '📊', desc: '笔记 / 字数 / 三档自适应' },
    { id: 'graph',      name: '关系图谱', icon: '🕸️', desc: '力导向；中心辐射版见 /graph' },
    { id: 'calculator', name: 'MATLAB 计算器', icon: '🧮', desc: '表达式 / 绘图；完整版见 /matlab' },
    { id: 'python', name: 'Python', icon: '🐍', desc: 'Pyodide 在线运行；完整版见 /python' },
    { id: 'whiteboard', name: '白板', icon: '✏️', desc: 'Excalidraw；完整版见 /whiteboard' },
    { id: 'whitenoise', name: '白噪音', icon: '🌧️', desc: '多轨混音 · 可调混响' },
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
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
  }
  function moveGhost(x: number, y: number) {
    if (dragGhost) {
      dragGhost.style.left = x + 'px';
      dragGhost.style.top = y + 'px';
    }
  }

  function onTilePointerDown(e: PointerEvent, w: Widget) {
    if (w.pinned) return;
    if ((e.target as HTMLElement).closest('.switch, [data-no-drag]')) return;
    drag = {
      key: w.id,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      moved: false,
    };
  }
  function onTilePointerMove(e: PointerEvent) {
    if (!drag.key) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.dragging) {
      if (Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;
      // 垂直滑动 → 交给抽屉滚动，不启动拖拽
      if (Math.abs(dy) > Math.abs(dx)) {
        suppressTileClick = true;
        resetDrag();
        return;
      }
      const w = items.find((i) => i.id === drag.key);
      if (!w) return;
      drag = { ...drag, dragging: true, moved: true };
      ensureGhost(`${w.icon} ${w.name}`);
      moveGhost(e.clientX, e.clientY);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
      return;
    }
    drag = { ...drag, moved: true };
    moveGhost(e.clientX, e.clientY);
  }
  function onTilePointerUp(e: PointerEvent, w: Widget) {
    const el = e.currentTarget as HTMLElement;
    if (drag.dragging && drag.key === w.id) {
      el.releasePointerCapture?.(e.pointerId);
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const onDrawer = !!target?.closest('.widget-drawer, .gear-btn, .widget-fab-stack');
      if (!onDrawer) onToggle(w.id, { x: e.clientX, y: e.clientY });
      suppressTileClick = true;
    } else if (drag.moved) {
      suppressTileClick = true;
    }
    resetDrag();
  }
  function onTileClick(e: MouseEvent, w: Widget) {
    if (suppressTileClick) {
      suppressTileClick = false;
      return;
    }
    if ((e.target as HTMLElement).closest('.switch, [data-no-drag]')) return;
    onToggle(w.id);
  }
</script>

<div class="widget-fab-stack" aria-label="主界面快捷操作">
  <button
    type="button"
    class="gear-btn"
    aria-label={open ? '关闭组件面板' : '打开组件面板'}
    title="组件面板"
    onclick={() => (open = !open)}
  >
    <span aria-hidden="true">⚙</span>
  </button>

  <!-- 一键清屏 / 恢复浮动按钮：常驻主界面，不需打开抽屉 -->
  {#if hasSnapshot}
    <button
      type="button"
      class="clear-btn is-restore"
      aria-label="恢复清屏前的组件布局"
      title="恢复刚才的组件"
      onclick={() => onRestore?.()}
    >
      <span aria-hidden="true">↩</span>
    </button>
  {:else}
    <button
      type="button"
      class="clear-btn"
      class:is-disabled={isCleared}
      aria-label="一键清屏，只保留背景"
      title={isCleared ? '当前已只剩背景' : '一键清屏，只保留背景'}
      onclick={() => { if (!isCleared) onClearAll?.(); }}
    >
      <span aria-hidden="true">🧹</span>
    </button>
  {/if}
</div>

{#if open}
  <button
    type="button"
    class="drawer-mask"
    aria-label="点击关闭面板"
    onclick={() => (open = false)}
  ></button>
{/if}

<aside class="widget-drawer" class:is-open={open} aria-label="组件抽屉">
  <header class="wd-head">
    <h2>组件</h2>
    <button type="button" class="wd-x" aria-label="关闭" onclick={() => (open = false)}>×</button>
  </header>

  <p class="wd-hint">点击卡片或开关添加组件；桌面端可拖到主界面。滑动列表时不会误触。</p>

  <!-- 一键清屏 / 恢复 操作条 -->
  <div class="wd-quick">
    <button
      type="button"
      class="wd-clear-btn"
      class:is-disabled={isCleared}
      onclick={() => { if (!isCleared) onClearAll?.(); }}
      disabled={isCleared && !hasSnapshot}
    >
      <span aria-hidden="true">🧹</span>
      <span>{isCleared ? '已只剩背景' : '一键清屏'}</span>
    </button>
    {#if hasSnapshot}
      <button type="button" class="wd-restore-btn" onclick={() => onRestore?.()}>
        <span aria-hidden="true">↩</span>
        <span>恢复</span>
      </button>
    {/if}
  </div>

  <ul class="wd-list">
    {#each items as w (w.id)}
      <li>
        <div
          class="wd-tile {drag.dragging && drag.key === w.id ? 'is-dragging' : ''} {enabled[w.id] ? 'is-on' : ''}"
          role="button"
          tabindex="0"
          onclick={(e) => onTileClick(e, w)}
          onpointerdown={(e) => onTilePointerDown(e, w)}
          onpointermove={onTilePointerMove}
          onpointerup={(e) => onTilePointerUp(e, w)}
          onpointercancel={(e) => {
            (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
            resetDrag();
          }}
          title={w.pinned ? '点击切换' : '点击切换；桌面端可拖到主界面'}
        >
          <span class="wd-tile-icon" aria-hidden="true">{w.icon}</span>
          <div class="wd-tile-info">
            <div class="wd-tile-name">{w.name}</div>
            <div class="wd-tile-desc">{w.desc}</div>
          </div>
          <label class="switch" data-no-drag onclick={(e) => e.stopPropagation()} onpointerdown={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={enabled[w.id]}
              onclick={(e) => {
                e.stopPropagation();
                suppressTileClick = true;
                onToggle(w.id, undefined);
              }}
              aria-label={`${w.name} 开关`}
            />
            <span></span>
          </label>
        </div>
      </li>
    {/each}
  </ul>

  <section class="wd-bg" aria-label="背景设置">
    <h3>背景设置</h3>
    <div class="row">
      <label for="bg-scene">场景</label>
      <select
        id="bg-scene"
        value={bg.sceneId}
        onchange={(e) => onPatchBg({ sceneId: (e.currentTarget as HTMLSelectElement).value })}
      >
        {#each scenes as s}
          <option value={s.id}>{s.label}</option>
        {/each}
      </select>
    </div>
    <div class="row toggles">
      <label>
        <input
          type="checkbox"
          checked={bg.useVideo}
          onchange={(e) => onPatchBg({ useVideo: (e.currentTarget as HTMLInputElement).checked })}
        /> 视频
      </label>
      <label>
        <input
          type="checkbox"
          checked={bg.rain}
          onchange={(e) => onPatchBg({ rain: (e.currentTarget as HTMLInputElement).checked })}
        /> 下雨
      </label>
    </div>
    <div class="row">
      <label for="bg-bright">亮度 {Math.round(bg.brightness * 100)}%</label>
      <input
        id="bg-bright" type="range" min="0.5" max="1.5" step="0.05" value={bg.brightness}
        oninput={(e) => onPatchBg({ brightness: Number((e.currentTarget as HTMLInputElement).value) })}
      />
    </div>
    <div class="row">
      <label for="bg-speed">速度 {bg.speed.toFixed(2)}×</label>
      <input
        id="bg-speed" type="range" min="0.5" max="2" step="0.05" value={bg.speed}
        oninput={(e) => onPatchBg({ speed: Number((e.currentTarget as HTMLInputElement).value) })}
      />
    </div>
  </section>

  <footer class="wd-foot">
    <span>Space 暂停/播放 · ↑↓ 音量 · Shift+←/→ 切歌</span>
  </footer>
</aside>

<style>
  .widget-fab-stack {
    position: fixed;
    z-index: 60;
    top: calc(max(env(safe-area-inset-top, 0px), 12px) + 92px);
    right: max(env(safe-area-inset-right, 0px), 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .gear-btn,
  .clear-btn {
    position: relative;
    top: auto;
    right: auto;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgb(255 255 255 / 0.22);
    background: rgb(20 16 32 / 0.55);
    color: #fff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    cursor: pointer;
    box-shadow: 0 8px 22px rgb(0 0 0 / 0.3);
    flex-shrink: 0;
  }

  .gear-btn {
    font-size: 1.1rem;
  }
  .gear-btn:hover { background: rgb(40 28 60 / 0.65); }

  .clear-btn {
    font-size: 1.05rem;
    transition: background 0.15s ease, transform 0.15s ease, opacity 0.2s ease;
  }
  .clear-btn:hover { background: rgb(40 28 60 / 0.65); transform: translateY(-1px); }
  .clear-btn.is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .clear-btn.is-restore {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.5), rgba(180, 140, 255, 0.55));
    border-color: rgb(255 255 255 / 0.35);
    box-shadow: 0 8px 24px rgb(180 140 255 / 0.45);
    animation: clr-pulse 1.4s ease-in-out infinite;
  }
  @keyframes clr-pulse {
    0%, 100% { box-shadow: 0 8px 24px rgb(180 140 255 / 0.45); }
    50%      { box-shadow: 0 8px 28px rgb(255 141 232 / 0.7); }
  }

  @media (max-width: 768px) {
    .widget-fab-stack {
      top: auto;
      bottom: calc(max(env(safe-area-inset-bottom, 0px), 12px) + 52px);
      right: max(env(safe-area-inset-right, 0px), 12px);
      gap: 14px;
    }
    .gear-btn,
    .clear-btn {
      width: 44px;
      height: 44px;
    }
  }

  /* 浮动「清屏/恢复」按钮：与齿轮同组堆叠 */

  .drawer-mask {
    position: fixed; inset: 0;
    background: rgb(0 0 0 / 0.18);
    z-index: 55;
    border: 0;
    cursor: default;
  }

  .widget-drawer {
    position: fixed;
    top: 0; bottom: 0;
    right: 0;
    width: min(360px, 92vw);
    z-index: 58;
    padding: 18px 16px 16px;
    background: rgb(20 16 32 / 0.78);
    color: #f3ecff;
    border-left: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: -18px 0 40px rgb(0 0 0 / 0.4);
    backdrop-filter: blur(18px) saturate(120%);
    -webkit-backdrop-filter: blur(18px) saturate(120%);
    transform: translateX(100%);
    transition: transform 0.25s ease;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .widget-drawer.is-open { transform: translateX(0); }

  .wd-head { display: flex; align-items: center; justify-content: space-between; }
  .wd-head h2 { margin: 0; font-size: 1rem; letter-spacing: 1px; }
  .wd-x {
    background: rgb(255 255 255 / 0.08); color: inherit;
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 8px; width: 28px; height: 28px; cursor: pointer;
  }

  .wd-hint {
    margin: 0;
    font-size: 0.74rem;
    color: #c8b9e2;
    line-height: 1.4;
  }

  .wd-quick {
    display: flex;
    gap: 8px;
    margin: 2px 0 4px;
  }
  .wd-clear-btn,
  .wd-restore-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgb(255 255 255 / 0.16);
    background: rgb(255 255 255 / 0.06);
    color: #f3ecff;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
  }
  .wd-clear-btn:hover:not(.is-disabled) {
    background: rgb(255 255 255 / 0.12);
    border-color: rgb(255 141 232 / 0.6);
    transform: translateY(-1px);
  }
  .wd-clear-btn.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .wd-restore-btn {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.32), rgba(180, 140, 255, 0.32));
    border-color: rgba(180, 140, 255, 0.6);
  }
  .wd-restore-btn:hover {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.5), rgba(180, 140, 255, 0.5));
    transform: translateY(-1px);
  }

  .wd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .wd-tile {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.12);
    cursor: pointer;
    user-select: none;
    transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
    touch-action: pan-y;
  }
  .wd-tile:hover { background: rgb(255 255 255 / 0.1); border-color: rgb(255 255 255 / 0.2); }
  .wd-tile.is-dragging {
    opacity: 0.5;
    cursor: grabbing;
    touch-action: none;
  }
  .wd-tile.is-on { border-color: rgb(180 140 255 / 0.55); }
  .wd-tile-icon { font-size: 1.4rem; text-align: center; }
  .wd-tile-name { font-weight: 600; font-size: 0.88rem; }
  .wd-tile-desc { font-size: 0.7rem; color: #c8b9e2; margin-top: 2px; }

  .switch {
    position: relative;
    width: 34px; height: 20px;
    display: inline-block;
  }
  .switch input { opacity: 0; width: 0; height: 0; }
  .switch span {
    position: absolute; inset: 0;
    background: rgb(255 255 255 / 0.18);
    border-radius: 999px;
    transition: background 0.2s ease;
    cursor: pointer;
  }
  .switch span::before {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #fff;
    top: 3px; left: 3px;
    transition: transform 0.2s ease;
  }
  .switch input:checked + span { background: rgb(180 140 255 / 0.75); }
  .switch input:checked + span::before { transform: translateX(14px); }

  .wd-bg {
    border-top: 1px solid rgb(255 255 255 / 0.08);
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .wd-bg h3 {
    margin: 0 0 4px;
    font-size: 0.8rem;
    letter-spacing: 1px;
    color: rgb(255 255 255 / 0.7);
    text-transform: uppercase;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 0.78rem;
    color: #d6cae6;
  }
  .row.toggles { justify-content: flex-start; gap: 16px; }
  .row select {
    background: rgb(28 18 44 / 0.85);
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.18);
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 0.78rem;
  }
  :global(.dark) .row select {
    background: rgb(12 8 22 / 0.92);
    border-color: rgb(255 255 255 / 0.1);
  }
  .row option { background: #1c122c; color: #f3ecff; }
  .row input[type='range'] {
    flex: 1;
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .row input[type='range']::-webkit-slider-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6);
  }

  .wd-foot {
    margin-top: auto;
    color: #aa97cf;
    font-size: 0.7rem;
    line-height: 1.4;
    padding-top: 8px;
    border-top: 1px solid rgb(255 255 255 / 0.06);
  }

  :global(.widget-drag-ghost) {
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgb(40 28 60 / 0.85);
    color: #fff;
    font-size: 0.8rem;
    border: 1px solid rgb(255 255 255 / 0.3);
    box-shadow: 0 10px 28px rgb(0 0 0 / 0.5);
    transform: translate(-50%, -110%);
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .widget-drawer { width: 100vw; }
  }
</style>
