// 图谱共用的数据：节点（含孤岛）、边、文件夹配色

export type RawNode = {
  id: string;
  title: string;
  folder: string;
  inDegree: number;
  outDegree: number;
};

export type RawLink = {
  source: string;
  target: string;
  alias?: string | null;
};

export type WikiData = {
  generatedAt?: string;
  stats?: { totalFiles: number; totalLinks: number; resolved: number; broken: number; headingLinks: number; aliased: number };
  nodes: RawNode[];
  links: RawLink[];
  broken?: { from: string; raw: string }[];
  ambiguous?: { from: string; raw: string; candidates: string[] }[];
  orphans?: string[];
  hot?: { id: string; deg: number }[];
};

export const PALETTE = [
  '#ff9ed4',
  '#b48cff',
  '#7dd0ff',
  '#7fe6c4',
  '#ffd86b',
  '#ff9d6b',
  '#a4b8ff',
  '#ffa3a3',
  '#9fffbb',
  '#ff8de8',
];

export function folderColor(folder: string, folders: string[]) {
  const i = folders.indexOf(folder);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}

export async function loadWiki(options?: { fresh?: boolean }): Promise<WikiData> {
  const q = options?.fresh ? `?t=${Date.now()}` : '';
  const res = await fetch(`/data/wikilinks.json${q}`, options?.fresh ? { cache: 'no-store' } : undefined);
  if (!res.ok) throw new Error(`wikilinks ${res.status}`);
  return (await res.json()) as WikiData;
}

// 页面在前台时，每隔 intervalMs 拉一次 wikilinks，新双链会自动出现在弧线图里
export function watchWikiRefresh(onData: (d: WikiData) => void, intervalMs = 5 * 60_000) {
  if (typeof document === 'undefined') return () => {};
  let timer: ReturnType<typeof setInterval> | null = null;
  const tick = () => {
    if (document.visibilityState !== 'visible') return;
    void loadWiki({ fresh: true }).then(onData).catch(() => {});
  };
  const onVis = () => {
    if (document.visibilityState === 'visible') tick();
  };
  timer = setInterval(tick, intervalMs);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', onVis);
  };
}

// 笔记 id（如 MATH/Algebra）→ /notes/<basename>/
export function noteHref(id: string) {
  const base = id.split('/').pop() ?? id;
  return `/notes/${encodeURI(base)}/`;
}

// ---- 图谱设置（localStorage 持久化）----
export type GraphSettings = {
  showOrphans: boolean; // 要不要画孤岛节点
  showLabels: 'always' | 'hover' | 'never'; // 标签何时显示
  clickToOpen: boolean; // 单击直接跳笔记，否则单击选中、双击跳转
  nodeScale: number;
  edgeScale: number;
  edgeOpacity: number; // 0..1
  bgDim: number; // 0 最暗，1 正常
  forceRepel: number;
  forceSpring: number;
  forceEdgeLen: number;
};

export const DEFAULT_SETTINGS: GraphSettings = {
  showOrphans: true,
  showLabels: 'hover',
  clickToOpen: false,
  nodeScale: 1,
  edgeScale: 1,
  edgeOpacity: 1,
  bgDim: 1,
  forceRepel: 920,
  forceSpring: 0.025,
  forceEdgeLen: 70,
};

export const SETTINGS_KEY = 'second-brain:graph-settings';

export function loadSettings(): GraphSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...s };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}
export function saveSettings(s: GraphSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}
