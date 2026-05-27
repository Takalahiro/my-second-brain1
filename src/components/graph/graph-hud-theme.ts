import { folderColor, type RawNode } from './graph-data';
import { readCssVar, readCssVarList } from '../../lib/theme/css-vars';

const HUD_FOLDER_FALLBACK = [
  '#f5f2eb', '#9aafc9', '#ff4d6a', '#c8d4e8', '#e8dcc8',
  '#a8c4e8', '#ffb3c1', '#d4e4f8', '#ffe8d4', '#b8cfe8',
];

/** NASA-punk 星图配色：从 CSS `--graph-hud-folder-N` 读取 */
export function hudFolderColors(): string[] {
  return readCssVarList('--graph-hud-folder-', 10, HUD_FOLDER_FALLBACK);
}

export function hudFolderColor(folder: string, folders: string[]): string {
  const palette = hudFolderColors();
  const i = folders.indexOf(folder);
  return palette[(i < 0 ? 0 : i) % palette.length];
}

/** HUD 画布语义色（随主题 / 明暗切换） */
export function hudGraphTheme() {
  return {
    spaceDeep: readCssVar('--graph-hud-space-deep', '#050a14'),
    spaceMid: readCssVar('--graph-hud-space-mid', '#0b1426'),
    spaceInner: readCssVar('--graph-hud-space-inner', '#101d36'),
    spaceGrid: readCssVar('--graph-hud-grid', 'rgba(245, 242, 235, 0.05)'),
    link: readCssVar('--graph-hud-link', 'rgba(154, 175, 201, 0.38)'),
    linkDim: readCssVar('--graph-hud-link-dim', 'rgba(245, 242, 235, 0.05)'),
    linkHi: readCssVar('--graph-hud-link-hi', '#ff4d6a'),
    linkHiSoft: readCssVar('--graph-hud-link-hi-soft', 'rgba(200, 16, 46, 0.55)'),
    label: readCssVar('--graph-hud-label', '#f5f2eb'),
    labelMuted: readCssVar('--graph-hud-label-muted', '#9aafc9'),
    labelStroke: readCssVar('--graph-hud-label-stroke', 'rgba(5, 10, 20, 0.92)'),
    core: readCssVar('--graph-hud-core', '#f5f2eb'),
    alert: readCssVar('--graph-alert', '#ff4d6a'),
    telemetry: readCssVar('--graph-telemetry', '#9aafc9'),
    glow: readCssVar('--graph-hud-glow', 'rgba(245, 242, 235, 0.35)'),
  };
}

/** @deprecated 使用 hudGraphTheme()；保留别名供渐进迁移 */
export const HUD_GRAPH = new Proxy({} as ReturnType<typeof hudGraphTheme>, {
  get(_t, prop: string) {
    return hudGraphTheme()[prop as keyof ReturnType<typeof hudGraphTheme>];
  },
});

export function resolveGraphColor(folder: string, folders: string[], hud: boolean): string {
  return hud ? hudFolderColor(folder, folders) : folderColor(folder, folders);
}

export function hudLinkStroke(dim: boolean, hi: boolean): string {
  const g = hudGraphTheme();
  if (hi) return g.linkHi;
  if (dim) return g.linkDim;
  return g.link;
}

export function hudNodeCoreColor(node: RawNode, starColor: string): string {
  const g = hudGraphTheme();
  const deg = node.inDegree + node.outDegree;
  if (deg >= 8) return g.linkHi;
  if (deg >= 4) return starColor;
  return g.core;
}
