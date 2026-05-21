export type PythonTraceStep = {
  line: number;
  source: string;
  explanation: string;
  func: string;
  event: 'line' | 'call' | 'return' | 'exception';
};

export type PythonTraceResult = {
  steps: PythonTraceStep[];
  stdout: string;
  error: string | null;
};

/** 在 Pyodide 中注册并逐步追踪用户代码 */
export const PY_TRACER_SETUP = `
import ast
import sys
import json
import io
from contextlib import redirect_stdout

def _explain_statement(node, source_line):
    try:
        if isinstance(node, ast.Import):
            names = ', '.join(a.name for a in node.names)
            return f"导入模块: {names}"
        if isinstance(node, ast.ImportFrom):
            mod = node.module or ''
            names = ', '.join(a.name for a in node.names)
            return f"从 {mod} 导入 {names}"
        if isinstance(node, ast.FunctionDef):
            args = ', '.join(a.arg for a in node.args.args)
            return f"定义函数 {node.name}({args})"
        if isinstance(node, ast.ClassDef):
            return f"定义类 {node.name}"
        if isinstance(node, ast.Assign):
            targets = ', '.join(ast.unparse(t) for t in node.targets)
            return f"赋值给 {targets}"
        if isinstance(node, ast.AugAssign):
            return f"更新变量 {ast.unparse(node.target)} ({type(node.op).__name__})"
        if isinstance(node, ast.AnnAssign):
            return f"带类型注解的赋值"
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            func = node.value.func
            if isinstance(func, ast.Name):
                name = func.id
                if name == 'print':
                    return "调用 print()，输出到控制台"
                return f"调用函数 {name}()"
            if isinstance(func, ast.Attribute):
                return f"调用方法 {ast.unparse(func)}()"
        if isinstance(node, ast.Return):
            return "return 返回结果给调用方"
        if isinstance(node, ast.For):
            return f"for 循环: 遍历 {ast.unparse(node.target)}"
        if isinstance(node, ast.While):
            return "while 循环条件判断"
        if isinstance(node, ast.If):
            return "if 条件分支判断"
        if isinstance(node, ast.With):
            return "with 上下文管理器"
        if isinstance(node, ast.Raise):
            return "raise 抛出异常"
        if isinstance(node, ast.Pass):
            return "pass 占位，无操作"
        if isinstance(node, ast.Break):
            return "break 跳出循环"
        if isinstance(node, ast.Continue):
            return "continue 进入下一轮循环"
    except Exception:
        pass
    s = source_line.strip()
    return f"执行语句: {s[:72]}" if s else "执行代码"

def _explain_line(code, lineno):
    lines = code.splitlines()
    if lineno < 1 or lineno > len(lines):
        return "执行代码"
    src = lines[lineno - 1]
    stripped = src.strip()
    if not stripped:
        return "跳过空行"
    if stripped.startswith('#'):
        return "注释行（解释器跳过）"
    try:
        tree = ast.parse(stripped)
        if tree.body:
            return _explain_statement(tree.body[0], src)
    except SyntaxError:
        pass
    return f"执行: {stripped[:72]}"

def run_traced(code):
    lines = code.splitlines()
    steps = []
    stdout_buf = io.StringIO()
    err = None
    last_key = None
    repeat = 0
    max_repeat = 12

    def _push(step):
        nonlocal last_key, repeat
        key = (step.get('line'), step.get('event'), step.get('func'))
        if key == last_key:
            repeat += 1
            if repeat > max_repeat:
                return
            if repeat == max_repeat:
                step = dict(step)
                step['explanation'] = step['explanation'] + f" （同一步骤已重复 ≥{max_repeat} 次，后续省略）"
        else:
            repeat = 0
            last_key = key
        steps.append(step)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<user_exec>':
            return tracer
        ln = frame.f_lineno
        src = lines[ln - 1] if 1 <= ln <= len(lines) else ''
        fn = frame.f_code.co_name
        if event == 'line':
            if not src.strip() or src.strip().startswith('#'):
                return tracer
            _push({
                'line': ln,
                'source': src,
                'explanation': _explain_line(code, ln),
                'func': fn,
                'event': 'line',
            })
        elif event == 'call' and fn not in ('<module>', '<listcomp>', '<dictcomp>', '<genexpr>'):
            _push({
                'line': frame.f_back.f_lineno if frame.f_back else ln,
                'source': src,
                'explanation': f"进入函数 {fn}()",
                'func': fn,
                'event': 'call',
            })
        elif event == 'return' and fn not in ('<module>',):
            val = '' if arg is None else f" → {repr(arg)[:48]}"
            _push({
                'line': ln,
                'source': src,
                'explanation': f"函数 {fn}() 返回{val}",
                'func': fn,
                'event': 'return',
            })
        return tracer

    ns = {'__name__': '__main__'}
    try:
        compiled = compile(code, '<user_exec>', 'exec')
        sys.settrace(tracer)
        try:
            with redirect_stdout(stdout_buf):
                exec(compiled, ns, ns)
        finally:
            sys.settrace(None)
    except Exception as e:
        err = f"{type(e).__name__}: {e}"
        tb = e.__traceback__
        while tb:
            if tb.tb_frame.f_code.co_filename == '<user_exec>':
                ln = tb.tb_lineno
                src = lines[ln - 1] if 1 <= ln <= len(lines) else ''
                _push({
                    'line': ln,
                    'source': src,
                    'explanation': f"异常: {err}",
                    'func': tb.tb_frame.f_code.co_name,
                    'event': 'exception',
                })
                break
            tb = tb.tb_next

    if not steps and not err:
        _push({
            'line': 1,
            'source': lines[0] if lines else '',
            'explanation': '代码已运行，无逐步事件（可能仅有定义/import）',
            'func': '<module>',
            'event': 'line',
        })

    return {'steps': steps, 'stdout': stdout_buf.getvalue(), 'error': err}
`;

export function emptyTrace(): PythonTraceResult {
  return { steps: [], stdout: '', error: null };
}

export const EVENT_LABELS: Record<PythonTraceStep['event'], string> = {
  line: '执行',
  call: '调用',
  return: '返回',
  exception: '异常',
};

export const SAMPLE_CODE = `# 在线 Python（Pyodide）
import math

def greet(name):
    msg = f"Hello, {name}!"
    return msg

print(greet("Second Brain"))
print("π =", round(math.pi, 4))
print("2**10 =", 2**10)
`;
