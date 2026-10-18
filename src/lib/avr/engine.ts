/** 教学型 AVR 子集：汇编 + 逐步模拟（非周期精确）。 */

export type AvrEvent = 'execute' | 'branch' | 'io' | 'halt' | 'exception';

export type AvrCategory = 'alu' | 'load' | 'ctrl' | 'io' | 'misc';

export type AvrSnapshot = {
  regs: number[];
  portb: number;
  ddrb: number;
  z: boolean;
  c: boolean;
  /** 数据段字节（相对 dataBase） */
  data: number[];
};

export type AvrFlow = {
  op: string;
  rd?: number;
  rr?: number;
  k?: number;
  io?: number;
  ptr?: 'x' | 'y' | 'z';
  post?: boolean;
  pre?: boolean;
};

export type AvrTraceStep = {
  id: number;
  line: number;
  source: string;
  explanation: string;
  event: AvrEvent;
  pc: number;
  category: AvrCategory;
  collapsed?: number;
  flow?: AvrFlow;
  snap: AvrSnapshot;
};

export type AvrTraceResult = {
  steps: AvrTraceStep[];
  log: string;
  error: string | null;
  dataBase: number;
  symbols: Record<string, number>;
};

const IO_NAMES: Record<string, number> = {
  pinb: 0x03,
  ddrb: 0x04,
  portb: 0x05,
};

type Inst = {
  op: string;
  line: number;
  text: string;
  rd?: number;
  rr?: number;
  k?: number;
  a?: number;
  target?: number;
  ptrBase?: number;
  ptrPre?: boolean;
  ptrPost?: boolean;
};

const MNEMONICS = new Set([
  'ldi', 'mov', 'add', 'sub', 'and', 'or', 'eor', 'inc', 'dec',
  'cpi', 'cp', 'subi', 'rjmp', 'jmp', 'breq', 'brne', 'out', 'in', 'nop',
  'ld', 'st', 'ret',
]);

const DATA_BASE = 0x100;
const MAX_STEPS = 256;
const REPEAT_FOLD = 40;

const PTR_BASE: Record<string, number> = { x: 26, y: 28, z: 30 };

function emptySnap(): AvrSnapshot {
  return { regs: Array(32).fill(0), portb: 0, ddrb: 0, z: false, c: false, data: [] };
}

export function emptyTrace(): AvrTraceResult {
  return { steps: [], log: '', error: null, dataBase: DATA_BASE, symbols: {} };
}

export const EVENT_LABELS: Record<AvrEvent, string> = {
  execute: '执行',
  branch: '跳转',
  io: '端口',
  halt: '停止',
  exception: '错误',
};

function parseReg(tok: string): number | null {
  const m = /^r(\d{1,2})$/i.exec(tok);
  if (!m) return null;
  const n = Number(m[1]);
  return n <= 31 ? n : null;
}

function parseImm(tok: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(tok)) return Number(tok) & 0xff;
  if (/^\$[0-9a-f]+$/i.test(tok)) return parseInt(tok.slice(1), 16) & 0xff;
  if (/^\d+$/.test(tok)) return Number(tok) & 0xff;
  return null;
}

function parseIo(tok: string): number | null {
  const named = IO_NAMES[tok.toLowerCase()];
  if (named != null) return named;
  return parseImm(tok);
}

function splitOps(rest: string): string[] {
  return rest.split(',').map((s) => s.trim()).filter(Boolean);
}

function parsePtr(tok: string): { base: number; pre: boolean; post: boolean } | null {
  const m = /^(-)?([XYZ])(\+)?$/i.exec(tok);
  if (!m || (m[1] && m[3])) return null;
  return { base: PTR_BASE[m[2].toLowerCase()], pre: Boolean(m[1]), post: Boolean(m[3]) };
}

function parseImmOrAddr(tok: string, dataSymbols: Map<string, number>): number | null {
  const lo = /^lo8\(([A-Za-z_]\w*)\)$/i.exec(tok);
  if (lo) {
    const addr = dataSymbols.get(lo[1].toLowerCase());
    return addr == null ? null : addr & 0xff;
  }
  const hi = /^hi8\(([A-Za-z_]\w*)\)$/i.exec(tok);
  if (hi) {
    const addr = dataSymbols.get(hi[1].toLowerCase());
    return addr == null ? null : (addr >> 8) & 0xff;
  }
  return parseImm(tok);
}

