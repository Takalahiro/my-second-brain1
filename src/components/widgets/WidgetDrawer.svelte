<script lang="ts">
  import { onMount } from 'svelte';
  import ControlCenterClock from './ControlCenterClock.svelte';
  import ControlCenterSlot from './ControlCenterSlot.svelte';
  import {
    loadSlotWidget,
    saveSlotWidget,
    type SlotWidgetKey,
  } from '../../lib/control-center-slot';

  type WidgetKey = 'background' | 'clock' | 'music' | 'notes' | 'todo' | 'calendar' | 'pomodoro' | 'weather' | 'stats' | 'world' | 'graph' | 'territory' | 'calculator' | 'python' | 'whiteboard' | 'whitenoise' | 'network';
  type PaneId = 'home' | 'widgets' | 'wallpaper' | 'desktop';

  interface Widget {
    id: WidgetKey;
    name: string;
    icon: string;
    desc: string;
    pinned?: boolean;
    keywords?: string[];
  }

  interface Props {
    enabled: Record<WidgetKey, boolean>;
    bg: {
      sceneId: string;
      useVideo: boolean;
      rain: boolean;
      rainDrops: boolean;
      rainDropsLinked?: boolean;
      sakura: boolean;
      brightness: number;
      speed: number;
    };
    scenes: Array<{ id: string; label: string; hasRain?: boolean; poster?: string | null; hasSakura?: boolean }>;
    hasSnapshot?: boolean;
    isCleared?: boolean;
    open?: boolean;
    spotlightToken?: number;
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
    open = $bindable(false),
    spotlightToken = 0,
    onToggle,
    onPatchBg,
    onClearAll,
    onRestore,
  }: Props = $props();

  let pane = $state<PaneId>('home');
  let searchQuery = $state('');
  let searchFocused = $state(false);
  let panelMinimized = $state(false);
  let panelExpanded = $state(false);
  let slotWidget = $state<SlotWidgetKey>('weather');
  let searchInput: HTMLInputElement | null = null;
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

  const categories: Array<{ id: PaneId; name: string; icon: string; desc: string }> = [
    { id: 'widgets', name: '组件', icon: '🧩', desc: '添加与管理桌面小组件' },
    { id: 'wallpaper', name: '墙纸', icon: '🖼️', desc: '场景、视频与氛围' },
    { id: 'desktop', name: '桌面', icon: '🖥️', desc: '清屏与布局恢复' },
  ];

  const widgetGroups: Array<{ title: string; ids: WidgetKey[] }> = [
    { title: '桌面', ids: ['background', 'clock'] },
    { title: '媒体与氛围', ids: ['music', 'whitenoise'] },
    { title: '效率', ids: ['todo', 'calendar', 'pomodoro', 'notes'] },
    { title: '信息', ids: ['weather', 'world', 'stats', 'network'] },
    { title: '可视化', ids: ['graph', 'territory'] },
    { title: '工具', ids: ['calculator', 'python', 'whiteboard'] },
  ];

  const items: Widget[] = [
    { id: 'background', name: '背景', icon: '🌄', desc: '响应式视频/图片背景', pinned: true, keywords: ['壁纸', '墙纸', '视频'] },
    { id: 'clock', name: '时钟', icon: '🕒', desc: '视频背景时锁定右下角', pinned: true, keywords: ['时间'] },
    { id: 'music', name: '音乐播放器', icon: '🎵', desc: '可拖拽缩放', keywords: ['音频', '播放'] },
    { id: 'notes', name: '笔记', icon: '📖', desc: '内嵌渲染笔记正文', keywords: ['阅读'] },
    { id: 'todo', name: '待办清单', icon: '✅', desc: '勾选完成 / 划掉取消', keywords: ['任务'] },
    { id: 'calendar', name: '日历', icon: '📅', desc: 'iCal URL 同步事件', keywords: ['日程'] },
    { id: 'pomodoro', name: '番茄钟', icon: '🍅', desc: '专注 / 小憩 / 长休', keywords: ['专注'] },
    { id: 'weather', name: '天气', icon: '☁️', desc: 'Open-Meteo · 5 天预报', keywords: ['气温'] },
    { id: 'world', name: '世界时钟', icon: '🌍', desc: '地图切城市/天气', keywords: ['时区'] },
    { id: 'stats', name: '学习统计', icon: '📊', desc: '笔记 / 字数统计', keywords: ['数据'] },
    { id: 'network', name: '网络流量', icon: '📡', desc: '会话下载 · 实时速率', keywords: ['带宽', '流量', '网络'] },
    { id: 'graph', name: '关系图谱', icon: '🕸️', desc: '力导向双链网络', keywords: ['双链', '图谱'] },
    { id: 'territory', name: '文件夹地图', icon: '🗺️', desc: '缩放切块 · 双链弧线', keywords: ['地图'] },
    { id: 'calculator', name: 'MATLAB 计算器', icon: '🧮', desc: '表达式 / 绘图', keywords: ['matlab', '计算'] },
    { id: 'python', name: 'Python', icon: '🐍', desc: 'Pyodide 在线运行', keywords: ['代码'] },
    { id: 'whiteboard', name: '白板', icon: '✏️', desc: 'Excalidraw 手绘', keywords: ['画板'] },
    { id: 'whitenoise', name: '白噪音', icon: '🌧️', desc: '多轨混音 · 可调混响', keywords: ['雨声', '环境音'] },
  ];

  const itemMap = $derived(Object.fromEntries(items.map((w) => [w.id, w])) as Record<WidgetKey, Widget>);
  const activeScene = $derived(scenes.find((s) => s.id === bg.sceneId));
  const rainAvailable = $derived(!!activeScene?.hasRain);
  const sakuraAvailable = $derived(!!activeScene?.hasSakura);

  const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
  const spotlightActive = $derived(pane === 'home' && (searchFocused || normalizedQuery.length > 0));

  const searchResults = $derived.by(() => {
    if (!normalizedQuery) return [] as Widget[];
    return items.filter((w) => {
      const hay = [w.name, w.desc, ...(w.keywords ?? [])].join(' ').toLowerCase();
      return hay.includes(normalizedQuery);
    });
  });

  const filteredGroups = $derived.by(() => {
    if (!normalizedQuery) return widgetGroups;
    const ids = new Set(searchResults.map((w) => w.id));
    return widgetGroups
      .map((g) => ({ ...g, ids: g.ids.filter((id) => ids.has(id)) }))
      .filter((g) => g.ids.length > 0);
  });

  const paneTitle = $derived(
    pane === 'home' ? '控制中心' : categories.find((c) => c.id === pane)?.name ?? '设置'
  );

  function resetDrag() {
    drag = { key: null, startX: 0, startY: 0, dragging: false, moved: false };
    clearGhost();
  }

  function openDrawer() {
    open = true;
    pane = 'home';
    searchQuery = '';
    searchFocused = false;
    panelMinimized = false;
    panelExpanded = false;
  }

  function closeDrawer() {
    open = false;
    pane = 'home';
    searchQuery = '';
    searchFocused = false;
    panelMinimized = false;
    panelExpanded = false;
    resetDrag();
  }

  function onTrafficRed() {
    closeDrawer();
  }

  function onTrafficYellow() {
    if (panelMinimized) {
      panelMinimized = false;
      return;
    }
    panelMinimized = true;
    panelExpanded = false;
    exitSpotlight();
    if (pane !== 'home') goBack();
  }

  function onTrafficGreen() {
    if (panelExpanded) {
      panelExpanded = false;
      return;
    }
    panelMinimized = false;
    panelExpanded = true;
  }

  $effect(() => {
    if (spotlightToken > 0) {
      open = true;
      pane = 'home';
      queueMicrotask(() => enterSpotlight());
    }
  });

  function enterSpotlight() {
    pane = 'home';
    searchFocused = true;
    queueMicrotask(() => searchInput?.focus());
  }

  function exitSpotlight() {
    searchFocused = false;
    searchQuery = '';
    searchInput?.blur();
  }

  function onSlotChange(id: SlotWidgetKey) {
    slotWidget = id;
    saveSlotWidget(id);
  }

  onMount(() => {
    slotWidget = loadSlotWidget();
  });

  function goPane(next: PaneId) {
    pane = next;
    if (next !== 'home') searchQuery = '';
  }

  function goBack() {
    pane = 'home';
    searchQuery = '';
  }

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
    if ((e.target as HTMLElement).closest('.mac-toggle, [data-no-drag]')) return;
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
      const onDrawer = !!target?.closest('.mac-settings, .mac-menu-bar');
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
    if ((e.target as HTMLElement).closest('.mac-toggle, [data-no-drag]')) return;
    onToggle(w.id);
  }

  function onDrawerKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (spotlightActive) {
        exitSpotlight();
        e.stopPropagation();
        return;
      }
      closeDrawer();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && open) {
      e.preventDefault();
      enterSpotlight();
    }
  }

  $effect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (spotlightActive) {
          exitSpotlight();
          return;
        }
        closeDrawer();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        enterSpotlight();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

