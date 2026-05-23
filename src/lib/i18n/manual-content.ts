import type { Locale } from './types';

export type ManualSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
  ordered?: string[];
  note?: string;
};

export type ManualContent = {
  sections: ManualSection[];
  syncLabels: {
    noteCount: string;
    noteUnit: string;
    latestUpdate: string;
    lastSync: string;
  };
  showWelcome: string;
  getStarted: string;
  homeFab: string;
  homeFabOpen: string;
  homeFabClose: string;
};

const zh: ManualContent = {
  sections: [
    {
      title: '桌面与组件',
      paragraphs: ['顶栏 <strong>控制中心</strong> · <strong>清屏</strong>；菜单栏可直达 <strong>笔记 / Python / MATLAB / 白板 / 图谱</strong>。'],
      items: [
        '主界面菜单栏与内容页顶栏导航样式统一',
        '雨滴默认跟随天气；控制中心 → 墙纸可改「跟随天气」',
        '樱花仅在控制中心 → 墙纸，且 <strong>Kyoto</strong> 场景可用',
        '控制中心 → 墙纸：圆角预览图点击切换场景',
        '窗口三圆点：<strong>红</strong>关闭 · <strong>黄</strong>最小化 · <strong>绿</strong>展开',
        '移动端：双指旋转 · 三指缩放组件窗口',
      ],
    },
    {
      title: '笔记与工具',
      items: [
        '<a href="/notes">笔记</a>：小组件 / 折叠树；文末显示 Git 最后更新时间',
        '阅读笔记时点 <strong>工具按钮</strong>：浮窗打开 Python / MATLAB / 白板',
        '顶栏 Logo 菜单：<a href="/python">Python</a> · <a href="/matlab">MATLAB</a> · <a href="/whiteboard">白板</a> · <a href="/graph">图谱</a>',
      ],
    },
    {
      title: '笔记自动同步',
      paragraphs: ['Obsidian 笔记在子模块 <code>obsidian-vault</code> 中，通过两层机制与网站同步：'],
      ordered: [
        '<strong>本机</strong>（可选）：计划任务每小时 <code>pnpm vault:auto</code>',
        '<strong>GitHub Actions</strong>：每 10 分钟检查 vault 并重建站点',
      ],
      note: '本地改笔记后执行 <code>pnpm vault:sync</code> 或等待计划任务。',
    },
  ],
  syncLabels: {
    noteCount: '已索引笔记',
    noteUnit: '篇',
    latestUpdate: 'manifest 最新更新',
    lastSync: '上次自动同步提交',
  },
  showWelcome: '显示欢迎卡片',
  getStarted: '开始使用',
  homeFab: '主页',
  homeFabOpen: '打开使用说明',
  homeFabClose: '关闭使用说明',
};

const en: ManualContent = {
  sections: [
    {
      title: 'Desktop & widgets',
      paragraphs: ['Use the menu bar <strong>Control Center</strong> and <strong>Clear screen</strong>; jump to <strong>Notes / Python / MATLAB / Whiteboard / Graph</strong> from the top bar.'],
      items: [
        'Home menu bar matches the content-page navigation style',
        'Rain follows weather by default; toggle in Control Center → Wallpaper',
        'Sakura is only in Control Center → Wallpaper, <strong>Kyoto</strong> scene',
        'Control Center → Wallpaper: tap rounded previews to switch scenes',
        'Traffic lights: <strong>red</strong> close · <strong>yellow</strong> minimize · <strong>green</strong> expand',
        'Mobile: two-finger rotate · three-finger pinch to resize widgets',
      ],
    },
    {
      title: 'Notes & tools',
      items: [
        '<a href="/notes">Notes</a>: widget / tree views; Git last-updated at the bottom',
        'While reading, use the <strong>tools button</strong> to open Python / MATLAB / Whiteboard',
        'Logo menu: <a href="/python">Python</a> · <a href="/matlab">MATLAB</a> · <a href="/whiteboard">Whiteboard</a> · <a href="/graph">Graph</a>',
      ],
    },
    {
      title: 'Note auto-sync',
      paragraphs: ['Obsidian notes live in the <code>obsidian-vault</code> submodule and sync via:'],
      ordered: [
        '<strong>Local</strong> (optional): scheduled <code>pnpm vault:auto</code> hourly',
        '<strong>GitHub Actions</strong>: checks vault every 10 minutes and rebuilds the site',
      ],
      note: 'After local edits run <code>pnpm vault:sync</code> or wait for the scheduler.',
    },
  ],
  syncLabels: {
    noteCount: 'Indexed notes',
    noteUnit: 'notes',
    latestUpdate: 'Latest manifest update',
    lastSync: 'Last auto-sync commit',
  },
  showWelcome: 'Show welcome card',
  getStarted: 'Get started',
  homeFab: 'Home',
  homeFabOpen: 'Open user guide',
  homeFabClose: 'Close user guide',
};

export function getManualContent(locale: Locale): ManualContent {
  return locale === 'en' ? en : zh;
}
