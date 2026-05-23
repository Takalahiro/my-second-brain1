/**
 * @deprecated Prefer getSiteNavLinks() from ./i18n/locale.svelte for reactive locale.
 * Static zh links kept for legacy imports.
 */
import type { PixelIconName } from './pixel-icons';
import { zh } from './i18n/messages/zh';

export type SiteNavLink = {
  href: string;
  label: string;
  title?: string;
  icon?: PixelIconName;
};

export const SITE_NAV_LINKS: SiteNavLink[] = [
  { href: '/notes', label: zh.nav.notes, title: zh.nav.notesTitle, icon: 'notes' },
  { href: '/teaching', label: zh.nav.teaching, title: zh.nav.teachingTitle, icon: 'book' },
  { href: '/python', label: zh.nav.python, title: zh.nav.pythonTitle, icon: 'python' },
  { href: '/matlab', label: zh.nav.matlab, title: zh.nav.matlabTitle, icon: 'matlab' },
  { href: '/digits', label: zh.nav.neural, title: zh.nav.neuralTitle, icon: 'digits' },
  { href: '/whiteboard', label: zh.nav.whiteboard, title: zh.nav.whiteboardTitle, icon: 'whiteboard' },
  { href: '/graph', label: zh.nav.graph, title: zh.nav.graphTitle, icon: 'graph' },
];

export const SITE_TOOL_LINKS = SITE_NAV_LINKS.filter((l) => l.href !== '/notes');

export { getSiteNavLinks } from './i18n/locale.svelte';
