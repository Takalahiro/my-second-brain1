import type { StructuralSkinId } from '../registry';
import type { DrawerPaneId } from '../primitives/controls/types';

/** 控制中心底部 Tab — 各皮肤主题标签（对应规范 ① Tab 页签） */
const DRAWER_TAB_LABELS: Record<StructuralSkinId, Record<DrawerPaneId, string>> = {
  blueprint: {
    home: 'SHEET 1',
    widgets: 'SHEET 2',
    wallpaper: 'SHEET 3',
    desktop: 'SHEET 4',
    ui: 'SHEET 5',
  },
  scholar: {
    home: 'Index',
    widgets: 'Apparatus',
    wallpaper: 'Scene',
    desktop: 'Desk',
    ui: 'Binding',
  },
  terminal: {
    home: '0:cc',
    widgets: '1:wdg',
    wallpaper: '2:bg',
    desktop: '3:dsk',
    ui: '4:ui',
  },
  crt: {
    home: 'F1',
    widgets: 'F2',
    wallpaper: 'F3',
    desktop: 'F4',
    ui: 'F5',
  },
  observatory: {
    home: 'OBS',
    widgets: 'INST',
    wallpaper: 'SKY',
    desktop: 'DECK',
    ui: 'FILTER',
  },
  herbarium: {
    home: 'Catalog',
    widgets: 'Specimens',
    wallpaper: 'Habitat',
    desktop: 'Table',
    ui: 'Register',
  },
  ink: {
    home: '卷一',
    widgets: '卷二',
    wallpaper: '卷三',
    desktop: '卷四',
    ui: '卷五',
  },
  rpg: {
    home: 'Quest',
    widgets: 'Gear',
    wallpaper: 'Realm',
    desktop: 'Camp',
    ui: 'Class',
  },
  spacecraft: {
    home: 'NODE 1',
    widgets: 'LAB',
    wallpaper: 'CUPOLA',
    desktop: 'DECK',
    ui: 'PNL-07',
  },
};

/** 控制中心标题栏副标 / 签名栏（规范 ① 标题栏） */
const DRAWER_CHROME_STAMP: Record<StructuralSkinId, string> = {
  blueprint: 'CTRL-01 │ REV-A │ 1:1',
  scholar: 'Chapter XVII · Folio',
  terminal: 'user@host:~/control-center (main *) ❯',
  crt: '*** SYSTEM READY ***',
  observatory: 'OBS LOG │ Cerro Paranal',
  herbarium: 'HERBARIUM │ Coll. J.D.Hooker',
  ink: '論語 · 學而第一',
  rpg: '◆ CHARACTER PANEL ◆',
  spacecraft: 'PNL-07 │ ECLSS',
};

const DRAWER_PANE_SHEET: Record<StructuralSkinId, Record<DrawerPaneId, string>> = {
  blueprint: {
    home: 'SHEET 1/5',
    widgets: 'SHEET 2/5',
    wallpaper: 'SHEET 3/5',
    desktop: 'SHEET 4/5',
    ui: 'SHEET 5/5',
  },
  scholar: {
    home: 'Folio I',
    widgets: 'Folio II',
    wallpaper: 'Folio III',
    desktop: 'Folio IV',
    ui: 'Folio V',
  },
  terminal: {
    home: 'pane 0',
    widgets: 'pane 1',
    wallpaper: 'pane 2',
    desktop: 'pane 3',
    ui: 'pane 4',
  },
  crt: {
    home: 'CHANNEL 01',
    widgets: 'CHANNEL 02',
    wallpaper: 'CHANNEL 03',
    desktop: 'CHANNEL 04',
    ui: 'CHANNEL 05',
  },
  observatory: {
    home: 'N zenith',
    widgets: 'E array',
    wallpaper: 'S sky',
    desktop: 'W deck',
    ui: 'filter wheel',
  },
  herbarium: {
    home: 'No.0001',
    widgets: 'No.0002',
    wallpaper: 'No.0003',
    desktop: 'No.0004',
    ui: 'No.0005',
  },
  ink: {
    home: '卷一',
    widgets: '卷二',
    wallpaper: '卷三',
    desktop: '卷四',
    ui: '卷五',
  },
  rpg: {
    home: 'Quest Log',
    widgets: 'Inventory',
    wallpaper: 'World Map',
    desktop: 'Camp',
    ui: 'Class',
  },
  spacecraft: {
    home: 'NODE 1',
    widgets: 'LAB',
    wallpaper: 'CUPOLA',
    desktop: 'DECK',
    ui: 'PNL-07',
  },
};

