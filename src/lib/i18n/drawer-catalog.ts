import type { PixelIconName, WidgetIconKey } from '../pixel-icons';
import { DRAWER_CATEGORY_ICONS } from '../pixel-icons';
import type { Locale } from './types';

export type DrawerPaneId = 'home' | 'widgets' | 'wallpaper' | 'desktop';
export type DrawerCategoryId = Exclude<DrawerPaneId, 'home'>;

export type DrawerWidget = {
  id: WidgetIconKey;
  name: string;
  desc: string;
  pinned?: boolean;
  keywords?: string[];
};

type Catalog = {
  categories: Array<{ id: DrawerCategoryId; name: string; icon: PixelIconName; desc: string }>;
  widgetGroups: Array<{ title: string; ids: WidgetIconKey[] }>;
  items: DrawerWidget[];
  searchHints: string[];
};

const zhCatalog: Catalog = {
  categories: [
    { id: 'widgets', name: '组件', icon: DRAWER_CATEGORY_ICONS.widgets, desc: '添加与管理桌面小组件' },
    { id: 'wallpaper', name: '墙纸', icon: DRAWER_CATEGORY_ICONS.wallpaper, desc: '场景、视频与氛围' },
    { id: 'desktop', name: '桌面', icon: DRAWER_CATEGORY_ICONS.desktop, desc: '清屏与布局恢复' },
  ],
  widgetGroups: [
    { title: '桌面', ids: ['background', 'clock'] },
    { title: '媒体与氛围', ids: ['music', 'whitenoise'] },
    { title: '效率', ids: ['todo', 'calendar', 'pomodoro', 'notes'] },
    { title: '信息', ids: ['weather', 'world', 'stats', 'network'] },
    { title: '可视化', ids: ['graph', 'territory'] },
    { title: '工具', ids: ['calculator', 'python', 'whiteboard'] },
  ],
  items: [
    { id: 'background', name: '背景', desc: '响应式视频/图片背景', pinned: true, keywords: ['壁纸', '墙纸', '视频'] },
    { id: 'clock', name: '时钟', desc: '视频背景时锁定右下角', pinned: true, keywords: ['时间'] },
    { id: 'music', name: '音乐播放器', desc: '可拖拽缩放', keywords: ['音频', '播放'] },
    { id: 'notes', name: '笔记', desc: '内嵌渲染笔记正文', keywords: ['阅读'] },
    { id: 'todo', name: '待办清单', desc: '勾选完成 / 划掉取消', keywords: ['任务'] },
    { id: 'calendar', name: '日历', desc: 'iCal URL 同步事件', keywords: ['日程'] },
    { id: 'pomodoro', name: '番茄钟', desc: '专注 / 小憩 / 长休', keywords: ['专注'] },
    { id: 'weather', name: '天气', desc: 'Open-Meteo · 5 天预报', keywords: ['气温'] },
    { id: 'world', name: '世界时钟', desc: '地图切城市/天气', keywords: ['时区'] },
    { id: 'stats', name: '学习统计', desc: '笔记 / 字数统计', keywords: ['数据'] },
    { id: 'network', name: '网络流量', desc: '会话下载 · 实时速率', keywords: ['带宽', '流量', '网络'] },
    { id: 'graph', name: '关系图谱', desc: '力导向双链网络', keywords: ['双链', '图谱'] },
    { id: 'territory', name: '文件夹地图', desc: '缩放切块 · 双链弧线', keywords: ['地图'] },
    { id: 'calculator', name: 'MATLAB 计算器', desc: '表达式 / 绘图', keywords: ['matlab', '计算'] },
    { id: 'python', name: 'Python', desc: 'Pyodide 在线运行', keywords: ['代码'] },
    { id: 'whiteboard', name: '白板', desc: 'Excalidraw 手绘', keywords: ['画板'] },
    { id: 'whitenoise', name: '白噪音', desc: '多轨混音 · 可调混响', keywords: ['雨声', '环境音'] },
  ],
  searchHints: ['天气', '待办', '音乐', '图谱', '墙纸'],
};

const enCatalog: Catalog = {
  categories: [
    { id: 'widgets', name: 'Widgets', icon: DRAWER_CATEGORY_ICONS.widgets, desc: 'Add and manage desktop widgets' },
    { id: 'wallpaper', name: 'Wallpaper', icon: DRAWER_CATEGORY_ICONS.wallpaper, desc: 'Scenes, video & atmosphere' },
    { id: 'desktop', name: 'Desktop', icon: DRAWER_CATEGORY_ICONS.desktop, desc: 'Clear screen & restore layout' },
  ],
  widgetGroups: [
    { title: 'Desktop', ids: ['background', 'clock'] },
    { title: 'Media & ambience', ids: ['music', 'whitenoise'] },
    { title: 'Productivity', ids: ['todo', 'calendar', 'pomodoro', 'notes'] },
    { title: 'Information', ids: ['weather', 'world', 'stats', 'network'] },
    { title: 'Visualization', ids: ['graph', 'territory'] },
    { title: 'Tools', ids: ['calculator', 'python', 'whiteboard'] },
  ],
  items: [
    { id: 'background', name: 'Background', desc: 'Responsive video/image wallpaper', pinned: true, keywords: ['wallpaper', 'video'] },
    { id: 'clock', name: 'Clock', desc: 'Pinned bottom-right with video bg', pinned: true, keywords: ['time'] },
    { id: 'music', name: 'Music player', desc: 'Draggable & resizable', keywords: ['audio', 'play'] },
    { id: 'notes', name: 'Notes', desc: 'Inline note rendering', keywords: ['read'] },
    { id: 'todo', name: 'Todo list', desc: 'Check off / strike through', keywords: ['tasks'] },
    { id: 'calendar', name: 'Calendar', desc: 'iCal URL sync', keywords: ['schedule'] },
    { id: 'pomodoro', name: 'Pomodoro', desc: 'Focus / short / long breaks', keywords: ['focus'] },
    { id: 'weather', name: 'Weather', desc: 'Open-Meteo · 5-day forecast', keywords: ['temperature'] },
    { id: 'world', name: 'World clock', desc: 'Map cities & weather', keywords: ['timezone'] },
    { id: 'stats', name: 'Study stats', desc: 'Note & word counts', keywords: ['data'] },
    { id: 'network', name: 'Network traffic', desc: 'Session download & live rate', keywords: ['bandwidth', 'network'] },
    { id: 'graph', name: 'Knowledge graph', desc: 'Force-directed wikilinks', keywords: ['links', 'graph'] },
    { id: 'territory', name: 'Folder map', desc: 'Zoom tiles · wikilink arcs', keywords: ['map'] },
    { id: 'calculator', name: 'MATLAB calculator', desc: 'Expressions & plots', keywords: ['matlab', 'calc'] },
    { id: 'python', name: 'Python', desc: 'Pyodide in-browser', keywords: ['code'] },
    { id: 'whiteboard', name: 'Whiteboard', desc: 'Excalidraw sketching', keywords: ['draw'] },
    { id: 'whitenoise', name: 'White noise', desc: 'Multi-track mix · reverb', keywords: ['rain', 'ambient'] },
  ],
  searchHints: ['weather', 'todo', 'music', 'graph', 'wallpaper'],
};

const catalogs: Record<Locale, Catalog> = { zh: zhCatalog, en: enCatalog };

export function getDrawerCatalog(locale: Locale): Catalog {
  return catalogs[locale];
}
