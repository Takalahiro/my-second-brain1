import { folderColor, type RawNode } from './graph-data';

/** NASA-punk 星图配色：文件夹 → 遥测星色 */
export const HUD_FOLDER_STARS = [
  '#f5f2eb',
  '#9aafc9',
  '#ff4d6a',
  '#c8d4e8',
  '#e8dcc8',
  '#a8c4e8',
  '#ffb3c1',
  '#d4e4f8',
  '#ffe8d4',
  '#b8cfe8',
];

export const HUD_GRAPH = {
  spaceDeep: '#050a14',
  spaceMid: '#0b1426',
  spaceGrid: 'rgba(245, 242, 235, 0.05)',
  link: 'rgba(154, 175, 201, 0.38)',
  linkDim: 'rgba(245, 242, 235, 0.05)',
  linkHi: '#ff4d6a',
  linkHiSoft: 'rgba(200, 16, 46, 0.55)',
  label: '#f5f2eb',
  labelMuted: '#9aafc9',
  labelStroke: 'rgba(5, 10, 20, 0.92)',
  core: '#f5f2eb',
  alert: '#c8102e',
  telemetry: '#9aafc9',
} as const;

export function hudFolderColor(folder: string, folders: string[]): string {
  const i = folders.indexOf(folder);
  return HUD_FOLDER_STARS[(i < 0 ? 0 : i) % HUD_FOLDER_STARS.length];
}

export function resolveGraphColor(folder: string, folders: string[], hud: boolean): string {
  return hud ? hudFolderColor(folder, folders) : folderColor(folder, folders);
}

export function hudLinkStroke(dim: boolean, hi: boolean): string {
  if (hi) return HUD_GRAPH.linkHi;
  if (dim) return HUD_GRAPH.linkDim;
  return HUD_GRAPH.link;
}

export function hudNodeCoreColor(node: RawNode, starColor: string): string {
  const deg = node.inDegree + node.outDegree;
  if (deg >= 8) return HUD_GRAPH.linkHi;
  if (deg >= 4) return starColor;
  return HUD_GRAPH.core;
}
