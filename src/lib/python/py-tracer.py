# Pyodide 逐步解释：AST 规则 + sys.settrace
import ast
import sys
import io
from contextlib import redirect_stdout

# ---------- 魔法方法 / 运算符 → 人话 ----------
_MAGIC = {
    '__init__': '构造方法 __init__（初始化实例）',
    '__new__': '类方法 __new__（创建实例对象）',
    '__del__': '析构方法 __del__',
    '__str__': '魔法方法 __str__（用户可读字符串）',
    '__repr__': '魔法方法 __repr__（调试字符串）',
    '__format__': '魔法方法 __format__（格式化）',
    '__bytes__': '魔法方法 __bytes__（转 bytes）',
    '__len__': '魔法方法 __len__（len()）',
    '__getitem__': '魔法方法 __getitem__（下标读取）',
    '__setitem__': '魔法方法 __setitem__（下标写入）',
    '__delitem__': '魔法方法 __delitem__（下标删除）',
    '__contains__': '魔法方法 __contains__（in 成员检测）',
    '__iter__': '魔法方法 __iter__（迭代器）',
    '__next__': '魔法方法 __next__（下一项）',
    '__enter__': '魔法方法 __enter__（with 进入）',
    '__exit__': '魔法方法 __exit__（with 退出）',
    '__call__': '魔法方法 __call__（实例当函数调用）',
    '__add__': '魔法方法 __add__（+）',
    '__sub__': '魔法方法 __sub__（-）',
    '__mul__': '魔法方法 __mul__（*）',
    '__truediv__': '魔法方法 __truediv__（/）',
    '__floordiv__': '魔法方法 __floordiv__（//）',
    '__mod__': '魔法方法 __mod__（%）',
    '__pow__': '魔法方法 __pow__（**）',
    '__eq__': '魔法方法 __eq__（==）',
    '__ne__': '魔法方法 __ne__（!=）',
    '__lt__': '魔法方法 __lt__（<）',
    '__le__': '魔法方法 __le__（<=）',
    '__gt__': '魔法方法 __gt__（>）',
    '__ge__': '魔法方法 __ge__（>=）',
    '__hash__': '魔法方法 __hash__（哈希）',
    '__bool__': '魔法方法 __bool__（布尔值）',
    '__getattr__': '魔法方法 __getattr__（缺失属性）',
    '__setattr__': '魔法方法 __setattr__（设置属性）',
    '__delattr__': '魔法方法 __delattr__（删除属性）',
    '__getattribute__': '魔法方法 __getattribute__（属性查找）',
    '__dir__': '魔法方法 __dir__（dir()）',
}

_BINOP = {
    'Add': ('加法 +', '__add__ / __radd__'),
    'Sub': ('减法 -', '__sub__'),
    'Mult': ('乘法 *', '__mul__'),
    'Div': ('除法 /', '__truediv__'),
    'FloorDiv': ('整除 //', '__floordiv__'),
    'Mod': ('取模 %', '__mod__'),
    'Pow': ('幂 **', '__pow__'),
    'MatMult': ('矩阵乘 @', '__matmul__'),
    'LShift': ('左移 <<', '__lshift__'),
    'RShift': ('右移 >>', '__rshift__'),
    'BitOr': ('按位或 |', '__or__'),
    'BitXor': ('按位异或 ^', '__xor__'),
    'BitAnd': ('按位与 &', '__and__'),
}

_CMPOP = {
    'Eq': '==', 'NotEq': '!=', 'Lt': '<', 'LtE': '<=',
    'Gt': '>', 'GtE': '>=', 'Is': 'is', 'IsNot': 'is not',
    'In': 'in', 'NotIn': 'not in',
}

_BOOLOP = {'And': 'and（短路）', 'Or': 'or（短路）'}

_AUGOP = {
    'Add': '+=', 'Sub': '-=', 'Mult': '*=', 'Div': '/=',
    'FloorDiv': '//=', 'Mod': '%=', 'Pow': '**=',
    'BitOr': '|=', 'BitXor': '^=', 'BitAnd': '&=',
    'LShift': '<<=', 'RShift': '>>=',
}


