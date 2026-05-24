import type { PythonTraceStep } from './tracer';

/** 细粒度语义模块（分栏 UI） */
export type TraceModuleKind =
  | 'static'
  | 'meta'
  | 'import'
  | 'define'
  | 'assign'
  | 'control'
  | 'async'
  | 'invoke'
  | 'io'
  | 'oop'
  | 'magic'
  | 'expr'
  | 'comp'
  | 'call'
  | 'construct'
  | 'return'
  | 'exception';

export const MODULE_ORDER: TraceModuleKind[] = [
  'static',
  'meta',
  'import',
  'define',
  'assign',
  'control',
  'async',
  'invoke',
  'io',
  'oop',
  'magic',
  'expr',
  'comp',
  'call',
  'construct',
  'return',
  'exception',
];

export const MODULE_META: Record<
  TraceModuleKind,
  { label: string; short: string; desc: string; color: string; bg: string }
> = {
  static: {
    label: '静态分析',
    short: '静态',
    desc: '未运行时的 AST 逐行解释',
    color: '#9eb4ff',
    bg: 'rgb(158 180 255 / 0.1)',
  },
  meta: {
    label: '结构 / 声明',
    short: '结构',
    desc: '空行、注释、global、nonlocal、pass',
    color: '#a8a8b3',
    bg: 'rgb(168 168 179 / 0.08)',
  },
  import: {
    label: '导入',
    short: '导入',
    desc: 'import / from ... import',
    color: '#c9a0ff',
    bg: 'rgb(201 160 255 / 0.1)',
  },
  define: {
    label: '定义',
    short: '定义',
    desc: 'def、async def、class 与装饰器',
    color: '#b8a0ff',
    bg: 'rgb(184 160 255 / 0.12)',
  },
  assign: {
    label: '赋值',
    short: '赋值',
    desc: '赋值、增强赋值、类型注解、del',
    color: '#7fe6c4',
    bg: 'rgb(127 230 196 / 0.12)',
  },
  control: {
    label: '控制流',
    short: '控制',
    desc: 'if / for / while / try / match / break / continue',
    color: '#6ee7d8',
    bg: 'rgb(110 231 216 / 0.1)',
  },
  async: {
    label: '异步 / 生成器',
    short: '异步',
    desc: 'await、async with/for、yield',
    color: '#5ecfff',
    bg: 'rgb(94 207 255 / 0.1)',
  },
  invoke: {
    label: '函数调用',
    short: '调用',
    desc: '调用普通函数或方法（表达式语句）',
    color: '#7ec8ff',
    bg: 'rgb(126 200 255 / 0.12)',
  },
  io: {
    label: '输入输出',
    short: 'I/O',
    desc: 'print 等控制台输出',
    color: '#8fd4ff',
    bg: 'rgb(143 212 255 / 0.1)',
  },
  oop: {
    label: '面向对象',
    short: 'OOP',
    desc: 'self 属性、实例方法、属性读写',
    color: '#ffb86c',
    bg: 'rgb(255 184 108 / 0.1)',
  },
  magic: {
    label: '魔法方法',
    short: '魔法',
    desc: '__init__、__add__ 等双下划线方法',
    color: '#ff9de6',
    bg: 'rgb(255 157 230 / 0.1)',
  },
  expr: {
    label: '表达式',
    short: '表达式',
    desc: '运算、比较、字面量、下标读取',
    color: '#a8e06a',
    bg: 'rgb(168 224 106 / 0.1)',
  },
  comp: {
    label: '推导式',
    short: '推导',
    desc: '列表/字典/集合推导式内部',
    color: '#c4e06a',
    bg: 'rgb(196 224 106 / 0.1)',
  },
  call: {
    label: '进入函数',
    short: '进入',
    desc: 'trace 进入用户定义的函数',
    color: '#5ba8ff',
    bg: 'rgb(91 168 255 / 0.14)',
  },
  construct: {
    label: '构造',
    short: '构造',
    desc: '__init__ 创建实例',
    color: '#ffa8a8',
    bg: 'rgb(255 168 168 / 0.1)',
  },
  return: {
    label: '返回',
    short: '返回',
    desc: '函数 return 与构造完成',
    color: '#ffd56a',
    bg: 'rgb(255 213 106 / 0.12)',
  },
  exception: {
    label: '异常',
    short: '异常',
    desc: '运行时错误与语法错误',
    color: '#ff9d9d',
    bg: 'rgb(255 157 157 / 0.12)',
  },
};

export function inferStepCategory(step: PythonTraceStep): TraceModuleKind {
  const cat = step.category as TraceModuleKind | undefined;
  if (cat && cat in MODULE_META) return cat;

  const { event, explanation: e, func: fn, static: isStatic } = step;
  if (isStatic) {
    if (e.includes('空行') || e.includes('注释')) return 'meta';
    // 与 py-tracer 一致：静态行仍按语义分类
  }
  if (event === 'exception') return 'exception';
  if (event === 'return') {
    if (fn === '__init__' || e.includes('构造')) return 'construct';
    if (fn.startsWith('__') && fn.endsWith('__')) return 'magic';
    return 'return';
  }
  if (event === 'call') {
    if (fn === '__init__' || e.includes('构造')) return 'construct';
    if (fn.startsWith('__') && fn.endsWith('__')) return 'magic';
    if (['<listcomp>', '<dictcomp>', '<setcomp>', '<genexpr>'].includes(fn)) return 'comp';
    return 'call';
  }

  if (e.includes('导入')) return 'import';
  if (e.includes('定义') && /函数|类|构造方法|async def|def /.test(e)) return 'define';
  if (/赋值|增强赋值|海象|类型注解|del 删除/.test(e)) return 'assign';
  if (/global|nonlocal|pass|注释|空行|跳过/.test(e)) return 'meta';
  if (/for 循环|while|if 条件|try 块|except|match|break|continue|assert/.test(e)) return 'control';
  if (/await|async |yield/.test(e)) return 'async';
  if (e.includes('调用')) {
    if (e.includes('print')) return 'io';
    if (e.includes('魔法方法') || /__\w+__/.test(e)) return 'magic';
    return 'invoke';
  }
  if (e.includes('魔法方法') || (e.includes('__') && e.includes('方法'))) return 'magic';
  if (/实例|self|属性/.test(e)) return 'oop';
  if (/运算|比较|布尔|三元|推导式|lambda|字面量|下标|读取|字符串/.test(e)) return 'expr';
  return 'expr';
}

export function moduleStats(steps: PythonTraceStep[]): Record<TraceModuleKind, number> {
  const counts = Object.fromEntries(MODULE_ORDER.map((k) => [k, 0])) as Record<TraceModuleKind, number>;
  for (const s of steps) counts[inferStepCategory(s)] += 1;
  return counts;
}
