import type { PixelIconName } from '../pixel-icons';

export type PathTag = '入门' | '基础' | '进阶' | '高级' | '面试' | '竞赛';

export type AlgoLearningPath = {
  id: string;
  title: string;
  tag: PathTag;
  description: string;
  icon: PixelIconName;
  accent: string;
};

export type AlgoTopic = {
  id: string;
  title: string;
  description: string;
  algorithmCount: number;
  progress: number;
  icon: PixelIconName;
  accent: string;
  href?: string;
};

export type AlgoRoadmapStep = {
  id: string;
  step: number;
  title: string;
  description: string;
  hours: string;
};

export type AlgoRecommendation = {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  readMinutes: number;
  href?: string;
};

export type AlgorithmsNavData = {
  title: string;
  subtitle: string;
  learningProgress: number;
  stats: {
    topics: number;
    algorithms: number;
    paths: number;
    problems: string;
    hours: number;
  };
  learningPaths: AlgoLearningPath[];
  topics: AlgoTopic[];
  roadmap: AlgoRoadmapStep[];
  recommendations: AlgoRecommendation[];
};

export const ALGORITHMS_NAV: AlgorithmsNavData = {
  title: '算法认知导航',
  subtitle: '从直观理解到代码实现，系统性掌握核心算法思想',
  learningProgress: 0,
  stats: {
    topics: 8,
    algorithms: 64,
    paths: 12,
    problems: '320+',
    hours: 0,
  },
  learningPaths: [
    {
      id: 'beginner',
      title: '入门路径',
      tag: '入门',
      description: '从零开始学习算法的基础知识',
      icon: 'book',
      accent: '#34d399',
    },
    {
      id: 'ds-basic',
      title: '数据结构基础',
      tag: '基础',
      description: '掌握核心数据结构的实现与应用',
      icon: 'grid',
      accent: '#60a5fa',
    },
    {
      id: 'advanced',
      title: '进阶算法路径',
      tag: '进阶',
      description: '学习高级算法与设计技巧',
      icon: 'orbit',
      accent: '#a78bfa',
    },
    {
      id: 'interview',
      title: '面试冲刺路径',
      tag: '面试',
      description: '针对技术面试的高频算法题',
      icon: 'timer',
      accent: '#f87171',
    },
    {
      id: 'competition',
      title: '竞赛提升路径',
      tag: '竞赛',
      description: '算法竞赛的训练与优化',
      icon: 'cup',
      accent: '#fbbf24',
    },
  ],
  topics: [
    {
      id: 'basics',
      title: '基础概念',
      description: '复杂度、递归、分治',
      algorithmCount: 8,
      progress: 0,
      icon: 'brain',
      accent: '#818cf8',
    },
    {
      id: 'structures',
      title: '数据结构',
      description: '数组、链表、树、图',
      algorithmCount: 12,
      progress: 0,
      icon: 'grid',
      accent: '#38bdf8',
      href: '/folder/计算机/data-structures-and-algorithms-数据结构与算法/数据结构/',
    },
    {
      id: 'sort',
      title: '排序算法',
      description: '快排、归并、堆排序',
      algorithmCount: 6,
      progress: 0,
      icon: 'chart',
      accent: '#34d399',
    },
    {
      id: 'search',
      title: '搜索算法',
      description: '二分、DFS、BFS',
      algorithmCount: 10,
      progress: 0,
      icon: 'orbit',
      accent: '#22d3ee',
    },
    {
      id: 'dp',
      title: '动态规划',
      description: '经典 DP 问题与优化',
      algorithmCount: 8,
      progress: 0,
      icon: 'puzzle',
      accent: '#a78bfa',
    },
    {
      id: 'greedy',
      title: '贪心算法',
      description: '活动选择、哈夫曼编码',
      algorithmCount: 6,
      progress: 0,
      icon: 'spark',
      accent: '#fbbf24',
    },
    {
      id: 'graph',
      title: '图论',
      description: '最短路径、最小生成树',
      algorithmCount: 14,
      progress: 0,
      icon: 'map',
      accent: '#f472b6',
      href: '/graph/',
    },
    {
      id: 'advanced',
      title: '高级算法',
      description: '字符串、几何、数论',
      algorithmCount: 10,
      progress: 0,
      icon: 'gear',
      accent: '#fb923c',
    },
  ],
  roadmap: [
    {
      id: 'r1',
      step: 1,
      title: '理解基础概念',
      description: '复杂度分析与递归思想',
      hours: '2-4 小时',
    },
    {
      id: 'r2',
      step: 2,
      title: '掌握数据结构',
      description: '数组、链表、栈、队列',
      hours: '4-6 小时',
    },
    {
      id: 'r3',
      step: 3,
      title: '学习排序搜索',
      description: '经典排序与搜索算法',
      hours: '3-5 小时',
    },
    {
      id: 'r4',
      step: 4,
      title: '算法设计模式',
      description: '动态规划、贪心、分治',
      hours: '6-8 小时',
    },
    {
      id: 'r5',
      step: 5,
      title: '综合应用实践',
      description: '解决实际问题与刷题',
      hours: '8-12 小时',
    },
  ],
  recommendations: [
    {
      id: 'rec1',
      title: '递归思想全解析',
      tags: ['基础概念'],
      summary: '深入理解递归的本质与应用场景',
      readMinutes: 15,
    },
    {
      id: 'rec2',
      title: '动态规划入门指南',
      tags: ['动态规划'],
      summary: '从斐波那契到背包问题的系统讲解',
      readMinutes: 20,
    },
    {
      id: 'rec3',
      title: '图论算法详解',
      tags: ['图论'],
      summary: 'BFS、DFS、Dijkstra 等核心算法',
      readMinutes: 25,
      href: '/graph/',
    },
    {
      id: 'rec4',
      title: 'Dijkstra 算法',
      tags: ['图论'],
      summary: '单源最短路径的经典算法实现',
      readMinutes: 18,
      href: '/graph/',
    },
  ],
};

export const PATH_TAG_CLASS: Record<PathTag, string> = {
  入门: 'tag--green',
  基础: 'tag--blue',
  进阶: 'tag--purple',
  高级: 'tag--orange',
  面试: 'tag--red',
  竞赛: 'tag--yellow',
};