def _decorators(node):
    if not node.decorator_list:
        return ''
    names = [ast.unparse(d) for d in node.decorator_list]
    return f'（装饰器: {", ".join(names)}）'


def _func_args(node):
    a = node.args
    parts = [x.arg for x in a.posonlyargs + a.args if x.arg != 'self']
    if a.vararg:
        parts.append('*' + a.vararg.arg)
    parts.extend(x.arg for x in a.kwonlyargs)
    if a.kwarg:
        parts.append('**' + a.kwarg.arg)
    return ', '.join(parts)


def _explain_function(node):
    is_async = isinstance(node, ast.AsyncFunctionDef)
    kw = 'async def' if is_async else 'def'
    args = _func_args(node)
    dec = _decorators(node)
    if node.name == '__init__':
        return f'定义构造方法 __init__({args}){dec}'
    if node.name in _MAGIC:
        return f'定义{_MAGIC[node.name]}{dec}'
    if any(
        isinstance(d, ast.Name) and d.id in ('classmethod', 'staticmethod', 'property')
        for d in node.decorator_list
    ):
        return f'定义类成员 {kw} {node.name}({args}){dec}'
    return f'定义{"异步 " if is_async else ""}函数 {node.name}({args}){dec}'


def _explain_class(node):
    bases = ', '.join(ast.unparse(b) for b in node.bases) if node.bases else 'object'
    dec = _decorators(node)
    keywords = [f'{k.arg}={ast.unparse(k.value)}' for k in node.keywords if k.arg]
    kw = f'，关键字: {", ".join(keywords)}' if keywords else ''
    return f'定义类 {node.name}，继承 {bases}{kw}{dec}'


def _receiver_label(func):
    if isinstance(func.value, ast.Name):
        return func.value.id
    return ast.unparse(func.value)


def _explain_call(call):
    func = call.func
    if isinstance(func, ast.Name):
        name = func.id
        if name == 'print':
            return '调用 print()，输出到控制台'
        if name == 'super':
            return '调用 super()，访问父类'
        if name == 'isinstance':
            return '调用 isinstance()，类型检查'
        if name == 'getattr':
            return '调用 getattr()，动态取属性'
        if name == 'setattr':
            return '调用 setattr()，动态设属性'
        return f'调用函数 {name}()'
    if isinstance(func, ast.Attribute):
        attr = func.attr
        recv = _receiver_label(func)
        if attr in _MAGIC:
            return f'对 {recv} 调用 {_MAGIC[attr]}'
        if attr.startswith('__') and attr.endswith('__'):
            return f'对 {recv} 调用魔法方法 {attr}()'
        return f'对 {recv} 调用方法 {attr}()'
    if isinstance(func, ast.Subscript):
        return f'调用可调用对象 {ast.unparse(func)}()'
    return f'调用 {ast.unparse(func)}()'


