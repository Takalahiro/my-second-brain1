import type { AvrTraceStep } from './engine';
import type { ArchId, PartId, Sandbox, StepGrain } from './datapath';

/** 总线争用：哈佛无争用 / 改进哈佛看缓存 / 冯·诺依曼多占一拍。 */
export type Contention = 'none' | 'cache' | 'shared-bus';

export type BusId = 'fetch16' | 'data8' | 'shared';

export type DataPathSpec = {
  id: ArchId;
  label: string;
  contention: Contention;
  buses: BusId[];
  /** 固定说明，不参与摆放。框的坐标写在图里，不从这里计算。 */
  note: string;
};

export const SPECS: Record<ArchId, DataPathSpec> = {
  harvard: {
    id: 'harvard',
    label: '哈佛',
    contention: 'none',
    buses: ['fetch16', 'data8'],
    note: '程序字走 16 位指令总线，数据走 8 位数据总线，ld 取指与读数可以叠在同一拍。',
  },
  modified: {
    id: 'modified',
    label: '改进型哈佛',
    contention: 'cache',
    buses: ['fetch16', 'data8'],
    note: '内部指令缓存与数据缓存分开。地址落在低 128 字节视为命中，否则多一拍去后备存储器。',
  },
  vonNeumann: {
    id: 'vonNeumann',
    label: '冯·诺依曼',
    contention: 'shared-bus',
    buses: ['shared'],
    note: '指令和数据挤在同一条总线上。ld / st 取指之后还要再占一拍搬数据。',
  },
};

export type LodLayer = 0 | 1 | 2 | 3;

/** 连续 scale → 离散层，边界附近给出相邻层的淡入权重。 */
export function lodBlend(scale: number): { layer: LodLayer; fade: number } {
  const s = Math.min(2.4, Math.max(0.5, scale));
  const edges = [0.72, 1.15, 1.75];
  let layer: LodLayer = 0;
  if (s >= edges[2]) layer = 3;
  else if (s >= edges[1]) layer = 2;
  else if (s >= edges[0]) layer = 1;
  const nearest = edges.reduce((best, edge) => (Math.abs(edge - s) < Math.abs(best - s) ? edge : best), edges[0]);
  const dist = Math.abs(nearest - s);
  const fade = dist < 0.08 ? 1 - dist / 0.08 : 0;
  return { layer, fade };
}

export function tickStride(scale: number, grain: StepGrain): number {
  if (grain === 'cycle') return 1;
  const { layer } = lodBlend(scale);
  if (layer === 0) return 8;
  if (layer === 1) return 2;
  return 1;
}

const MEM = new Set(['ld', 'st']);

export function beatsFor(step: AvrTraceStep | undefined, arch: ArchId): number {
  const op = step?.flow?.op ?? '';
  if (!MEM.has(op)) return 1;
  const spec = SPECS[arch];
  if (spec.contention === 'none') return 1;
  if (spec.contention === 'shared-bus') return 2;
  const addr = step ? memAddr(step) : 0;
  return addr != null && addr < 0x180 ? 1 : 2;
}

function memAddr(step: AvrTraceStep): number | null {
  const flow = step.flow;
  if (!flow?.ptr) return null;
  const base = flow.ptr === 'x' ? 26 : flow.ptr === 'y' ? 28 : 30;
  const now = (step.snap.regs[base] | (step.snap.regs[base + 1] << 8)) & 0xffff;
  if (flow.post) return (now - 1) & 0xffff;
  return now;
}

export function cyclesUpTo(steps: AvrTraceStep[], index: number, arch: ArchId): number {
  let n = 0;
  const end = Math.min(steps.length - 1, index);
  for (let i = 0; i <= end; i++) n += beatsFor(steps[i], arch);
  return n;
}

