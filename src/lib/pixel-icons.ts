// 16×16 像素风图标，每个块是 [x, y, w, h]
export type PixelRect = readonly [x: number, y: number, w: number, h: number];

export type PixelIconName =
  | 'notes'
  | 'folder'
  | 'folder-open'
  | 'note'
  | 'terminal'
  | 'chart'
  | 'brain'
  | 'cup'
  | 'spark'
  | 'map'
  | 'orbit'
  | 'arc'
  | 'ring'
  | 'grid'
  | 'gear'
  | 'puzzle'
  | 'frame'
  | 'monitor'
  | 'landscape'
  | 'clock'
  | 'music'
  | 'book'
  | 'check'
  | 'calendar'
  | 'timer'
  | 'cloud'
  | 'sun'
  | 'moon'
  | 'cloud-sun'
  | 'cloud-moon'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'thermo'
  | 'globe'
  | 'signal'
  | 'graph'
  | 'calc'
  | 'code'
  | 'pen'
  | 'search'
  | 'star'
  | 'link'
  | 'island'
  | 'clear'
  | 'python'
  | 'matlab'
  | 'digits'
  | 'whiteboard'
  | 'list';

export const PIXEL_ICONS: Record<PixelIconName, readonly PixelRect[]> = {
  notes: [
    [3, 2, 10, 2],
    [2, 4, 2, 10],
    [12, 4, 2, 10],
    [4, 4, 8, 10],
    [5, 6, 6, 1],
    [5, 8, 5, 1],
    [5, 10, 4, 1],
  ],
  folder: [
    [2, 5, 12, 9],
    [2, 3, 6, 3],
    [3, 6, 10, 7],
  ],
  'folder-open': [
    [2, 6, 12, 8],
    [2, 4, 6, 3],
    [3, 7, 10, 6],
    [4, 8, 8, 1],
  ],
  note: [
    [4, 2, 8, 12],
    [5, 5, 6, 1],
    [5, 7, 5, 1],
    [5, 9, 4, 1],
    [5, 11, 3, 1],
  ],
  terminal: [
    [2, 3, 12, 10],
    [3, 4, 10, 8],
    [4, 6, 2, 2],
    [7, 7, 4, 1],
    [7, 9, 3, 1],
  ],
  chart: [
    [2, 12, 2, 2],
    [5, 9, 2, 5],
    [8, 6, 2, 8],
    [11, 3, 2, 11],
    [2, 2, 12, 1],
  ],
  brain: [
    [4, 3, 8, 10],
    [3, 5, 2, 6],
    [11, 5, 2, 6],
    [5, 5, 2, 2],
    [9, 5, 2, 2],
    [6, 9, 4, 2],
  ],
  cup: [
    [4, 3, 8, 2],
    [3, 5, 10, 6],
    [5, 11, 6, 2],
    [11, 6, 2, 3],
  ],
  spark: [
    [7, 1, 2, 4],
    [7, 11, 2, 4],
    [1, 7, 4, 2],
    [11, 7, 4, 2],
    [4, 4, 2, 2],
    [10, 4, 2, 2],
    [4, 10, 2, 2],
    [10, 10, 2, 2],
    [7, 7, 2, 2],
  ],
  map: [
    [2, 3, 12, 10],
    [4, 5, 2, 2],
    [10, 4, 2, 2],
    [7, 8, 2, 2],
    [3, 9, 2, 2],
    [5, 6, 1, 5],
    [8, 5, 1, 6],
    [11, 4, 1, 7],
  ],
  orbit: [
    [7, 7, 2, 2],
    [3, 7, 10, 1],
    [7, 3, 1, 10],
    [4, 4, 2, 1],
    [10, 4, 2, 1],
    [4, 11, 2, 1],
    [10, 11, 2, 1],
  ],
  arc: [
    [2, 10, 2, 2],
    [4, 7, 2, 2],
    [6, 5, 2, 2],
    [8, 5, 2, 2],
    [10, 7, 2, 2],
    [12, 10, 2, 2],
    [3, 11, 10, 1],
  ],
  ring: [
    [5, 5, 6, 6],
    [6, 6, 4, 4],
    [3, 7, 2, 2],
    [11, 7, 2, 2],
  ],
  grid: [
    [2, 2, 5, 5],
    [9, 2, 5, 5],
    [2, 9, 5, 5],
    [9, 9, 5, 5],
  ],
  gear: [
    [6, 1, 4, 2],
    [6, 13, 4, 2],
    [1, 6, 2, 4],
    [13, 6, 2, 4],
    [4, 4, 2, 2],
    [10, 4, 2, 2],
    [4, 10, 2, 2],
    [10, 10, 2, 2],
    [5, 5, 6, 6],
    [6, 6, 4, 4],
  ],
  puzzle: [
    [2, 2, 6, 6],
    [8, 2, 6, 6],
    [2, 8, 6, 6],
    [8, 8, 6, 6],
    [5, 4, 2, 2],
    [10, 7, 2, 2],
    [4, 10, 2, 2],
  ],
  frame: [
    [2, 2, 12, 12],
    [3, 3, 10, 10],
    [5, 5, 4, 3],
    [5, 9, 6, 1],
  ],
  monitor: [
    [2, 3, 12, 8],
    [3, 4, 10, 6],
    [6, 11, 4, 2],
    [5, 13, 6, 1],
  ],
  landscape: [
    [1, 9, 14, 5],
    [3, 7, 4, 3],
    [8, 5, 5, 5],
    [2, 10, 12, 1],
  ],
  clock: [
    [3, 3, 10, 10],
    [7, 4, 2, 4],
    [7, 7, 4, 2],
    [8, 3, 1, 1],
  ],
  music: [
    [6, 2, 2, 9],
    [7, 2, 5, 2],
    [4, 9, 4, 4],
    [10, 3, 2, 8],
    [9, 10, 4, 4],
  ],
  book: [
    [3, 2, 5, 12],
    [8, 2, 5, 12],
    [4, 4, 3, 1],
    [4, 6, 3, 1],
    [9, 5, 3, 1],
    [9, 7, 3, 1],
  ],
  check: [
    [2, 3, 5, 5],
    [3, 5, 2, 2],
    [4, 6, 1, 1],
    [5, 7, 1, 1],
    [8, 4, 6, 1],
    [8, 7, 5, 1],
    [8, 10, 6, 1],
  ],
  calendar: [
    [3, 2, 10, 12],
    [3, 5, 10, 9],
    [5, 2, 2, 3],
    [9, 2, 2, 3],
    [5, 7, 2, 2],
    [8, 7, 2, 2],
    [5, 10, 2, 2],
  ],
  timer: [
    [7, 2, 2, 2],
    [4, 4, 8, 8],
    [7, 6, 2, 4],
    [9, 9, 3, 1],
  ],
  cloud: [
    [2, 8, 3, 3],
    [4, 5, 4, 4],
    [7, 4, 5, 4],
    [11, 6, 3, 3],
    [3, 9, 10, 3],
  ],
  sun: [
    [7, 1, 2, 2],
    [7, 13, 2, 2],
    [1, 7, 2, 2],
    [13, 7, 2, 2],
    [4, 4, 2, 2],
    [10, 4, 2, 2],
    [4, 10, 2, 2],
    [10, 10, 2, 2],
    [5, 5, 6, 6],
  ],
  moon: [
    [9, 3, 5, 10],
    [5, 3, 6, 10],
  ],
  'cloud-sun': [
    [2, 2, 4, 4],
    [3, 8, 4, 3],
    [6, 6, 5, 4],
    [10, 8, 3, 3],
    [4, 9, 8, 3],
  ],
  'cloud-moon': [
    [9, 2, 4, 5],
    [3, 8, 4, 3],
    [6, 6, 5, 4],
    [10, 8, 3, 3],
    [4, 9, 8, 3],
  ],
  rain: [
    [3, 4, 4, 3],
    [6, 2, 5, 4],
    [10, 4, 3, 3],
    [4, 5, 8, 3],
    [4, 10, 1, 3],
    [7, 11, 1, 3],
    [10, 10, 1, 3],
  ],
  snow: [
    [3, 4, 4, 3],
    [6, 2, 5, 4],
    [10, 4, 3, 3],
    [4, 5, 8, 3],
    [5, 10, 2, 2],
    [9, 11, 2, 2],
    [7, 12, 2, 1],
  ],
  fog: [
    [2, 4, 12, 2],
    [3, 7, 10, 2],
    [2, 10, 12, 2],
  ],
  storm: [
    [3, 3, 4, 3],
    [6, 2, 5, 4],
    [10, 3, 3, 3],
    [4, 4, 8, 3],
    [8, 8, 2, 4],
    [6, 11, 3, 2],
  ],
  thermo: [
    [6, 2, 4, 2],
    [7, 4, 2, 7],
    [5, 10, 6, 4],
    [7, 6, 2, 2],
  ],
  globe: [
    [3, 3, 10, 10],
    [7, 3, 1, 10],
    [4, 6, 8, 1],
    [4, 9, 8, 1],
  ],
  signal: [
    [2, 12, 2, 2],
    [5, 10, 2, 4],
    [8, 7, 2, 7],
    [11, 4, 2, 10],
    [13, 2, 1, 12],
  ],
  graph: [
    [3, 3, 3, 3],
    [11, 2, 3, 3],
    [6, 11, 3, 3],
    [5, 4, 4, 1],
    [6, 5, 1, 4],
    [8, 6, 4, 1],
    [7, 7, 1, 3],
  ],
  calc: [
    [2, 2, 12, 12],
    [3, 3, 10, 10],
    [4, 4, 2, 2],
    [7, 4, 2, 2],
    [10, 4, 2, 2],
    [4, 7, 2, 2],
    [7, 7, 2, 2],
    [10, 7, 2, 2],
    [4, 10, 5, 2],
  ],
  code: [
    [2, 4, 3, 2],
    [2, 7, 3, 2],
    [11, 4, 3, 2],
    [11, 7, 3, 2],
    [5, 9, 2, 2],
    [7, 7, 2, 2],
    [9, 5, 2, 2],
  ],
  pen: [
    [3, 10, 4, 4],
    [7, 6, 4, 4],
    [10, 3, 3, 3],
    [11, 2, 2, 2],
  ],
  search: [
    [3, 3, 7, 7],
    [4, 4, 5, 5],
    [9, 9, 4, 1],
    [11, 11, 2, 2],
  ],
  star: [
    [7, 2, 2, 2],
    [5, 5, 2, 2],
    [9, 5, 2, 2],
    [4, 8, 2, 2],
    [10, 8, 2, 2],
    [6, 8, 4, 5],
  ],
  link: [
    [2, 6, 4, 4],
    [10, 6, 4, 4],
    [5, 7, 2, 2],
    [9, 7, 2, 2],
    [3, 7, 2, 1],
    [11, 8, 2, 1],
  ],
  island: [
    [2, 10, 12, 3],
    [6, 6, 4, 4],
    [7, 4, 2, 2],
  ],
  clear: [
    [3, 3, 8, 2],
    [2, 5, 2, 6],
    [12, 5, 2, 6],
    [4, 11, 8, 2],
    [6, 6, 4, 4],
  ],
  python: [
    [3, 2, 4, 4],
    [9, 10, 4, 4],
    [5, 4, 2, 2],
    [9, 10, 2, 2],
    [7, 6, 2, 4],
  ],
  matlab: [
    [2, 2, 12, 12],
    [4, 4, 3, 8],
    [8, 4, 1, 8],
    [10, 4, 3, 8],
  ],
  digits: [
    [3, 3, 10, 10],
    [5, 5, 2, 2],
    [9, 5, 2, 2],
    [5, 9, 2, 2],
    [9, 9, 2, 2],
  ],
  whiteboard: [
    [2, 2, 12, 8],
    [3, 3, 10, 6],
    [5, 5, 5, 1],
    [5, 7, 4, 1],
    [7, 10, 2, 3],
    [5, 13, 6, 1],
  ],
  list: [
    [3, 3, 10, 2],
    [3, 6, 7, 1],
    [3, 8, 9, 1],
    [3, 10, 6, 1],
    [3, 12, 8, 1],
  ],
};

