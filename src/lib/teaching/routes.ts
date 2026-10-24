import type {
  TeachingCategory,
  TeachingCsSubFilter,
  TeachingIsland,
  TeachingIslandId,
  TeachingTopFilter,
} from './registry';
import {
  CS_CATEGORIES,
  KNOWLEDGE_ISLANDS,
  TEACHING_CS_SUB_FILTERS,
  isComputerCategory,
} from './registry';

/** 已实现详情/catalog 页的岛屿 */
export type IslandPageKind = 'catalog-algorithms';

const ISLAND_PAGE_KIND: Partial<Record<TeachingIslandId, IslandPageKind>> = {
  'cs-algorithms': 'catalog-algorithms',
};

export function getIslandById(id: string): TeachingIsland | undefined {
  return KNOWLEDGE_ISLANDS.find((i) => i.id === id);
}

export function islandHref(id: TeachingIslandId): string {
  return `/teaching/${id}/`;
}

/** URL category 参数 → 顶层 + 计算机子分类 */
export function parseTeachingCategoryParam(value: string | null): {
  top: TeachingTopFilter;
  csSub: TeachingCsSubFilter;
} {
  if (!value || value === 'all') return { top: 'all', csSub: 'all' };
  if (value === 'math') return { top: 'math', csSub: 'all' };
  if (value === 'cs') return { top: 'cs', csSub: 'all' };
  if (value === 'cs-core' || value === 'cs-system' || value === 'cs-applied' || value === 'data') {
    return { top: 'cs', csSub: value };
  }
  return { top: 'all', csSub: 'all' };
}

export function teachingHubHref(
  top: TeachingTopFilter = 'all',
  csSub: TeachingCsSubFilter = 'all',
): string {
  if (top === 'all') return '/lab/?tab=teaching';
  if (top === 'math') return '/lab/?tab=teaching&category=math';
  if (csSub === 'all') return '/lab/?tab=teaching&category=cs';
  return `/lab/?tab=teaching&category=${encodeURIComponent(csSub)}`;
}

/** 从岛屿分类生成回地图链接 */
export function teachingHubHrefForIsland(category: TeachingCategory): string {
  if (category === 'math') return teachingHubHref('math');
  return teachingHubHref('cs', category);
}

export function getIslandPageKind(id: TeachingIslandId): IslandPageKind | null {
  return ISLAND_PAGE_KIND[id] ?? null;
}

export function islandHasCatalog(id: TeachingIslandId): boolean {
  return id in ISLAND_PAGE_KIND;
}

export function getCategoryLabel(category: TeachingCategory): string {
  return TEACHING_CS_SUB_FILTERS.find((f) => f.id === category)?.label ?? category;
}

export function isTeachingCategoryParam(value: string): boolean {
  return (
    value === 'all' ||
    value === 'math' ||
    value === 'cs' ||
    value === 'cs-core' ||
    value === 'cs-system' ||
    value === 'cs-applied' ||
    value === 'data'
  );
}

export function getIslandPageTitle(id: TeachingIslandId, fallbackTitle: string): string {
  const kind = getIslandPageKind(id);
  if (kind === 'catalog-algorithms') return `${fallbackTitle} · 算法认知导航`;
  return `${fallbackTitle} · 教学`;
}

/** 岛屿 → 笔记/工具入口（占位页与 catalog 侧栏复用） */
export const ISLAND_RESOURCE_LINKS: Partial<
  Record<TeachingIslandId, { label: string; href: string }[]>
> = {
  'cs-architecture': [
    { label: 'AVR 汇编', href: '/lab/?tab=compilers&lang=avr' },
  ],
  'cs-algorithms': [
    { label: '算法笔记目录', href: '/folder/计算机/data-structures-and-algorithms-数据结构与算法/算法/' },
    { label: '关系图谱', href: '/graph/' },
    { label: 'Python', href: '/lab/?tab=compilers&lang=python' },
  ],
  'cs-structures': [
    { label: '数据结构笔记', href: '/folder/计算机/data-structures-and-algorithms-数据结构与算法/数据结构/' },
  ],
  'cs-programming': [
    { label: '编程语言笔记', href: '/folder/计算机/programming-language-编程语言/' },
    { label: '编译器', href: '/lab/?tab=compilers' },
  ],
  'data-science': [
    { label: 'DATA1001 笔记', href: '/folder/data1001/' },
  ],
  'math-calculus': [
    { label: '微积分笔记', href: '/folder/math/calculus-微积分/' },
  ],
};

export function getIslandResourceLinks(id: TeachingIslandId) {
  return ISLAND_RESOURCE_LINKS[id] ?? [];
}

export function isComputerIsland(island: TeachingIsland): boolean {
  return isComputerCategory(island.category);
}

export { CS_CATEGORIES, isComputerCategory };
