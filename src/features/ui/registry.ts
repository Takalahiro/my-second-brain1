import type { UiSkinId, UiSkinMeta } from './types';

export const UI_STORAGE_KEY = 'second-brain:ui-skin';

export const UI_SKINS: readonly UiSkinMeta[] = [
  {
    id: 'mac',
    preview: 'linear-gradient(180deg, #f5f5f7 0%, #eceef2 40%, #d8dce6 100%)',
    nameKey: 'uiSkinMac',
    descKey: 'uiSkinMacDesc',
  },
  {
    id: 'glass',
    preview: 'linear-gradient(135deg, rgb(180 210 255 / 0.7) 0%, rgb(255 200 230 / 0.45) 50%, rgb(140 220 255 / 0.35) 100%)',
    nameKey: 'uiSkinGlass',
    descKey: 'uiSkinGlassDesc',
  },
  {
    id: 'pixel',
    preview: 'repeating-linear-gradient(0deg, #c8d4bc, #c8d4bc 8px, #d8e0d0 8px, #d8e0d0 16px)',
    nameKey: 'uiSkinPixel',
    descKey: 'uiSkinPixelDesc',
  },
  {
    id: 'hud',
    preview:
      'radial-gradient(circle, #c8102e 1px, transparent 1.5px), linear-gradient(#12243b 1px, transparent 1px), linear-gradient(90deg, #12243b 1px, transparent 1px), #f5f2eb',
    nameKey: 'uiSkinHud',
    descKey: 'uiSkinHudDesc',
  },
] as const;

export const DEFAULT_UI_SKIN: UiSkinId = 'mac';

export function isUiSkinId(value: string | null | undefined): value is UiSkinId {
  return UI_SKINS.some((s) => s.id === value);
}