/** 浮动窗口标题栏签名（规范 ① — Generic 壳） */
const FRAME_HEADER_META: Record<StructuralSkinId, (layoutKey: string) => string> = {
  blueprint: (k) => `DWG-${k.slice(0, 3).toUpperCase()} │ REV-A │ 1:50`,
  scholar: () => 'Chapter XVII',
  terminal: (k) => `user@host:~/${k} (main *) ❯`,
  crt: () => '*** SYSTEM READY ***',
  observatory: () => 'OBS LOG │ JD 2460186.5',
  herbarium: (k) => `HERBARIUM │ No.${k.slice(-3).padStart(4, '0')}`,
  ink: () => '論語 · 學而第一',
  rpg: () => 'Lv.42 Arcanist',
  spacecraft: () => 'PNL-07 │ ECLSS',
};

/** 空状态文案（规范 ① 空状态） */
export const STRUCTURAL_EMPTY_STATE: Record<StructuralSkinId, string> = {
  blueprint: 'NO DRAWING — AWAITING INPUT',
  scholar: 'page intentionally left blank',
  terminal: '$ ls → (empty)',
  crt: 'NO DATA — INSERT TAPE',
  observatory: 'NO TARGET — SKY CLEAR',
  herbarium: 'awaiting specimen',
  ink: '未錄',
  rpg: 'Inventory empty — slay monsters to gain loot',
  spacecraft: 'NO TELEMETRY — CHANNEL IDLE',
};

export function getStructuralDrawerTabLabel(skin: StructuralSkinId, pane: DrawerPaneId): string {
  return DRAWER_TAB_LABELS[skin][pane];
}

export function getStructuralDrawerTabs(
  skin: StructuralSkinId,
): Array<{ id: DrawerPaneId; label: string }> {
  const panes: DrawerPaneId[] = ['home', 'widgets', 'wallpaper', 'desktop', 'ui'];
  return panes.map((id) => ({ id, label: getStructuralDrawerTabLabel(skin, id) }));
}

export function getDrawerChromeStamp(skin: StructuralSkinId, pane: DrawerPaneId): string {
  const sheet = DRAWER_PANE_SHEET[skin][pane];
  const base = DRAWER_CHROME_STAMP[skin];
  if (skin === 'blueprint') return `${sheet} │ ${base}`;
  if (skin === 'spacecraft') return `${base} │ ${sheet}`;
  if (skin === 'terminal') return `${base} │ ${sheet}`;
  return `${base} · ${sheet}`;
}

export function getFrameHeaderMeta(skin: StructuralSkinId, layoutKey: string): string {
  return FRAME_HEADER_META[skin](layoutKey);
}

/** 顶栏菜单品牌文案 */
export const MENU_BAR_BRAND: Record<StructuralSkinId, { app: string; tag: string }> = {
  blueprint: { app: 'DWG-CTRL', tag: 'SHEET INDEX' },
  scholar: { app: 'Folio', tag: 'Chapter XVII' },
  terminal: { app: 'second-brain', tag: '~/desktop' },
  crt: { app: 'SYSTEM', tag: 'CHANNEL 03' },
  observatory: { app: 'OBS LOG', tag: 'Cerro Paranal' },
  herbarium: { app: 'HERBARIUM', tag: 'Catalog' },
  ink: { app: '第二大脑', tag: '卷一' },
  rpg: { app: 'QUEST LOG', tag: 'Lv.42' },
  spacecraft: { app: 'PNL-01', tag: 'ECLSS' },
};

export function getMenuBarBrand(skin: StructuralSkinId) {
  return MENU_BAR_BRAND[skin];
}
