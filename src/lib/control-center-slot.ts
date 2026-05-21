export type SlotWidgetKey =
  | 'music'
  | 'notes'
  | 'todo'
  | 'calendar'
  | 'pomodoro'
  | 'weather'
  | 'stats'
  | 'world'
  | 'graph'
  | 'territory'
  | 'calculator'
  | 'python'
  | 'whiteboard'
  | 'whitenoise';

export const SLOT_STORAGE_KEY = 'second-brain:control-center-slot';

export const DEFAULT_SLOT_WIDGET: SlotWidgetKey = 'weather';

export const SLOT_WIDGET_OPTIONS: Array<{ id: SlotWidgetKey; name: string; icon: string }> = [
  { id: 'music', name: '音乐', icon: '🎵' },
  { id: 'notes', name: '笔记', icon: '📖' },
  { id: 'todo', name: '待办', icon: '✅' },
  { id: 'calendar', name: '日历', icon: '📅' },
  { id: 'pomodoro', name: '番茄钟', icon: '🍅' },
  { id: 'weather', name: '天气', icon: '☁️' },
  { id: 'stats', name: '统计', icon: '📊' },
  { id: 'world', name: '世界时钟', icon: '🌍' },
  { id: 'graph', name: '关系图谱', icon: '🕸️' },
  { id: 'territory', name: '文件夹地图', icon: '🗺️' },
  { id: 'calculator', name: 'MATLAB', icon: '🧮' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'whiteboard', name: '白板', icon: '✏️' },
  { id: 'whitenoise', name: '白噪音', icon: '🌧️' },
];

export type SlotPreview = {
  title: string;
  value: string;
  sub?: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadSlotWidget(): SlotWidgetKey {
  try {
    const raw = localStorage.getItem(SLOT_STORAGE_KEY);
    if (!raw) return DEFAULT_SLOT_WIDGET;
    const id = JSON.parse(raw)?.id;
    if (SLOT_WIDGET_OPTIONS.some((o) => o.id === id)) return id as SlotWidgetKey;
  } catch {}
  return DEFAULT_SLOT_WIDGET;
}

export function saveSlotWidget(id: SlotWidgetKey) {
  try {
    localStorage.setItem(SLOT_STORAGE_KEY, JSON.stringify({ id }));
  } catch {}
}

export function readSlotPreview(id: SlotWidgetKey): SlotPreview {
  const meta = SLOT_WIDGET_OPTIONS.find((o) => o.id === id)!;
  switch (id) {
    case 'weather': {
      const s = readJson<{ placeName?: string; forecast?: { current?: { temperature?: number }; placeName?: string } }>(
        'second-brain:weather-state'
      );
      const temp = s?.forecast?.current?.temperature;
      const place = s?.placeName ?? s?.forecast?.placeName;
      return {
        title: meta.name,
        value: temp != null ? `${Math.round(temp)}°` : '—',
        sub: place ?? '未设置城市',
      };
    }
    case 'todo': {
      const s = readJson<{ items?: Array<{ done?: boolean; cancelled?: boolean }> }>('second-brain:todo-state');
      const items = s?.items ?? [];
      const active = items.filter((i) => !i.done && !i.cancelled).length;
      return { title: meta.name, value: String(active), sub: `${items.length} 项总计` };
    }
    case 'pomodoro': {
      const s = readJson<{ remainingMs?: number; phase?: string; running?: boolean }>('second-brain:pomo-state');
      const sec = typeof s?.remainingMs === 'number' ? Math.ceil(s.remainingMs / 1000) : 0;
      const m = Math.floor(sec / 60);
      const ss = String(sec % 60).padStart(2, '0');
      const phaseLabel = s?.phase === 'focus' ? '专注' : s?.phase === 'short' ? '小憩' : s?.phase === 'long' ? '长休' : '就绪';
      return {
        title: meta.name,
        value: `${m}:${ss}`,
        sub: s?.running ? `${phaseLabel}中` : phaseLabel,
      };
    }
    case 'music': {
      const s = readJson<{ tracks?: Array<{ title?: string }>; index?: number }>('second-brain:music');
      const track = s?.tracks?.[s.index ?? 0];
      return { title: meta.name, value: '♪', sub: track?.title?.slice(0, 18) ?? '未播放' };
    }
    case 'world': {
      const s = readJson<{ selectedId?: string }>('second-brain:world-state');
      return { title: meta.name, value: s?.selectedId ?? '🌍', sub: '点击地图切换' };
    }
    case 'calendar': {
      const s = readJson<{ events?: unknown[] }>('second-brain:cal-state');
      const n = s?.events?.length ?? 0;
      return { title: meta.name, value: String(n), sub: '近期事件' };
    }
    case 'whitenoise': {
      const s = readJson<{ tracks?: Array<{ enabled?: boolean }> }>('second-brain:whitenoise-state');
      const on = s?.tracks?.filter((t) => t.enabled).length ?? 0;
      return { title: meta.name, value: String(on), sub: '轨正在播放' };
    }
    default:
      return { title: meta.name, value: meta.icon, sub: '点击启用到桌面' };
  }
}
