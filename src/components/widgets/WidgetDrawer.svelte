<script lang="ts">
  import { onMount } from 'svelte';
  import ControlCenterClock from './ControlCenterClock.svelte';
  import ControlCenterSlot from './ControlCenterSlot.svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import {
    loadSlotWidget,
    saveSlotWidget,
    type SlotWidgetKey,
  } from '../../lib/control-center-slot';
  import {
    DRAWER_CATEGORY_ICONS,
    WIDGET_ICON_MAP,
    type PixelIconName,
    type WidgetIconKey,
  } from '../../lib/pixel-icons';
  import { modeFromBg, type WallpaperMode } from '../../features/wallpaper/state/mode';
  import { getDrawerCatalog, type DrawerWidget } from '../../lib/i18n/drawer-catalog';
  import { getMessages, initLocale, localeState } from '../../lib/i18n/locale.svelte';
  import UiSkinPicker from '../../features/ui/components/UiSkinPicker.svelte';

  type WidgetKey = WidgetIconKey;
  type PaneId = 'home' | 'widgets' | 'wallpaper' | 'desktop' | 'ui';

  type Widget = DrawerWidget;

  interface Props {
    enabled: Record<WidgetKey, boolean>;
    bg: {
      sceneId: string;
      useVideo: boolean;
      usePly: boolean;
      rain: boolean;
      rainDrops: boolean;
      rainDropsLinked?: boolean;
      sakura: boolean;
      brightness: number;
      speed: number;
    };
    scenes: Array<{ id: string; label: string; hasRain?: boolean; hasPly?: boolean; poster?: string | null; hasSakura?: boolean }>;
    hasSnapshot?: boolean;
    isCleared?: boolean;
    open?: boolean;
    spotlightToken?: number;
    onToggle: (key: WidgetKey, drop?: { x: number; y: number }) => void;
    onPatchBg: (p: Partial<Props['bg']>) => void;
    onSetWallpaperMode?: (mode: WallpaperMode) => void;
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
    onSetWallpaperMode,
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

  const catalog = $derived(getDrawerCatalog(localeState.current));
  const m = $derived(getMessages());
  const categories = $derived(catalog.categories);
  const widgetGroups = $derived(catalog.widgetGroups);
  const items = $derived(catalog.items);

  const itemMap = $derived(Object.fromEntries(items.map((w) => [w.id, w])) as Record<WidgetKey, Widget>);
  const activeScene = $derived(scenes.find((s) => s.id === bg.sceneId));
  const rainAvailable = $derived(!!activeScene?.hasRain);
  const plyAvailable = $derived(!!activeScene?.hasPly);
  const sakuraAvailable = $derived(!!activeScene?.hasSakura);
  const wallpaperMode = $derived(modeFromBg(bg));

  function pickWallpaperMode(mode: WallpaperMode) {
    if (mode === 'ply' && !plyAvailable) return;
    if (onSetWallpaperMode) onSetWallpaperMode(mode);
    else onPatchBg(mode === 'ply' ? { usePly: true, useVideo: false } : mode === 'video' ? { usePly: false, useVideo: true } : { usePly: false, useVideo: false });
  }

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
    pane === 'home' ? m.drawer.controlCenter : categories.find((c) => c.id === pane)?.name ?? m.drawer.settings
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
    initLocale();
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
      ensureGhost(w.name);
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
    aria-label={m.drawer.close}
    onclick={() => (spotlightActive ? exitSpotlight() : closeDrawer())}
  ></button>
{/if}

<aside
  class="mac-settings"
  class:is-open={open}
  class:is-spotlight={spotlightActive}
  class:is-minimized={panelMinimized}
  class:is-expanded={panelExpanded}
  aria-label={m.drawer.controlCenter}
  aria-hidden={!open}
  onkeydown={onDrawerKeydown}
>
  <div class="mac-window-chrome">
    <div class="mac-traffic" role="toolbar" aria-label={m.drawer.windowControls}>
      <button type="button" class="dot red" aria-label={m.drawer.closeBtn} title={m.drawer.closeBtn} onclick={onTrafficRed}></button>
      <button
        type="button"
        class="dot yellow"
        aria-label={panelMinimized ? m.drawer.restore : m.drawer.minimize}
        title={panelMinimized ? m.drawer.restore : m.drawer.minimize}
        onclick={onTrafficYellow}
      ></button>
      <button
        type="button"
        class="dot green"
        aria-label={panelExpanded ? m.drawer.standardSize : m.drawer.expand}
        title={panelExpanded ? m.drawer.standardSize : m.drawer.expand}
        onclick={onTrafficGreen}
      ></button>
    </div>
    <div class="mac-titlebar">
      {#if pane !== 'home'}
        <button type="button" class="mac-back" onclick={goBack} aria-label={m.drawer.back}>
          <span class="mac-back-chevron" aria-hidden="true">‹</span>
          <span>{m.drawer.home}</span>
        </button>
      {:else}
        <span class="mac-title-spacer" aria-hidden="true"></span>
      {/if}
      <span class="mac-title mac-title-center">{paneTitle}</span>
      <button type="button" class="mac-close" aria-label={m.drawer.closeBtn} onclick={closeDrawer}>×</button>
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
              placeholder={m.drawer.searchPlaceholder}
              bind:value={searchQuery}
              aria-label={m.drawer.searchAria}
              onfocus={() => (searchFocused = true)}
              onblur={() => {
                if (!searchQuery.trim()) searchFocused = false;
              }}
            />
            {#if searchQuery}
              <button type="button" class="mac-search-clear" aria-label={m.drawer.clearSearch} onclick={() => (searchQuery = '')}>×</button>
            {/if}
          </div>
        </div>

        {#if spotlightActive}
          <div class="mac-spotlight-panel">
            {#if normalizedQuery}
              {#if searchResults.length === 0}
                <p class="mac-spotlight-empty">{m.drawer.noResults}「{searchQuery}」</p>
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
                        <span class="mac-spotlight-row-icon"><PixelIcon name={WIDGET_ICON_MAP[w.id]} size={18} /></span>
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
                            aria-label={`${w.name} ${m.drawer.toggleSwitch}`}
                          />
                          <span></span>
                        </label>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            {:else}
              <p class="mac-spotlight-hint">{m.drawer.searchHint}</p>
              <ul class="mac-spotlight-suggest">
                {#each catalog.searchHints as hint}
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
                  <span class="mac-category-icon"><PixelIcon name={cat.icon} size={22} /></span>
                  <span class="mac-category-name">{cat.name}</span>
                  <span class="mac-category-desc">{cat.desc}</span>
                </button>
              {/each}
            </div>

            <section class="mac-group mac-group-compact">
              <h3 class="mac-group-label">{m.drawer.quickActions}</h3>
              <ul class="mac-list">
                <li>
                  <button
                    type="button"
                    class="mac-action-row"
                    class:is-disabled={isCleared}
                    disabled={isCleared}
                    onclick={() => { if (!isCleared) onClearAll?.(); }}
                  >
                    <span class="mac-row-icon"><PixelIcon name="clear" size={18} /></span>
                    <span class="mac-row-title">{m.drawer.clearScreen}</span>
                    <span class="mac-row-value">{isCleared ? m.drawer.cleared : m.drawer.keepWallpaper}</span>
                  </button>
                </li>
                {#if hasSnapshot}
                  <li>
                    <button type="button" class="mac-action-row is-accent" onclick={() => onRestore?.()}>
                      <span class="mac-row-icon">↩</span>
                      <span class="mac-row-title">{m.drawer.restoreLayout}</span>
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
        <p class="mac-pane-hint">{m.drawer.paneHint}</p>
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
                    title={w.pinned ? m.drawer.tapToggle : m.drawer.tapToggleDrag}
                  >
                    <span class="mac-row-icon"><PixelIcon name={WIDGET_ICON_MAP[w.id]} size={18} /></span>
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
                        aria-label={`${w.name} ${m.drawer.toggleSwitch}`}
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
          <h3 class="mac-group-label">{m.drawer.scenes}</h3>
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
                  <span class="mac-wall-fallback" aria-hidden="true"><PixelIcon name="frame" size={24} /></span>
                {/if}
                <span class="mac-wall-label">{s.label}</span>
              </button>
            {/each}
          </div>
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.ambience}</h3>
          <ul class="mac-list">
            <li>
              <label class="mac-setting-row mac-setting-toggle">
                <div class="mac-row-text">
                  <span class="mac-row-title">{m.drawer.followWeather}</span>
                  <span class="mac-row-sub">{m.drawer.followWeatherSub}</span>
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
                  <span class="mac-row-title">{m.drawer.rainDrops}</span>
                  <span class="mac-row-sub">{bg.rainDropsLinked !== false ? m.drawer.rainLinked : m.drawer.rainManual}</span>
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
                  <span class="mac-row-title">{m.drawer.sakura}</span>
                  <span class="mac-row-sub">{m.drawer.sakuraSub}</span>
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
            <p class="mac-footnote">{m.drawer.sakuraFoot}</p>
          {/if}
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.playback}</h3>
          <div class="mac-segment" role="group" aria-label={m.drawer.playback}>
            <button
              type="button"
              class="mac-segment-btn"
              class:is-active={wallpaperMode === 'video'}
              onclick={() => pickWallpaperMode('video')}
            >
              {m.drawer.modeVideo}
            </button>
            <button
              type="button"
              class="mac-segment-btn"
              class:is-active={wallpaperMode === 'poster'}
              onclick={() => pickWallpaperMode('poster')}
            >
              {m.drawer.modePoster}
            </button>
            <button
              type="button"
              class="mac-segment-btn"
              class:is-active={wallpaperMode === 'ply'}
              class:is-disabled={!plyAvailable}
              disabled={!plyAvailable}
              onclick={() => pickWallpaperMode('ply')}
            >
              {m.drawer.modePly}
            </button>
          </div>
          {#if !plyAvailable}
            <p class="mac-footnote">{m.drawer.plyMissing}</p>
          {:else if wallpaperMode === 'ply'}
            <p class="mac-footnote">{m.drawer.plyHint}</p>
          {/if}
          <ul class="mac-list">
            <li>
              <label class="mac-setting-row mac-setting-toggle" class:is-disabled={!rainAvailable || wallpaperMode !== 'video'}>
                <div class="mac-row-text">
                  <span class="mac-row-title">{m.drawer.rainVideo}</span>
                  <span class="mac-row-sub">{m.drawer.rainVideoSub}</span>
                </div>
                <span class="mac-toggle mac-toggle-inline">
                  <input
                    type="checkbox"
                    checked={bg.rain}
                    disabled={!rainAvailable || wallpaperMode !== 'video'}
                    onchange={(e) => onPatchBg({ rain: (e.currentTarget as HTMLInputElement).checked })}
                  />
                  <span></span>
                </span>
              </label>
            </li>
          </ul>
          {#if !rainAvailable}
            <p class="mac-footnote">{m.drawer.noRainVideo}</p>
          {/if}
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.display}</h3>
          <ul class="mac-list mac-list-sliders">
            <li class="mac-slider-row">
              <div class="mac-slider-head">
                <span class="mac-row-title">{m.drawer.brightness}</span>
                <span class="mac-row-value">{Math.round(bg.brightness * 100)}%</span>
              </div>
              <input
                type="range"
                class="mac-slider"
                min="0.5"
                max="1.5"
                step="0.05"
                value={bg.brightness}
                aria-label={m.drawer.brightnessAria}
                oninput={(e) => onPatchBg({ brightness: Number((e.currentTarget as HTMLInputElement).value) })}
              />
            </li>
            <li class="mac-slider-row">
              <div class="mac-slider-head">
                <span class="mac-row-title">{m.drawer.speed}</span>
                <span class="mac-row-value">{bg.speed.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                class="mac-slider"
                min="0.5"
                max="2"
                step="0.05"
                value={bg.speed}
                aria-label={m.drawer.speedAria}
                oninput={(e) => onPatchBg({ speed: Number((e.currentTarget as HTMLInputElement).value) })}
              />
            </li>
          </ul>
        </section>
      </div>
    {:else if pane === 'desktop'}
      <div class="mac-pane mac-pane-detail">
        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.layout}</h3>
          <ul class="mac-list">
            <li>
              <button
                type="button"
                class="mac-action-row"
                class:is-disabled={isCleared}
                disabled={isCleared}
                onclick={() => { if (!isCleared) onClearAll?.(); }}
              >
                <span class="mac-row-icon"><PixelIcon name="clear" size={18} /></span>
                <div class="mac-row-text">
                  <span class="mac-row-title">{m.drawer.clearScreen}</span>
                  <span class="mac-row-sub">{m.drawer.clearAllSub}</span>
                </div>
              </button>
            </li>
            {#if hasSnapshot}
              <li>
                <button type="button" class="mac-action-row is-accent" onclick={() => onRestore?.()}>
                  <span class="mac-row-icon">↩</span>
                  <div class="mac-row-text">
                    <span class="mac-row-title">{m.drawer.restoreLast}</span>
                    <span class="mac-row-sub">{m.drawer.restoreLastSub}</span>
                  </div>
                  <span class="mac-row-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            {/if}
          </ul>
        </section>

        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.tips}</h3>
          <ul class="mac-list mac-list-info">
            <li class="mac-info-row">{m.drawer.tipDrag}</li>
            <li class="mac-info-row">{m.drawer.tipClock}</li>
            <li class="mac-info-row">{m.drawer.tipMusic}</li>
          </ul>
        </section>
      </div>
    {:else if pane === 'ui'}
      <div class="mac-pane mac-pane-detail">
        <section class="mac-group">
          <h3 class="mac-group-label">{m.drawer.uiSwitch}</h3>
          <UiSkinPicker />
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
    --wd-hover: var(--chrome-hover);
    --wd-subtle: var(--chrome-subtle);
    --wd-active: var(--chrome-active);
    --wd-border: var(--chrome-border);
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
    color: var(--chrome-text);
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
  .mac-back:hover { background: var(--wd-hover); }
  .mac-back-chevron { font-size: 1.15rem; line-height: 1; margin-top: -1px; }
  .mac-close {
    grid-column: 3;
    justify-self: end;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 6px;
    background: var(--wd-subtle);
    color: var(--chrome-text-muted);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  .mac-close:hover { background: var(--wd-hover); color: var(--chrome-text); }

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
    color: var(--chrome-text-muted);
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
    color: var(--chrome-text);
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
  .mac-spotlight-row:hover { background: var(--wd-hover); }
  .mac-spotlight-row.is-on { background: rgb(180 140 255 / 0.1); }
  .mac-spotlight-row-icon {
    width: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
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
    color: var(--chrome-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mac-search-icon {
    position: absolute;
    left: 11px;
    color: var(--chrome-text-muted);
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
  .mac-search::placeholder { color: var(--chrome-text-muted); }
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
    color: var(--chrome-text-muted);
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
    color: var(--chrome-text-muted);
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
    color: var(--chrome-text-muted);
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
  .mac-setting-row:hover { background: var(--wd-hover); }
  .mac-widget-row.is-on { background: rgb(180 140 255 / 0.08); }
  .mac-widget-row.is-dragging { opacity: 0.45; cursor: grabbing; touch-action: none; }
  .mac-action-row.is-disabled { opacity: 0.5; cursor: not-allowed; }
  .mac-action-row.is-accent { background: rgb(180 140 255 / 0.1); }

  .mac-row-icon {
    width: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    color: var(--chrome-text-muted);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mac-row-value {
    font-size: 0.76rem;
    color: var(--chrome-text-muted);
    flex-shrink: 0;
  }
  .mac-row-chevron {
    color: var(--chrome-text-muted);
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .mac-setting-row {
    justify-content: space-between;
    cursor: default;
  }
  .mac-setting-toggle { cursor: pointer; }
  .mac-setting-row.is-disabled { opacity: 0.45; }

  .mac-segment {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    padding: 4px;
    margin-bottom: 10px;
    border-radius: 10px;
    background: var(--wd-subtle);
    border: 1px solid var(--wd-border);
  }
  .mac-segment-btn {
    border: 0;
    border-radius: 8px;
    padding: 8px 6px;
    font-size: 0.78rem;
    color: var(--chrome-text-muted);
    background: transparent;
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease;
  }
  .mac-segment-btn.is-active {
    background: var(--wd-active);
    color: var(--chrome-text);
    font-weight: 600;
  }
  .mac-segment-btn.is-disabled,
  .mac-segment-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .mac-select {
    max-width: 52%;
    background: var(--chrome-subtle);
    color: var(--chrome-text);
    border: 1px solid var(--chrome-border);
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
    color: var(--chrome-text);
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
    color: var(--chrome-text-muted);
    border-top: 1px solid rgb(255 255 255 / 0.07);
  }
  .mac-info-row:first-child { border-top: 0; }

  .mac-pane-hint,
  .mac-footnote,
  .mac-empty {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--chrome-text-muted);
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
