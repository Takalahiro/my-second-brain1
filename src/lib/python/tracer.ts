import pyTracerSetup from './py-tracer.py?raw';

import type { TraceModuleKind } from './step-category';

export type { TraceModuleKind } from './step-category';
export { MODULE_META, MODULE_ORDER, inferStepCategory, moduleStats } from './step-category';

export type PythonTraceStep = {
  id?: number;
  line: number;
  source: string;
  explanation: string;
  func: string;
  event: 'line' | 'call' | 'return' | 'exception';
  /** 细粒度语义分模块（与 py-tracer _classify_category 同步） */
  category?: TraceModuleKind;
  depth?: number;
  collapsed?: number;
  /** 仅 AST 静态分析、未实际执行 */
  static?: boolean;
};

export type PythonTraceResult = {
  steps: PythonTraceStep[];
  stdout: string;
  error: string | null;
};

// 注入 Pyodide 的逐步 trace 脚本（AST 规则见 py-tracer.py）
export const PY_TRACER_SETUP = pyTracerSetup;

export function emptyTrace(): PythonTraceResult {
  return { steps: [], stdout: '', error: null };
}

export const EVENT_LABELS: Record<PythonTraceStep['event'], string> = {
  line: '执行',
  call: '调用',
  return: '返回',
  exception: '异常',
};

/** 当前 AST 已覆盖的语句/表达式类型（与 py-tracer.py 同步，供文档与 UI 参考） */
export const AST_COVERAGE = [
  'import / from ... import',
  'def / async def（含 @classmethod、@staticmethod、@property）',
  'class（继承、装饰器、metaclass 关键字）',
  '__init__ 等魔法方法定义与调用',
  '赋值 / 增强赋值 / 类型注解 / 海象运算符 :=',
  '实例属性 self.x、属性/下标读写（__getattr__ 等提示）',
  'print、super、isinstance、getattr、setattr',
  'for / async for、while、if、三元表达式',
  'with / async with、try/except/raise/assert',
  'return / yield / yield from / await',
  'global / nonlocal / del / pass / break / continue',
  '二元/比较/布尔运算（附带魔法方法提示）',
  '列表/字典/集合推导式与生成器表达式',
  'lambda、match/case（3.10+）',
  'call/return 事件：构造方法、实例方法、魔法方法、推导式内部',
  '无法运行 / 语法错误时：逐行静态 AST 回退（每行均有解释）',
  'async for / async with 独立解析',
  '分模块：静态 / 导入 / 定义 / 赋值 / 控制流 / 异步 / 调用 / OOP / 魔法 / 表达式 / 进入 / 返回 / 异常 等',
] as const;

export const SAMPLE_CODE = `# OOP + 魔法方法 + 进阶语法 示例
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    @classmethod
    def zero(cls):
        return cls(0, 0)

v1 = Vector(1, 2)
v2 = Vector(3, 4)
print(v1 + v2)
print(Vector.zero())
`;
