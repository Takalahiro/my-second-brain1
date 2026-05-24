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
  {
    id: 'blueprint',
    preview:
      'linear-gradient(#ffffff18 1px, transparent 1px), linear-gradient(90deg, #ffffff18 1px, transparent 1px), #0e3a5f',
    nameKey: 'uiSkinBlueprint',
    descKey: 'uiSkinBlueprintDesc',
  },
  {
    id: 'scholar',
    preview: 'radial-gradient(circle at 70% 80%, rgb(139 90 43 / 0.12) 0%, transparent 40%), #f4ecd8',
    nameKey: 'uiSkinScholar',
    descKey: 'uiSkinScholarDesc',
  },
  {
    id: 'terminal',
    preview: 'repeating-linear-gradient(0deg, #000 0, #000 2px, #001a0a 2px, #001a0a 4px)',
    nameKey: 'uiSkinTerminal',
    descKey: 'uiSkinTerminalDesc',
  },
  {
    id: 'crt',
    preview: 'radial-gradient(ellipse at center, #ffb00022 0%, transparent 70%), #1a1200',
    nameKey: 'uiSkinCrt',
    descKey: 'uiSkinCrtDesc',
  },
  {
    id: 'observatory',
    preview: 'radial-gradient(circle at 20% 30%, #e8c547 1px, transparent 2px), radial-gradient(circle at 80% 60%, #c4a0ff88 1px, transparent 2px), #0a0e27',
    nameKey: 'uiSkinObservatory',
    descKey: 'uiSkinObservatoryDesc',
  },
  {
    id: 'herbarium',
    preview: 'linear-gradient(135deg, #f4ecd8 0%, #e8efe4 50%, #dce8e0 100%)',
    nameKey: 'uiSkinHerbarium',
    descKey: 'uiSkinHerbariumDesc',
  },
  {
    id: 'ink',
    preview: 'radial-gradient(circle at 85% 15%, #c0392b33 0%, transparent 35%), linear-gradient(#1a1a1a08 1px, transparent 1px), #f7f3ea',
    nameKey: 'uiSkinInk',
    descKey: 'uiSkinInkDesc',
  },
  {
    id: 'rpg',
    preview: 'linear-gradient(180deg, #1a0f2e 0%, #2d1b4e 50%, #1a0f2e 100%)',
    nameKey: 'uiSkinRpg',
    descKey: 'uiSkinRpgDesc',
  },
  {
    id: 'spacecraft',
    preview: 'linear-gradient(180deg, #050810 0%, #0c1428 40%, #101830 100%)',
    nameKey: 'uiSkinSpacecraft',
    descKey: 'uiSkinSpacecraftDesc',
  },
] as const;

export const DEFAULT_UI_SKIN: UiSkinId = 'mac';

export function isUiSkinId(value: string | null | undefined): value is UiSkinId {
  return UI_SKINS.some((s) => s.id === value);
}