export function estimateCpi(steps: AvrTraceStep[], index: number, arch: ArchId, sandbox: Sandbox): { cycles: number; cpi: number; ns: number } {
  const count = Math.min(steps.length, index + 1);
  if (!count) return { cycles: 0, cpi: 0, ns: 0 };
  let cycles = 0;
  for (let i = 0; i < count; i++) {
    let b = beatsFor(steps[i], arch);
    const op = steps[i].flow?.op ?? '';
    if (sandbox.pipeline > 1) {
      const stall = MEM.has(op) && !sandbox.bypass ? 1 : 0;
      b = 1 + stall + (b > 1 ? 1 : 0);
    }
    cycles += b;
  }
  const cpi = cycles / count;
  const ns = Number(sandbox.clockMHz) > 0 ? (cycles / Number(sandbox.clockMHz)) * 1000 : 0;
  return { cycles, cpi, ns };
}

export type FlagCell = { name: string; bit: number; value: 0 | 1; delta: 'up' | 'down' | 'same' | 'na' };

const FLAG_NAMES = ['I', 'T', 'H', 'S', 'V', 'N', 'Z', 'C'] as const;

export function flagCells(step: AvrTraceStep | null, prev: AvrTraceStep | null): FlagCell[] {
  return FLAG_NAMES.map((name, bit) => {
    if (name !== 'Z' && name !== 'C') return { name, bit, value: 0 as const, delta: 'na' as const };
    const cur = name === 'Z' ? !!step?.snap.z : !!step?.snap.c;
    const was = name === 'Z' ? !!prev?.snap.z : !!prev?.snap.c;
    const value = cur ? 1 : 0;
    const delta = !prev ? 'same' : cur === was ? 'same' : cur ? 'up' : 'down';
    return { name, bit, value: value as 0 | 1, delta };
  });
}

export function flagHex(step: AvrTraceStep | null): string {
  const z = step?.snap.z ? 2 : 0;
  const c = step?.snap.c ? 1 : 0;
  return (z | c).toString(16).toUpperCase().padStart(2, '0');
}

export function changedRegs(step: AvrTraceStep | null, prev: AvrTraceStep | null): Set<number> {
  const set = new Set<number>();
  if (!step || !prev) return set;
  for (let i = 0; i < 32; i++) if (step.snap.regs[i] !== prev.snap.regs[i]) set.add(i);
  return set;
}

export function provenance(steps: AvrTraceStep[], index: number, reg: number): number[] {
  const chain: number[] = [];
  if (!steps.length || reg < 0 || reg > 31) return chain;
  let seen = steps[Math.min(index, steps.length - 1)]?.snap.regs[reg];
  for (let i = Math.min(index, steps.length - 1); i >= 0; i--) {
    const before = i === 0 ? 0 : steps[i - 1].snap.regs[reg];
    const now = steps[i].snap.regs[reg];
    if (now !== before) {
      chain.push(i);
      seen = before;
      if (seen === 0 && i > 0) {
        const earlier = steps[i - 1].snap.regs[reg];
        if (earlier === 0) break;
      }
    }
    if (chain.length > 6) break;
  }
  return chain;
}

const OP_NIBBLE: Record<string, number> = {
  nop: 0x0, add: 0x0, sub: 0x1, and: 0x2, or: 0x2, eor: 0x2,
  cpi: 0x3, cp: 0x3, subi: 0x5, mov: 0x2, inc: 0x9, dec: 0x9,
  ldi: 0xe, ld: 0x9, st: 0x8, rjmp: 0xc, jmp: 0x9, breq: 0xf, brne: 0xf,
  in: 0xb, out: 0xb, ret: 0x9,
};

export type BitField = { name: string; bits: string; kind: 'op' | 'rd' | 'rr' | 'k' };

/** 教学用 16 位切分，不是芯片手册里的真实编码。 */
export function encodeFields(step: AvrTraceStep | null): BitField[] {
  const op = step?.flow?.op ?? 'nop';
  const rd = step?.flow?.rd ?? 0;
  const rr = step?.flow?.rr ?? 0;
  const k = step?.flow?.k ?? step?.flow?.io ?? 0;
  const nib = (OP_NIBBLE[op] ?? 0).toString(2).padStart(4, '0');
  const rdB = (rd & 31).toString(2).padStart(5, '0');
  const rrB = (rr & 31).toString(2).padStart(5, '0');
  const kB = (k & 3).toString(2).padStart(2, '0');
  return [
    { name: 'opcode', bits: nib, kind: 'op' },
    { name: 'Rd', bits: rdB, kind: 'rd' },
    { name: 'Rr', bits: rrB, kind: 'rr' },
    { name: 'K', bits: kB, kind: 'k' },
  ];
}

