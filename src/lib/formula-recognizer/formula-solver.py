# formula-solver v2 — loaded by Pyodide (no Var import; use sympy.stats.variance)
import json
import re
import sympy as sp
from sympy import (
    Symbol,
    symbols,
    sympify,
    simplify,
    diff,
    integrate,
    sqrt,
    Eq,
    solve,
    latex as sp_latex,
)
from sympy.stats import Normal, cdf, E, variance

x, y, z, t = symbols('x y z t', real=True)


def _step(title, expr, note=''):
    try:
        lat = expr if isinstance(expr, str) else sp_latex(expr)
    except Exception:
        lat = str(expr)
    return {'title': title, 'latex': lat, 'note': note}


def _clean(latex_str):
    s = latex_str.strip()
    return re.sub(r'^\$+|\$+$', '', s)


def _to_expr(latex_str):
    s = _clean(latex_str)
    s = s.replace(r'\left', '').replace(r'\right', '')
    s = s.replace(r'\cdot', '*').replace(r'\times', '*')
    s = s.replace(r'\pi', 'pi').replace(r'\infty', 'oo')
    s = re.sub(r'\\frac\{([^{}]+)\}\{([^{}]+)\}', r'((\1)/(\2))', s)
    s = re.sub(r'\\sqrt\{([^{}]+)\}', r'sqrt(\1)', s)
    s = re.sub(r'\^\{([^{}]+)\}', r'**(\1)', s)
    s = re.sub(r'\^([a-zA-Z0-9]+)', r'**\1', s)
    s = re.sub(r'\\([a-zA-Z]+)', r'\1', s)
    try:
        return sympify(s)
    except Exception:
        return sympify(s.replace('^', '**'))


def _normal_task(latex_str, steps):
    s = _clean(latex_str)
    m = re.search(r'\\Phi\s*\(([^)]+)\)', s)
    if m:
        z = _to_expr(m.group(1))
        steps.append(_step('识别为标准正态分布', r'Z \sim \mathcal{N}(0,1)'))
        steps.append(_step('代入', rf'\Phi({sp_latex(z)})'))
        val = cdf(Normal('Z', 0, 1))(z)
        steps.append(_step('标准正态累积分布', sp_latex(val)))
        return {'ok': True, 'task': 'normal', 'answerLatex': sp_latex(val), 'steps': steps}

    m2 = re.search(r'\\mathcal\{N\}\s*\(([^,]+),\s*([^)]+)\)', s)
    if m2:
        mu_v = _to_expr(m2.group(1))
        sig2 = _to_expr(m2.group(2))
        rv = Normal('X', mu_v, sqrt(sig2))
        steps.append(_step('识别正态分布', sp_latex(rv)))
        if 'Var' in s or 'D(' in s or 'mathrm{Var}' in s or 'operatorname{Var}' in s:
            ans = variance(rv)
            steps.append(_step('计算方差', sp_latex(ans)))
            return {'ok': True, 'task': 'normal', 'answerLatex': sp_latex(ans), 'steps': steps}
        ans = E(rv)
        steps.append(_step('计算期望', sp_latex(ans)))
        return {'ok': True, 'task': 'normal', 'answerLatex': sp_latex(ans), 'steps': steps}

    return {'ok': False, 'task': 'normal', 'error': '未能解析正态分布表达式', 'steps': steps}


def _integral_task(latex_str, steps):
    s = _clean(latex_str)
    steps.append(_step('识别积分式', s))
    m = re.search(r'\\int(?:_\{([^{}]+)\})?(?:\^\{([^{}]+)\})?\s*(.+?)\\,?d([a-zA-Z])', s)
    if m:
        a = _to_expr(m.group(1)) if m.group(1) else None
        b = _to_expr(m.group(2)) if m.group(2) else None
        integrand = _to_expr(m.group(3))
        var = Symbol(m.group(4))
        steps.append(_step('被积函数', sp_latex(integrand)))
        if a is not None and b is not None:
            res = integrate(integrand, (var, a, b))
            steps.append(_step('定积分', rf'\int_{{{sp_latex(a)}}}^{{{sp_latex(b)}}} {sp_latex(integrand)} \, d{var}'))
        else:
            res = integrate(integrand, var)
            steps.append(_step('不定积分', rf'\int {sp_latex(integrand)} \, d{var}'))
        res = simplify(res)
        steps.append(_step('化简结果', sp_latex(res)))
        return {'ok': True, 'task': 'integral', 'answerLatex': sp_latex(res), 'steps': steps}
    return {'ok': False, 'task': 'integral', 'error': '未能解析积分式', 'steps': steps}


def _derivative_task(latex_str, steps):
    s = _clean(latex_str)
    m = re.search(r'\\frac\s*\{\s*d\s*\}\s*\{\s*d([a-zA-Z])\s*\}\s*(.+)', s)
    if not m:
        m = re.search(r'\\frac\s*\{\s*\\partial\s*\}\s*\{\s*\\partial\s*([a-zA-Z])\s*\}\s*(.+)', s)
    if m:
        var = Symbol(m.group(1))
        expr = _to_expr(m.group(2))
        steps.append(_step('原函数', sp_latex(expr)))
        res = simplify(diff(expr, var))
        steps.append(_step(f'对 {var} 求导', sp_latex(res)))
        return {'ok': True, 'task': 'derivative', 'answerLatex': sp_latex(res), 'steps': steps}
    return {'ok': False, 'task': 'derivative', 'error': '未能解析求导式', 'steps': steps}


def _equation_task(latex_str, steps):
    s = _clean(latex_str)
    left, right = s.split('=', 1)
    eq = Eq(_to_expr(left), _to_expr(right))
    steps.append(_step('整理方程', sp_latex(eq)))
    unknown = x if 'x' in s else (y if 'y' in s else x)
    sol = solve(eq, unknown)
    steps.append(_step(f'求解 {unknown}', sp_latex(sol)))
    ans = sol[0] if sol else eq
    return {'ok': True, 'task': 'equation', 'answerLatex': sp_latex(ans), 'steps': steps}


def _simplify_task(latex_str, steps):
    expr = _to_expr(latex_str)
    steps.append(_step('识别表达式', sp_latex(expr)))
    simp = simplify(expr)
    steps.append(_step('化简', sp_latex(simp)))
    try:
        val = simp.evalf()
        if val != simp:
            steps.append(_step('数值近似', sp_latex(val), note='若可计算'))
    except Exception:
        pass
    return {'ok': True, 'task': 'simplify', 'answerLatex': sp_latex(simp), 'steps': steps}


def solve_latex(latex_str):
    steps = [_step('读取识别结果', _clean(latex_str))]
    s = _clean(latex_str)
    try:
        if re.search(r'\\Phi|\\mathcal\{N\}|Normal', s):
            return json.dumps(_normal_task(s, steps))
        if r'\int' in s:
            return json.dumps(_integral_task(s, steps))
        if re.search(r'\\frac\s*\{\s*(d|\\partial)', s):
            return json.dumps(_derivative_task(s, steps))
        if '=' in s:
            return json.dumps(_equation_task(s, steps))
        return json.dumps(_simplify_task(s, steps))
    except Exception as e:
        return json.dumps({'ok': False, 'error': str(e), 'steps': steps})