def _explain_assign(node):
    targets = ', '.join(ast.unparse(t) for t in node.targets)
    for t in node.targets:
        if isinstance(t, ast.Attribute) and isinstance(t.value, ast.Name) and t.value.id == 'self':
            return f'设置实例属性 {ast.unparse(t)}'
        if isinstance(t, ast.Subscript):
            return f'下标赋值 {ast.unparse(t)}（可能触发 __setitem__）'
        if isinstance(t, ast.Attribute):
            return f'属性赋值 {ast.unparse(t)}（可能触发 __setattr__）'
    val = node.value
    if isinstance(val, ast.Call):
        if isinstance(val.func, ast.Name):
            return f'赋值并构造/调用: {targets} = {val.func.id}(...)'
        if isinstance(val.func, ast.Attribute):
            return f'赋值: {targets} = {ast.unparse(val.func)}(...)'
    if isinstance(val, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
        return f'推导式赋值给 {targets}'
    if isinstance(val, ast.Lambda):
        return f'lambda 赋值给 {targets}'
    return f'赋值给 {targets}'


def _explain_comp(node):
    if isinstance(node, ast.ListComp):
        kind = '列表推导式'
    elif isinstance(node, ast.DictComp):
        kind = '字典推导式'
    elif isinstance(node, ast.SetComp):
        kind = '集合推导式'
    else:
        kind = '生成器表达式'
    return kind + ' [' + ast.unparse(node)[:60] + ']'


def _explain_statement(node, source_line):
    try:
        if isinstance(node, ast.Import):
            names = ', '.join(a.name for a in node.names)
            return f'导入模块: {names}'
        if isinstance(node, ast.ImportFrom):
            mod = node.module or ''
            names = ', '.join(a.name for a in node.names)
            return f'从 {mod} 导入 {names}'
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            return _explain_function(node)
        if isinstance(node, ast.ClassDef):
            return _explain_class(node)
        if isinstance(node, ast.Assign):
            return _explain_assign(node)
        if isinstance(node, ast.AnnAssign):
            tgt = ast.unparse(node.target)
            ann = ast.unparse(node.annotation) if node.annotation else '?'
            return f'带类型注解赋值: {tgt}: {ann}'
        if isinstance(node, ast.AugAssign):
            op = _AUGOP.get(type(node.op).__name__, type(node.op).__name__)
            return f'增强赋值 {ast.unparse(node.target)} {op}'
        if isinstance(node, ast.NamedExpr):
            return f'海象运算符 := 赋值 {ast.unparse(node.target)}'
        if isinstance(node, ast.Expr):
            val = node.value
            if isinstance(val, ast.Call):
                return _explain_call(val)
            if isinstance(val, ast.Await):
                inner = val.value
                if isinstance(inner, ast.Call):
                    return 'await ' + _explain_call(inner)
                return f'await 异步等待 {ast.unparse(inner)}'
            if isinstance(val, ast.Yield):
                return 'yield 产出值（生成器）'
            if isinstance(val, ast.YieldFrom):
                return 'yield from 委托子生成器'
            if isinstance(val, ast.Attribute):
                return f'读取属性 {ast.unparse(val)}'
            if isinstance(val, ast.Subscript):
                return f'下标访问 {ast.unparse(val)}（可能触发 __getitem__）'
            if isinstance(val, ast.Constant) and isinstance(val.value, str):
                return '字符串表达式语句（如 doctest / REPL 展示）'
        if isinstance(node, ast.Return):
            val = ast.unparse(node.value) if node.value else 'None'
            return f'return 返回 {val}'
        if isinstance(node, ast.Delete):
            targets = ', '.join(ast.unparse(t) for t in node.targets)
            return f'del 删除 {targets}'
        if isinstance(node, ast.AsyncFor):
            return f'async for 循环: 遍历 {ast.unparse(node.target)} in {ast.unparse(node.iter)}'
        if isinstance(node, ast.For):
            return f'for 循环: 遍历 {ast.unparse(node.target)} in {ast.unparse(node.iter)}'
        if isinstance(node, ast.While):
            orelse = '（含 else 分支）' if node.orelse else ''
            return f'while 循环条件判断{orelse}'
        if isinstance(node, ast.If):
            orelse = '（含 else/elif）' if node.orelse else ''
            return f'if 条件分支: {ast.unparse(node.test)[:48]}{orelse}'
        if isinstance(node, ast.AsyncWith):
            items = ', '.join(ast.unparse(i) for i in node.items)
            return f'async with 异步上下文管理器: {items}'
        if isinstance(node, ast.With):
            items = ', '.join(ast.unparse(i) for i in node.items)
            return f'with 上下文管理器: {items}'
        if isinstance(node, ast.Try):
            handlers = len(node.handlers)
            return f'try 块（{handlers} 个 except / else / finally）'
        if isinstance(node, ast.ExceptHandler):
            tp = ast.unparse(node.type) if node.type else 'Exception'
            return f'except {tp} 捕获异常'
        if isinstance(node, ast.Raise):
            if node.exc:
                return f'raise 抛出 {ast.unparse(node.exc)}'
            return 'raise 重新抛出当前异常'
        if isinstance(node, ast.Assert):
            return f'assert 断言: {ast.unparse(node.test)[:48]}'
        if isinstance(node, ast.Global):
            return f'global 声明全局变量: {", ".join(node.names)}'
        if isinstance(node, ast.Nonlocal):
            return f'nonlocal 声明外层变量: {", ".join(node.names)}'
        if isinstance(node, ast.Pass):
            return 'pass 占位，无操作'
        if isinstance(node, ast.Break):
            return 'break 跳出循环'
        if isinstance(node, ast.Continue):
            return 'continue 进入下一轮循环'
        if isinstance(node, ast.BinOp):
            name = type(node.op).__name__
            label, magic = _BINOP.get(name, (name, ''))
            return f'二元运算: {label}（可能触发 {magic}）'
        if isinstance(node, ast.Compare):
            parts = []
            left = ast.unparse(node.left)
            for op, comp in zip(node.ops, node.comparators):
                sym = _CMPOP.get(type(op).__name__, type(op).__name__)
                parts.append(f'{left} {sym} {ast.unparse(comp)}')
                left = ast.unparse(comp)
            return '比较链: ' + ' '.join(parts[:2])
        if isinstance(node, ast.BoolOp):
            joiner = _BOOLOP.get(type(node.op).__name__, type(node.op).__name__)
            return f'布尔运算 {joiner}: {ast.unparse(node)[:56]}'
        if isinstance(node, ast.IfExp):
            return f'三元表达式: {ast.unparse(node)[:56]}'
        if isinstance(node, ast.Subscript):
            return f'下标读取 {ast.unparse(node)}（可能触发 __getitem__）'
        if isinstance(node, ast.Attribute):
            return f'属性访问 {ast.unparse(node)}'
        if isinstance(node, ast.Lambda):
            return f'lambda 匿名函数: {ast.unparse(node)[:56]}'
        if isinstance(node, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
            return _explain_comp(node)
        if isinstance(node, ast.List):
            return '创建列表字面量'
        if isinstance(node, ast.Dict):
            return '创建字典字面量'
        if isinstance(node, ast.Set):
            return '创建集合字面量'
        if isinstance(node, ast.Tuple):
            return '创建元组'
        if isinstance(node, ast.Match):
            return 'match 模式匹配（structural pattern matching）'
        if isinstance(node, ast.MatchCase):
            return f'match 分支 case {ast.unparse(node.pattern)[:40]}'
        if isinstance(node, ast.TypeAlias):
            return f'类型别名 type {node.name.name} = {ast.unparse(node.value)[:48]}'
        if isinstance(node, ast.TypeVar):
            return f'类型变量 TypeVar({node.name})'
        if hasattr(ast, 'TypeVarTuple') and isinstance(node, ast.TypeVarTuple):
            return f'类型变量组 TypeVarTuple({node.name})'
        if hasattr(ast, 'ParamSpec') and isinstance(node, ast.ParamSpec):
            return f'参数规范 ParamSpec({node.name})'
        if isinstance(node, ast.JoinedStr):
            return 'f-string 格式化字符串'
        if isinstance(node, ast.Starred):
            return f'解包 *{ast.unparse(node.value)}'
        if isinstance(node, ast.Constant):
            v = node.value
            if isinstance(v, str):
                return '字符串常量'
            if v is Ellipsis:
                return 'Ellipsis ...'
            return f'常量 {repr(v)[:40]}'
        if isinstance(node, ast.UnaryOp):
            op = type(node.op).__name__
            return f'一元运算 {op}: {ast.unparse(node.operand)[:48]}'
        if isinstance(node, ast.Slice):
            return f'切片 {ast.unparse(node)}'
    except Exception:
        pass
    s = source_line.strip()
    return f'执行语句: {s[:72]}' if s else '执行代码'


def _explain_node(node, source_line):
    """语句或表达式节点 → 人话"""
    if node is None:
        return f'执行: {source_line.strip()[:72]}' if source_line.strip() else '执行代码'
    if isinstance(node, ast.stmt):
        return _explain_statement(node, source_line)
    if isinstance(node, ast.Expr):
        return _explain_statement(node, source_line)
    wrapped = ast.Expr(value=node)
    return _explain_statement(wrapped, source_line)


def _stmt_span(node):
    end = getattr(node, 'end_lineno', None) or node.lineno
    return end - node.lineno, node.lineno


def _line_map_from_tree(tree):
    """每行映射到跨度最小的语句节点（多行块语句按行覆盖）"""
    stmts = [n for n in ast.walk(tree) if isinstance(n, ast.stmt)]
    if not stmts:
        return {}
    max_ln = max((getattr(n, 'end_lineno', None) or n.lineno) for n in stmts)
    result = {}
    for ln in range(1, max_ln + 1):
        hits = [
            n for n in stmts
            if n.lineno <= ln <= (getattr(n, 'end_lineno', None) or n.lineno)
        ]
        if not hits:
            continue
        result[ln] = min(hits, key=_stmt_span)
    return result


def _build_line_stmt_map_incremental(code):
    """语法错误时尽量解析已完整的前缀；其余行逐行 fallback"""
    lines = code.splitlines()
    result = {}
    try:
        return _line_map_from_tree(ast.parse(code))
    except SyntaxError:
        buf = []
        for line in lines:
            buf.append(line)
            try:
                result.update(_line_map_from_tree(ast.parse('\n'.join(buf))))
            except SyntaxError:
                break
    for ln, src in enumerate(lines, 1):
        if ln in result:
            continue
        stripped = src.strip()
        if not stripped or stripped.startswith('#'):
            continue
        try:
            tree = ast.parse(stripped, mode='exec')
            if tree.body:
                result[ln] = tree.body[0]
                continue
        except SyntaxError:
            pass
        try:
            tree = ast.parse(stripped, mode='eval')
            if tree.body:
                result[ln] = tree.body
        except SyntaxError:
            pass
    return result


def _build_line_stmt_map(code):
    return _build_line_stmt_map_incremental(code)


def _classify_category(event, explanation, func, static=False):
    """细粒度语义模块（与前端 step-category.ts 同步）"""
    if static:
        if '空行' in explanation or '注释' in explanation:
            return 'meta'
        # 静态步骤也按语句语义分栏（仅未执行标注在 merge 文案里）
        return _classify_category(event, explanation, func, static=False)
    if event == 'exception':
        return 'exception'
    if event == 'return':
        if func == '__init__' or '构造' in explanation:
            return 'construct'
        if func.startswith('__') and func.endswith('__'):
            return 'magic'
        return 'return'
    if event == 'call':
        if func == '__init__' or '构造' in explanation:
            return 'construct'
        if func.startswith('__') and func.endswith('__'):
            return 'magic'
        if func in ('<listcomp>', '<dictcomp>', '<setcomp>', '<genexpr>'):
            return 'comp'
        return 'call'
    e = explanation
    if '导入' in e:
        return 'import'
    if '定义' in e and any(k in e for k in ('函数', '类', '构造方法', 'async def', 'def ')):
        return 'define'
    if any(k in e for k in ('赋值', '增强赋值', '海象', '类型注解', 'del 删除')):
        return 'assign'
    if any(k in e for k in ('global', 'nonlocal', 'pass', '注释', '空行', '跳过')):
        return 'meta'
    if any(k in e for k in ('for 循环', 'while', 'if 条件', 'try 块', 'except', 'match', 'break', 'continue', 'assert')):
        return 'control'
    if any(k in e for k in ('await', 'async ', 'yield')):
        return 'async'
    if '调用' in e:
        if 'print' in e:
            return 'io'
        if '魔法方法' in e or '__' in e:
            return 'magic'
        return 'invoke'
    if '魔法方法' in e or ('__' in e and '方法' in e):
        return 'magic'
    if any(k in e for k in ('实例', 'self', '属性')):
        return 'oop'
    if any(k in e for k in ('运算', '比较', '布尔', '三元', '推导式', 'lambda', '字面量', '下标', '读取', '字符串')):
        return 'expr'
    return 'expr'


def _with_category(step):
    s = dict(step)
    s['category'] = _classify_category(
        s.get('event', 'line'),
        s.get('explanation', ''),
        s.get('func', '<module>'),
        s.get('static', False),
    )
    return s


def build_static_line_steps(code):
    """不执行代码：为每一行生成 AST 解释步骤"""
    lines = code.splitlines() if code else ['']
    line_map = _build_line_stmt_map_incremental(code)
    syntax_err = None
    try:
        ast.parse(code)
    except SyntaxError as e:
        syntax_err = e

    steps = []
    for ln in range(1, len(lines) + 1):
        src = lines[ln - 1]
        stripped = src.strip()
        if not stripped:
            expl = '空行（无执行）'
        elif stripped.startswith('#'):
            expl = '注释行（解释器跳过）'
        else:
            node = line_map.get(ln)
            if node is not None:
                expl = _explain_node(node, src)
            else:
                expl = _explain_line(code, ln, line_map)
            if syntax_err and ln == syntax_err.lineno:
                expl = f'语法错误: {syntax_err.msg} — {expl}'

        steps.append(_with_category({
            'line': ln,
            'source': src,
            'explanation': expl,
            'func': '<static>',
            'event': 'line',
            'depth': 0,
            'static': True,
        }))

    if syntax_err:
        eln = syntax_err.lineno or 1
        esrc = lines[eln - 1] if 1 <= eln <= len(lines) else ''
        steps.append(_with_category({
            'line': eln,
            'source': esrc,
            'explanation': f'语法错误: {syntax_err.msg}',
            'func': '<static>',
            'event': 'exception',
            'depth': 0,
            'static': True,
        }))

    return steps


def _event_sort_key(step):
    order = {'line': 0, 'call': 1, 'return': 2, 'exception': 3}
    return (step.get('line', 0), order.get(step.get('event'), 9), step.get('id', 0))


def _merge_static_runtime(static_steps, runtime_steps):
    """运行时步骤为主；未执行到的行补上静态分析"""
    if not runtime_steps:
        out = []
        for i, st in enumerate(static_steps, 1):
            s = dict(st)
            s['id'] = i
            if s.get('event') == 'line' and s.get('static'):
                s['explanation'] = s['explanation'] + '（仅静态分析，未运行）'
            out.append(s)
        return out

    runtime_line_hits = {s['line'] for s in runtime_steps if s['event'] in ('line', 'exception')}
    merged = [dict(s, static=False) for s in runtime_steps]
    for st in static_steps:
        if st['line'] in runtime_line_hits:
            continue
        if st.get('event') != 'line':
            continue
        copy = dict(st)
        copy['explanation'] = copy['explanation'] + '（静态分析：程序未执行到此行）'
        merged.append(copy)
    merged.sort(key=_event_sort_key)
    out = []
    for i, s in enumerate(merged, 1):
        s['id'] = i
        out.append(s)
    return out


def _frame_depth(frame):
    depth = 0
    while frame:
        if frame.f_code.co_filename == '<user_exec>':
            depth += 1
        frame = frame.f_back
    return max(0, depth - 1)


def _explain_line(code, lineno, line_map=None):
    lines = code.splitlines()
    if lineno < 1 or lineno > len(lines):
        return '执行代码'
    src = lines[lineno - 1]
    stripped = src.strip()
    if not stripped:
        return '跳过空行'
    if stripped.startswith('#'):
        return '注释行（解释器跳过）'
    if line_map is None:
        line_map = _build_line_stmt_map(code)
    node = line_map.get(lineno)
    if node is not None:
        return _explain_node(node, src)
    try:
        tree = ast.parse(stripped)
        if tree.body:
            return _explain_statement(tree.body[0], src)
    except SyntaxError:
        pass
    return f'执行: {stripped[:72]}'


def _explain_call_event(frame, fn):
    if fn == '__init__':
        cls = frame.f_locals.get('__class__')
        cname = getattr(cls, '__name__', '实例') if cls else '实例'
        return f'进入构造方法 __init__，初始化 {cname} 对象'
    if fn in _MAGIC:
        return f'进入{_MAGIC[fn]}'
    if fn.startswith('__') and fn.endswith('__'):
        return f'进入魔法方法 {fn}()'
    if 'self' in frame.f_locals and fn not in ('<module>', '<lambda>'):
        return f'进入实例方法 {fn}()'
    if fn == '<lambda>':
        return '进入 lambda 匿名函数'
    if fn in ('<listcomp>', '<dictcomp>', '<setcomp>', '<genexpr>'):
        return f'进入{fn} 内部推导'
    return f'进入函数 {fn}()'


_SKIP_CALL = ('<module>',)
_SKIP_RETURN = ('<module>', '<listcomp>', '<dictcomp>', '<setcomp>', '<genexpr>')
_MAX_STEPS = 400
_LOOP_REPEAT_CAP = 8


def run_traced(code):
    lines = code.splitlines()
    static_steps = build_static_line_steps(code)
    steps = []
    stdout_buf = io.StringIO()
    err = None
    step_id = 0
    line_map = _build_line_stmt_map_incremental(code)

    # 同 (line, event, func, explanation) 重复计数，避免死循环刷爆步骤
    repeat_key = None
    repeat_count = 0

    def _push(step):
        nonlocal step_id, repeat_key, repeat_count
        key = (step.get('line'), step.get('event'), step.get('func'), step.get('explanation'))
        if key == repeat_key:
            repeat_count += 1
            if repeat_count > _LOOP_REPEAT_CAP:
                return
            if repeat_count == _LOOP_REPEAT_CAP:
                step = dict(step)
                step['explanation'] = step['explanation'] + f' （本行已重复 ≥{_LOOP_REPEAT_CAP} 次，后续同类步骤省略）'
                step['collapsed'] = repeat_count
        else:
            repeat_key = key
            repeat_count = 1
        if len(steps) >= _MAX_STEPS:
            if not steps or '截断' not in steps[-1].get('explanation', ''):
                trunc = _with_category({
                    'line': step.get('line', 1),
                    'source': '',
                    'explanation': f'步骤过多（>{_MAX_STEPS}），追踪已截断',
                    'func': '<module>',
                    'event': 'line',
                    'depth': 0,
                })
                step_id += 1
                trunc['id'] = step_id
                steps.append(trunc)
            return
        step_id += 1
        step['id'] = step_id
        steps.append(_with_category(step))

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<user_exec>':
            return tracer
        ln = frame.f_lineno
        src = lines[ln - 1] if 1 <= ln <= len(lines) else ''
        fn = frame.f_code.co_name
        depth = _frame_depth(frame)
        if event == 'line':
            if not src.strip() or src.strip().startswith('#'):
                return tracer
            _push({
                'line': ln,
                'source': src,
                'explanation': _explain_line(code, ln, line_map),
                'func': fn,
                'event': 'line',
                'depth': depth,
            })
        elif event == 'call' and fn not in _SKIP_CALL:
            back = frame.f_back
            back_ln = back.f_lineno if back else ln
            _push({
                'line': back_ln,
                'source': lines[back_ln - 1] if 1 <= back_ln <= len(lines) else src,
                'explanation': _explain_call_event(frame, fn),
                'func': fn,
                'event': 'call',
                'depth': depth,
            })
        elif event == 'return' and fn not in _SKIP_RETURN:
            val = '' if arg is None else f' → {repr(arg)[:48]}'
            if fn == '__init__':
                expl = f'构造方法 __init__ 返回（实例已创建）{val}'
            elif fn in _MAGIC:
                expl = f'{_MAGIC[fn]} 返回{val}'
            elif 'self' in frame.f_locals:
                expl = f'实例方法 {fn}() 返回{val}'
            else:
                expl = f'函数 {fn}() 返回{val}'
            _push({
                'line': ln,
                'source': src,
                'explanation': expl,
                'func': fn,
                'event': 'return',
                'depth': depth,
            })
        return tracer

    ns = {'__name__': '__main__'}
    compile_err = None
    try:
        compiled = compile(code, '<user_exec>', 'exec')
    except SyntaxError as e:
        compile_err = f'SyntaxError: {e}'
        err = compile_err
    else:
        try:
            sys.settrace(tracer)
            try:
                with redirect_stdout(stdout_buf):
                    exec(compiled, ns, ns)
            finally:
                sys.settrace(None)
        except Exception as e:
            err = f'{type(e).__name__}: {e}'
            tb = e.__traceback__
            while tb:
                if tb.tb_frame.f_code.co_filename == '<user_exec>':
                    ln = tb.tb_lineno
                    src = lines[ln - 1] if 1 <= ln <= len(lines) else ''
                    _push({
                        'line': ln,
                        'source': src,
                        'explanation': f'异常: {err}',
                        'func': tb.tb_frame.f_code.co_name,
                        'event': 'exception',
                        'depth': _frame_depth(tb.tb_frame),
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
                'depth': 0,
            })

    final_steps = _merge_static_runtime(static_steps, steps)
    return {'steps': final_steps, 'stdout': stdout_buf.getvalue(), 'error': err}
