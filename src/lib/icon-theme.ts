// 跟 FontSwitcher / BaseLayout 预加载用的是同一套字体键
export const FONT_KEYS = ['wenkai', 'inter', 'serif', 'plex', 'jp-pixel'] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const FONT_STORAGE_KEY = 'second-brain:font-family';

export function isPixelFont(font: string | null | undefined): boolean {
  return font === 'jp-pixel';
}

export function readFontKey(): FontKey {
  if (typeof document === 'undefined') return 'wenkai';
  const attr = document.documentElement.getAttribute('data-font');
  if (attr && FONT_KEYS.includes(attr as FontKey)) return attr as FontKey;
  try {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    if (saved && FONT_KEYS.includes(saved as FontKey)) return saved as FontKey;
  } catch {
    /* ignore */
  }
  return 'wenkai';
}