export const PART_COPY: Record<PartId, { what: string; doing: string }> = {
  pc: { what: '程序计数器，保存下一条指令的字地址。', doing: '每个节拍把地址送到程序存储器，顺序时加 1 个字（2 字节）。' },
  pmem: { what: '程序存储器，只放指令字。', doing: '按 PC 取出 16 位指令，交给指令寄存器。' },
  ir: { what: '指令寄存器，暂存刚取到的 16 位指令。', doing: '把整条指令交给译码器拆字段。' },
  decode: { what: '指令译码器，识别操作码和操作数。', doing: '打开该写的控制信号，本身不保存数据。' },
  regs: { what: '寄存器堆，32 个 8 位寄存器。X/Y/Z 是成对的指针。', doing: '给 ALU 或存储器提供操作数，并接收写回。' },
  alu: { what: '算术逻辑单元。', doing: '做加减与逻辑，比较指令只改标志、不写回寄存器。' },
  sreg: { what: '状态寄存器。这个子集只模拟 Z 和 C。', doing: '供 BREQ / BRNE 决定要不要改 PC。' },
  dmem: { what: '数据存储器，SRAM。', doing: 'LD 读出一个字节，ST 写入一个字节。' },
};

export function partDoing(part: PartId, step: AvrTraceStep | null): string {
  const base = PART_COPY[part].doing;
  const op = step?.flow?.op;
  if (!op) return base;
  if (part === 'dmem' && (op === 'ld' || op === 'st')) return `${op.toUpperCase()} 正在访问数据存储器。`;
  if (part === 'alu' && op) return `当前操作 ${op.toUpperCase()}。`;
  if (part === 'pc' && step) return `字地址 #${step.pc}。`;
  return base;
}

export function insnCycles(step: AvrTraceStep, arch: ArchId): number {
  return beatsFor(step, arch);
}

export type Mix = { alu: number; load: number; ctrl: number; io: number; misc: number };

export function mixUpTo(steps: AvrTraceStep[], index: number): Mix {
  const mix: Mix = { alu: 0, load: 0, ctrl: 0, io: 0, misc: 0 };
  const end = Math.min(steps.length - 1, index);
  for (let i = 0; i <= end; i++) {
    const c = steps[i].category;
    if (c === 'alu' || c === 'load' || c === 'ctrl' || c === 'io') mix[c] += 1;
    else mix.misc += 1;
  }
  return mix;
}

export function regPressure(step: AvrTraceStep | null): number {
  if (!step) return 0;
  return step.snap.regs.filter((n) => n !== 0).length;
}

export const STORY = [
  { test: (s: AvrTraceStep) => s.flow?.op === 'ldi', line: '先把指针和常数放进寄存器。' },
  { test: (s: AvrTraceStep) => s.flow?.op === 'ld', line: '从 SRAM 读出一个字符。' },
  { test: (s: AvrTraceStep) => s.flow?.op === 'subi', line: 'ALU 把小写字母减去 32，变成大写。' },
  { test: (s: AvrTraceStep) => s.flow?.op === 'st', line: '把结果写回 sol。' },
  { test: (s: AvrTraceStep) => s.flow?.op === 'out', line: '数据总线把寄存器送到灯口。' },
  { test: (s: AvrTraceStep) => s.event === 'halt', line: '函数返回，这一段跑完了。' },
];

export function storyLine(step: AvrTraceStep | null): string {
  if (!step) return '运行之后，从第一条指令讲到结果落进存储器或端口。';
  return STORY.find((s) => s.test(step))?.line ?? step.explanation;
}
