/** 将常见 LaTeX 片段转为 SymPy 可读的 Python 表达式（启发式） */
export function latexToSympyHints(latex: string): string {
  let s = latex.trim();
  s = s.replace(/^\$+|\$+$/g, '');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/\bdiv\b/g, '/');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\infty/g, 'oo');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))');
  s = s.replace(/\^\{([^}]+)\}/g, '**($1)');
  s = s.replace(/\^([a-zA-Z0-9]+)/g, '**$1');
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  s = s.replace(/\s+/g, ' ');
  return s;
}

export function detectFormulaTask(latex: string): string {
  if (/\\Phi|\\mathcal\{N\}|\\operatorname\{Normal\}|N\s*\(/.test(latex)) return 'normal';
  if (/\\int/.test(latex)) return 'integral';
  if (/\\frac\s*\{\s*d\s*\}|\\partial|d\/d[a-z]/.test(latex)) return 'derivative';
  if (/=/.test(latex)) return 'equation';
  return 'simplify';
}
