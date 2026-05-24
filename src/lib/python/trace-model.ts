import { highlightPython } from './highlight';
import type { PythonTraceStep } from './tracer';
import { MODULE_META, MODULE_ORDER, type TraceModuleKind } from './tracer';

export type { TraceModuleKind };

export type LineTraceState = 'idle' | 'pending' | 'executed' | 'active' | 'error' | 'static';

export type LineTraceRow = {
  line: number;
  html: string;
  text: string;
  state: LineTraceState;
  /** 落在这一行的步骤下标 */
  stepIndices: number[];
  /** 当前 active 步骤是否在此行 */
  isActiveLine: boolean;
  /** 此行的主要事件类型（用于色条） */
  event?: PythonTraceStep['event'];
};

export function buildLineTraceModel(
  code: string,
  steps: PythonTraceStep[],
  activeStep: number,
): LineTraceRow[] {
  const lines = code.split('\n');
  const active = steps[activeStep];
  const activeLine = active?.line ?? 0;
  const maxExecutedStep = activeStep >= 0 ? activeStep : -1;

  const executedLines = new Set<number>();
  const runtimeLines = new Set<number>();
  const lineToSteps = new Map<number, number[]>();
  let errorLine = 0;

  steps.forEach((s, i) => {
    const arr = lineToSteps.get(s.line) ?? [];
    arr.push(i);
    lineToSteps.set(s.line, arr);
    if (!s.static) runtimeLines.add(s.line);
    if (!s.static && (i <= maxExecutedStep || i === activeStep)) {
      executedLines.add(s.line);
    }
    if (s.event === 'exception') errorLine = s.line;
  });

  return lines.map((text, i) => {
    const line = i + 1;
    const stepIndices = lineToSteps.get(line) ?? [];
    const isActiveLine = line === activeLine;
    let state: LineTraceState = 'idle';
    if (errorLine === line && active?.event === 'exception') state = 'error';
    else if (isActiveLine) state = 'active';
    else if (executedLines.has(line)) state = 'executed';
    else if (stepIndices.length > 0 && !runtimeLines.has(line)) state = 'static';
    else if (activeLine > 0 && line > activeLine) state = 'pending';

    const event = isActiveLine ? active?.event : stepIndices.length ? steps[stepIndices[stepIndices.length - 1]!]?.event : undefined;

    return {
      line,
      text,
      html: text ? highlightPython(text) : '&nbsp;',
      state,
      stepIndices,
      isActiveLine,
      event,
    };
  });
}

/** 点击某行 → 跳到该行第一个未过步骤，或该行最后一步 */
export function stepIndexForLine(steps: PythonTraceStep[], line: number, preferLast = false): number {
  const hits = steps
    .map((s, i) => ({ i, line: s.line }))
    .filter((x) => x.line === line);
  if (!hits.length) return -1;
  return preferLast ? hits[hits.length - 1]!.i : hits[0]!.i;
}

/** 合并同一行连续相同解释的步骤（前端可选预处理） */
export function compactTraceSteps(steps: PythonTraceStep[]): PythonTraceStep[] {
  if (steps.length < 2) return steps;
  const out: PythonTraceStep[] = [];
  let run = 0;
  let last: PythonTraceStep | null = null;

  for (const s of steps) {
    const same =
      last &&
      s.line === last.line &&
      s.event === last.event &&
      s.func === last.func &&
      s.explanation === last.explanation;
    if (same) {
      run += 1;
      continue;
    }
    if (last && run > 0) {
      out.push({ ...last, explanation: `${last.explanation} （重复 ${run + 1} 次）` });
    } else if (last) {
      out.push(last);
    }
    last = s;
    run = 0;
  }
  if (last) {
    if (run > 0) out.push({ ...last, explanation: `${last.explanation} （重复 ${run + 1} 次）` });
    else out.push(last);
  }
  return out;
}

/** 按调用 / 执行 / 返回 / 异常 分模块整理步骤 */
export type TraceModuleBucket = {
  kind: TraceModuleKind;
  label: string;
  desc: string;
  color: string;
  bg: string;
  items: Array<{ index: number; step: PythonTraceStep }>;
};

export function buildModuleBuckets(steps: PythonTraceStep[]): TraceModuleBucket[] {
  const map = new Map<TraceModuleKind, TraceModuleBucket['items']>();
  for (const kind of MODULE_ORDER) map.set(kind, []);

  steps.forEach((step, index) => {
    map.get(step.event)?.push({ index, step });
  });

  return MODULE_ORDER.map((kind) => {
    const meta = MODULE_META[kind];
    return {
      kind,
      label: meta.label,
      desc: meta.desc,
      color: meta.color,
      bg: meta.bg,
      items: map.get(kind) ?? [],
    };
  }).filter((b) => b.items.length > 0);
}

/** 调用栈块：call → 内部 execute → return 按时间顺序归组 */
export type TraceFlowSegment = {
  kind: TraceModuleKind;
  index: number;
  step: PythonTraceStep;
};

export type TraceInvocationFrame = {
  id: number;
  func: string;
  depth: number;
  callIndex: number;
  returnIndex: number | null;
  segments: TraceFlowSegment[];
};

export function buildInvocationFrames(steps: PythonTraceStep[]): TraceInvocationFrame[] {
  const out: TraceInvocationFrame[] = [];
  const stack: TraceInvocationFrame[] = [];
  let frameId = 0;

  function openModuleFrame(atIndex: number, step: PythonTraceStep) {
    const frame: TraceInvocationFrame = {
      id: frameId++,
      func: '主程序',
      depth: 0,
      callIndex: atIndex,
      returnIndex: null,
      segments: [],
    };
    stack.push(frame);
    out.push(frame);
    return frame;
  }

  steps.forEach((step, index) => {
    const seg: TraceFlowSegment = { kind: step.event, index, step };

    if (step.event === 'call') {
      const frame: TraceInvocationFrame = {
        id: frameId++,
        func: step.func,
        depth: step.depth ?? stack.length,
        callIndex: index,
        returnIndex: null,
        segments: [seg],
      };
      stack.push(frame);
      out.push(frame);
      return;
    }

    if (stack.length === 0) openModuleFrame(index, step);

    if (step.event === 'return') {
      const frame = stack.length > 0 ? stack.pop()! : openModuleFrame(index, step);
      frame.returnIndex = index;
      if (frame.segments[frame.segments.length - 1]?.index !== index) {
        frame.segments.push(seg);
      }
      return;
    }

    stack[stack.length - 1]!.segments.push(seg);
  });

  return out;
}

export function moduleStats(steps: PythonTraceStep[]): Record<TraceModuleKind, number> {
  const counts: Record<TraceModuleKind, number> = { call: 0, line: 0, return: 0, exception: 0 };
  for (const s of steps) counts[s.event] += 1;
  return counts;
}
