import type { UiSkinId } from './types';

export type SkinChromeProfile = {
  /** 顶栏细状态条 + 双层菜单 */
  immersive: boolean;
  /** Canvas 实时壁纸（所有沉浸式皮肤） */
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

const IMMERSIVE_BASE: Omit<SkinChromeProfile, 'searchPrefix' | 'scrollTopLabel' | 'scrollBottomLabel' | 'scrollValuePrefix'> = {
  immersive: true,
  canvasWallpaper: true,
  scrollIndicator: true,
  statusStripHeight: 22,
  menuBarHeight: 44,
};

export const SKIN_CHROME: Record<UiSkinId, SkinChromeProfile> = {
  mac: { ...DEFAULT_PROFILE },
  glass: { ...DEFAULT_PROFILE },
  pixel: {
    ...IMMERSIVE_BASE,
    canvasWallpaper: false,
    searchPrefix: '>',
    scrollTopLabel: 'LV',
    scrollBottomLabel: '0',
    scrollValuePrefix: 'XP ',
  },
  hud: {
    ...IMMERSIVE_BASE,
    searchPrefix: 'MSB://CMD>',
    scrollTopLabel: 'ALT',
    scrollBottomLabel: '0',
    scrollValuePrefix: '',
  },
  blueprint: {
    ...IMMERSIVE_BASE,
    searchPrefix: 'DIM>',
    scrollTopLabel: 'ELEV',
    scrollBottomLabel: '0',
    scrollValuePrefix: '',
  },
  scholar: {
    ...IMMERSIVE_BASE,
    searchPrefix: 'Note:',
    scrollTopLabel: 'Pg',
    scrollBottomLabel: '1',
    scrollValuePrefix: '',
  },
  terminal: {
    ...IMMERSIVE_BASE,
    searchPrefix: ':open ',
    scrollTopLabel: 'BUF',
    scrollBottomLabel: '0%',
    scrollValuePrefix: '',
  },
  crt: {
    ...IMMERSIVE_BASE,
    searchPrefix: '>',
    scrollTopLabel: 'MEM',
    scrollBottomLabel: 'OK',
    scrollValuePrefix: '',
  },
  observatory: {
    ...IMMERSIVE_BASE,
    searchPrefix: 'STAR>',
    scrollTopLabel: 'DEC',
    scrollBottomLabel: 'S',
    scrollValuePrefix: '',
  },
  herbarium: {
    ...IMMERSIVE_BASE,
    searchPrefix: 'Spec:',
    scrollTopLabel: 'LAT',
    scrollBottomLabel: '—',
    scrollValuePrefix: '',
  },
  ink: {
    ...IMMERSIVE_BASE,
    searchPrefix: '卷>',
    scrollTopLabel: '上',
    scrollBottomLabel: '下',
    scrollValuePrefix: '',
  },
  rpg: {
    ...IMMERSIVE_BASE,
    searchPrefix: '/quest ',
    scrollTopLabel: 'LV',
    scrollBottomLabel: '1',
    scrollValuePrefix: 'XP ',
  },
  spacecraft: {
    ...IMMERSIVE_BASE,
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
