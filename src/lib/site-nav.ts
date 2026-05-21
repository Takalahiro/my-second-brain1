export type SiteNavLink = {
  href: string;
  label: string;
  title?: string;
  icon?: string;
};

import { NEURAL_LAB } from './neural-lab-meta';

/** 全站统一导航项（主界面菜单栏 + 内容页顶栏） */
export const SITE_NAV_LINKS: SiteNavLink[] = [
  { href: '/notes', label: '笔记', title: '笔记浏览', icon: '📚' },
  { href: '/python', label: 'Python', title: 'Python IDE' },
  { href: '/matlab', label: 'MATLAB', title: 'MATLAB 计算器' },
  { href: '/digits', label: NEURAL_LAB.navLabel, title: NEURAL_LAB.navTitle },
  { href: '/whiteboard', label: '白板', title: 'Excalidraw 白板' },
  { href: '/graph', label: '图谱', title: '关系图谱' },
];

export const SITE_TOOL_LINKS = SITE_NAV_LINKS.filter((l) => l.href !== '/notes');