export function assemble(source: string): {
  program: Inst[];
  error: string | null;
  data: number[];
  dataBase: number;
  symbols: Record<string, number>;
  entry: number;
} {
  const failAll = (error: string) => ({
    program: [] as Inst[],
    error,
    data: [] as number[],
    dataBase: DATA_BASE,
    symbols: {} as Record<string, number>,
    entry: 0,
  });
  const rawLines = source.replace(/\r\n/g, '\n').split('\n');
  const pending: { line: number; text: string; mnemonic: string; args: string[] }[] = [];
  const labels = new Map<string, number>();
  const dataSymbols = new Map<string, number>();
  const dataBytes: number[] = [];
  let section: 'text' | 'data' = 'text';

  const place = (name: string | null, bytes: number[], lineNo: number): string | null => {
    if (name) {
      if (dataSymbols.has(name)) return `L${lineNo}: 数据标签 ${name} 重复`;
      dataSymbols.set(name, DATA_BASE + dataBytes.length);
    }
    dataBytes.push(...bytes);
    return null;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const lineNo = i + 1;
    let text = rawLines[i] ?? '';
    const cmt = text.indexOf(';');
    if (cmt >= 0) text = text.slice(0, cmt);
    text = text.trim();
    if (!text) continue;

    const sectionMatch = /^\.section\s+\.(data|text)\b/i.exec(text);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase() === 'data' ? 'data' : 'text';
      continue;
    }
    if (/^\.(global|end)\b/i.test(text)) continue;

    if (section === 'data') {
      const asciz = /^(?:([A-Za-z_]\w*):)?\s*\.asciz\s+"([^"]*)"\s*$/i.exec(text);
      if (asciz) {
        const bytes = [...asciz[2]].map((ch) => ch.charCodeAt(0) & 0xff);
        bytes.push(0);
        const err = place(asciz[1]?.toLowerCase() ?? null, bytes, lineNo);
        if (err) return failAll(err);
        continue;
      }
      const space = /^(?:([A-Za-z_]\w*):)?\s*\.space\s+(\d+)\s*(?:,\s*(\d+))?\s*$/i.exec(text);
      if (space) {
        const n = Number(space[2]);
        const fill = space[3] != null ? Number(space[3]) & 0xff : 0;
        if (n > 512) return failAll(`L${lineNo}: .space 过大`);
        const err = place(space[1]?.toLowerCase() ?? null, Array(n).fill(fill), lineNo);
        if (err) return failAll(err);
        continue;
      }
      const only = /^([A-Za-z_]\w*):$/.exec(text);
      if (only) {
        const err = place(only[1].toLowerCase(), [], lineNo);
        if (err) return failAll(err);
        continue;
      }
      return failAll(`L${lineNo}: 数据段无法解析 ${text}`);
    }

    const labelMatch = /^([A-Za-z_]\w*):$/.exec(text);
    if (labelMatch) {
      const name = labelMatch[1].toLowerCase();
      if (labels.has(name) || dataSymbols.has(name)) return failAll(`L${lineNo}: 标签 ${name} 重复`);
      labels.set(name, pending.length);
      continue;
    }

    const inline = /^([A-Za-z_]\w*):\s+(.+)$/.exec(text);
    let body = text;
    if (inline && !inline[2].trim().startsWith('.')) {
      const name = inline[1].toLowerCase();
      if (labels.has(name) || dataSymbols.has(name)) return failAll(`L${lineNo}: 标签 ${name} 重复`);
      labels.set(name, pending.length);
      body = inline[2].trim();
    }

    const parts = body.split(/\s+/);
    const mnemonic = parts[0].toLowerCase();
    if (!MNEMONICS.has(mnemonic)) {
      return failAll(`L${lineNo}: 未知指令 ${parts[0]}（教学子集不含此助记符）`);
    }
    pending.push({
      line: lineNo,
      text: (rawLines[i] ?? '').replace(/;.*$/, '').trim(),
      mnemonic,
      args: splitOps(parts.slice(1).join(' ')),
    });
  }

  const program: Inst[] = [];
  for (const row of pending) {
    const fail = (msg: string) => failAll(`L${row.line}: ${msg}`);
    const need = (n: number) => row.args.length === n;

    const reg = (tok: string | undefined, name: string) => {
      if (!tok) return null;
      const r = parseReg(tok);
      return r;
    };

    if (row.mnemonic === 'nop') {
      if (!need(0)) return fail('NOP 不接受操作数');
      program.push({ op: 'nop', line: row.line, text: row.text });
      continue;
    }

    if (row.mnemonic === 'ldi' || row.mnemonic === 'cpi' || row.mnemonic === 'subi') {
      if (!need(2)) return fail(`${row.mnemonic.toUpperCase()} Rd, K`);
      const rd = reg(row.args[0], 'Rd');
      const k = parseImmOrAddr(row.args[1], dataSymbols);
      if (rd == null || k == null) return fail('寄存器、立即数或 lo8/hi8 符号无法解析');
      if (rd < 16) return fail(`${row.mnemonic.toUpperCase()} 只能用于 R16–R31`);
      program.push({ op: row.mnemonic, line: row.line, text: row.text, rd, k });
      continue;
    }

    if (row.mnemonic === 'mov' || row.mnemonic === 'add' || row.mnemonic === 'sub'
      || row.mnemonic === 'and' || row.mnemonic === 'or' || row.mnemonic === 'eor' || row.mnemonic === 'cp') {
      if (!need(2)) return fail(`${row.mnemonic.toUpperCase()} Rd, Rr`);
      const rd = reg(row.args[0], 'Rd');
      const rr = reg(row.args[1], 'Rr');
      if (rd == null || rr == null) return fail('需要两个寄存器');
      program.push({ op: row.mnemonic, line: row.line, text: row.text, rd, rr });
      continue;
    }

    if (row.mnemonic === 'inc' || row.mnemonic === 'dec') {
      if (!need(1)) return fail(`${row.mnemonic.toUpperCase()} Rd`);
      const rd = reg(row.args[0], 'Rd');
      if (rd == null) return fail('需要寄存器');
      program.push({ op: row.mnemonic, line: row.line, text: row.text, rd });
      continue;
    }

    if (row.mnemonic === 'ld') {
      if (!need(2)) return fail('LD Rd, X+');
      const rd = reg(row.args[0], 'Rd');
      const ptr = parsePtr(row.args[1]);
      if (rd == null || !ptr) return fail('LD 需要寄存器和 X/Y/Z 指针');
      program.push({
        op: 'ld', line: row.line, text: row.text, rd,
        ptrBase: ptr.base, ptrPre: ptr.pre, ptrPost: ptr.post,
      });
      continue;
    }

    if (row.mnemonic === 'st') {
      if (!need(2)) return fail('ST Z+, Rr');
      const ptr = parsePtr(row.args[0]);
      const rr = reg(row.args[1], 'Rr');
      if (!ptr || rr == null) return fail('ST 需要 X/Y/Z 指针和寄存器');
      program.push({
        op: 'st', line: row.line, text: row.text, rr,
        ptrBase: ptr.base, ptrPre: ptr.pre, ptrPost: ptr.post,
      });
      continue;
    }

    if (row.mnemonic === 'ret') {
      if (!need(0)) return fail('RET 不接受操作数');
      program.push({ op: 'ret', line: row.line, text: row.text });
      continue;
    }

    if (row.mnemonic === 'rjmp' || row.mnemonic === 'jmp' || row.mnemonic === 'breq' || row.mnemonic === 'brne') {
      if (!need(1)) return fail(`${row.mnemonic.toUpperCase()} 标签`);
      const label = row.args[0].toLowerCase();
      if (!labels.has(label)) return fail(`找不到标签 ${row.args[0]}`);
      program.push({ op: row.mnemonic, line: row.line, text: row.text, target: labels.get(label) });
      continue;
    }

    if (row.mnemonic === 'out') {
      if (!need(2)) return fail('OUT A, Rr');
      const a = parseIo(row.args[0]);
      const rr = reg(row.args[1], 'Rr');
      if (a == null || rr == null) return fail('端口或寄存器无法解析');
      program.push({ op: 'out', line: row.line, text: row.text, a, rr });
      continue;
    }

    if (row.mnemonic === 'in') {
      if (!need(2)) return fail('IN Rd, A');
      const rd = reg(row.args[0], 'Rd');
      const a = parseIo(row.args[1]);
      if (rd == null || a == null) return fail('寄存器或端口无法解析');
      program.push({ op: 'in', line: row.line, text: row.text, rd, a });
      continue;
    }

    return fail(`无法编码 ${row.mnemonic}`);
  }

  const symbols = Object.fromEntries(dataSymbols);
  return {
    program,
    error: null,
    data: dataBytes,
    dataBase: DATA_BASE,
    symbols,
    entry: labels.get('asm_function') ?? 0,
  };
}

