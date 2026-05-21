/** 离散数学：逻辑、集合、组合、图 */

export type TruthRow = { inputs: Record<string, boolean>; result: boolean };

export function extractVariables(expr: string): string[] {
  const tokens = expr.match(/[A-Z]/g) ?? [];
  return [...new Set(tokens)].sort();
}

export function normalizeLogic(expr: string): string {
  let s = expr.trim();
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/\bnot\b/gi, '!');
  s = s.replace(/\band\b/gi, '&&');
  s = s.replace(/\bor\b/gi, '||');
  s = s.replace(/∧/g, '&&').replace(/∨/g, '||').replace(/¬/g, '!');
  s = s.replace(/⊕/g, '!==');
  return s;
}

function evalBoolToken(s: string): boolean {
  const t = s.trim();
  if (t === '1' || t === 'true') return true;
  if (t === '0' || t === 'false') return false;
  return false;
}

/** 简易布尔表达式：! && || ( ) */
export function evalLogic(expr: string, vars: Record<string, boolean>): boolean {
  let s = normalizeLogic(expr);
  for (const [name, val] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\b${name}\\b`, 'g'), val ? '1' : '0');
  }
  // 蕴含 A->B => (!A||B)
  while (s.includes('->')) {
    s = s.replace(/(\([^)]+\)|[01!]+)\s*->\s*(\([^)]+\)|[01!]+)/g, '(!($1)||($2))');
    s = s.replace(/([01])\s*->\s*([01])/g, '(!($1)||($2))');
  }
  while (s.includes('<->')) {
    s = s.replace(/(\([^)]+\)|[01!]+)\s*<->\s*(\([^)]+\)|[01!]+)/g, '((($1)&&($2))||(!(($1))&&!(($2))))');
  }
  try {
    // 仅允许安全字符
    if (/[^01!&|()=\s]/.test(s.replace(/!==/g, ''))) return false;
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${s.replace(/&&/g, '&&').replace(/\|\|/g, '||')})`);
    return !!fn();
  } catch {
    return evalLogicSimple(s);
  }
}

function evalLogicSimple(s: string): boolean {
  // recursive descent for ! && ||
  let i = 0;
  const src = s.replace(/\s/g, '');
  function parseOr(): boolean {
    let v = parseAnd();
    while (src.slice(i, i + 2) === '||') {
      i += 2;
      v = v || parseAnd();
    }
    return v;
  }
  function parseAnd(): boolean {
    let v = parseNot();
    while (src.slice(i, i + 2) === '&&') {
      i += 2;
      v = v && parseNot();
    }
    return v;
  }
  function parseNot(): boolean {
    if (src[i] === '!') {
      i++;
      return !parseNot();
    }
    if (src[i] === '(') {
      i++;
      const v = parseOr();
      if (src[i] === ')') i++;
      return v;
    }
    const c = src[i++];
    return c === '1';
  }
  return parseOr();
}

export function truthTable(expr: string): { vars: string[]; rows: TruthRow[] } {
  const vars = extractVariables(expr);
  const rows: TruthRow[] = [];
  const n = vars.length;
  for (let i = 0; i < 2 ** n; i++) {
    const inputs: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) {
      inputs[vars[j]] = !!(i & (1 << (n - 1 - j)));
    }
    rows.push({ inputs, result: evalLogic(expr, inputs) });
  }
  return { vars, rows };
}

export type SetOp = 'union' | 'intersect' | 'diff' | 'symdiff';

export function setOp(A: string[], B: string[], op: SetOp): string[] {
  const a = new Set(A);
  const b = new Set(B);
  switch (op) {
    case 'union': return [...new Set([...A, ...B])].sort();
    case 'intersect': return A.filter((x) => b.has(x)).sort();
    case 'diff': return A.filter((x) => !b.has(x)).sort();
    case 'symdiff': return [...A.filter((x) => !b.has(x)), ...B.filter((x) => !a.has(x))].sort();
  }
}

export function parseSetInput(s: string): string[] {
  return s.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
}

export function factorial(n: number): bigint {
  if (n < 0) return 0n;
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

export function nPr(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  let res = 1n;
  for (let i = 0; i < r; i++) res *= BigInt(n - i);
  return res;
}

export function nCr(n: number, r: number): bigint {
  if (r < 0 || r > n) return 0n;
  return nPr(n, r) / factorial(r);
}

export type CombStep = { latex: string; explanation: string };

export function combSteps(n: number, r: number, kind: 'C' | 'P'): CombStep[] {
  const steps: CombStep[] = [];
  if (kind === 'P') {
    steps.push({
      latex: `P(${n},${r}) = ${n}!/(${n}-${r})!`,
      explanation: '排列：从 n 个元素中取 r 个，考虑顺序',
    });
    const num = nPr(n, r);
    steps.push({
      latex: `= ${n} \\times ${n - 1} \\times \\cdots \\times ${n - r + 1} = ${num}`,
      explanation: '连乘 r 个递减因子',
    });
  } else {
    steps.push({
      latex: `C(${n},${r}) = \\frac{P(${n},${r})}{r!} = \\frac{${n}!}{${r}!\\,(${n}-${r})!}`,
      explanation: '组合：排列数除以 r!（去掉顺序）',
    });
    const num = nCr(n, r);
    steps.push({
      latex: `= ${num}`,
      explanation: `共 ${num} 种选法`,
    });
  }
  return steps;
}

export type GraphEdge = { from: number; to: number; undirected?: boolean };

export function buildAdjMatrix(n: number, edges: GraphEdge[]): number[][] {
  const m = Array.from({ length: n }, () => Array(n).fill(0));
  for (const e of edges) {
    m[e.from][e.to] = 1;
    if (e.undirected) m[e.to][e.from] = 1;
  }
  return m;
}

export function parseEdges(text: string, n: number): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const lines = text.split(/[\n;；]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/(\d+)\s*[-–—>→]\s*(\d+)/);
    if (!m) continue;
    const a = Number(m[1]) - 1;
    const b = Number(m[2]) - 1;
    if (a >= 0 && a < n && b >= 0 && b < n) edges.push({ from: a, to: b, undirected: true });
  }
  return edges;
}

/** 节点圆形布局 */
export function circleLayout(n: number, cx: number, cy: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
  });
}
