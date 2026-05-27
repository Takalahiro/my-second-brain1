import type { UiSkinId } from '../../features/ui/types';

/** 结构换皮：排除 mac / glass / pixel / hud(NASA-punk) */
export const STRUCTURAL_SKIN_IDS = [
  'blueprint',
  'scholar',
  'terminal',
  'crt',
  'observatory',
  'herbarium',
  'ink',
  'rpg',
  'spacecraft',
] as const satisfies readonly UiSkinId[];

export type StructuralSkinId = (typeof STRUCTURAL_SKIN_IDS)[number];

const SET = new Set<string>(STRUCTURAL_SKIN_IDS);

export function isStructuralSkinId(id: string): id is StructuralSkinId {
  return SET.has(id);
}

export type StructuralFrameVariant =
  | 'blueprint'
  | 'scholar'
  | 'terminal'
  | 'crt'
  | 'observatory'
  | 'herbarium'
  | 'ink'
  | 'rpg'
  | 'spacecraft';

export type StructuralSkinTheme = {
  id: StructuralSkinId;
  variant: StructuralFrameVariant;
  /** 标题栏角标 / 系统标记 */
  badge: string;
};

export const STRUCTURAL_SKIN_THEMES: Record<StructuralSkinId, StructuralSkinTheme> = {
  blueprint: { id: 'blueprint', variant: 'blueprint', badge: 'BLU' },
  scholar: { id: 'scholar', variant: 'scholar', badge: 'FOLIO' },
  terminal: { id: 'terminal', variant: 'terminal', badge: 'TERM' },
  crt: { id: 'crt', variant: 'crt', badge: 'CRT' },
  observatory: { id: 'observatory', variant: 'observatory', badge: 'OBS' },
  herbarium: { id: 'herbarium', variant: 'herbarium', badge: 'SPEC' },
  ink: { id: 'ink', variant: 'ink', badge: '卷' },
  rpg: { id: 'rpg', variant: 'rpg', badge: 'QUEST' },
  spacecraft: { id: 'spacecraft', variant: 'spacecraft', badge: 'SYS' },
};

export function getStructuralTheme(skin: StructuralSkinId): StructuralSkinTheme {
  return STRUCTURAL_SKIN_THEMES[skin];
}
