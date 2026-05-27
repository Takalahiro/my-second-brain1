<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { DESKTOP_ATMOSPHERE_KEY, type DesktopAtmosphereState } from '../../lib/desktop-atmosphere';
  import { media } from '../../lib/media';
  import LazyWidget from './LazyWidget.svelte';
  import { resolveWidgetLoader } from '../../design-system/resolveWidgetLoader';
  import { isStructuralSkinId } from '../../design-system/structural/registry';
  import StructuralBackgroundOverlay from '../../design-system/structural/widgets/StructuralBackgroundOverlay.svelte';
  import { widgetLoaders } from './widgetLoaders';
  import WidgetDrawer from './WidgetDrawer.svelte';
  import PixelFxLayer from '../../design-system/pixel/components/PixelFxLayer.svelte';
  import SkinMenuBar from '../../design-system/structural/components/SkinMenuBar.svelte';
  import MacMenuBar from '../desktop/MacMenuBar.svelte';
  import MobileHomeDock from '../desktop/MobileHomeDock.svelte';
  import { readGlobalMuted, writeGlobalMuted } from '../../lib/global-audio-mute';
  import {
    computeLinkedRainDrops,
    readCachedWeatherCode,
  } from '../../lib/weather-rain';
  import { patchFromMode, type WallpaperMode } from '../../features/wallpaper/state/mode';
  import SkinCanvasWallpaper from '../wallpaper/SkinCanvasWallpaper.svelte';
  import SkinScrollIndicator from '../desktop/SkinScrollIndicator.svelte';
  import { useSkinChrome } from '../../features/ui/skin-chrome.svelte';
  import { clampDropPoint } from '../../lib/floating-widget-layout';
  import { initUiSkin } from '../../features/ui/apply-ui';
  import type { UiSkinId } from '../../features/ui/types';

  interface Props {
    backgroundDefault?: boolean;
    desktopMode?: boolean;
  }
  let { backgroundDefault = false, desktopMode = false }: Props = $props();

  const skinChrome = useSkinChrome();
  const isPixelSkin = $derived(skinChrome.id === 'pixel');
  const isStructuralSkin = $derived(isStructuralSkinId(skinChrome.id));
  const wl = (key: WidgetKey) => resolveWidgetLoader(skinChrome.id, key);

  const STORAGE_KEY = 'second-brain:widgets';

  type WidgetKey = 'background' | 'clock' | 'music' | 'notes' | 'todo' | 'calendar' | 'pomodoro' | 'weather' | 'stats' | 'world' | 'graph' | 'territory' | 'calculator' | 'python' | 'whiteboard' | 'whitenoise' | 'network';
  type Enabled = Record<WidgetKey, boolean>;

  const WIDGET_KEYS: WidgetKey[] = [
    'background',
    'clock',
    'music',
    'notes',
    'todo',
    'calendar',
    'pomodoro',
    'weather',
    'stats',
    'world',
    'graph',
    'territory',
    'calculator',
    'python',
    'whiteboard',
    'whitenoise',
    'network',
  ];

  function createEmptyEnabled(background: boolean): Enabled {
    return {
      background,
      clock: false,
      music: false,
      notes: false,
      todo: false,
      calendar: false,
      pomodoro: false,
      weather: false,
      stats: false,
      world: false,
      graph: false,
      territory: false,
      calculator: false,
      python: false,
      whiteboard: false,
      whitenoise: false,
      network: false,
    };
  }

  function isWidgetsCleared(state: Enabled): boolean {
    return WIDGET_KEYS.filter((k) => k !== 'background').every((k) => !state[k]);
  }

  function parseStoredEnabled(raw: unknown, backgroundDefault: boolean): Enabled | null {
    if (!raw || typeof raw !== 'object') return null;
    const s = raw as { enabled?: Partial<Enabled> };
    if (!s.enabled || typeof s.enabled !== 'object') return null;
    const out = createEmptyEnabled(backgroundDefault);
    for (const key of WIDGET_KEYS) {
      if (typeof s.enabled[key] === 'boolean') out[key] = s.enabled[key]!;
    }
    if (backgroundDefault) out.background = true;
    return out;
  }

  function pixelDesktopDefaults(backgroundDefault: boolean, useVideo: boolean): Enabled {
    return {
      ...createEmptyEnabled(backgroundDefault),
      clock: backgroundDefault && useVideo,
      todo: true,
      music: true,
      notes: true,
      pomodoro: true,
      weather: true,
      stats: true,
    };
  }

  function usesFloatingDesktopDefaults(skinId: UiSkinId, isDesktop: boolean) {
    return isDesktop && (skinId === 'pixel' || isStructuralSkinId(skinId));
  }

  function resolveEnabledOnLoad(
    stored: Enabled | null,
    skinId: UiSkinId,
    backgroundDefault: boolean,
    useVideo: boolean,
    isDesktop: boolean,
  ): Enabled {
    if (stored) {
      if (usesFloatingDesktopDefaults(skinId, isDesktop) && isWidgetsCleared(stored)) {
        return pixelDesktopDefaults(backgroundDefault, useVideo);
      }
      return stored;
    }
    if (usesFloatingDesktopDefaults(skinId, isDesktop)) {
      return pixelDesktopDefaults(backgroundDefault, useVideo);
    }
    return createEmptyEnabled(backgroundDefault);
  }
  type BgState = {
    sceneId: string;
    useVideo: boolean;
    usePly: boolean;
    rain: boolean;
    rainDrops: boolean;
    // true 时雨滴跟着天气 / 雨天视频自动开
    rainDropsLinked: boolean;
    sakura: boolean;
    brightness: number;
    speed: number;
    mobileIndex: number;
  };

  let ready = $state(false);
  let enabled = $state<Enabled>(createEmptyEnabled(backgroundDefault));
  // 壁纸层一键静音（音乐 + 白噪音）
  let globalMuted = $state(false);
  // 清屏前的快照；有值就显示「恢复」按钮
  let snapshot = $state<Enabled | null>(null);
  let isMobile = $state(false);
  let controlCenterOpen = $state(false);
  let spotlightToken = $state(0);
  let bg = $state<BgState>({
    sceneId: media.scenes[0]?.id ?? 'usyd',
    useVideo: true,
    usePly: false,
    rain: false,
    rainDrops: false,
    rainDropsLinked: true,
    sakura: false,
    brightness: 1,
    speed: 1,
    mobileIndex: 0,
  });

  let lastWeatherCode = $state<number | null>(null);

  function sceneHasRain(sceneId = bg.sceneId) {
    return !!media.scenes.find((s) => s.id === sceneId)?.hasRain;
  }

  function syncLinkedRainDrops(weatherCode: number | null = lastWeatherCode) {
    if (!bg.rainDropsLinked) return;
    const next = computeLinkedRainDrops(weatherCode, bg.rain, sceneHasRain());
    if (next !== bg.rainDrops) bg = { ...bg, rainDrops: next };
  }

  function onWeatherSync(e: Event) {
    const ev = e as CustomEvent<{ weatherCode?: number }>;
    const code = ev.detail?.weatherCode;
    if (typeof code !== 'number') return;
    lastWeatherCode = code;
    syncLinkedRainDrops(code);
    persist();
  }

  const desktopAtmosphere = $state<DesktopAtmosphereState>({ rainDrops: false });
  setContext(DESKTOP_ATMOSPHERE_KEY, desktopAtmosphere);
  $effect(() => {
    desktopAtmosphere.rainDrops = desktopMode && bg.rainDrops;
  });

  $effect(() => {
    if (!desktopMode || typeof document === 'undefined') return;
    document.body.classList.toggle('mac-os-body--scroll', isMobile);
    return () => document.body.classList.remove('mac-os-body--scroll');
  });

  onMount(() => {
    const skinId = initUiSkin();
    globalMuted = readGlobalMuted();
    let storedEnabled: Enabled | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.bg && typeof s.bg === 'object') {
          bg = {
            sceneId: typeof s.bg.sceneId === 'string' ? s.bg.sceneId : bg.sceneId,
            useVideo: s.bg.useVideo !== false,
            usePly: !!s.bg.usePly,
            rain: !!s.bg.rain,
            rainDrops: !!s.bg.rainDrops,
            rainDropsLinked: s.bg.rainDropsLinked !== false,
            sakura: s.bg.sceneId === 'kyoto' ? !!s.bg.sakura : false,
            brightness: typeof s.bg.brightness === 'number' ? s.bg.brightness : 1,
            speed: typeof s.bg.speed === 'number' ? s.bg.speed : 1,
            mobileIndex: typeof s.bg.mobileIndex === 'number' ? s.bg.mobileIndex : 0,
          };
        }
        storedEnabled = parseStoredEnabled(s, backgroundDefault);
      }
    } catch {}
    enabled = resolveEnabledOnLoad(storedEnabled, skinId, backgroundDefault, bg.useVideo, desktopMode);
    lastWeatherCode = readCachedWeatherCode();
    syncLinkedRainDrops(lastWeatherCode);
    window.addEventListener('weather:sync', onWeatherSync);
    snapshot = null;
    // 监听移动端断点 —— 时钟在此条件下永远不 pin
    try {
      const mq = window.matchMedia('(max-width: 768px)');
      isMobile = mq.matches;
      const onChange = (e: MediaQueryListEvent) => { isMobile = e.matches; };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else mq.addListener(onChange);
    } catch {}
    ready = true;
    persist();
    return () => window.removeEventListener('weather:sync', onWeatherSync);
  });

  // 桌面 + 开了背景 + 用视频时，时钟钉右下角
  const clockPinned = $derived(!isMobile && enabled.background && bg.useVideo);

  function persist() {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, bg })); } catch {}
  }

  function toggleGlobalMute() {
    globalMuted = !globalMuted;
    writeGlobalMuted(globalMuted);
  }

  // 拖进桌面时，给各组件写初始落点
  const dropMap: Partial<Record<WidgetKey, { key: string; serialize: (drop: { x: number; y: number }) => string }>> = {
    music: {
      key: 'second-brain:music-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:music-layout') || '{}');
          const w = typeof cur.width === 'number' ? cur.width : 360;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, width: w });
        } catch { return ''; }
      },
    },
    notes: {
      key: 'second-brain:notes-widget-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:notes-widget-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 560;
          const h = typeof cur.h === 'number' ? cur.h : 440;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    // 时钟固定在右下角，不接受落点（pinned 不可拖）
    todo: {
      key: 'second-brain:todo-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:todo-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 360;
          const h = typeof cur.h === 'number' ? cur.h : 420;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    calendar: {
      key: 'second-brain:cal-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:cal-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 380;
          const h = typeof cur.h === 'number' ? cur.h : 460;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    pomodoro: {
      key: 'second-brain:pomo-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:pomo-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 340;
          const h = typeof cur.h === 'number' ? cur.h : 380;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    weather: {
      key: 'second-brain:weather-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:weather-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 340;
          const h = typeof cur.h === 'number' ? cur.h : 380;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    stats: {
      key: 'second-brain:stats-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:stats-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 560;
          const h = typeof cur.h === 'number' ? cur.h : 520;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    world: {
      key: 'second-brain:world-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:world-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 640;
          const h = typeof cur.h === 'number' ? cur.h : 440;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    graph: {
      key: 'second-brain:graph-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:graph-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 680;
          const h = typeof cur.h === 'number' ? cur.h : 540;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    territory: {
      key: 'second-brain:territory-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:territory-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 720;
          const h = typeof cur.h === 'number' ? cur.h : 520;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h });
        } catch { return ''; }
      },
    },
    calculator: {
      key: 'second-brain:calc-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:calc-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 420;
          const h = typeof cur.h === 'number' ? cur.h : 520;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 });
        } catch { return ''; }
      },
    },
    python: {
      key: 'second-brain:python-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:python-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 520;
          const h = typeof cur.h === 'number' ? cur.h : 560;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 });
        } catch { return ''; }
      },
    },
    whiteboard: {
      key: 'second-brain:whiteboard-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:whiteboard-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 640;
          const h = typeof cur.h === 'number' ? cur.h : 520;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 });
        } catch { return ''; }
      },
    },
    whitenoise: {
      key: 'second-brain:whitenoise-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:whitenoise-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 380;
          const h = typeof cur.h === 'number' ? cur.h : 480;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 });
        } catch { return ''; }
      },
    },
    network: {
      key: 'second-brain:network-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:network-layout') || '{}');
          const w = typeof cur.w === 'number' ? cur.w : 400;
          const h = typeof cur.h === 'number' ? cur.h : 460;
          const d = clampDropPoint(x, y);
          return JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 });
        } catch { return ''; }
      },
    },
  };

  function toggleEnabled(key: WidgetKey, drop?: { x: number; y: number }) {
    const next = !enabled[key];
    enabled = { ...enabled, [key]: next };
    if (next && drop) {
      const m = dropMap[key];
      if (m) {
        try {
          const payload = m.serialize(drop);
          if (payload) localStorage.setItem(m.key, payload);
        } catch {}
      }
    }
    // 用户在清屏后又主动开了组件 → 视为放弃快照
    if (next && snapshot) snapshot = null;
    persist();
  }
  function patchBg(p: Partial<BgState>) {
    const next = { ...bg, ...p };
    if (p.usePly === true) next.useVideo = false;
    if (p.useVideo === true) next.usePly = false;
    if (next.usePly && next.useVideo) next.useVideo = false;
    if (p.sceneId && p.sceneId !== 'kyoto') next.sakura = false;
    if (p.rainDrops !== undefined && p.rainDropsLinked === undefined) {
      next.rainDropsLinked = false;
    }
    if (p.rainDropsLinked === true) {
      next.rainDrops = computeLinkedRainDrops(
        lastWeatherCode,
        next.rain,
        sceneHasRain(next.sceneId),
      );
    } else if (p.rain !== undefined && next.rainDropsLinked) {
      next.rainDrops = computeLinkedRainDrops(
        lastWeatherCode,
        next.rain,
        sceneHasRain(next.sceneId),
      );
    }
    bg = next;
    persist();
  }
  function setMobileIndex(idx: number) {
    bg = { ...bg, mobileIndex: idx };
    persist();
  }

  function setWallpaperMode(mode: WallpaperMode) {
    patchBg(patchFromMode(mode));
  }

  // 一键清屏：背景留着，其它全关，当前状态存快照
  function clearAll() {
    // 如果当前已经是「除背景外全关」的状态，就忽略（避免清空之前的快照）
    const others = Object.entries(enabled).filter(([k]) => k !== 'background').some(([, v]) => v);
    if (!others) return;
    snapshot = { ...enabled };
    enabled = {
      background: enabled.background,
      clock: false,
      music: false,
      notes: false,
      todo: false,
      calendar: false,
      pomodoro: false,
      weather: false,
      stats: false,
      world: false,
      graph: false,
    territory: false,
      calculator: false,
      python: false,
      whiteboard: false,
      whitenoise: false,
      network: false,
    };
    persist();
  }
  // 恢复快照里的全部组件
  function restoreAll() {
    if (!snapshot) return;
    enabled = { ...snapshot };
    snapshot = null;
    persist();
  }
  // 是不是「只剩背景」的清屏态
  const isCleared = $derived(
    Object.entries(enabled).filter(([k]) => k !== 'background').every(([, v]) => !v)
  );

  function toggleControlCenter() {
    controlCenterOpen = !controlCenterOpen;
  }

  function openSpotlight() {
    controlCenterOpen = true;
    spotlightToken += 1;
  }

  function toggleManualFromDesktop() {
    window.dispatchEvent(new CustomEvent('second-brain:toggle-manual'));
  }

  const scenes = media.scenes.map((s) => ({
    id: s.id,
    label: s.label,
    hasRain: s.hasRain,
    hasPly: s.hasPly,
    poster: s.poster,
    hasSakura: s.id === 'kyoto',
  }));

