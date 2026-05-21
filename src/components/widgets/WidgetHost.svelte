<script lang="ts">
  import { onMount } from 'svelte';
  import { media } from '../../lib/media';
  import BackgroundLayer from './BackgroundLayer.svelte';
  import PixelClock from './PixelClock.svelte';
  import MusicPlayer from './MusicPlayer.svelte';
  import NotesWidget from './NotesWidget.svelte';
  import TodoWidget from './TodoWidget.svelte';
  import CalendarWidget from './CalendarWidget.svelte';
  import PomodoroWidget from './PomodoroWidget.svelte';
  import WeatherWidget from './WeatherWidget.svelte';
  import StatsWidget from './StatsWidget.svelte';
  import WorldClockWidget from './WorldClockWidget.svelte';
  import GraphWidget from './GraphWidget.svelte';
  import CalculatorWidget from './CalculatorWidget.svelte';
  import PythonWidget from './PythonWidget.svelte';
  import WhiteboardWidget from './WhiteboardWidget.svelte';
  import WhiteNoiseWidget from './WhiteNoiseWidget.svelte';
  import WidgetDrawer from './WidgetDrawer.svelte';
  import { readGlobalMuted, writeGlobalMuted } from '../../lib/global-audio-mute';

  interface Props {
    backgroundDefault?: boolean;
  }
  let { backgroundDefault = false }: Props = $props();

  const STORAGE_KEY = 'second-brain:widgets';

  type WidgetKey = 'background' | 'clock' | 'music' | 'notes' | 'todo' | 'calendar' | 'pomodoro' | 'weather' | 'stats' | 'world' | 'graph' | 'calculator' | 'python' | 'whiteboard' | 'whitenoise';
  type Enabled = Record<WidgetKey, boolean>;
  type BgState = {
    sceneId: string;
    useVideo: boolean;
    rain: boolean;
    brightness: number;
    speed: number;
    mobileIndex: number;
  };

  let ready = $state(false);
  let enabled = $state<Enabled>({
    background: backgroundDefault,
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
    calculator: false,
    python: false,
    whiteboard: false,
    whitenoise: false,
  });
  /** 壁纸层一键静音（音乐 + 白噪音） */
  let globalMuted = $state(false);
  /** 一键清屏前的快照；非 null 时显示"恢复"按钮 */
  let snapshot = $state<Enabled | null>(null);
  let isMobile = $state(false);
  let bg = $state<BgState>({
    sceneId: media.scenes[0]?.id ?? 'usyd',
    useVideo: true,
    rain: false,
    brightness: 1,
    speed: 1,
    mobileIndex: 0,
  });

  onMount(() => {
    globalMuted = readGlobalMuted();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.bg && typeof s.bg === 'object') {
          bg = {
            sceneId: typeof s.bg.sceneId === 'string' ? s.bg.sceneId : bg.sceneId,
            useVideo: s.bg.useVideo !== false,
            rain: !!s.bg.rain,
            brightness: typeof s.bg.brightness === 'number' ? s.bg.brightness : 1,
            speed: typeof s.bg.speed === 'number' ? s.bg.speed : 1,
            mobileIndex: typeof s.bg.mobileIndex === 'number' ? s.bg.mobileIndex : 0,
          };
        }
      }
    } catch {}
    // 每次打开主界面：壁纸始终保留（若页面默认开启），其余小组件清空
    enabled = {
      background: backgroundDefault,
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
      calculator: false,
      python: false,
      whiteboard: false,
      whitenoise: false,
    };
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
  });

  /** 时钟仅在「桌面 + 启用了背景 + 使用视频」时锁定在右下角 */
  const clockPinned = $derived(!isMobile && enabled.background && bg.useVideo);

  function persist() {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, bg })); } catch {}
  }

  function toggleGlobalMute() {
    globalMuted = !globalMuted;
    writeGlobalMuted(globalMuted);
  }

  /** 拖入主界面时，给每个组件落点提示初始化位置 */
  const dropMap: Partial<Record<WidgetKey, { key: string; serialize: (drop: { x: number; y: number }) => string }>> = {
    music: {
      key: 'second-brain:music-layout',
      serialize: ({ x, y }) => {
        try {
          const cur = JSON.parse(localStorage.getItem('second-brain:music-layout') || '{}');
          const w = typeof cur.width === 'number' ? cur.width : 360;
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), width: w });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h, r: cur.r ?? 0 });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h, r: cur.r ?? 0 });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h, r: cur.r ?? 0 });
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
          return JSON.stringify({ x: Math.max(8, x - 24), y: Math.max(8, y - 16), w, h, r: cur.r ?? 0 });
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
  function patchBg(p: Partial<BgState>) { bg = { ...bg, ...p }; persist(); }
  function setMobileIndex(idx: number) { bg = { ...bg, mobileIndex: idx }; persist(); }

  /** 一键清屏：除「背景」外全部关闭，并保存当前状态为快照 */
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
      calculator: false,
      python: false,
      whiteboard: false,
      whitenoise: false,
    };
    persist();
  }
  /** 恢复清屏前的全部组件 */
  function restoreAll() {
    if (!snapshot) return;
    enabled = { ...snapshot };
    snapshot = null;
    persist();
  }
  /** 当前是否处于「只剩背景」的清屏态 */
  const isCleared = $derived(
    Object.entries(enabled).filter(([k]) => k !== 'background').every(([, v]) => !v)
  );

  const scenes = media.scenes.map((s) => ({ id: s.id, label: s.label, hasRain: s.hasRain }));
