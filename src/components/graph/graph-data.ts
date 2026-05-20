/**
 * 共享的图谱数据加载逻辑：
 * - 全量节点（包含孤岛）
 * - 边
 * - 文件夹色板
 * - 类型与工具
 */

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

export async function loadWiki(): Promise<WikiData> {
  const mod = await import('../../data/wikilinks.json');
  return (mod.default ?? mod) as WikiData;
}

/** 把笔记 id（例：`MATH/Algebra`）转成 `/notes/<basename>/` */
export function noteHref(id: string) {
  const base = id.split('/').pop() ?? id;
  return `/notes/${encodeURI(base)}/`;
}

/** ============== 用户可自定义的图谱设置 ============== */
export type GraphSettings = {
  /** 是否显示孤岛节点 */
  showOrphans: boolean;
  /** 标签显示策略：always 一直显示 / hover 悬停才显示 / never 不显示 */
  showLabels: 'always' | 'hover' | 'never';
  /** 单击节点是否直接跳转笔记（否则单击选中、双击跳转） */
  clickToOpen: boolean;
  /** 节点半径整体倍率 */
  nodeScale: number;
  /** 边宽整体倍率 */
  edgeScale: number;
  /** 边整体透明度（0..1） */
  edgeOpacity: number;
  /** 背景暗度（0=最暗，1=正常） */
  bgDim: number;
  /** 力导向：斥力 */
  forceRepel: number;
  /** 力导向：弹簧系数 */
  forceSpring: number;
  /** 力导向：边长 */
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