</script>

{#if desktopMode}
  <div class="mac-desktop" aria-label="桌面">
    {#if ready}
      {#if isStructuralSkin}
        <SkinMenuBar
          controlCenterOpen={controlCenterOpen}
          globalMuted={globalMuted}
          hasSnapshot={!!snapshot}
          {isCleared}
          rainDrops={bg.rainDrops}
          onToggleControlCenter={toggleControlCenter}
          onToggleMute={toggleGlobalMute}
          onClearAll={clearAll}
          onRestore={restoreAll}
          onToggleManual={toggleManualFromDesktop}
          onOpenSpotlight={openSpotlight}
        />
      {:else}
        <MacMenuBar
          controlCenterOpen={controlCenterOpen}
          globalMuted={globalMuted}
          hasSnapshot={!!snapshot}
          {isCleared}
          rainDrops={bg.rainDrops}
          onToggleControlCenter={toggleControlCenter}
          onToggleMute={toggleGlobalMute}
          onClearAll={clearAll}
          onRestore={restoreAll}
          onToggleManual={toggleManualFromDesktop}
          onOpenSpotlight={openSpotlight}
        />
      {/if}
    {/if}

    {#if ready}
      <MobileHomeDock
        {controlCenterOpen}
        onOpenControlCenter={toggleControlCenter}
        onOpenManual={toggleManualFromDesktop}
      />
    {/if}

    {#if isPixelSkin}
      <PixelFxLayer />
    {/if}
    {#if skinChrome.canvasWallpaper}
      <SkinCanvasWallpaper />
    {/if}
    {#if skinChrome.immersive && skinChrome.profile.scrollIndicator}
      <SkinScrollIndicator skin={skinChrome.id} />
    {/if}

    <div class="mac-desktop-stage">
      {#if enabled.background && !skinChrome.canvasWallpaper}
        <LazyWidget
          show={true}
          loader={widgetLoaders.background}
          sceneId={bg.sceneId}
          useVideo={bg.useVideo}
          usePly={bg.usePly}
          rain={bg.rain}
          brightness={bg.brightness}
          speed={bg.speed}
          mobileIndex={bg.mobileIndex}
          onMobileIndexChange={setMobileIndex}
        />
        <LazyWidget
          show={true}
          loader={widgetLoaders.atmosphere}
          props={{
            rainDrops: bg.rainDrops,
            sakura: bg.sakura,
            sceneId: bg.sceneId,
            active: true,
          }}
        />
        {#if isStructuralSkin}
          <StructuralBackgroundOverlay
            sceneId={bg.sceneId}
            {scenes}
            onSceneChange={(id) => patchBg({ sceneId: id })}
          />
        {/if}
      {/if}

      {#if ready && enabled.clock}
        <LazyWidget
          show={true}
          loader={wl('clock')}
          props={{ onClose: () => toggleEnabled('clock'), pinned: clockPinned }}
        />
      {/if}
      {#if ready && enabled.music}
        <LazyWidget
          show={true}
          loader={wl('music')}
          props={{ onClose: () => toggleEnabled('music'), globalMuted }}
        />
      {/if}
      {#if ready && enabled.notes}
        <LazyWidget show={true} loader={wl('notes')} props={{ onClose: () => toggleEnabled('notes') }} />
      {/if}
      {#if ready && enabled.todo}
        <LazyWidget show={true} loader={wl('todo')} props={{ onClose: () => toggleEnabled('todo') }} />
      {/if}
      {#if ready && enabled.calendar}
        <LazyWidget show={true} loader={wl('calendar')} props={{ onClose: () => toggleEnabled('calendar') }} />
      {/if}
      {#if ready && enabled.pomodoro}
        <LazyWidget show={true} loader={wl('pomodoro')} props={{ onClose: () => toggleEnabled('pomodoro') }} />
      {/if}
      {#if ready && enabled.weather}
        <LazyWidget show={true} loader={wl('weather')} props={{ onClose: () => toggleEnabled('weather') }} />
      {/if}
      {#if ready && enabled.stats}
        <LazyWidget show={true} loader={wl('stats')} props={{ onClose: () => toggleEnabled('stats') }} />
      {/if}
      {#if ready && enabled.world}
        <LazyWidget show={true} loader={wl('world')} props={{ onClose: () => toggleEnabled('world') }} />
      {/if}
      {#if ready && enabled.graph}
        <LazyWidget show={true} loader={widgetLoaders.graph} props={{ onClose: () => toggleEnabled('graph') }} />
      {/if}
      {#if ready && enabled.territory}
        <LazyWidget show={true} loader={widgetLoaders.territory} props={{ onClose: () => toggleEnabled('territory') }} />
      {/if}
      {#if ready && enabled.calculator}
        <LazyWidget show={true} loader={widgetLoaders.calculator} props={{ onClose: () => toggleEnabled('calculator') }} />
      {/if}
      {#if ready && enabled.python}
        <LazyWidget show={true} loader={widgetLoaders.python} props={{ onClose: () => toggleEnabled('python') }} />
      {/if}
      {#if ready && enabled.whiteboard}
        <LazyWidget show={true} loader={widgetLoaders.whiteboard} props={{ onClose: () => toggleEnabled('whiteboard') }} />
      {/if}
      {#if ready && enabled.whitenoise}
        <LazyWidget
          show={true}
          loader={wl('whitenoise')}
          props={{ onClose: () => toggleEnabled('whitenoise'), globalMuted }}
        />
      {/if}
      {#if ready && enabled.network}
        <LazyWidget show={true} loader={wl('network')} props={{ onClose: () => toggleEnabled('network') }} />
      {/if}
    </div>

    {#if ready}
      <WidgetDrawer
        bind:open={controlCenterOpen}
        {spotlightToken}
        {enabled}
        {bg}
        {scenes}
        hasSnapshot={!!snapshot}
        {isCleared}
        onToggle={(key, drop) => toggleEnabled(key, drop)}
        onPatchBg={patchBg}
        onSetWallpaperMode={setWallpaperMode}
        onClearAll={clearAll}
        onRestore={restoreAll}
      />
    {/if}
  </div>
{:else}
  {#if enabled.background}
    <LazyWidget
      show={true}
      loader={widgetLoaders.background}
      sceneId={bg.sceneId}
      useVideo={bg.useVideo}
      usePly={bg.usePly}
      rain={bg.rain}
      brightness={bg.brightness}
      speed={bg.speed}
      mobileIndex={bg.mobileIndex}
      onMobileIndexChange={setMobileIndex}
    />
    <LazyWidget
      show={true}
      loader={widgetLoaders.atmosphere}
      props={{
        rainDrops: bg.rainDrops,
        sakura: bg.sakura,
        sceneId: bg.sceneId,
        active: true,
      }}
    />
    {#if ready}
      <button
        type="button"
        class="wallpaper-mute-btn"
        class:is-muted={globalMuted}
        aria-label={globalMuted ? '取消静音' : '一键静音'}
        title={globalMuted ? '取消静音' : '一键静音（音乐 + 白噪音）'}
        onclick={toggleGlobalMute}
      >
        {globalMuted ? '🔇' : '🔊'}
      </button>
    {/if}
  {/if}

  {#if ready && enabled.clock}
    <LazyWidget
      show={true}
      loader={wl('clock')}
      props={{ onClose: () => toggleEnabled('clock'), pinned: clockPinned }}
    />
  {/if}
  {#if ready && enabled.music}
    <LazyWidget
      show={true}
      loader={wl('music')}
      props={{ onClose: () => toggleEnabled('music'), globalMuted }}
    />
  {/if}
  {#if ready && enabled.notes}
    <LazyWidget show={true} loader={wl('notes')} props={{ onClose: () => toggleEnabled('notes') }} />
  {/if}
  {#if ready && enabled.todo}
    <LazyWidget show={true} loader={wl('todo')} props={{ onClose: () => toggleEnabled('todo') }} />
  {/if}
  {#if ready && enabled.calendar}
    <LazyWidget show={true} loader={wl('calendar')} props={{ onClose: () => toggleEnabled('calendar') }} />
  {/if}
  {#if ready && enabled.pomodoro}
    <LazyWidget show={true} loader={wl('pomodoro')} props={{ onClose: () => toggleEnabled('pomodoro') }} />
  {/if}
  {#if ready && enabled.weather}
    <LazyWidget show={true} loader={wl('weather')} props={{ onClose: () => toggleEnabled('weather') }} />
  {/if}
  {#if ready && enabled.stats}
    <LazyWidget show={true} loader={wl('stats')} props={{ onClose: () => toggleEnabled('stats') }} />
  {/if}
  {#if ready && enabled.world}
    <LazyWidget show={true} loader={wl('world')} props={{ onClose: () => toggleEnabled('world') }} />
  {/if}
  {#if ready && enabled.graph}
    <LazyWidget show={true} loader={widgetLoaders.graph} props={{ onClose: () => toggleEnabled('graph') }} />
  {/if}
  {#if ready && enabled.territory}
    <LazyWidget show={true} loader={widgetLoaders.territory} props={{ onClose: () => toggleEnabled('territory') }} />
  {/if}
  {#if ready && enabled.calculator}
    <LazyWidget show={true} loader={widgetLoaders.calculator} props={{ onClose: () => toggleEnabled('calculator') }} />
  {/if}
  {#if ready && enabled.python}
    <LazyWidget show={true} loader={widgetLoaders.python} props={{ onClose: () => toggleEnabled('python') }} />
  {/if}
  {#if ready && enabled.whiteboard}
    <LazyWidget show={true} loader={widgetLoaders.whiteboard} props={{ onClose: () => toggleEnabled('whiteboard') }} />
  {/if}
  {#if ready && enabled.whitenoise}
    <LazyWidget
      show={true}
      loader={wl('whitenoise')}
      props={{ onClose: () => toggleEnabled('whitenoise'), globalMuted }}
    />
  {/if}
  {#if ready && enabled.network}
    <LazyWidget show={true} loader={wl('network')} props={{ onClose: () => toggleEnabled('network') }} />
  {/if}

  {#if ready}
    <WidgetDrawer
      {enabled}
      {bg}
      {scenes}
      hasSnapshot={!!snapshot}
      {isCleared}
      onToggle={(key, drop) => toggleEnabled(key, drop)}
      onPatchBg={patchBg}
      onSetWallpaperMode={setWallpaperMode}
      onClearAll={clearAll}
      onRestore={restoreAll}
    />
  {/if}
{/if}

<style>
  .mac-desktop {
    position: fixed;
    inset: 0;
    z-index: 1;
    overflow: hidden;
  }
  .mac-desktop-stage {
    position: absolute;
    inset: calc(max(env(safe-area-inset-top, 0px), 8px) + 52px) 0
      calc(max(env(safe-area-inset-bottom, 0px), 10px) + 78px) 0;
  }

  .wallpaper-mute-btn {
    position: fixed;
    z-index: 12;
    top: max(env(safe-area-inset-top, 0px), 14px);
    left: max(env(safe-area-inset-left, 0px), 14px);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgb(255 255 255 / 0.28);
    background: rgb(0 0 0 / 0.38);
    color: #fff;
    font-size: 1.15rem;
    line-height: 1;
    cursor: pointer;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 18px rgb(0 0 0 / 0.28);
    transition: transform 0.2s ease, background 0.2s ease;
  }
  .wallpaper-mute-btn:hover {
    transform: scale(1.06);
    background: rgb(0 0 0 / 0.48);
  }
  .wallpaper-mute-btn.is-muted {
    background: rgb(180 60 80 / 0.55);
    border-color: rgb(255 180 190 / 0.45);
  }
  @media (max-width: 768px) {
    .wallpaper-mute-btn {
      display: none;
    }
  }
</style>