</script>

{#if enabled.background}
  <BackgroundLayer
    sceneId={bg.sceneId}
    useVideo={bg.useVideo}
    rain={bg.rain}
    brightness={bg.brightness}
    speed={bg.speed}
    mobileIndex={bg.mobileIndex}
    onMobileIndexChange={setMobileIndex}
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
  <PixelClock onClose={() => toggleEnabled('clock')} pinned={clockPinned} />
{/if}
{#if ready && enabled.music}
  <MusicPlayer onClose={() => toggleEnabled('music')} {globalMuted} />
{/if}
{#if ready && enabled.notes}
  <NotesWidget onClose={() => toggleEnabled('notes')} />
{/if}
{#if ready && enabled.todo}
  <TodoWidget onClose={() => toggleEnabled('todo')} />
{/if}
{#if ready && enabled.calendar}
  <CalendarWidget onClose={() => toggleEnabled('calendar')} />
{/if}
{#if ready && enabled.pomodoro}
  <PomodoroWidget onClose={() => toggleEnabled('pomodoro')} />
{/if}
{#if ready && enabled.weather}
  <WeatherWidget onClose={() => toggleEnabled('weather')} />
{/if}
{#if ready && enabled.stats}
  <StatsWidget onClose={() => toggleEnabled('stats')} />
{/if}
{#if ready && enabled.world}
  <WorldClockWidget onClose={() => toggleEnabled('world')} />
{/if}
{#if ready && enabled.graph}
  <GraphWidget onClose={() => toggleEnabled('graph')} />
{/if}
{#if ready && enabled.calculator}
  <CalculatorWidget onClose={() => toggleEnabled('calculator')} />
{/if}
{#if ready && enabled.python}
  <PythonWidget onClose={() => toggleEnabled('python')} />
{/if}
{#if ready && enabled.whiteboard}
  <WhiteboardWidget onClose={() => toggleEnabled('whiteboard')} />
{/if}
{#if ready && enabled.whitenoise}
  <WhiteNoiseWidget onClose={() => toggleEnabled('whitenoise')} {globalMuted} />
{/if}

{#if ready}
  <WidgetDrawer
    enabled={enabled}
    bg={bg}
    scenes={scenes}
    hasSnapshot={!!snapshot}
    isCleared={isCleared}
    onToggle={(key, drop) => toggleEnabled(key, drop)}
    onPatchBg={patchBg}
    onClearAll={clearAll}
    onRestore={restoreAll}
  />
{/if}

<style>
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
</style>
