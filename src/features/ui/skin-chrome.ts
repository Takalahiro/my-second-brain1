import type { UiSkinId } from './types';

export type SkinChromeProfile = {
  /** 顶栏细状态条 + 双层菜单 */
  immersive: boolean;
  /** Canvas 实时壁纸（仅 hud） */
  canvasWallpaper: boolean;
  /** 右侧滚动高度计 */
  scrollIndicator: boolean;
  /** 控制中心 / 桌面顶距锚点用 */
  statusStripHeight: number;
  menuBarHeight: number;
  searchPrefix: string;
  scrollTopLabel: string;
  scrollBottomLabel: string;
  scrollValuePrefix: string;
};

const DEFAULT_PROFILE: SkinChromeProfile = {
  immersive: false,
  canvasWallpaper: false,
  scrollIndicator: false,
  statusStripHeight: 0,
  menuBarHeight: 44,
  searchPrefix: '',
  scrollTopLabel: 'TOP',
  scrollBottomLabel: '0',
  scrollValuePrefix: '',
};

export const SKIN_CHROME: Record<UiSkinId, SkinChromeProfile> = {
  mac: { ...DEFAULT_PROFILE },
  glass: { ...DEFAULT_PROFILE },
  pixel: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: '>',
    scrollTopLabel: 'LV',
    scrollBottomLabel: '0',
    scrollValuePrefix: 'XP ',
  },
  hud: {
    immersive: true,
    canvasWallpaper: true,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'MSB://CMD>',
    scrollTopLabel: 'ALT',
    scrollBottomLabel: '0',
    scrollValuePrefix: '',
  },
  blueprint: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'DIM>',
    scrollTopLabel: 'ELEV',
    scrollBottomLabel: '0',
    scrollValuePrefix: '',
  },
  scholar: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'Note:',
    scrollTopLabel: 'Pg',
    scrollBottomLabel: '1',
    scrollValuePrefix: '',
  },
  terminal: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: ':open ',
    scrollTopLabel: 'BUF',
    scrollBottomLabel: '0%',
    scrollValuePrefix: '',
  },
  crt: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: '>',
    scrollTopLabel: 'MEM',
    scrollBottomLabel: 'OK',
    scrollValuePrefix: '',
  },
  observatory: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'STAR>',
    scrollTopLabel: 'DEC',
    scrollBottomLabel: 'S',
    scrollValuePrefix: '',
  },
  herbarium: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'Spec:',
    scrollTopLabel: 'LAT',
    scrollBottomLabel: '—',
    scrollValuePrefix: '',
  },
  ink: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: '卷>',
    scrollTopLabel: '上',
    scrollBottomLabel: '下',
    scrollValuePrefix: '',
  },
  rpg: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: '/quest ',
    scrollTopLabel: 'LV',
    scrollBottomLabel: '1',
    scrollValuePrefix: 'XP ',
  },
  spacecraft: {
    immersive: true,
    canvasWallpaper: false,
    scrollIndicator: true,
    statusStripHeight: 22,
    menuBarHeight: 44,
    searchPrefix: 'CMD>',
    scrollTopLabel: 'ALT',
    scrollBottomLabel: '0',
    scrollValuePrefix: '',
  },
};

export function getSkinChrome(id: UiSkinId): SkinChromeProfile {
  return SKIN_CHROME[id] ?? DEFAULT_PROFILE;
}

export function isImmersiveSkin(id: UiSkinId): boolean {
  return getSkinChrome(id).immersive;
}

export function isCanvasWallpaperSkin(id: UiSkinId): boolean {
  return getSkinChrome(id).canvasWallpaper;
}