function cloneSnap(s: AvrSnapshot, data: number[]): AvrSnapshot {
  return { regs: s.regs.slice(), portb: s.portb, ddrb: s.ddrb, z: s.z, c: s.c, data: data.slice() };
}

function readCString(sram: Uint8Array, addr: number): string {
  let s = '';
  for (let i = 0; i < 160; i++) {
    const c = sram[addr + i] ?? 0;
    if (c === 0) break;
    s += c >= 32 && c < 127 ? String.fromCharCode(c) : '.';
  }
  return s;
}

function ptrWord(regs: number[], base: number): number {
  return (regs[base] | (regs[base + 1] << 8)) & 0xffff;
}

function setPtrWord(regs: number[], base: number, value: number) {
  regs[base] = value & 0xff;
  regs[base + 1] = (value >> 8) & 0xff;
}

function bits(n: number): string {
  return (n & 0xff).toString(2).padStart(8, '0');
}

function hex(n: number): string {
  return `0x${(n & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function hex16(n: number): string {
  return `0x${(n & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

export function runAvr(source: string): AvrTraceResult {
  const built = assemble(source);
  if (built.error) {
    return { steps: [], log: '', error: built.error, dataBase: built.dataBase, symbols: built.symbols };
  }
  const { program, data, dataBase, symbols, entry } = built;

  const state = emptySnap();
  const io = new Uint8Array(256);
  const sram = new Uint8Array(0x900);
  sram.set(data, dataBase);
  const steps: AvrTraceStep[] = [];
  const logs: string[] = [];
  const hits = new Map<number, number>();
  let pc = entry;
  let id = 0;
  let stop = false;

  const dataSlice = () => Array.from(sram.slice(dataBase, dataBase + data.length));

  const push = (
    inst: Inst | null,
    event: AvrEvent,
    category: AvrCategory,
    explanation: string,
    collapsed?: number,
  ) => {
    steps.push({
      id: id++,
      line: inst?.line ?? 0,
      source: inst?.text ?? '',
      explanation,
      event,
      pc,
      category,
      collapsed,
      flow: flowOf(inst),
      snap: cloneSnap(state, dataSlice()),
    });
  };

  function flowOf(inst: Inst | null): AvrFlow | undefined {
    if (!inst) return undefined;
    const ptr = inst.ptrBase === 26 ? 'x' : inst.ptrBase === 28 ? 'y' : inst.ptrBase === 30 ? 'z' : undefined;
    return {
      op: inst.op,
      rd: inst.rd,
      rr: inst.rr,
      k: inst.k,
      io: inst.op === 'in' || inst.op === 'out' ? inst.a : undefined,
      ptr,
      post: inst.ptrPost,
      pre: inst.ptrPre,
    };
  }

  const syncIo = () => {
    state.portb = io[0x05];
    state.ddrb = io[0x04];
  };

  while (!stop && steps.length < MAX_STEPS) {
    if (pc < 0 || pc >= program.length) {
      push(null, 'halt', 'misc', pc >= program.length ? 'PC 越过末条指令，程序结束' : 'PC 越界');
      break;
    }

    const seen = (hits.get(pc) ?? 0) + 1;
    hits.set(pc, seen);
    if (seen >= REPEAT_FOLD) {
      const inst = program[pc];
      push(inst, 'halt', 'ctrl', `同一指令已重复执行，循环折叠（教学上限）`, seen);
      break;
    }

    const inst = program[pc];
    const next = pc + 1;

    const alu2 = (name: string, fn: (a: number, b: number) => { v: number; c: boolean }) => {
      const a = state.regs[inst.rd!];
      const b = state.regs[inst.rr!];
      const { v, c } = fn(a, b);
      state.regs[inst.rd!] = v & 0xff;
      state.z = (v & 0xff) === 0;
      state.c = c;
      push(inst, 'execute', 'alu', `${name} R${inst.rd}：${hex(a)} 与 ${hex(b)} → ${hex(v)}，Z=${state.z ? 1 : 0} C=${c ? 1 : 0}`);
      pc = next;
    };

    switch (inst.op) {
      case 'nop':
        push(inst, 'execute', 'misc', 'NOP：空操作，PC + 1');
        pc = next;
        break;
      case 'ldi': {
        state.regs[inst.rd!] = inst.k! & 0xff;
        push(inst, 'execute', 'load', `LDI 把立即数 ${hex(inst.k!)} 写入 R${inst.rd}`);
        pc = next;
        break;
      }
      case 'mov': {
        state.regs[inst.rd!] = state.regs[inst.rr!];
        push(inst, 'execute', 'load', `MOV：R${inst.rd} ← R${inst.rr} = ${hex(state.regs[inst.rd!])}`);
        pc = next;
        break;
      }
      case 'add':
        alu2('ADD', (a, b) => ({ v: a + b, c: a + b > 255 }));
        break;
      case 'sub':
        alu2('SUB', (a, b) => ({ v: (a - b) & 0xff, c: a < b }));
        break;
      case 'and':
        alu2('AND', (a, b) => ({ v: a & b, c: state.c }));
        break;
      case 'or':
        alu2('OR', (a, b) => ({ v: a | b, c: state.c }));
        break;
      case 'eor':
        alu2('EOR', (a, b) => ({ v: a ^ b, c: state.c }));
        break;
      case 'inc': {
        const a = state.regs[inst.rd!];
        const v = (a + 1) & 0xff;
        state.regs[inst.rd!] = v;
        state.z = v === 0;
        push(inst, 'execute', 'alu', `INC R${inst.rd}：${hex(a)} → ${hex(v)}`);
        pc = next;
        break;
      }
      case 'dec': {
        const a = state.regs[inst.rd!];
        const v = (a - 1) & 0xff;
        state.regs[inst.rd!] = v;
        state.z = v === 0;
        state.c = a === 0;
        push(inst, 'execute', 'alu', `DEC R${inst.rd}：${hex(a)} → ${hex(v)}`);
        pc = next;
        break;
      }
      case 'subi': {
        const a = state.regs[inst.rd!];
        const k = inst.k!;
        const v = (a - k) & 0xff;
        state.regs[inst.rd!] = v;
        state.z = v === 0;
        state.c = a < k;
        const ch = v >= 32 && v < 127 ? ` '${String.fromCharCode(v)}'` : '';
        push(inst, 'execute', 'alu', `SUBI R${inst.rd}：${hex(a)} - ${k} → ${hex(v)}${ch}`);
        pc = next;
        break;
      }
      case 'ld': {
        let addr = ptrWord(state.regs, inst.ptrBase!);
        if (inst.ptrPre) addr = (addr - 1) & 0xffff;
        const v = sram[addr] ?? 0;
        state.regs[inst.rd!] = v;
        if (inst.ptrPre) setPtrWord(state.regs, inst.ptrBase!, addr);
        if (inst.ptrPost) setPtrWord(state.regs, inst.ptrBase!, (addr + 1) & 0xffff);
        const ch = v >= 32 && v < 127 ? ` '${String.fromCharCode(v)}'` : v === 0 ? ' NUL' : '';
        push(inst, 'execute', 'load', `LD R${inst.rd} ← SRAM[${hex16(addr)}] = ${hex(v)}${ch}`);
        pc = next;
        break;
      }
      case 'st': {
        let addr = ptrWord(state.regs, inst.ptrBase!);
        if (inst.ptrPre) addr = (addr - 1) & 0xffff;
        const v = state.regs[inst.rr!];
        sram[addr] = v;
        if (inst.ptrPre) setPtrWord(state.regs, inst.ptrBase!, addr);
        if (inst.ptrPost) setPtrWord(state.regs, inst.ptrBase!, (addr + 1) & 0xffff);
        const ch = v >= 32 && v < 127 ? ` '${String.fromCharCode(v)}'` : '';
        push(inst, 'execute', 'load', `ST SRAM[${hex16(addr)}] ← R${inst.rr} = ${hex(v)}${ch}`);
        pc = next;
        break;
      }
      case 'jmp': {
        const dest = inst.target!;
        push(inst, 'branch', 'ctrl', `JMP：跳到指令 #${dest}`);
        pc = dest;
        break;
      }
      case 'ret': {
        push(inst, 'halt', 'ctrl', 'RET：函数返回');
        stop = true;
        break;
      }
      case 'cpi': {
        const a = state.regs[inst.rd!];
        const k = inst.k!;
        const v = (a - k) & 0xff;
        state.z = v === 0;
        state.c = a < k;
        push(inst, 'execute', 'alu', `CPI：比较 R${inst.rd}=${hex(a)} 与 ${hex(k)}，不写回寄存器。Z=${state.z ? 1 : 0}`);
        pc = next;
        break;
      }
      case 'cp': {
        const a = state.regs[inst.rd!];
        const b = state.regs[inst.rr!];
        const v = (a - b) & 0xff;
        state.z = v === 0;
        state.c = a < b;
        push(inst, 'execute', 'alu', `CP：比较 R${inst.rd}=${hex(a)} 与 R${inst.rr}=${hex(b)}。Z=${state.z ? 1 : 0}`);
        pc = next;
        break;
      }
      case 'rjmp': {
        const dest = inst.target!;
        push(inst, 'branch', 'ctrl', `RJMP：无条件跳到指令 #${dest}`);
        pc = dest;
        break;
      }
      case 'breq':
      case 'brne': {
        const take = inst.op === 'breq' ? state.z : !state.z;
        const dest = inst.target!;
        if (take) {
          push(inst, 'branch', 'ctrl', `${inst.op.toUpperCase()} 条件成立（Z=${state.z ? 1 : 0}），跳到 #${dest}`);
          pc = dest;
        } else {
          push(inst, 'branch', 'ctrl', `${inst.op.toUpperCase()} 条件不成立（Z=${state.z ? 1 : 0}），顺序执行`);
          pc = next;
        }
        break;
      }
      case 'out': {
        const prev = io[inst.a!];
        io[inst.a!] = state.regs[inst.rr!];
        if (inst.a === 0x05) io[0x03] = io[0x05];
        syncIo();
        const name = inst.a === 0x05 ? 'PORTB' : inst.a === 0x04 ? 'DDRB' : `IO ${hex(inst.a!)}`;
        push(inst, 'io', 'io', `OUT ${name} ← R${inst.rr} = ${hex(io[inst.a!])} (${bits(io[inst.a!])})`);
        if (inst.a === 0x05 && prev !== io[0x05]) {
          logs.push(`PORTB ${bits(prev)} → ${bits(io[0x05])}`);
        }
        pc = next;
        break;
      }
      case 'in': {
        const v = io[inst.a!];
        state.regs[inst.rd!] = v;
        syncIo();
        const name = inst.a === 0x05 ? 'PORTB' : inst.a === 0x04 ? 'DDRB' : inst.a === 0x03 ? 'PINB' : `IO ${hex(inst.a!)}`;
        push(inst, 'io', 'io', `IN R${inst.rd} ← ${name} = ${hex(v)}`);
        pc = next;
        break;
      }
      default:
        push(inst, 'exception', 'misc', `未实现的操作 ${inst.op}`);
        return { steps, log: logs.join('\n'), error: `未实现 ${inst.op}` };
    }
  }

  if (!stop && steps.length >= MAX_STEPS && steps[steps.length - 1]?.event !== 'halt') {
    push(program[Math.min(pc, program.length - 1)] ?? null, 'halt', 'misc', '达到单次追踪步数上限');
  }

  const sol = symbols.sol;
  if (sol != null) {
    logs.push(`sol = "${readCString(sram, sol)}"`);
  }

  return { steps, log: logs.join('\n'), error: null, dataBase, symbols };
}

export const SAMPLE_STRINGS = `.section .data
a: .asciz "sydney"
c: .asciz "perth"
sol: .space 100, 0

.section .text
.global asm_function

asm_function:
    ldi r26, lo8(a)
    ldi r27, hi8(a)
    ldi r30, lo8(sol)
    ldi r31, hi8(sol)
    ldi r17, 0

loop1:
    ld r16, X+
    cpi r16, 0
    breq next
    jmp upper
loop1_2:
    st Z+, r16
    jmp loop1

next:
    inc r17
    ldi r16, 38
    st Z+, r16

loop2:
    ld r16, X+
    cpi r16, 0
    breq end
    jmp upper
loop2_2:
    st Z+, r16
    jmp loop2
end:
    ret

upper:
    subi r16, 32
    cpi r17, 0
    breq loop1_2
    jmp loop2_2
.end
`;

export const SAMPLE_BLINK = `; AVR 教学子集 · PORTB 走灯
; DDRB=0x04  PORTB=0x05
ldi r16, 0xFF
out DDRB, r16
ldi r17, 0x01
loop:
out PORTB, r17
inc r17
rjmp loop
`;

export const SAMPLE_COUNT = `; 计数到 3 后点亮 PORTB.1
ldi r18, 0xFF
out DDRB, r18
ldi r16, 0
ldi r17, 3
loop:
inc r16
cp r16, r17
brne loop
ldi r19, 0x02
out PORTB, r19
done:
nop
`;

export const SAMPLE_ALU = `; 寄存器运算
ldi r16, 0x0F
ldi r17, 0x03
eor r16, r17
cpi r16, 0x0C
breq ok
ldi r18, 0x00
rjmp done
ok:
ldi r18, 0x01
done:
nop
`;
