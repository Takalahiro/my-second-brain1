import type { AvrFlow, AvrTraceStep } from './engine';
import { ALU_OPS, BRANCH_OPS, DIRECT_MEM_OPS, INDIRECT_OPS, IO_OPS } from './isa';

export type ArchId = 'harvard' | 'vonNeumann' | 'modified';
export type Density = 'simple' | 'detail';

export type StepGrain = 'insn' | 'cycle';
export type PartId = 'pc' | 'pmem' | 'ir' | 'decode' | 'regs' | 'alu' | 'sreg' | 'dmem';

export type Sandbox = {
  clockMHz: number;
  pipeline: number;
  bypass: boolean;
};

export type DatapathPrefs = {
  arch: ArchId;
  density: Density;
  showRegs: boolean;
  showFlags: boolean;
  showCtrl: boolean;
  showMem: boolean;
  showBus: boolean;
  /** 空间缩放与时间分辨率共用。0.5–2.4 映射到 L0–L3。 */
  scale: number;
  grain: StepGrain;
  pulse: number;
  openParts: PartId[];
  breakpoints: number[];
  sandbox: Sandbox;
};

export const DEFAULT_PREFS: DatapathPrefs = {
  arch: 'harvard',
  density: 'detail',
  showRegs: true,
  showFlags: true,
  showCtrl: true,
  showMem: true,
  showBus: true,
  scale: 1,
  grain: 'insn',
  pulse: 1.1,
  openParts: [],
  breakpoints: [],
  sandbox: { clockMHz: 16, pipeline: 1, bypass: true },
};

export const ARCHS: { id: ArchId; label: string; blurb: string }[] = [
  { id: 'harvard', label: '哈佛', blurb: '程序存储器与数据存储器分开，两条总线同时工作' },
  { id: 'vonNeumann', label: '冯·诺依曼', blurb: '指令和数据共用一套存储器与总线' },
  { id: 'modified', label: '改进型哈佛', blurb: '对外统一地址空间，内部指令缓存与数据缓存分开' },
];

const PREF_KEY = 'second-brain:avr-datapath';

export function loadDatapathPrefs(): DatapathPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<DatapathPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      sandbox: { ...DEFAULT_PREFS.sandbox, ...parsed.sandbox },
      openParts: parsed.openParts ?? [],
      breakpoints: parsed.breakpoints ?? [],
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveDatapathPrefs(prefs: DatapathPrefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

export type Hot =
  | 'pc' | 'pmem' | 'ir' | 'decode' | 'ctrl' | 'regs' | 'alu' | 'sreg'
  | 'dmem' | 'dbus' | 'abus' | 'indirect' | 'direct' | 'io'
  | 'unified' | 'icache' | 'dcache' | 'backing';

const ALU = ALU_OPS;
const BRANCH = BRANCH_OPS;

export function hotSet(flow: AvrFlow | undefined, arch: ArchId): Set<Hot> {
  const hot = new Set<Hot>(['pc', 'ir', 'decode']);
  const op = flow?.op ?? '';

  if (arch === 'harvard') hot.add('pmem');
  else if (arch === 'vonNeumann') hot.add('unified');
  else {
    hot.add('icache');
    hot.add('backing');
  }

  if (ALU.has(op)) {
    hot.add('regs');
    hot.add('alu');
    hot.add('sreg');
    hot.add('ctrl');
  } else if (INDIRECT_OPS.has(op) || DIRECT_MEM_OPS.has(op) || op === 'mov' || op === 'movw' || op === 'push' || op === 'pop') {
    hot.add('regs');
    hot.add('ctrl');
    if (DIRECT_MEM_OPS.has(op)) hot.add('direct');
    if (INDIRECT_OPS.has(op)) {
      hot.add('indirect');
      hot.add('abus');
      hot.add('dbus');
      if (arch === 'harvard') hot.add('dmem');
      else if (arch === 'vonNeumann') hot.add('unified');
      else {
        hot.add('dcache');
        hot.add('backing');
      }
    }
  } else if (op === 'ldi' || op === 'ser') {
    hot.add('regs');
    hot.add('ctrl');
    hot.add('direct');
  } else if (BRANCH.has(op)) {
    hot.add('ctrl');
    hot.add('pc');
    hot.add('sreg');
  } else if (IO_OPS.has(op)) {
    hot.add('regs');
    hot.add('io');
    hot.add('dbus');
    hot.add('ctrl');
    hot.add('direct');
  } else {
    hot.add('ctrl');
  }
  return hot;
}

export function controlSignals(flow: AvrFlow | undefined): string[] {
  const op = flow?.op;
  if (!op) return ['取指'];
  const list = ['PC+1', 'IR ← 程序字'];
  if (ALU.has(op)) list.push('ALU 使能', 'SREG 写回', op === 'cpi' || op === 'cp' || op === 'cpc' ? '禁止写寄存器' : 'Rd 写回');
  if (op === 'ldi' || op === 'ser') list.push('立即数通道', `写 R${flow?.rd ?? '?'}`);
  if (op === 'ld' || op === 'ldd') list.push(`${(flow?.ptr ?? 'x').toUpperCase()} 间接读`, '数据总线 → Rd', flow?.post ? '指针后增' : '保持指针');
  if (op === 'st' || op === 'std') list.push(`${(flow?.ptr ?? 'z').toUpperCase()} 间接写`, 'Rr → 数据总线', flow?.post ? '指针后增' : '保持指针');
  if (BRANCH.has(op)) list.push('读状态寄存器', '条件改写 PC');
  if (DIRECT_MEM_OPS.has(op)) list.push(op === 'lds' ? '直接寻址读' : '直接寻址写');
  if (IO_OPS.has(op)) list.push('I/O 地址译码');
  return list;
}

export function routeCaption(step: AvrTraceStep | undefined, arch: ArchId): string {
  const op = step?.flow?.op;
  const archName = ARCHS.find((a) => a.id === arch)?.label ?? '';
  if (!step || !op) return `${archName}：等待一条指令`;
  const via = arch === 'vonNeumann'
    ? '经唯一总线'
    : arch === 'modified'
      ? '经内部缓存'
      : '经分离总线';
  if (op === 'ld') return `${archName}：取指后 ${via}，用 ${(step.flow?.ptr ?? 'x').toUpperCase()} 间接读数据存储器`;
  if (op === 'st') return `${archName}：取指后 ${via}，用 ${(step.flow?.ptr ?? 'z').toUpperCase()} 间接写数据存储器`;
  if (ALU.has(op)) return `${archName}：取指后寄存器进入 ALU，结果写状态寄存器`;
  if (op === 'ldi') return `${archName}：立即数不经过数据存储器，直接写入寄存器`;
  if (op === 'breq' || op === 'brne') return `${archName}：用状态寄存器决定下一个程序计数器`;
  if (op === 'jmp' || op === 'rjmp' || op === 'ret') return `${archName}：控制通路改写程序计数器`;
  if (op === 'out' || op === 'in') return `${archName}：寄存器与 I/O 经数据总线交换`;
  return `${archName}：${step.explanation}`;
}

export function pointerAddr(step: AvrTraceStep): number | null {
  const flow = step.flow;
  if (!flow?.ptr) return null;
  const base = flow.ptr === 'x' ? 26 : flow.ptr === 'y' ? 28 : 30;
  const now = (step.snap.regs[base] | (step.snap.regs[base + 1] << 8)) & 0xffff;
  if (flow.post) return ((now - 1) + (flow.disp ?? 0)) & 0xffff;
  return (now + (flow.disp ?? 0)) & 0xffff;
}