{#if open}
  <button
    type="button"
    class="drawer-mask"
    class:is-spotlight={spotlightActive}
    aria-label="点击关闭控制中心"
    onclick={() => (spotlightActive ? exitSpotlight() : closeDrawer())}
  ></button>
{/if}

<aside
  class="mac-settings"
  class:is-open={open}
  class:is-spotlight={spotlightActive}
  class:is-minimized={panelMinimized}
  class:is-expanded={panelExpanded}
  aria-label="控制中心"
  aria-hidden={!open}
  onkeydown={onDrawerKeydown}
>
  <div class="mac-window-chrome">
    <div class="mac-traffic" role="toolbar" aria-label="窗口控制">
      <button type="button" class="dot red" aria-label="关闭" title="关闭" onclick={onTrafficRed}></button>
      <button
        type="button"
        class="dot yellow"
        aria-label={panelMinimized ? '还原' : '最小化'}
        title={panelMinimized ? '还原' : '最小化'}
        onclick={onTrafficYellow}
      ></button>
      <button
        type="button"
        class="dot green"
        aria-label={panelExpanded ? '标准大小' : '展开'}
        title={panelExpanded ? '标准大小' : '展开'}
        onclick={onTrafficGreen}
      ></button>
    </div>
    <div class="mac-titlebar">
      {#if pane !== 'home'}
        <button type="button" class="mac-back" onclick={goBack} aria-label="返回">
          <span class="mac-back-chevron" aria-hidden="true">‹</span>
          <span>控制中心</span>
        </button>
      {:else}
        <span class="mac-title-spacer" aria-hidden="true"></span>
      {/if}
      <span class="mac-title mac-title-center">{paneTitle}</span>
      <button type="button" class="mac-close" aria-label="关闭" onclick={closeDrawer}>×</button>
    </div>
  </div>

  <div class="mac-body">
    {#if pane === 'home'}
      <div class="mac-pane mac-pane-home">
        <div class="mac-search-stage" class:is-spotlight={spotlightActive}>
          <div class="mac-search-wrap">
            <span class="mac-search-icon" aria-hidden="true">⌕</span>
            <input
              bind:this={searchInput}
              type="search"
              class="mac-search"
              placeholder="搜索设置与组件  ⌘K"
              bind:value={searchQuery}
              aria-label="搜索设置与组件"
              onfocus={() => (searchFocused = true)}
              onblur={() => {
                if (!searchQuery.trim()) searchFocused = false;
              }}
            />
            {#if searchQuery}
              <button type="button" class="mac-search-clear" aria-label="清除搜索" onclick={() => (searchQuery = '')}>×</button>
            {/if}
          </div>
        </div>

        {#if spotlightActive}
          <div class="mac-spotlight-panel">
            {#if normalizedQuery}
              {#if searchResults.length === 0}
                <p class="mac-spotlight-empty">未找到「{searchQuery}」</p>
              {:else}
                <ul class="mac-spotlight-list">
                  {#each searchResults as w, i (w.id)}
                    <li style={`--i: ${i}`}>
                      <div
                        class="mac-spotlight-row {enabled[w.id] ? 'is-on' : ''}"
                        role="button"
                        tabindex="0"
                        onclick={(e) => onTileClick(e, w)}
                        onpointerdown={(e) => onTilePointerDown(e, w)}
                        onpointermove={onTilePointerMove}
                        onpointerup={(e) => onTilePointerUp(e, w)}
                      >
                        <span class="mac-spotlight-row-icon">{w.icon}</span>
                        <div class="mac-spotlight-row-text">
                          <span class="mac-spotlight-row-title">{w.name}</span>
                          <span class="mac-spotlight-row-sub">{w.desc}</span>
                        </div>
                        <label class="mac-toggle" data-no-drag onclick={(e) => e.stopPropagation()}>
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
                    </li>
                  {/each}
                </ul>
              {/if}
            {:else}
              <p class="mac-spotlight-hint">输入关键词搜索组件、设置项…</p>
              <ul class="mac-spotlight-suggest">
                {#each ['天气', '待办', '音乐', '图谱', '墙纸'] as hint}
                  <li>
                    <button type="button" class="mac-spotlight-chip" onclick={() => (searchQuery = hint)}>
                      {hint}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {:else}
          <div class="mac-home-content">
            <div class="cc-widget-grid">
              <div class="cc-cell cc-cell-2x2">
                <ControlCenterClock />
              </div>
              <div class="cc-cell cc-cell-2x2">
                <ControlCenterSlot
                  widgetId={slotWidget}
                  enabled={enabled[slotWidget]}
                  onChange={onSlotChange}
                  onToggle={() => onToggle(slotWidget)}
                />
              </div>
            </div>

            <div class="mac-category-grid">
              {#each categories as cat (cat.id)}
                <button type="button" class="mac-category-tile" onclick={() => goPane(cat.id)}>
                  <span class="mac-category-icon">{cat.icon}</span>
                  <span class="mac-category-name">{cat.name}</span>
                  <span class="mac-category-desc">{cat.desc}</span>
                </button>
              {/each}
            </div>

            <section class="mac-group mac-group-compact">
              <h3 class="mac-group-label">快捷操作</h3>
              <ul class="mac-list">
                <li>
                  <button
                    type="button"
                    class="mac-action-row"
                    class:is-disabled={isCleared}
                    disabled={isCleared}
                    onclick={() => { if (!isCleared) onClearAll?.(); }}
                  >
                    <span class="mac-row-icon">🧹</span>
                    <span class="mac-row-title">一键清屏</span>
                    <span class="mac-row-value">{isCleared ? '已清屏' : '保留背景'}</span>
                  </button>
                </li>
                {#if hasSnapshot}
                  <li>
                    <button type="button" class="mac-action-row is-accent" onclick={() => onRestore?.()}>
                      <span class="mac-row-icon">↩</span>
                      <span class="mac-row-title">恢复组件布局</span>
                      <span class="mac-row-chevron" aria-hidden="true">›</span>
                    </button>
                  </li>
                {/if}
              </ul>
            </section>
          </div>
        {/if}
      </div>
    {:else if pane === 'widgets'}
      <div class="mac-pane mac-pane-detail">
        <p class="mac-pane-hint">点击行或开关启用；桌面端可拖到主界面放置。</p>
        {#each filteredGroups as group (group.title)}
          <section class="mac-group">
            <h3 class="mac-group-label">{group.title}</h3>
            <ul class="mac-list">
              {#each group.ids as id (id)}
                {@const w = itemMap[id]}
                <li>
                  <div
                    class="mac-widget-row {drag.dragging && drag.key === w.id ? 'is-dragging' : ''} {enabled[w.id] ? 'is-on' : ''}"
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
                    <span class="mac-row-icon">{w.icon}</span>
                    <div class="mac-row-text">
                      <span class="mac-row-title">{w.name}</span>
                      <span class="mac-row-sub">{w.desc}</span>
                    </div>
                    <label class="mac-toggle" data-no-drag onclick={(e) => e.stopPropagation()} onpointerdown={(e) => e.stopPropagation()}>
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
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {:else if pane === 'wallpaper'}
      <div class="mac-pane mac-pane-detail">
        <section class="mac-group">
          <h3 class="mac-group-label">场景</h3>
          <div class="mac-wall-grid">
            {#each scenes as s (s.id)}
              <button
                type="button"
                class="mac-wall-card"
                class:is-active={bg.sceneId === s.id}
                aria-pressed={bg.sceneId === s.id}
                onclick={() => onPatchBg({ sceneId: s.id })}
              >
                {#if s.poster}
                  <img class="mac-wall-thumb" src={s.poster} alt="" loading="lazy" />
                {:else}
                  <span class="mac-wall-fallback" aria-hidden="true">🖼️</span>
                {/if}
                <span class="mac-wall-label">{s.label}</span>
              </button>
            {/each}
          </div>
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">氛围</h3>
          <ul class="mac-list">
            <li>
              <label class="mac-setting-row mac-setting-toggle">
                <div class="mac-row-text">
                  <span class="mac-row-title">跟随天气</span>
                  <span class="mac-row-sub">实况有雨时自动开启雨滴</span>
                </div>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.rainDropsLinked !== false}
                    onchange={(e) => onPatchBg({ rainDropsLinked: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
            <li>
              <label class="mac-setting-row mac-setting-toggle" class:is-disabled={bg.rainDropsLinked !== false}>
                <div class="mac-row-text">
                  <span class="mac-row-title">雨滴飘落</span>
                  <span class="mac-row-sub">{bg.rainDropsLinked !== false ? '已联动，关闭「跟随天气」后可手动' : '拟真雨丝与玻璃水痕'}</span>
                </div>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.rainDrops}
                    disabled={bg.rainDropsLinked !== false}
                    onchange={(e) => onPatchBg({ rainDrops: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
            <li>
              <label class="mac-setting-row mac-setting-toggle" class:is-disabled={!sakuraAvailable}>
                <div class="mac-row-text">
                  <span class="mac-row-title">樱花飘落</span>
                  <span class="mac-row-sub">仅 Kyoto 场景</span>
                </div>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.sakura}
                    disabled={!sakuraAvailable}
                    onchange={(e) => onPatchBg({ sakura: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
          </ul>
          {#if !sakuraAvailable}
            <p class="mac-footnote">切换到 Kyoto 墙纸后可开启樱花</p>
          {/if}
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">播放</h3>
          <ul class="mac-list">
            <li>
              <label class="mac-setting-row mac-setting-toggle">
                <span class="mac-row-title">使用视频</span>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.useVideo}
                    onchange={(e) => onPatchBg({ useVideo: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
            <li>
              <label class="mac-setting-row mac-setting-toggle" class:is-disabled={!rainAvailable}>
                <div class="mac-row-text">
                  <span class="mac-row-title">雨天视频</span>
                  <span class="mac-row-sub">切换为雨天版背景视频</span>
                </div>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.rain}
                    disabled={!rainAvailable}
                    onchange={(e) => onPatchBg({ rain: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
          </ul>
          {#if !rainAvailable}
            <p class="mac-footnote">当前场景不支持雨天视频</p>
          {/if}
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">显示</h3>
          <ul class="mac-list mac-list-sliders">
            <li class="mac-slider-row">
              <div class="mac-slider-head">
                <span class="mac-row-title">亮度</span>
                <span class="mac-row-value">{Math.round(bg.brightness * 100)}%</span>
              </div>
              <input
                type="range"
                class="mac-slider"
                min="0.5"
                max="1.5"
                step="0.05"
                value={bg.brightness}
                aria-label="背景亮度"
                oninput={(e) => onPatchBg({ brightness: Number((e.currentTarget as HTMLInputElement).value) })}
              />
            </li>
            <li class="mac-slider-row">
              <div class="mac-slider-head">
                <span class="mac-row-title">播放速度</span>
                <span class="mac-row-value">{bg.speed.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                class="mac-slider"
                min="0.5"
                max="2"
                step="0.05"
                value={bg.speed}
                aria-label="背景播放速度"
                oninput={(e) => onPatchBg({ speed: Number((e.currentTarget as HTMLInputElement).value) })}
              />
            </li>
          </ul>
        </section>
      </div>
    {:else if pane === 'desktop'}
      <div class="mac-pane mac-pane-detail">
        <section class="mac-group">
          <h3 class="mac-group-label">布局</h3>
          <ul class="mac-list">
            <li>
              <button
                type="button"
                class="mac-action-row"
                class:is-disabled={isCleared}
                disabled={isCleared}
                onclick={() => { if (!isCleared) onClearAll?.(); }}
              >
                <span class="mac-row-icon">🧹</span>
                <div class="mac-row-text">
                  <span class="mac-row-title">一键清屏</span>
                  <span class="mac-row-sub">关闭全部组件，仅保留背景</span>
                </div>
              </button>
            </li>
            {#if hasSnapshot}
              <li>
                <button type="button" class="mac-action-row is-accent" onclick={() => onRestore?.()}>
                  <span class="mac-row-icon">↩</span>
                  <div class="mac-row-text">
                    <span class="mac-row-title">恢复上次布局</span>
                    <span class="mac-row-sub">还原清屏前的组件状态</span>
                  </div>
                  <span class="mac-row-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            {/if}
          </ul>
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">提示</h3>
          <ul class="mac-list mac-list-info">
            <li class="mac-info-row">桌面端可将组件拖出面板，放到主界面任意位置。</li>
            <li class="mac-info-row">视频背景开启时，时钟会固定在右下角。</li>
            <li class="mac-info-row">音乐：Space 暂停 · ↑↓ 音量 · Shift+←/→ 切歌</li>
          </ul>
        </section>
      </div>
    {/if}
  </div>
</aside>

<style>
  .widget-fab-stack--hidden {
    display: none !important;
  }

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

  .widget-fab-stack--hidden {
    display: none !important;
  }

  .gear-btn,
  .clear-btn {
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
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .gear-btn {
    font-size: 1.1rem;
  }
  .gear-btn[aria-expanded='true'] {
    background: rgb(80 60 120 / 0.78);
    transform: rotate(90deg);
    box-shadow:
      0 12px 32px rgb(120 80 200 / 0.45),
      inset 0 1px 0 rgb(255 255 255 / 0.18);
  }
  .gear-btn:hover { background: rgb(48 36 72 / 0.72); transform: scale(1.05); }
  .gear-btn[aria-expanded='true']:hover { transform: rotate(90deg) scale(1.05); }

  @media (max-width: 768px) {
    .gear-btn {
      top: calc(max(env(safe-area-inset-top, 0px), 10px) + 112px);
    }
    .clear-btn {
      top: calc(max(env(safe-area-inset-top, 0px), 10px) + 160px);
    }
  }

  /* 浮动「清屏/恢复」按钮：紧贴 gear-btn 下方 */
  .clear-btn {
    position: fixed;
    top: calc(max(env(safe-area-inset-top, 0px), 88px) + 48px);
    right: max(env(safe-area-inset-right, 0px), 16px);
    z-index: 60;
    width: 40px; height: 40px;
    border-radius: 50%;
    border: 1px solid rgb(255 255 255 / 0.22);
    background: rgb(20 16 32 / 0.55);
    color: #fff;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    cursor: pointer;
    font-size: 1.05rem;
    box-shadow: 0 8px 22px rgb(0 0 0 / 0.3);
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

  .clear-btn {
    font-size: 1.05rem;
  }
  .clear-btn:hover { background: rgb(40 28 60 / 0.65); transform: translateY(-1px); }
  .clear-btn.is-disabled { opacity: 0.45; cursor: not-allowed; }
  .clear-btn.is-restore {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.5), rgba(180, 140, 255, 0.55));
    border-color: rgb(255 255 255 / 0.35);
    animation: clr-pulse 1.4s ease-in-out infinite;
  }
  @keyframes clr-pulse {
    0%, 100% { box-shadow: 0 8px 24px rgb(180 140 255 / 0.45); }
    50% { box-shadow: 0 8px 28px rgb(255 141 232 / 0.7); }
  }

  @media (max-width: 768px) {
    .widget-fab-stack {
      top: auto;
      bottom: calc(max(env(safe-area-inset-bottom, 0px), 14px));
      right: max(env(safe-area-inset-right, 0px), 14px);
      gap: 14px;
    }
    :global(.mac-os-body) .widget-fab-stack {
      top: auto;
      bottom: calc(max(env(safe-area-inset-bottom, 0px), 14px));
    }
    .gear-btn, .clear-btn { width: 48px; height: 48px; }
  }

  .drawer-mask {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.28);
    z-index: 55;
    border: 0;
    cursor: default;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    transition: background 0.28s ease, backdrop-filter 0.28s ease;
  }
  .drawer-mask.is-spotlight {
    background: rgb(0 0 0 / 0.52);
    backdrop-filter: blur(10px) saturate(120%);
    -webkit-backdrop-filter: blur(10px) saturate(120%);
  }

  /* macOS System Settings inspired panel */
  .mac-settings {
    position: fixed;
    top: max(env(safe-area-inset-top, 0px), 12px);
    bottom: max(env(safe-area-inset-bottom, 0px), 12px);
    right: max(env(safe-area-inset-right, 0px), 12px);
    width: min(400px, calc(100vw - 24px));
    z-index: 58;
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    overflow: hidden;
    background: var(--chrome-dropdown-bg);
    color: var(--chrome-text);
    border: 1px solid var(--chrome-border);
    box-shadow: var(--chrome-shadow);
    backdrop-filter: blur(28px) saturate(140%);
    -webkit-backdrop-filter: blur(28px) saturate(140%);
    transform: translateX(calc(100% + 20px)) scale(0.96);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.24s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', system-ui, sans-serif;
  }
  .mac-settings.is-open {
    transform: translateX(0) scale(1);
    opacity: 1;
    pointer-events: auto;
  }
  .mac-settings.is-spotlight {
    box-shadow:
      0 28px 80px rgb(0 0 0 / 0.55),
      0 0 0 0.5px rgb(255 255 255 / 0.12) inset,
      0 0 48px rgb(180 140 255 / 0.12);
  }

  :global(.mac-os-body) .mac-settings {
    top: max(env(safe-area-inset-top, 0px), 58px);
    bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    z-index: 115;
  }

  .mac-settings.is-minimized {
    bottom: auto;
    height: auto;
  }
  .mac-settings.is-minimized .mac-body {
    display: none;
  }

  .mac-settings.is-expanded {
    width: min(480px, calc(100vw - 24px));
  }
  :global(.mac-os-body) .mac-settings.is-expanded {
    top: max(env(safe-area-inset-top, 0px), 58px);
    bottom: max(env(safe-area-inset-bottom, 0px), 12px);
  }

  .mac-window-chrome {
    flex-shrink: 0;
    border-bottom: 1px solid var(--chrome-border);
    background: var(--chrome-subtle);
  }

  .mac-traffic {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 11px 14px 0;
  }
  .mac-traffic .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 0.5px solid rgb(0 0 0 / 0.15);
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    color: transparent;
    transition: color 0.12s ease, filter 0.12s ease, transform 0.12s ease;
  }
  .mac-traffic:hover .dot {
    color: rgb(0 0 0 / 0.55);
  }
  .mac-traffic .dot:hover {
    filter: brightness(1.08);
    transform: scale(1.08);
  }
  .mac-traffic .dot:active {
    transform: scale(0.94);
  }
  .mac-traffic .red::before { content: '×'; }
  .mac-traffic .yellow::before { content: '−'; }
  .mac-traffic .green::before { content: '+'; }
  .mac-traffic .red { background: #ff5f57; }
  .mac-traffic .yellow { background: #febc2e; }
  .mac-traffic .green { background: #28c840; }
  .mac-settings.is-minimized .mac-traffic .yellow {
    box-shadow: 0 0 0 2px rgb(254 188 46 / 0.45);
  }
  .mac-settings.is-expanded .mac-traffic .green {
    box-shadow: 0 0 0 2px rgb(40 200 64 / 0.45);
  }

  .mac-titlebar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    min-height: 38px;
    padding: 4px 10px 10px;
    gap: 8px;
  }
  .mac-title {
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: rgb(255 255 255 / 0.88);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mac-title-center {
    text-align: center;
    grid-column: 2;
  }
  .mac-title-spacer {
    grid-column: 1;
    width: 1px;
  }
  .mac-back {
    grid-column: 1;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    border: 0;
    background: transparent;
    color: #b48cff;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 2px;
    border-radius: 6px;
    justify-self: start;
  }
  .mac-back:hover { background: rgb(255 255 255 / 0.06); }
  .mac-back-chevron { font-size: 1.15rem; line-height: 1; margin-top: -1px; }
  .mac-close {
    grid-column: 3;
    justify-self: end;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 6px;
    background: rgb(255 255 255 / 0.06);
    color: rgb(255 255 255 / 0.7);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  .mac-close:hover { background: rgb(255 255 255 / 0.12); color: #fff; }

  .mac-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 12px 14px 16px;
  }

  .mac-pane {
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: mac-pane-in 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes mac-pane-in {
    from { opacity: 0; transform: translateX(12px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .mac-search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .mac-search-stage {
    transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), margin 0.32s ease;
  }
  .mac-search-stage.is-spotlight {
    transform: scale(1.02);
    margin-bottom: 4px;
  }
  .mac-search-stage.is-spotlight .mac-search {
    padding-top: 11px;
    padding-bottom: 11px;
    font-size: 0.92rem;
    background: rgb(0 0 0 / 0.38);
    border-color: rgb(180 140 255 / 0.45);
    box-shadow:
      0 12px 32px rgb(0 0 0 / 0.28),
      0 0 0 4px rgb(180 140 255 / 0.14);
  }

  .mac-home-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: mac-home-in 0.32s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes mac-home-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .cc-widget-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(74px, auto));
    gap: 10px;
  }
  .cc-cell-2x2 {
    grid-column: span 2;
    grid-row: span 2;
  }
  .cc-cell {
    min-height: 0;
  }

  .mac-spotlight-panel {
    flex: 1;
    min-height: 180px;
    animation: mac-spotlight-in 0.34s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes mac-spotlight-in {
    from { opacity: 0; transform: translateY(10px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .mac-spotlight-hint,
  .mac-spotlight-empty {
    margin: 18px 0 12px;
    text-align: center;
    font-size: 0.82rem;
    color: rgb(255 255 255 / 0.45);
  }
  .mac-spotlight-suggest {
    list-style: none;
    margin: 0;
    padding: 0 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .mac-spotlight-chip {
    border: 1px solid rgb(255 255 255 / 0.14);
    background: rgb(255 255 255 / 0.07);
    color: rgb(255 255 255 / 0.82);
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .mac-spotlight-chip:hover {
    background: rgb(180 140 255 / 0.22);
    transform: translateY(-1px);
  }
  .mac-spotlight-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.08);
  }
  .mac-spotlight-list > li {
    border-top: 1px solid rgb(255 255 255 / 0.07);
    animation: mac-spotlight-item 0.32s cubic-bezier(0.32, 0.72, 0, 1) both;
    animation-delay: calc(var(--i, 0) * 35ms);
  }
  .mac-spotlight-list > li:first-child { border-top: 0; }
  @keyframes mac-spotlight-item {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .mac-spotlight-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.12s ease;
  }
  .mac-spotlight-row:hover { background: rgb(255 255 255 / 0.06); }
  .mac-spotlight-row.is-on { background: rgb(180 140 255 / 0.1); }
  .mac-spotlight-row-icon { font-size: 1.25rem; width: 28px; text-align: center; }
  .mac-spotlight-row-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mac-spotlight-row-title { font-size: 0.86rem; font-weight: 600; }
  .mac-spotlight-row-sub {
    font-size: 0.68rem;
    color: rgb(255 255 255 / 0.45);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mac-search-icon {
    position: absolute;
    left: 11px;
    color: rgb(255 255 255 / 0.42);
    font-size: 0.95rem;
    pointer-events: none;
  }
  .mac-search {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 32px 9px 32px;
    border-radius: 10px;
    border: 1px solid rgb(255 255 255 / 0.1);
    background: rgb(0 0 0 / 0.22);
    color: #f3ecff;
    font-size: 0.84rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .mac-search::placeholder { color: rgb(255 255 255 / 0.38); }
  .mac-search:focus {
    border-color: rgb(180 140 255 / 0.55);
    box-shadow: 0 0 0 3px rgb(180 140 255 / 0.18);
  }
  .mac-search-clear {
    position: absolute;
    right: 6px;
    width: 22px;
    height: 22px;
    border: 0;
    border-radius: 50%;
    background: rgb(255 255 255 / 0.12);
    color: rgb(255 255 255 / 0.75);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
  }

  .mac-category-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .mac-category-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 8px 12px;
    border-radius: 12px;
    border: 1px solid rgb(255 255 255 / 0.1);
    background: rgb(255 255 255 / 0.05);
    color: inherit;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
  }
  .mac-category-tile:hover {
    background: rgb(255 255 255 / 0.1);
    border-color: rgb(180 140 255 / 0.35);
    transform: translateY(-1px);
  }
  .mac-category-tile:active { transform: scale(0.98); }
  .mac-category-icon {
    font-size: 1.65rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(145deg, rgb(255 255 255 / 0.1), rgb(255 255 255 / 0.03));
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.18);
  }
  .mac-category-name {
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.2;
  }
  .mac-category-desc {
    font-size: 0.62rem;
    color: rgb(255 255 255 / 0.48);
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mac-group { display: flex; flex-direction: column; gap: 6px; }
  .mac-group-compact { margin-top: 2px; }
  .mac-group-label {
    margin: 0 0 2px 10px;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgb(255 255 255 / 0.45);
  }

  .mac-list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-radius: 11px;
    overflow: hidden;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.08);
  }
  .mac-list > li + li {
    border-top: 1px solid rgb(255 255 255 / 0.07);
  }

  .mac-widget-row,
  .mac-action-row,
  .mac-setting-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    box-sizing: border-box;
    background: transparent;
    border: 0;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s ease;
    touch-action: pan-y;
  }
  .mac-widget-row:hover,
  .mac-action-row:hover:not(.is-disabled),
  .mac-setting-row:hover { background: rgb(255 255 255 / 0.06); }
  .mac-widget-row.is-on { background: rgb(180 140 255 / 0.08); }
  .mac-widget-row.is-dragging { opacity: 0.45; cursor: grabbing; touch-action: none; }
  .mac-action-row.is-disabled { opacity: 0.5; cursor: not-allowed; }
  .mac-action-row.is-accent { background: rgb(180 140 255 / 0.1); }

  .mac-row-icon {
    font-size: 1.25rem;
    width: 28px;
    text-align: center;
    flex-shrink: 0;
  }
  .mac-row-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .mac-row-title {
    font-size: 0.84rem;
    font-weight: 500;
    line-height: 1.25;
  }
  .mac-row-sub {
    font-size: 0.68rem;
    color: rgb(255 255 255 / 0.48);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mac-row-value {
    font-size: 0.76rem;
    color: rgb(255 255 255 / 0.45);
    flex-shrink: 0;
  }
  .mac-row-chevron {
    color: rgb(255 255 255 / 0.35);
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .mac-setting-row {
    justify-content: space-between;
    cursor: default;
  }
  .mac-setting-toggle { cursor: pointer; }
  .mac-setting-row.is-disabled { opacity: 0.45; }

  .mac-select {
    max-width: 52%;
    background: rgb(0 0 0 / 0.25);
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 0.78rem;
  }

  .mac-wall-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 2px 0;
  }
  .mac-wall-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    border: 2px solid rgb(255 255 255 / 0.1);
    border-radius: 16px;
    background: rgb(255 255 255 / 0.05);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  }
  .mac-wall-card:hover {
    border-color: rgb(255 255 255 / 0.22);
    transform: translateY(-1px);
  }
  .mac-wall-card.is-active {
    border-color: rgb(180 140 255 / 0.85);
    box-shadow:
      0 0 0 1px rgb(180 140 255 / 0.35),
      0 8px 20px rgb(120 80 200 / 0.22);
  }
  .mac-wall-thumb {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 12px;
    display: block;
    background: rgb(0 0 0 / 0.2);
  }
  .mac-wall-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: 12px;
    background: rgb(255 255 255 / 0.08);
    font-size: 1.6rem;
  }
  .mac-wall-label {
    font-size: 0.74rem;
    font-weight: 600;
    color: rgb(255 255 255 / 0.88);
    padding: 0 2px 2px;
  }

  .mac-list-sliders { padding: 4px 0; }
  .mac-slider-row {
    padding: 10px 12px 12px;
    border-top: 1px solid rgb(255 255 255 / 0.07);
  }
  .mac-slider-row:first-child { border-top: 0; }
  .mac-slider-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .mac-slider {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    height: 4px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.16);
    outline: none;
  }
  .mac-slider::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f5f5f7;
    border: 0.5px solid rgb(0 0 0 / 0.08);
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.28);
  }

  .mac-list-info { padding: 4px 0; }
  .mac-info-row {
    padding: 10px 12px;
    font-size: 0.74rem;
    line-height: 1.45;
    color: rgb(255 255 255 / 0.55);
    border-top: 1px solid rgb(255 255 255 / 0.07);
  }
  .mac-info-row:first-child { border-top: 0; }

  .mac-pane-hint,
  .mac-footnote,
  .mac-empty {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: rgb(255 255 255 / 0.48);
    padding: 0 4px;
  }

  /* macOS-style toggle */
  .mac-toggle {
    position: relative;
    width: 42px;
    height: 26px;
    display: inline-block;
    flex-shrink: 0;
  }
  .mac-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  .mac-toggle span {
    position: absolute;
    inset: 0;
    background: rgb(255 255 255 / 0.18);
    border-radius: 999px;
    transition: background 0.22s ease;
    cursor: pointer;
  }
  .mac-toggle span::before {
    content: '';
    position: absolute;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    top: 2px;
    left: 2px;
    transition: transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.28);
  }
  .mac-toggle input:checked + span { background: #34c759; }
  .mac-toggle input:checked + span::before { transform: translateX(16px); }
  .mac-toggle input:disabled + span { opacity: 0.45; cursor: not-allowed; }

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
    .mac-settings {
      top: auto;
      left: max(env(safe-area-inset-left, 0px), 8px);
      right: max(env(safe-area-inset-right, 0px), 8px);
      bottom: max(env(safe-area-inset-bottom, 0px), 8px);
      width: auto;
      border-radius: 16px;
    }
    :global(.mac-os-body) .mac-settings {
      top: max(env(safe-area-inset-top, 0px), 58px);
      bottom: calc(max(env(safe-area-inset-bottom, 0px), 10px) + 72px);
    }
    .mac-category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
