import pyTracerSetup from './py-tracer.py?raw';

export type PythonTraceStep = {
  id?: number;
  line: number;
  source: string;
  explanation: string;
  func: string;
  event: 'line' | 'call' | 'return' | 'exception';
  depth?: number;
  collapsed?: number;
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

/** 追踪步骤所属模块（与 event 一一对应，UI 分栏用） */
export type TraceModuleKind = PythonTraceStep['event'];

export const MODULE_META: Record<
  TraceModuleKind,
  { label: string; short: string; desc: string; color: string; bg: string }
> = {
  call: {
    label: '调用模块',
    short: '调用',
    desc: '进入函数 / 方法 / 魔法方法',
    color: '#7ec8ff',
    bg: 'rgb(126 200 255 / 0.12)',
  },
  line: {
    label: '执行模块',
    short: '执行',
    desc: '逐行运行语句（赋值、循环、运算等）',
    color: '#7fe6c4',
    bg: 'rgb(127 230 196 / 0.12)',
  },
  return: {
    label: '返回模块',
    short: '返回',
    desc: '函数返回与构造完成',
    color: '#ffd56a',
    bg: 'rgb(255 213 106 / 0.12)',
  },
  exception: {
    label: '异常模块',
    short: '异常',
    desc: '运行时错误与堆栈位置',
    color: '#ff9d9d',
    bg: 'rgb(255 157 157 / 0.12)',
  },
};

export const MODULE_ORDER: TraceModuleKind[] = ['call', 'line', 'return', 'exception'];

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
