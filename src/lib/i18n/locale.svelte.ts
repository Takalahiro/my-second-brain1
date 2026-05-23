import type { PixelIconName } from '../pixel-icons';
import { en } from './messages/en';
import { zh, type Messages } from './messages/zh';
import type { Locale } from './types';

export type { Locale } from './types';

export type SiteNavLink = {
  href: string;
  label: string;
  title?: string;
  icon?: PixelIconName;
};

const STORAGE_KEY = 'second-brain:locale';
const FONT_KEY = 'second-brain:font-family';
const FONT_BEFORE_EN = 'second-brain:font-before-en';
const EN_UI_FONT = 'inter';
const ZH_DEFAULT_FONTS = new Set(['wenkai', 'jp-pixel']);
const dicts: Record<Locale, Messages> = { zh, en };

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';
  return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

export function applyLocaleToDocument(l: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
  document.documentElement.dataset.locale = l;
  applyLocaleFont(l);
  syncDocumentTitle(l);
}

function applyLocaleFont(l: Locale) {
  if (typeof document === 'undefined') return;
  const current = document.documentElement.getAttribute('data-font') || 'wenkai';
  if (l === 'en') {
    if (ZH_DEFAULT_FONTS.has(current)) {
      try {
        localStorage.setItem(FONT_BEFORE_EN, current);
        document.documentElement.setAttribute('data-font', EN_UI_FONT);
        localStorage.setItem(FONT_KEY, EN_UI_FONT);
      } catch {}
    }
  } else {
    try {
      const prev = localStorage.getItem(FONT_BEFORE_EN);
      if (prev) {
        document.documentElement.setAttribute('data-font', prev);
        localStorage.setItem(FONT_KEY, prev);
        localStorage.removeItem(FONT_BEFORE_EN);
      }
    } catch {}
  }
}

function syncDocumentTitle(l: Locale) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector<HTMLElement>('[data-i18n-page-title]');
  if (!el) return;
  const zh = el.dataset.pageTitleZh;
  const en = el.dataset.pageTitleEn;
  const next = l === 'en' ? en : zh;
  if (next) document.title = next;
}

/** Shared locale — mutate `.current`, do not reassign the object. */
export const localeState = $state({ current: 'zh' as Locale });

export function getLocale(): Locale {
  return localeState.current;
}

export function initLocale() {
  localeState.current = readStoredLocale();
  applyLocaleToDocument(localeState.current);
}

export function setLocale(next: Locale) {
  if (localeState.current === next) return;
  localeState.current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  applyLocaleToDocument(next);
  window.dispatchEvent(new CustomEvent('second-brain:locale-change', { detail: next }));
}

export function toggleLocale() {
  setLocale(localeState.current === 'zh' ? 'en' : 'zh');
}

export function getMessages(): Messages {
  return dicts[localeState.current];
}

export function getSiteNavLinks(): SiteNavLink[] {
  const m = getMessages();
  return [
    { href: '/notes', label: m.nav.notes, title: m.nav.notesTitle, icon: 'notes' },
    { href: '/teaching', label: m.nav.teaching, title: m.nav.teachingTitle, icon: 'book' },
    { href: '/python', label: m.nav.python, title: m.nav.pythonTitle, icon: 'python' },
    { href: '/matlab', label: m.nav.matlab, title: m.nav.matlabTitle, icon: 'matlab' },
    { href: '/digits', label: m.nav.neural, title: m.nav.neuralTitle, icon: 'digits' },
    { href: '/whiteboard', label: m.nav.whiteboard, title: m.nav.whiteboardTitle, icon: 'whiteboard' },
    { href: '/graph', label: m.nav.graph, title: m.nav.graphTitle, icon: 'graph' },
  ];
}
