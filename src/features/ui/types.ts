export const UI_SKIN_IDS = ['mac', 'glass', 'pixel', 'hud'] as const;

export type UiSkinId = (typeof UI_SKIN_IDS)[number];

export type UiSkinMeta = {
  id: UiSkinId;
  /** CSS background for preview swatch */
  preview: string;
  nameKey: 'uiSkinMac' | 'uiSkinGlass' | 'uiSkinPixel' | 'uiSkinHud';
  descKey: 'uiSkinMacDesc' | 'uiSkinGlassDesc' | 'uiSkinPixelDesc' | 'uiSkinHudDesc';
};
