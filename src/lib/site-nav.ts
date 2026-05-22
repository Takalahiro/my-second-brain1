import { NEURAL_LAB } from './neural-lab-meta';
import type { PixelIconName } from './pixel-icons';

export type SiteNavLink = {
  href: string;
  label: string;
  title?: string;
  icon?: PixelIconName;
};

// 全站导航——主界面菜单栏和内容页顶栏共用这份列表
export const SITE_NAV_LINKS: SiteNavLink[] = [
  { href: '/notes', label: '笔记', title: '笔记浏览', icon: 'notes' },
  { href: '/python', label: 'Python', title: 'Python IDE', icon: 'python' },
  { href: '/matlab', label: 'MATLAB', title: 'MATLAB 计算器', icon: 'matlab' },
  { href: '/digits', label: NEURAL_LAB.navLabel, title: NEURAL_LAB.navTitle, icon: 'digits' },
  { href: '/whiteboard', label: '白板', title: 'Excalidraw 白板', icon: 'whiteboard' },
  { href: '/graph', label: '图谱', title: '关系图谱', icon: 'graph' },
];

export const SITE_TOOL_LINKS = SITE_NAV_LINKS.filter((l) => l.href !== '/notes');