export const DEFAULT_NOTE_ICON: PixelIconName = 'note';
export const DEFAULT_FOLDER_ICON: PixelIconName = 'folder';

export function getPixelIconRects(name: PixelIconName): readonly PixelRect[] {
  return PIXEL_ICONS[name] ?? PIXEL_ICONS.note;
}

export function folderIconName(open = false): PixelIconName {
  return open ? 'folder-open' : 'folder';
}

export function folderEmojiToIcon(name: string): PixelIconName {
  const lower = name.toLowerCase();
  if (name.includes('计算机') || lower.includes('computer')) return 'terminal';
  if (name.includes('data') || name.includes('统计')) return 'chart';
  if (name.includes('info')) return 'brain';
  if (name.includes('数学') || lower.includes('math')) return 'calc';
  return DEFAULT_FOLDER_ICON;
}

// Open-Meteo 的 WMO 代码 → 对应像素天气图标
export function weatherIconName(code: number, isDay = 1): PixelIconName {
  if (code === 0) return isDay ? 'sun' : 'moon';
  if (code === 1 || code === 2) return isDay ? 'cloud-sun' : 'cloud-moon';
  if (code === 3) return 'cloud';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'storm';
  return 'thermo';
}

export type WidgetIconKey =
  | 'background'
  | 'clock'
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
  | 'whitenoise'
  | 'network';

export const WIDGET_ICON_MAP: Record<WidgetIconKey, PixelIconName> = {
  background: 'landscape',
  clock: 'clock',
  music: 'music',
  notes: 'book',
  todo: 'check',
  calendar: 'calendar',
  pomodoro: 'timer',
  weather: 'cloud',
  stats: 'chart',
  world: 'globe',
  graph: 'graph',
  territory: 'map',
  calculator: 'calc',
  python: 'python',
  whiteboard: 'whiteboard',
  whitenoise: 'rain',
  network: 'signal',
};

export const DRAWER_CATEGORY_ICONS = {
  widgets: 'puzzle',
  wallpaper: 'frame',
  desktop: 'monitor',
} as const satisfies Record<string, PixelIconName>;

export const GRAPH_VIEW_ICONS = {
  force: 'spark',
  territory: 'map',
  radial: 'orbit',
  arc: 'arc',
  cluster: 'ring',
  tiles: 'grid',
  settings: 'gear',
} as const satisfies Record<string, PixelIconName>;
