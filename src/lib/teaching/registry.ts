import type { PixelIconName } from '../pixel-icons';

export type TeachingBuildingId =
  | 'math-temple'
  | 'cs-cpu'
  | 'cs-tree'
  | 'cs-graph'
  | 'cs-layers'
  | 'cs-pipeline'
  | 'cs-antenna'
  | 'cs-neural'
  | 'cs-terminal';

export type TeachingIslandId =
  | 'math'
  | 'cs-architecture'
  | 'cs-structures'
  | 'cs-algorithms'
  | 'cs-os'
  | 'cs-compiler'
  | 'cs-network'
  | 'cs-ml'
  | 'cs-programming';

export type TeachingCategory = 'math' | 'cs';

export type TeachingIsland = {
  id: TeachingIslandId;
  category: TeachingCategory;
  building: TeachingBuildingId;
  title: string;
  tagline: string;
  courseCount: number | '∞';
  icon: PixelIconName;
  accent: string;
  glow: string;
  x: number;
  y: number;
  scale?: number;
  cardAnchor?: 'bl' | 'br' | 'r' | 'l';
  keywords?: string[];
};

export const TEACHING_CATEGORY_FILTERS: {
  id: 'all' | TeachingCategory;
  label: string;
  icon: PixelIconName;
}[] = [
  { id: 'all', label: '全部', icon: 'gear' },
  { id: 'math', label: '数学', icon: 'matlab' },
  { id: 'cs', label: '计算机', icon: 'python' },
];

export const KNOWLEDGE_ISLANDS: TeachingIsland[] = [
  {
    id: 'math',
    category: 'math',
    building: 'math-temple',
    title: '数学',
    tagline: '逻辑与抽象的艺术',
    courseCount: 24,
    icon: 'matlab',
    accent: '#5b9fd4',
    glow: 'rgb(91 159 212 / 0.45)',
    x: 20,
    y: 44,
    scale: 1.12,
    cardAnchor: 'r',
    keywords: ['代数', '微积分', '几何', '概率', '统计'],
  },
  {
    id: 'cs-architecture',
    category: 'cs',
    building: 'cs-cpu',
    title: '计算机组成',
    tagline: '从晶体管到指令流水线',
    courseCount: 8,
    icon: 'gear',
    accent: '#a78bfa',
    glow: 'rgb(167 139 250 / 0.48)',
    x: 38,
    y: 16,
    cardAnchor: 'bl',
    keywords: ['组成原理', 'CPU', '存储', '总线'],
  },
  {
    id: 'cs-structures',
    category: 'cs',
    building: 'cs-tree',
    title: '数据结构',
    tagline: '组织信息的基本形态',
    courseCount: 12,
    icon: 'python',
    accent: '#c084fc',
    glow: 'rgb(192 132 252 / 0.45)',
    x: 52,
    y: 20,
    cardAnchor: 'bl',
    keywords: ['数组', '链表', '树', '堆', '哈希'],
  },
  {
    id: 'cs-algorithms',
    category: 'cs',
    building: 'cs-graph',
    title: '算法',
    tagline: '求解问题的策略与复杂度',
    courseCount: 14,
    icon: 'orbit',
    accent: '#8b5cf6',
    glow: 'rgb(139 92 246 / 0.5)',
    x: 66,
    y: 15,
    cardAnchor: 'br',
    keywords: ['排序', '搜索', '动态规划', '贪心', '图论'],
  },
  {
    id: 'cs-compiler',
    category: 'cs',
    building: 'cs-pipeline',
    title: '编译原理',
    tagline: '源码如何变成机器语言',
    courseCount: 6,
    icon: 'matlab',
    accent: '#7c6cf0',
    glow: 'rgb(124 108 240 / 0.45)',
    x: 82,
    y: 22,
    cardAnchor: 'bl',
    keywords: ['词法', '语法', '语义', '优化', '代码生成'],
  },
  {
    id: 'cs-os',
    category: 'cs',
    building: 'cs-layers',
    title: '操作系统',
    tagline: '进程、内存与文件的世界',
    courseCount: 10,
    icon: 'gear',
    accent: '#9b7bd4',
    glow: 'rgb(155 123 212 / 0.48)',
    x: 36,
    y: 40,
    cardAnchor: 'r',
    keywords: ['进程', '线程', '内存', '文件系统', '死锁'],
  },
  {
    id: 'cs-network',
    category: 'cs',
    building: 'cs-antenna',
    title: '网络与安全',
    tagline: '连接、协议与防护',
    courseCount: 9,
    icon: 'orbit',
    accent: '#b794f6',
    glow: 'rgb(183 148 246 / 0.45)',
    x: 54,
    y: 44,
    cardAnchor: 'bl',
    keywords: ['TCP', 'HTTP', '密码学', '防火墙', '安全'],
  },
  {
    id: 'cs-ml',
    category: 'cs',
    building: 'cs-neural',
    title: '机器学习',
    tagline: '从数据中学习规律',
    courseCount: 16,
    icon: 'python',
    accent: '#d946ef',
    glow: 'rgb(217 70 239 / 0.42)',
    x: 72,
    y: 40,
    cardAnchor: 'bl',
    keywords: ['神经网络', '深度学习', 'CNN', 'Transformer'],
  },
  {
    id: 'cs-programming',
    category: 'cs',
    building: 'cs-terminal',
    title: '编程语言',
    tagline: '表达计算的多重方式',
    courseCount: 18,
    icon: 'python',
    accent: '#e879f9',
    glow: 'rgb(232 121 249 / 0.4)',
    x: 58,
    y: 68,
    scale: 1.05,
    cardAnchor: 'l',
    keywords: ['C', 'Python', 'Java', 'JavaScript', 'Rust'],
  },
];

export function filterIslands(
  query: string,
  category: 'all' | TeachingCategory,
): TeachingIsland[] {
  const q = query.trim().toLowerCase();
  return KNOWLEDGE_ISLANDS.filter((island) => {
    if (category !== 'all' && island.category !== category) return false;
    if (!q) return true;
    const hay = [island.title, island.tagline, ...(island.keywords ?? [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

/** @deprecated 嵌入课时用 — 暂为空 */
export type TeachingModule = {
  id: string;
  title: string;
  description: string;
  embed: string;
};

export type TeachingSubject = {
  id: string;
  title: string;
  icon: PixelIconName;
  description: string;
  modules: TeachingModule[];
};

export const TEACHING_SUBJECTS: TeachingSubject[] = [];

export function findModule(subjectId: string, moduleId: string) {
  const subject = TEACHING_SUBJECTS.find((s) => s.id === subjectId);
  if (!subject) return null;
  const mod = subject.modules.find((m) => m.id === moduleId);
  if (!mod) return null;
  return { subject, module: mod };
}
