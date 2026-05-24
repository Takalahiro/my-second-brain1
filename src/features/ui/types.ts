export const UI_SKIN_IDS = [
  'mac',
  'glass',
  'pixel',
  'hud',
  'blueprint',
  'scholar',
  'terminal',
  'crt',
  'observatory',
  'herbarium',
  'ink',
  'rpg',
  'spacecraft',
] as const;

export type UiSkinId = (typeof UI_SKIN_IDS)[number];

export type UiSkinNameKey =
  | 'uiSkinMac'
  | 'uiSkinGlass'
  | 'uiSkinPixel'
  | 'uiSkinHud'
  | 'uiSkinBlueprint'
  | 'uiSkinScholar'
  | 'uiSkinTerminal'
  | 'uiSkinCrt'
  | 'uiSkinObservatory'
  | 'uiSkinHerbarium'
  | 'uiSkinInk'
  | 'uiSkinRpg'
  | 'uiSkinSpacecraft';

export type UiSkinDescKey = `${UiSkinNameKey}Desc`;

export type UiSkinMeta = {
  id: UiSkinId;
  /** CSS background for preview swatch */
  preview: string;
  nameKey: UiSkinNameKey;
  descKey: UiSkinDescKey;
};
