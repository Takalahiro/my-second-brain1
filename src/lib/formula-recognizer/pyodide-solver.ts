import solverScript from './formula-solver.py?raw';
import type { SolveResult, SolverPhase } from './solver-types';

/** Bump when formula-solver.py changes — helps detect stale bundles */
export const FORMULA_SOLVER_VERSION = 'v5';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

type PyodideApi = {
  runPythonAsync: (code: string) => Promise<string>;
  loadPackage: (pkg: string) => Promise<void>;
  globals: { set: (k: string, v: string) => void };
};

export function formatSolverError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("cannot import name 'Var'")) {
    return 'SymPy 包版本不兼容（Var 导入失败），请刷新页面后重试';
  }
  const importMatch = msg.match(/ImportError:\s*(.+?)(?:\n|$)/);
  if (importMatch) {
    return `SymPy 加载失败：${importMatch[1].trim()}`;
  }
  if (msg.includes('Traceback')) {
    const lines = msg.trim().split('\n');
    const last = lines[lines.length - 1]?.trim();
    return last ? `SymPy 求解失败：${last}` : 'SymPy 求解失败';
  }
  return msg;
}

class FormulaSolverEngine {
  private pyodide: PyodideApi | null = null;
  private phase: SolverPhase = 'idle';
  private initPromise: Promise<void> | null = null;
  private loadedVersion: string | null = null;

  get state(): SolverPhase {
    return this.phase;
  }

  get version(): string {
    return FORMULA_SOLVER_VERSION;
  }

  dispose() {
    this.pyodide = null;
    this.initPromise = null;
    this.loadedVersion = null;
    this.phase = 'idle';
  }

  async solve(latex: string): Promise<SolveResult> {
    if (!latex.trim()) {
      return { ok: false, steps: [], error: '没有可求解的公式' };
    }
    await this.ensureReady();
    if (!this.pyodide) throw new Error('SymPy 未就绪');

    this.phase = 'solving';
    try {
      this.pyodide.globals.set('latex_input', latex);
      const raw = await this.pyodide.runPythonAsync('solve_latex(latex_input)');
      return JSON.parse(raw) as SolveResult;
    } finally {
      this.phase = 'ready';
    }
  }

  private async ensureReady() {
    if (
      this.phase === 'ready' &&
      this.pyodide &&
      this.loadedVersion === FORMULA_SOLVER_VERSION
    ) {
      return;
    }
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.init();
    try {
      await this.initPromise;
    } finally {
      if (this.phase !== 'ready') this.initPromise = null;
    }
  }

  private loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`无法加载 ${src}`));
      document.head.appendChild(s);
    });
  }

  private async init() {
    this.phase = 'loading';
    this.pyodide = null;
    this.loadedVersion = null;
    try {
      await this.loadScript(`${PYODIDE_URL}pyodide.js`);
      // @ts-expect-error CDN global
      const loadPyodide = window.loadPyodide as (cfg: { indexURL: string }) => Promise<PyodideApi>;
      this.pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
      await this.pyodide.loadPackage('sympy');
      if (!solverScript.includes('formula-solver v5')) {
        throw new Error('SymPy 求解脚本未正确加载，请刷新页面');
      }
      await this.pyodide.runPythonAsync(solverScript);
      this.loadedVersion = FORMULA_SOLVER_VERSION;
      this.phase = 'ready';
    } catch (err) {
      this.phase = 'error';
      this.pyodide = null;
      throw err;
    }
  }
}

export const formulaSolver = new FormulaSolverEngine();

export function disposeFormulaSolver() {
  formulaSolver.dispose();
}
