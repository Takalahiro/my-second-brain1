/**
 * AVR 指令集（Microchip AVR Instruction Set Manual 的全部助记符，含 LDD/STD/ESPM）。
 * 教学模拟：按指令效果执行，不是周期精确，也不是逐位 opcode 译码。
 */
import type { AvrCategory, AvrEvent, AvrSnapshot } from './engine';

export type Inst = {
  op: string;
  line: number;
  text: string;
  rd?: number;
  rr?: number;
  k?: number;
  a?: number;
  bit?: number;
  target?: number;
  ptrBase?: number;
  ptrPre?: boolean;
  ptrPost?: boolean;
  disp?: number;
};

export const AVR_MNEMONICS = [
  'adc', 'add', 'adiw', 'and', 'andi', 'asr',
  'bclr', 'bld', 'brbc', 'brbs', 'brcc', 'brcs', 'break', 'breq', 'brge', 'brhc', 'brhs', 'brid', 'brie', 'brlo', 'brlt', 'brmi', 'brne', 'brpl', 'brsh', 'brtc', 'brts', 'brvc', 'brvs', 'bset', 'bst',
  'call', 'cbi', 'cbr', 'clc', 'clh', 'cli', 'cln', 'clr', 'cls', 'clt', 'clv', 'clz', 'com', 'cp', 'cpc', 'cpi', 'cpse',
  'dec', 'des',
  'eicall', 'eijmp', 'elpm', 'eor', 'espm',
  'fmul', 'fmuls', 'fmulsu',
  'icall', 'ijmp', 'in', 'inc',
  'jmp',
  'lac', 'las', 'lat', 'ld', 'ldd', 'ldi', 'lds', 'lpm', 'lsl', 'lsr',
  'mov', 'movw', 'mul', 'muls', 'mulsu',
  'neg', 'nop',
  'or', 'ori', 'out',
  'pop', 'push',
  'rcall', 'ret', 'reti', 'rjmp', 'rol', 'ror',
  'sbc', 'sbci', 'sbi', 'sbic', 'sbis', 'sbiw', 'sbr', 'sbrc', 'sbrs', 'sec', 'seh', 'sei', 'sen', 'ser', 'ses', 'set', 'sev', 'sez', 'sleep', 'spm', 'st', 'std', 'sts', 'sub', 'subi', 'swap',
  'tst',
  'wdr',
  'xch',
] as const;

export const AVR_MNEMONIC_SET = new Set<string>(AVR_MNEMONICS);

export const ALU_OPS = new Set([
  'adc', 'add', 'adiw', 'and', 'andi', 'asr', 'cbr', 'com', 'cp', 'cpc', 'cpi', 'dec', 'eor',
  'fmul', 'fmuls', 'fmulsu', 'inc', 'lsl', 'lsr', 'mul', 'muls', 'mulsu', 'neg', 'or', 'ori',
  'rol', 'ror', 'sbc', 'sbci', 'sbiw', 'sbr', 'sub', 'subi', 'swap', 'tst', 'clr', 'ser',
]);

export const BRANCH_OPS = new Set([
  'brbc', 'brbs', 'brcc', 'brcs', 'breq', 'brge', 'brhc', 'brhs', 'brid', 'brie', 'brlo', 'brlt',
  'brmi', 'brne', 'brpl', 'brsh', 'brtc', 'brts', 'brvc', 'brvs', 'call', 'cpse', 'eicall', 'eijmp',
  'icall', 'ijmp', 'jmp', 'rcall', 'ret', 'reti', 'rjmp', 'sbrc', 'sbrs', 'sbic', 'sbis',
]);

export const INDIRECT_OPS = new Set(['ld', 'ldd', 'st', 'std', 'lpm', 'elpm', 'spm', 'espm', 'xch', 'las', 'lac', 'lat']);
export const DIRECT_MEM_OPS = new Set(['lds', 'sts']);
export const IO_OPS = new Set(['in', 'out', 'sbi', 'cbi', 'sbic', 'sbis']);

const IO_NAMES: Record<string, number> = {
  pinb: 0x03, ddrb: 0x04, portb: 0x05,
  pinc: 0x06, ddrc: 0x07, portc: 0x08,
  pind: 0x09, ddrd: 0x0a, portd: 0x0b,
  rampz: 0x3b, eind: 0x3c, spl: 0x3d, sph: 0x3e, sreg: 0x3f,
};

const PTR_BASE: Record<string, number> = { x: 26, y: 28, z: 30 };
const WORD_REGS = new Set([24, 26, 28, 30]);
const FLAG_PLAIN = ['进位', '零标志', '负数标志', '溢出标志', '符号标志', '半进位', 'T 位', '总中断'];
const FLAG_SET: Record<string, number> = { sec: 0, sez: 1, sen: 2, sev: 3, ses: 4, seh: 5, set: 6, sei: 7 };
const FLAG_CLR: Record<string, number> = { clc: 0, clz: 1, cln: 2, clv: 3, cls: 4, clh: 5, clt: 6, cli: 7 };
const BRANCH_ONE = new Set([
  'breq', 'brne', 'brcs', 'brcc', 'brsh', 'brlo', 'brmi', 'brpl', 'brge', 'brlt',
  'brhs', 'brhc', 'brts', 'brtc', 'brvs', 'brvc', 'brie', 'brid', 'rjmp', 'jmp', 'rcall', 'call',
]);
const ZERO_OPS = new Set(['nop', 'sleep', 'wdr', 'break', 'ret', 'reti', 'ijmp', 'eijmp', 'icall', 'eicall']);
const ONE_REG = new Set(['inc', 'dec', 'lsl', 'lsr', 'rol', 'ror', 'asr', 'swap', 'com', 'neg', 'clr', 'ser', 'tst', 'push', 'pop']);
const TWO_REG = new Set(['mov', 'add', 'adc', 'sub', 'sbc', 'and', 'or', 'eor', 'cp', 'cpc', 'cpse', 'mul']);
const IMM_HI = new Set(['ldi', 'andi', 'ori', 'subi', 'sbci', 'cpi', 'sbr', 'cbr']);

const RAMEND = 0x08ff;

export type ExecCtx = {
  inst: Inst;
  state: AvrSnapshot;
  sram: Uint8Array;
  flash: Uint8Array;
  io: Uint8Array;
  pc: number;
  next: number;
  programLength: number;
  sp: { v: number };
};

export type ExecOutcome = {
  pc: number;
  stop?: boolean;
  event: AvrEvent;
  category: AvrCategory;
  explanation: string;
  log?: string;
};

type Row = { line: number; text: string; mnemonic: string; args: string[] };

function hex(n: number): string {
  return `0x${(n & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
}

function hex16(n: number): string {
  return `0x${(n & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;
}

function bits(n: number): string {
  return (n & 0xff).toString(2).padStart(8, '0');
}

export function sregByte(s: Pick<AvrSnapshot, 'i' | 't' | 'h' | 's' | 'v' | 'n' | 'z' | 'c'>): number {
  return (s.i ? 0x80 : 0) | (s.t ? 0x40 : 0) | (s.h ? 0x20 : 0) | (s.s ? 0x10 : 0)
    | (s.v ? 0x08 : 0) | (s.n ? 0x04 : 0) | (s.z ? 0x02 : 0) | (s.c ? 0x01 : 0);
}

function applySreg(s: AvrSnapshot, v: number) {
  s.i = (v & 0x80) !== 0;
  s.t = (v & 0x40) !== 0;
  s.h = (v & 0x20) !== 0;
  s.s = (v & 0x10) !== 0;
  s.v = (v & 0x08) !== 0;
  s.n = (v & 0x04) !== 0;
  s.z = (v & 0x02) !== 0;
  s.c = (v & 0x01) !== 0;
}

function finishLogic(s: AvrSnapshot, v: number) {
  s.n = (v & 0x80) !== 0;
  s.v = false;
  s.s = s.n;
  s.z = (v & 0xff) === 0;
}

function finishNz(s: AvrSnapshot, v: number, overflow: boolean) {
  s.n = (v & 0x80) !== 0;
  s.v = overflow;
  s.s = s.n !== s.v;
  s.z = (v & 0xff) === 0;
}

function writeAdd(s: AvrSnapshot, a: number, b: number, cin: boolean): number {
  const sum = (a & 0xff) + (b & 0xff) + (cin ? 1 : 0);
  const v = sum & 0xff;
  s.h = ((a & 0x0f) + (b & 0x0f) + (cin ? 1 : 0)) > 0x0f;
  s.c = sum > 0xff;
  const a7 = (a & 0x80) !== 0;
  const b7 = (b & 0x80) !== 0;
  const r7 = (v & 0x80) !== 0;
  finishNz(s, v, (a7 && b7 && !r7) || (!a7 && !b7 && r7));
  return v;
}

function writeSub(s: AvrSnapshot, a: number, b: number, cin: boolean, keepZ = false): number {
  const borrow = cin ? 1 : 0;
  const diff = (a & 0xff) - (b & 0xff) - borrow;
  const v = diff & 0xff;
  s.h = ((a & 0x0f) - (b & 0x0f) - borrow) < 0;
  s.c = diff < 0;
  const a7 = (a & 0x80) !== 0;
  const b7 = (b & 0x80) !== 0;
  const r7 = (v & 0x80) !== 0;
  const prevZ = s.z;
  finishNz(s, v, (a7 && !b7 && !r7) || (!a7 && b7 && r7));
  if (keepZ) s.z = (v === 0) && prevZ;
  return v;
}

function parseReg(tok: string): number | null {
  const m = /^r(\d{1,2})$/i.exec(tok);
  if (!m) return null;
  const n = Number(m[1]);
  return n <= 31 ? n : null;
}

function parseNum(tok: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(tok)) return Number(tok);
  if (/^\$[0-9a-f]+$/i.test(tok)) return parseInt(tok.slice(1), 16);
  if (/^\d+$/.test(tok)) return Number(tok);
  return null;
}

function parseIo(tok: string): number | null {
  const named = IO_NAMES[tok.toLowerCase()];
  if (named != null) return named;
  const n = parseNum(tok);
  if (n == null || n > 0x3f) return null;
  return n;
}

function parseBit(tok: string): number | null {
  const n = parseNum(tok);
  if (n == null || n > 7) return null;
  return n;
}

function parseK8(tok: string, symbols: Map<string, number>, labels: Map<string, number>): number | null {
  const lo = /^lo8\(([A-Za-z_]\w*)\)$/i.exec(tok);
  if (lo) {
    const name = lo[1].toLowerCase();
    const addr = symbols.get(name) ?? labels.get(name);
    return addr == null ? null : addr & 0xff;
  }
  const hi = /^hi8\(([A-Za-z_]\w*)\)$/i.exec(tok);
  if (hi) {
    const name = hi[1].toLowerCase();
    const addr = symbols.get(name) ?? labels.get(name);
    return addr == null ? null : (addr >> 8) & 0xff;
  }
  const n = parseNum(tok);
  if (n == null || n > 0xff) return null;
  return n;
}

function parseAddr(tok: string, symbols: Map<string, number>): number | null {
  const named = symbols.get(tok.toLowerCase());
  if (named != null) return named;
  const n = parseNum(tok);
  if (n == null || n > 0xffff) return null;
  return n;
}

function parsePtr(tok: string): { base: number; pre: boolean; post: boolean; disp: number } | string | null {
  const t = tok.replace(/\s+/g, '');
  const m = /^(-)?([XYZ])(\+\d+|\+)?$/i.exec(t);
  if (!m) return null;
  const base = PTR_BASE[m[2].toLowerCase()];
  const pre = Boolean(m[1]);
  const tail = m[3] ?? '';
  if (pre && tail) return '指针不能又减又加';
  if (tail.startsWith('+') && tail.length > 1) {
    const disp = Number(tail.slice(1));
    if (disp > 63) return '偏移只能是 0 到 63';
    if (base === 26) return 'X 指针不能加偏移，偏移只用 Y 或 Z';
    return { base, pre: false, post: false, disp };
  }
  return { base, pre, post: tail === '+', disp: 0 };
}

function wordReg(tok: string): number | null {
  const name = tok.toLowerCase();
  if (name === 'x' || name === 'xl') return 26;
  if (name === 'y' || name === 'yl') return 28;
  if (name === 'z' || name === 'zl') return 30;
  if (name === 'r24') return 24;
  const r = parseReg(tok);
  return r != null && WORD_REGS.has(r) ? r : null;
}

function evenReg(tok: string): number | null {
  const r = parseReg(tok);
  if (r == null || r % 2 !== 0) return null;
  return r;
}

function ptrName(base: number | undefined): string {
  if (base === 26) return 'X';
  if (base === 28) return 'Y';
  if (base === 30) return 'Z';
  return '指针';
}

function baseInst(row: Row, op = row.mnemonic): Inst {
  return { op, line: row.line, text: row.text };
}

export function encodeInst(
  row: Row,
  labels: Map<string, number>,
  symbols: Map<string, number>,
): Inst | string {
  const op = row.mnemonic;
  const a = row.args;
  const bad = (msg: string) => msg;

  if (ZERO_OPS.has(op)) {
    if (a.length) return bad(`${op.toUpperCase()} 后面不用写参数`);
    return baseInst(row);
  }

  if (FLAG_SET[op] != null || FLAG_CLR[op] != null) {
    if (a.length) return bad(`${op.toUpperCase()} 后面不用写参数`);
    return { ...baseInst(row), bit: FLAG_SET[op] ?? FLAG_CLR[op] };
  }

  if (op === 'bset' || op === 'bclr') {
    if (a.length !== 1) return bad(`${op.toUpperCase()} 后面跟一个 0 到 7 的位号`);
    const bit = parseBit(a[0]);
    if (bit == null) return bad('位号只能是 0 到 7');
    return { ...baseInst(row), bit };
  }

  if (op === 'des') {
    if (a.length !== 1) return bad('DES 后面跟轮数 0 到 15');
    const k = parseNum(a[0]);
    if (k == null || k > 15) return bad('DES 的轮数只能是 0 到 15');
    return { ...baseInst(row), k };
  }

  if (BRANCH_ONE.has(op)) {
    if (a.length !== 1) return bad(`${op.toUpperCase()} 后面跟一个标签`);
    const target = labels.get(a[0].toLowerCase());
    if (target == null) return bad(`找不到标签 ${a[0]}`);
    return { ...baseInst(row), target };
  }

  if (op === 'brbs' || op === 'brbc') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：位号, 标签`);
    const bit = parseBit(a[0]);
    const target = labels.get(a[1].toLowerCase());
    if (bit == null) return bad('位号只能是 0 到 7');
    if (target == null) return bad(`找不到标签 ${a[1]}`);
    return { ...baseInst(row), bit, target };
  }

  if (IMM_HI.has(op)) {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：寄存器, 常数`);
    const rd = parseReg(a[0]);
    const k = parseK8(a[1], symbols, labels);
    if (rd == null || k == null) return bad('寄存器或常数没看懂（常数 0–255，也可以用 lo8/hi8）');
    if (rd < 16) return bad(`${op.toUpperCase()} 只能用 R16 到 R31`);
    return { ...baseInst(row), rd, k };
  }

  if (op === 'adiw' || op === 'sbiw') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：寄存器对, 常数`);
    const rd = wordReg(a[0]);
    const k = parseNum(a[1]);
    if (rd == null) return bad('寄存器对只能是 R24、X、Y 或 Z');
    if (k == null || k > 63) return bad('这个常数只能是 0 到 63');
    return { ...baseInst(row), rd, k };
  }

  if (TWO_REG.has(op)) {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：Rd, Rr`);
    const rd = parseReg(a[0]);
    const rr = parseReg(a[1]);
    if (rd == null || rr == null) return bad('需要两个寄存器，比如 R16, R17');
    return { ...baseInst(row), rd, rr };
  }

  if (op === 'muls') {
    if (a.length !== 2) return bad('MULS 要写成：Rd, Rr');
    const rd = parseReg(a[0]);
    const rr = parseReg(a[1]);
    if (rd == null || rr == null || rd < 16 || rr < 16) return bad('MULS 的两个寄存器都要在 R16 到 R31');
    return { ...baseInst(row), rd, rr };
  }

  if (op === 'mulsu' || op === 'fmul' || op === 'fmuls' || op === 'fmulsu') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：Rd, Rr`);
    const rd = parseReg(a[0]);
    const rr = parseReg(a[1]);
    if (rd == null || rr == null || rd < 16 || rd > 23 || rr < 16 || rr > 23) {
      return bad(`${op.toUpperCase()} 的两个寄存器都要在 R16 到 R23`);
    }
    return { ...baseInst(row), rd, rr };
  }

  if (op === 'movw') {
    if (a.length !== 2) return bad('MOVW 要写成：Rd, Rr，而且都是偶数号');
    const rd = evenReg(a[0]);
    const rr = evenReg(a[1]);
    if (rd == null || rr == null) return bad('MOVW 只能用成对的偶数寄存器，比如 R16, R18');
    return { ...baseInst(row), rd, rr };
  }

  if (ONE_REG.has(op)) {
    if (a.length !== 1) return bad(`${op.toUpperCase()} 后面跟一个寄存器`);
    const rd = parseReg(a[0]);
    if (rd == null) return bad('需要一个寄存器');
    if (op === 'ser' && rd < 16) return bad('SER 只能用 R16 到 R31');
    return { ...baseInst(row), rd };
  }

  if (op === 'bst' || op === 'bld' || op === 'sbrc' || op === 'sbrs') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：寄存器, 位号`);
    const rd = parseReg(a[0]);
    const bit = parseBit(a[1]);
    if (rd == null || bit == null) return bad('需要寄存器和第 0 到 7 位');
    return { ...baseInst(row), rd, bit };
  }

  if (op === 'sbi' || op === 'cbi' || op === 'sbic' || op === 'sbis') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：端口, 位号`);
    const io = parseIo(a[0]);
    const bit = parseBit(a[1]);
    if (io == null || io > 31 || bit == null) return bad('端口只能是低 32 个 I/O，位号 0 到 7');
    return { ...baseInst(row), a: io, bit };
  }

  if (op === 'in') {
    if (a.length !== 2) return bad('IN 要写成：寄存器, 端口');
    const rd = parseReg(a[0]);
    const io = parseIo(a[1]);
    if (rd == null || io == null) return bad('寄存器或端口没看懂');
    return { ...baseInst(row), rd, a: io };
  }

  if (op === 'out') {
    if (a.length !== 2) return bad('OUT 要写成：端口, 寄存器');
    const io = parseIo(a[0]);
    const rr = parseReg(a[1]);
    if (io == null || rr == null) return bad('端口或寄存器没看懂');
    return { ...baseInst(row), a: io, rr };
  }

  if (op === 'lds') {
    if (a.length !== 2) return bad('LDS 要写成：寄存器, 地址');
    const rd = parseReg(a[0]);
    const addr = parseAddr(a[1], symbols);
    if (rd == null || addr == null) return bad('需要寄存器和数据地址（名字或数字都行）');
    return { ...baseInst(row), rd, a: addr };
  }

  if (op === 'sts') {
    if (a.length !== 2) return bad('STS 要写成：地址, 寄存器');
    const addr = parseAddr(a[0], symbols);
    const rr = parseReg(a[1]);
    if (addr == null || rr == null) return bad('需要数据地址和寄存器');
    return { ...baseInst(row), a: addr, rr };
  }

  if (op === 'ld' || op === 'ldd') {
    if (a.length !== 2) return bad('LD 要写成：寄存器, X/Y/Z');
    const rd = parseReg(a[0]);
    const ptr = parsePtr(a[1]);
    if (typeof ptr === 'string') return bad(ptr);
    if (rd == null || !ptr) return bad('需要寄存器和 X、Y 或 Z 指针');
    if (op === 'ldd' && ptr.base === 26) return bad('LDD 只能配 Y 或 Z 的偏移');
    return { ...baseInst(row, ptr.disp ? 'ldd' : 'ld'), rd, ptrBase: ptr.base, ptrPre: ptr.pre, ptrPost: ptr.post, disp: ptr.disp };
  }

  if (op === 'st' || op === 'std') {
    if (a.length !== 2) return bad('ST 要写成：X/Y/Z, 寄存器');
    const ptr = parsePtr(a[0]);
    const rr = parseReg(a[1]);
    if (typeof ptr === 'string') return bad(ptr);
    if (!ptr || rr == null) return bad('需要 X、Y 或 Z 指针，以及一个寄存器');
    if (op === 'std' && ptr.base === 26) return bad('STD 只能配 Y 或 Z 的偏移');
    return { ...baseInst(row, ptr.disp ? 'std' : 'st'), rr, ptrBase: ptr.base, ptrPre: ptr.pre, ptrPost: ptr.post, disp: ptr.disp };
  }

  if (op === 'lpm' || op === 'elpm') {
    if (!a.length) return { ...baseInst(row), rd: 0, ptrBase: 30 };
    if (a.length !== 2) return bad(`${op.toUpperCase()} 可以不写参数，或写成 Rd, Z / Rd, Z+`);
    const rd = parseReg(a[0]);
    const ptr = parsePtr(a[1]);
    if (typeof ptr === 'string') return bad(ptr);
    if (rd == null || !ptr || ptr.base !== 30 || ptr.pre || ptr.disp) return bad('程序存储器只能用 Z 或 Z+');
    return { ...baseInst(row), rd, ptrBase: 30, ptrPost: ptr.post };
  }

  if (op === 'spm' || op === 'espm') {
    if (!a.length) return { ...baseInst(row, op === 'espm' ? 'espm' : 'spm'), ptrBase: 30 };
    const ptr = parsePtr(a[0]);
    if (typeof ptr === 'string') return bad(ptr);
    if (a.length !== 1 || !ptr || ptr.base !== 30) return bad('SPM 可以不写参数，或写成 Z+');
    if (ptr.post) return { ...baseInst(row, 'espm'), ptrBase: 30, ptrPost: true };
    return { ...baseInst(row, 'spm'), ptrBase: 30 };
  }

  if (op === 'xch' || op === 'las' || op === 'lac' || op === 'lat') {
    if (a.length !== 2) return bad(`${op.toUpperCase()} 要写成：Z, 寄存器`);
    const leftZ = /^z$/i.test(a[0]);
    const rd = parseReg(leftZ ? a[1] : a[0]);
    const rightZ = /^z$/i.test(a[1]);
    if (rd == null || (!leftZ && !rightZ)) return bad('其中一个必须是 Z 指针');
    return { ...baseInst(row), rd, ptrBase: 30 };
  }

  return bad(`不认识的指令 ${op}`);
}

function ioName(a: number): string {
  const found = Object.entries(IO_NAMES).find(([, n]) => n === a);
  return found ? found[0].toUpperCase() : `端口 ${hex(a)}`;
}

function readIo(ctx: ExecCtx, a: number): number {
  if (a === 0x3f) return sregByte(ctx.state);
  if (a === 0x3d) return ctx.sp.v & 0xff;
  if (a === 0x3e) return (ctx.sp.v >> 8) & 0xff;
  return ctx.io[a] ?? 0;
}

function writeIo(ctx: ExecCtx, a: number, val: number): string | undefined {
  const v = val & 0xff;
  const prev = a === 0x05 ? ctx.io[0x05] : undefined;
  if (a === 0x3f) applySreg(ctx.state, v);
  else if (a === 0x3d) ctx.sp.v = (ctx.sp.v & 0xff00) | v;
  else if (a === 0x3e) ctx.sp.v = (ctx.sp.v & 0x00ff) | (v << 8);
  else {
    ctx.io[a] = v;
    if (a === 0x05) ctx.io[0x03] = v;
  }
  ctx.state.portb = ctx.io[0x05] ?? 0;
  ctx.state.ddrb = ctx.io[0x04] ?? 0;
  if (a === 0x05 && prev !== v) return `PORTB ${bits(prev ?? 0)} → ${bits(v)}`;
  return undefined;
}

function readData(ctx: ExecCtx, addr: number): number | null {
  if (addr < 0 || addr >= 0x900) return null;
  if (addr < 32) return ctx.state.regs[addr];
  if (addr < 0x60) return readIo(ctx, addr - 0x20);
  return ctx.sram[addr];
}

function writeData(ctx: ExecCtx, addr: number, val: number): string | null | undefined {
  if (addr < 0 || addr >= 0x900) return null;
  if (addr < 32) {
    ctx.state.regs[addr] = val & 0xff;
    return undefined;
  }
  if (addr < 0x60) return writeIo(ctx, addr - 0x20, val);
  ctx.sram[addr] = val & 0xff;
  return undefined;
}

function ptrWord(regs: number[], base: number): number {
  return (regs[base] | (regs[base + 1] << 8)) & 0xffff;
}

function setPtrWord(regs: number[], base: number, value: number) {
  regs[base] = value & 0xff;
  regs[base + 1] = (value >> 8) & 0xff;
}

function pointerAddr(ctx: ExecCtx): number | null {
  const inst = ctx.inst;
  if (inst.ptrBase == null) return null;
  let addr = ptrWord(ctx.state.regs, inst.ptrBase);
  if (inst.ptrPre) {
    addr = (addr - 1) & 0xffff;
    setPtrWord(ctx.state.regs, inst.ptrBase, addr);
  }
  return (addr + (inst.disp ?? 0)) & 0xffff;
}

function pointerAfter(ctx: ExecCtx) {
  const inst = ctx.inst;
  if (!inst.ptrPost || inst.ptrBase == null) return;
  const step = inst.op === 'espm' ? 2 : 1;
  setPtrWord(ctx.state.regs, inst.ptrBase, (ptrWord(ctx.state.regs, inst.ptrBase) + step) & 0xffff);
}

function pushByte(ctx: ExecCtx, val: number) {
  writeData(ctx, ctx.sp.v, val);
  ctx.sp.v = (ctx.sp.v - 1) & 0xffff;
}

function popByte(ctx: ExecCtx): number {
  ctx.sp.v = (ctx.sp.v + 1) & 0xffff;
  return readData(ctx, ctx.sp.v) ?? 0;
}

function callTo(ctx: ExecCtx, target: number, why: string): ExecOutcome {
  pushByte(ctx, (ctx.next >> 8) & 0xff);
  pushByte(ctx, ctx.next & 0xff);
  return { pc: target, event: 'branch', category: 'ctrl', explanation: why };
}

function retFrom(ctx: ExecCtx, irq: boolean): ExecOutcome {
  if (ctx.sp.v >= RAMEND) {
    return {
      pc: ctx.pc,
      stop: true,
      event: 'halt',
      category: 'ctrl',
      explanation: irq ? '中断处理结束，但栈是空的，程序就停在这里' : '函数返回。没有谁在等它，程序到此结束',
    };
  }
  const lo = popByte(ctx);
  const hi = popByte(ctx);
  if (irq) ctx.state.i = true;
  const dest = (hi << 8) | lo;
  return {
    pc: dest,
    event: 'branch',
    category: 'ctrl',
    explanation: irq ? '中断处理完了，跳回被打断的地方，并重新打开总中断' : '函数做完了，跳回刚才记住的地方继续',
  };
}

function jumpWord(ctx: ExecCtx, extended: boolean, call: boolean): ExecOutcome {
  const z = ptrWord(ctx.state.regs, 30);
  const eind = readIo(ctx, 0x3c);
  if (extended && eind !== 0) {
    return {
      pc: ctx.pc,
      stop: true,
      event: 'exception',
      category: 'ctrl',
      explanation: 'Z 前面还拼了一段扩展地址，这段程序装不下，所以停住',
    };
  }
  if (z < 0 || z >= ctx.programLength) {
    return {
      pc: z,
      stop: true,
      event: 'exception',
      category: 'ctrl',
      explanation: `Z 里的 ${z} 不是这段程序里的指令编号，跳不过去`,
    };
  }
  if (call) return callTo(ctx, z, `先记住回来的位置，再按 Z 里的编号 ${z} 去调用`);
  return { pc: z, event: 'branch', category: 'ctrl', explanation: `按 Z 里记下的编号 ${z}，直接跳过去` };
}

function branchTaken(op: string, state: AvrSnapshot, bit = 0): boolean {
  switch (op) {
    case 'breq': return state.z;
    case 'brne': return !state.z;
    case 'brcs':
    case 'brlo': return state.c;
    case 'brcc':
    case 'brsh': return !state.c;
    case 'brmi': return state.n;
    case 'brpl': return !state.n;
    case 'brvs': return state.v;
    case 'brvc': return !state.v;
    case 'brlt': return state.s;
    case 'brge': return !state.s;
    case 'brhs': return state.h;
    case 'brhc': return !state.h;
    case 'brts': return state.t;
    case 'brtc': return !state.t;
    case 'brie': return state.i;
    case 'brid': return !state.i;
    case 'brbs': return flagBit(state, bit);
    case 'brbc': return !flagBit(state, bit);
    default: return false;
  }
}

function branchWords(op: string, take: boolean): string {
  const table: Record<string, [string, string]> = {
    breq: ['两个数相等，所以跳过去', '两个数不相等，所以接着往下走'],
    brne: ['两个数不相等，所以跳过去', '两个数相等，所以接着往下走'],
    brcs: ['有进位，所以跳过去', '没有进位，所以不跳'],
    brlo: ['前面的数更小，所以跳过去', '前面的数并不更小，所以不跳'],
    brcc: ['没有进位，所以跳过去', '有进位，所以不跳'],
    brsh: ['前面的数更大，或者一样大，所以跳过去', '前面的数更小，所以不跳'],
    brmi: ['结果是负数，所以跳过去', '结果不是负数，所以不跳'],
    brpl: ['结果是正数或零，所以跳过去', '结果是负数，所以不跳'],
    brvs: ['运算溢出了，所以跳过去', '没有溢出，所以不跳'],
    brvc: ['没有溢出，所以跳过去', '运算溢出了，所以不跳'],
    brlt: ['按有符号数来比，前面的更小，所以跳过去', '按有符号数来比，前面的并不更小，所以不跳'],
    brge: ['按有符号数来比，前面的更大或相等，所以跳过去', '按有符号数来比，前面的更小，所以不跳'],
    brhs: ['低四位有进位，所以跳过去', '低四位没有进位，所以不跳'],
    brhc: ['低四位没有进位，所以跳过去', '低四位有进位，所以不跳'],
    brts: ['T 位是 1，所以跳过去', 'T 位是 0，所以不跳'],
    brtc: ['T 位是 0，所以跳过去', 'T 位是 1，所以不跳'],
    brie: ['总中断开着，所以跳过去', '总中断关着，所以不跳'],
    brid: ['总中断关着，所以跳过去', '总中断开着，所以不跳'],
  };
  const pair = table[op];
  if (!pair) return take ? '条件成立，跳过去' : '条件不成立，接着往下走';
  return take ? pair[0] : pair[1];
}

function flagBit(s: AvrSnapshot, bit: number): boolean {
  return [s.c, s.z, s.n, s.v, s.s, s.h, s.t, s.i][bit] ?? false;
}

function setFlagBit(s: AvrSnapshot, bit: number, on: boolean) {
  if (bit === 0) s.c = on;
  else if (bit === 1) s.z = on;
  else if (bit === 2) s.n = on;
  else if (bit === 3) s.v = on;
  else if (bit === 4) s.s = on;
  else if (bit === 5) s.h = on;
  else if (bit === 6) s.t = on;
  else s.i = on;
}

function go(ctx: ExecCtx, event: AvrEvent, category: AvrCategory, explanation: string, pc = ctx.next, stop = false, log?: string): ExecOutcome {
  return { pc, stop, event, category, explanation, log };
}

function badAddr(ctx: ExecCtx, addr: number): ExecOutcome {
  return go(ctx, 'exception', 'load', `地址 ${hex16(addr)} 超出了这块内存，读不了也写不了`, ctx.pc, true);
}

function putMul(ctx: ExecCtx, prod: number, carryFrom: number): number {
  const p = prod & 0xffff;
  ctx.state.regs[0] = p & 0xff;
  ctx.state.regs[1] = (p >> 8) & 0xff;
  ctx.state.c = (carryFrom & 0x8000) !== 0;
  ctx.state.z = p === 0;
  return p;
}

function s8(n: number): number {
  const v = n & 0xff;
  return v & 0x80 ? v - 256 : v;
}

export function executeInst(ctx: ExecCtx): ExecOutcome {
  const { inst, state } = ctx;
  const op = inst.op;
  const rd = inst.rd ?? 0;
  const rr = inst.rr ?? 0;
  const regs = state.regs;

  if (op === 'nop') return go(ctx, 'execute', 'misc', '什么都不做，直接看下一条');
  if (op === 'sleep') return go(ctx, 'execute', 'misc', '让芯片睡觉省电。这里没有真的睡，只是空过一拍');
  if (op === 'wdr') return go(ctx, 'execute', 'misc', '喂狗，把看门狗计时清零。这里没有真的看门狗，只记下这一下');
  if (op === 'break') return go(ctx, 'halt', 'misc', '调试器在这里把程序停住', ctx.pc, true);
  if (op === 'des') {
    const dir = state.h ? '解密' : '加密';
    return go(ctx, 'execute', 'misc', `这是芯片上的 DES ${dir}第 ${inst.k} 轮。教学模拟不跑真正的加密，寄存器保持原样`);
  }

  if (op === 'ret') return retFrom(ctx, false);
  if (op === 'reti') return retFrom(ctx, true);
  if (op === 'ijmp') return jumpWord(ctx, false, false);
  if (op === 'eijmp') return jumpWord(ctx, true, false);
  if (op === 'icall') return jumpWord(ctx, false, true);
  if (op === 'eicall') return jumpWord(ctx, true, true);

  if (op === 'rjmp' || op === 'jmp') {
    return go(ctx, 'branch', 'ctrl', `无条件跳到第 ${inst.target} 条`, inst.target);
  }
  if (op === 'rcall' || op === 'call') {
    return callTo(ctx, inst.target ?? ctx.next, `先记住回来的位置，再跳去第 ${inst.target} 条开始的函数`);
  }

  if (BRANCH_ONE.has(op) && op !== 'rjmp' && op !== 'jmp' && op !== 'rcall' && op !== 'call') {
    const take = branchTaken(op, state);
    return go(ctx, 'branch', 'ctrl', branchWords(op, take), take ? inst.target : ctx.next);
  }
  if (op === 'brbs' || op === 'brbc') {
    const take = branchTaken(op, state, inst.bit ?? 0);
    const name = FLAG_PLAIN[inst.bit ?? 0] ?? '标志';
    const explain = take
      ? `${name}${op === 'brbs' ? '是 1' : '是 0'}，所以跳过去`
      : `${name}不满足，所以不跳`;
    return go(ctx, 'branch', 'ctrl', explain, take ? inst.target : ctx.next);
  }

  if (FLAG_SET[op] != null || op === 'bset') {
    const bit = inst.bit ?? 0;
    setFlagBit(state, bit, true);
    return go(ctx, 'execute', 'alu', `把${FLAG_PLAIN[bit]}设成 1`);
  }
  if (FLAG_CLR[op] != null || op === 'bclr') {
    const bit = inst.bit ?? 0;
    setFlagBit(state, bit, false);
    return go(ctx, 'execute', 'alu', `把${FLAG_PLAIN[bit]}清成 0`);
  }

  if (op === 'ldi' || op === 'ser') {
    const k = op === 'ser' ? 0xff : (inst.k ?? 0);
    regs[rd] = k;
    return go(ctx, 'execute', 'load', op === 'ser'
      ? `把 R${rd} 的 8 位全部设成 1，也就是 ${hex(0xff)}`
      : `把数字 ${hex(k)} 直接放进 R${rd}`);
  }
  if (op === 'mov') {
    regs[rd] = regs[rr];
    return go(ctx, 'execute', 'load', `把 R${rr} 里的 ${hex(regs[rd])} 抄到 R${rd}`);
  }
  if (op === 'movw') {
    regs[rd] = regs[rr];
    regs[rd + 1] = regs[rr + 1];
    return go(ctx, 'execute', 'load', `一次抄一对：R${rd + 1}:R${rd} 变成和 R${rr + 1}:R${rr} 一样`);
  }
  if (op === 'clr') {
    regs[rd] = 0;
    finishLogic(state, 0);
    state.z = true;
    return go(ctx, 'execute', 'alu', `把 R${rd} 清成 0`);
  }
  if (op === 'tst') {
    finishLogic(state, regs[rd]);
    return go(ctx, 'execute', 'alu', regs[rd] === 0
      ? `看了看 R${rd}，里面是 0`
      : `看了看 R${rd}，里面是 ${hex(regs[rd])}，不是 0`);
  }

  if (op === 'add' || op === 'adc' || op === 'lsl' || op === 'rol') {
    const a = regs[rd];
    const useCarry = op === 'adc' || op === 'rol';
    const b = op === 'lsl' || op === 'rol' ? a : regs[rr];
    const v = writeAdd(state, a, b, useCarry && state.c);
    regs[rd] = v;
    if (op === 'lsl') return go(ctx, 'execute', 'alu', `把 R${rd} 里的 ${hex(a)} 整体左移一位，空出的右边补 0，得到 ${hex(v)}`);
    if (op === 'rol') return go(ctx, 'execute', 'alu', `把 R${rd} 连同进位一起左转一格，${hex(a)} 变成 ${hex(v)}`);
    if (op === 'adc') return go(ctx, 'execute', 'alu', `R${rd} 的 ${hex(a)} 加上 R${rr} 的 ${hex(b)}，再带上进位，得到 ${hex(v)}`);
    return go(ctx, 'execute', 'alu', `把 R${rd} 的 ${hex(a)} 和 R${rr} 的 ${hex(b)} 加在一起，得到 ${hex(v)}，放回 R${rd}`);
  }

  if (op === 'sub' || op === 'sbc' || op === 'subi' || op === 'sbci' || op === 'cp' || op === 'cpc' || op === 'cpi' || op === 'neg') {
    const a = op === 'neg' ? 0 : regs[rd];
    const b = op === 'subi' || op === 'sbci' || op === 'cpi' ? (inst.k ?? 0) : op === 'neg' ? regs[rd] : regs[rr];
    const cin = op === 'sbc' || op === 'sbci' || op === 'cpc' ? state.c : false;
    const keepZ = op === 'sbc' || op === 'sbci' || op === 'cpc';
    const v = writeSub(state, a, b, cin, keepZ);
    const compare = op === 'cp' || op === 'cpc' || op === 'cpi';
    if (!compare) regs[rd] = v;
    if (op === 'neg') return go(ctx, 'execute', 'alu', `把 R${rd} 变成相反数，${hex(b)} 变成 ${hex(v)}`);
    if (op === 'cpi') return go(ctx, 'execute', 'alu', `拿 R${rd} 里的 ${hex(a)} 和常数 ${hex(b)} 比一比，寄存器不变`);
    if (op === 'cp') return go(ctx, 'execute', 'alu', `拿 R${rd} 里的 ${hex(a)} 和 R${rr} 里的 ${hex(b)} 比一比，寄存器不变`);
    if (op === 'cpc') return go(ctx, 'execute', 'alu', `接着比下一字节：R${rd} 减去 R${rr}，还要减去刚才的借位，寄存器不变`);
    if (op === 'subi') return go(ctx, 'execute', 'alu', `R${rd} 的 ${hex(a)} 减去常数 ${hex(b)}，得到 ${hex(v)}`);
    if (op === 'sbci') return go(ctx, 'execute', 'alu', `R${rd} 的 ${hex(a)} 减去常数 ${hex(b)}，再减去借位，得到 ${hex(v)}`);
    if (op === 'sbc') return go(ctx, 'execute', 'alu', `R${rd} 的 ${hex(a)} 减去 R${rr} 的 ${hex(b)}，再减去借位，得到 ${hex(v)}`);
    return go(ctx, 'execute', 'alu', `R${rd} 的 ${hex(a)} 减去 R${rr} 的 ${hex(b)}，得到 ${hex(v)}`);
  }

  if (op === 'and' || op === 'andi' || op === 'or' || op === 'ori' || op === 'eor' || op === 'sbr' || op === 'cbr' || op === 'com') {
    const a = regs[rd];
    let v = a;
    if (op === 'and') v = a & regs[rr];
    else if (op === 'andi') v = a & (inst.k ?? 0);
    else if (op === 'or' ) v = a | regs[rr];
    else if (op === 'ori' || op === 'sbr') v = a | (inst.k ?? 0);
    else if (op === 'cbr') v = a & (~(inst.k ?? 0) & 0xff);
    else if (op === 'eor') v = a ^ regs[rr];
    else v = (~a) & 0xff;
    regs[rd] = v;
    finishLogic(state, v);
    if (op === 'com') state.c = true;
    if (op === 'com') return go(ctx, 'execute', 'alu', `把 R${rd} 的每一位取反，${hex(a)} 变成 ${hex(v)}`);
    if (op === 'and' || op === 'andi') return go(ctx, 'execute', 'alu', `把 R${rd} 的 ${hex(a)} 和 ${op === 'and' ? `R${rr} 的 ${hex(regs[rr])}` : `常数 ${hex(inst.k ?? 0)}`} 按位与，得到 ${hex(v)}`);
    if (op === 'cbr') return go(ctx, 'execute', 'alu', `按掩码 ${hex(inst.k ?? 0)} 把 R${rd} 里对应的位清掉，得到 ${hex(v)}`);
    if (op === 'eor') return go(ctx, 'execute', 'alu', `把 R${rd} 的 ${hex(a)} 和 R${rr} 的 ${hex(regs[rr])} 按位异或，得到 ${hex(v)}`);
    return go(ctx, 'execute', 'alu', `把 R${rd} 的 ${hex(a)} 和 ${op === 'or' ? `R${rr} 的 ${hex(regs[rr])}` : `常数 ${hex(inst.k ?? 0)}`} 按位或，得到 ${hex(v)}`);
  }

  if (op === 'inc' || op === 'dec') {
    const a = regs[rd];
    const v = op === 'inc' ? (a + 1) & 0xff : (a - 1) & 0xff;
    finishNz(state, v, op === 'inc' ? a === 0x7f : a === 0x80);
    regs[rd] = v;
    return go(ctx, 'execute', 'alu', op === 'inc'
      ? `R${rd} 加 1，${hex(a)} 变成 ${hex(v)}`
      : `R${rd} 减 1，${hex(a)} 变成 ${hex(v)}`);
  }

  if (op === 'adiw' || op === 'sbiw') {
    const word = ptrWord(regs, rd);
    const k = inst.k ?? 0;
    const sum = op === 'adiw' ? word + k : word - k;
    const res = sum & 0xffff;
    const hi = regs[rd + 1];
    setPtrWord(regs, rd, res);
    state.c = op === 'adiw' ? sum > 0xffff : sum < 0;
    state.z = res === 0;
    state.n = (res & 0x8000) !== 0;
    state.v = op === 'adiw'
      ? (hi & 0x80) === 0 && (res & 0x8000) !== 0
      : (hi & 0x80) !== 0 && (res & 0x8000) === 0;
    state.s = state.n !== state.v;
    const name = rd === 24 ? 'R25:R24' : ptrName(rd);
    return go(ctx, 'execute', 'alu', op === 'adiw'
      ? `把 ${name} 这一对寄存器 ${hex16(word)} 加上 ${k}，得到 ${hex16(res)}`
      : `把 ${name} 这一对寄存器 ${hex16(word)} 减去 ${k}，得到 ${hex16(res)}`);
  }

  if (op === 'lsr' || op === 'asr' || op === 'ror' || op === 'swap') {
    const a = regs[rd];
    let v = a;
    if (op === 'lsr') {
      state.c = (a & 1) !== 0;
      v = a >> 1;
      finishNz(state, v, state.c);
    } else if (op === 'asr') {
      state.c = (a & 1) !== 0;
      v = (a >> 1) | (a & 0x80);
      finishNz(state, v, ((v & 0x80) !== 0) !== state.c);
    } else if (op === 'ror') {
      const oldC = state.c;
      state.c = (a & 1) !== 0;
      v = (a >> 1) | (oldC ? 0x80 : 0);
      finishNz(state, v, ((v & 0x80) !== 0) !== state.c);
    } else {
      v = ((a & 0x0f) << 4) | ((a >> 4) & 0x0f);
      regs[rd] = v;
      return go(ctx, 'execute', 'alu', `把 R${rd} 的高 4 位和低 4 位对调，${hex(a)} 变成 ${hex(v)}`);
    }
    regs[rd] = v & 0xff;
    if (op === 'lsr') return go(ctx, 'execute', 'alu', `把 R${rd} 整体右移一位，左边补 0，${hex(a)} 变成 ${hex(v)}`);
    if (op === 'asr') return go(ctx, 'execute', 'alu', `把 R${rd} 按有符号数右移一位，符号位保留，${hex(a)} 变成 ${hex(v)}`);
    return go(ctx, 'execute', 'alu', `把 R${rd} 连同进位一起右转一格，${hex(a)} 变成 ${hex(v)}`);
  }

  if (op === 'mul' || op === 'muls' || op === 'mulsu' || op === 'fmul' || op === 'fmuls' || op === 'fmulsu') {
    const a = regs[rd];
    const b = regs[rr];
    let raw = 0;
    if (op === 'mul' || op === 'fmul') raw = a * b;
    else if (op === 'muls' || op === 'fmuls') raw = s8(a) * s8(b);
    else raw = s8(a) * b;
    const prod16 = raw & 0xffff;
    const fractional = op.startsWith('f');
    const stored = fractional ? (prod16 << 1) & 0xffff : prod16;
    putMul(ctx, stored, fractional ? prod16 : stored);
    const shown = hex16(stored);
    if (fractional) return go(ctx, 'execute', 'alu', `把 R${rd} 和 R${rr} 做小数乘法，结果左移一位后放进 R1:R0，得到 ${shown}`);
    return go(ctx, 'execute', 'alu', `把 R${rd} 的 ${hex(a)} 和 R${rr} 的 ${hex(b)} 相乘，16 位结果 ${shown} 放进 R1:R0`);
  }

  if (op === 'cpse') {
    const same = regs[rd] === regs[rr];
    return go(ctx, 'branch', 'ctrl', same
      ? `R${rd} 和 R${rr} 都是 ${hex(regs[rd])}，所以下一条先跳过`
      : `R${rd} 是 ${hex(regs[rd])}，R${rr} 是 ${hex(regs[rr])}，不一样，下一条照常执行`, same ? ctx.next + 1 : ctx.next);
  }
  if (op === 'sbrc' || op === 'sbrs') {
    const on = ((regs[rd] >> (inst.bit ?? 0)) & 1) === 1;
    const skip = op === 'sbrs' ? on : !on;
    return go(ctx, 'branch', 'ctrl', skip
      ? `R${rd} 的第 ${inst.bit} 位是 ${on ? 1 : 0}，所以下一条先跳过`
      : `R${rd} 的第 ${inst.bit} 位是 ${on ? 1 : 0}，下一条照常执行`, skip ? ctx.next + 1 : ctx.next);
  }
  if (op === 'sbic' || op === 'sbis') {
    const on = ((readIo(ctx, inst.a ?? 0) >> (inst.bit ?? 0)) & 1) === 1;
    const skip = op === 'sbis' ? on : !on;
    return go(ctx, 'branch', 'io', skip
      ? `${ioName(inst.a ?? 0)} 的第 ${inst.bit} 位是 ${on ? 1 : 0}，所以下一条先跳过`
      : `${ioName(inst.a ?? 0)} 的第 ${inst.bit} 位是 ${on ? 1 : 0}，下一条照常执行`, skip ? ctx.next + 1 : ctx.next);
  }

  if (op === 'bst') {
    state.t = ((regs[rd] >> (inst.bit ?? 0)) & 1) === 1;
    return go(ctx, 'execute', 'alu', `把 R${rd} 的第 ${inst.bit} 位抄到 T 位，现在 T 是 ${state.t ? 1 : 0}`);
  }
  if (op === 'bld') {
    const bit = inst.bit ?? 0;
    const mask = 1 << bit;
    regs[rd] = state.t ? (regs[rd] | mask) : (regs[rd] & ~mask);
    return go(ctx, 'execute', 'alu', `把 T 位的 ${state.t ? 1 : 0} 写进 R${rd} 的第 ${bit} 位`);
  }

  if (op === 'in') {
    const v = readIo(ctx, inst.a ?? 0);
    regs[rd] = v;
    return go(ctx, 'io', 'io', `从 ${ioName(inst.a ?? 0)} 读出 ${hex(v)}，放进 R${rd}`);
  }
  if (op === 'out') {
    const log = writeIo(ctx, inst.a ?? 0, regs[rr]);
    return go(ctx, 'io', 'io', `把 R${rr} 里的 ${hex(regs[rr])} 送到 ${ioName(inst.a ?? 0)}`, ctx.next, false, log);
  }
  if (op === 'sbi' || op === 'cbi') {
    const cur = readIo(ctx, inst.a ?? 0);
    const mask = 1 << (inst.bit ?? 0);
    const log = writeIo(ctx, inst.a ?? 0, op === 'sbi' ? (cur | mask) : (cur & ~mask));
    return go(ctx, 'io', 'io', op === 'sbi'
      ? `把 ${ioName(inst.a ?? 0)} 的第 ${inst.bit} 位置成 1`
      : `把 ${ioName(inst.a ?? 0)} 的第 ${inst.bit} 位清成 0`, ctx.next, false, log);
  }

  if (op === 'push') {
    pushByte(ctx, regs[rd]);
    return go(ctx, 'execute', 'load', `把 R${rd} 里的 ${hex(regs[rd])} 压进栈，先存着`);
  }
  if (op === 'pop') {
    if (ctx.sp.v >= RAMEND) return go(ctx, 'exception', 'load', '栈是空的，没有数可以弹出来', ctx.pc, true);
    const v = popByte(ctx);
    regs[rd] = v;
    return go(ctx, 'execute', 'load', `从栈顶取出 ${hex(v)}，放进 R${rd}`);
  }

  if (op === 'lds' || op === 'sts') {
    const addr = inst.a ?? 0;
    if (op === 'lds') {
      const v = readData(ctx, addr);
      if (v == null) return badAddr(ctx, addr);
      regs[rd] = v;
      return go(ctx, 'execute', 'load', `从内存 ${hex16(addr)} 读出 ${hex(v)}，放进 R${rd}`);
    }
    const log = writeData(ctx, addr, regs[rr]);
    if (log === null) return badAddr(ctx, addr);
    return go(ctx, 'execute', 'load', `把 R${rr} 里的 ${hex(regs[rr])} 写进内存 ${hex16(addr)}`, ctx.next, false, log);
  }

  if (op === 'ld' || op === 'ldd' || op === 'st' || op === 'std') {
    const addr = pointerAddr(ctx);
    if (addr == null) return go(ctx, 'exception', 'load', '没有指针地址', ctx.pc, true);
    const name = ptrName(inst.ptrBase);
    const how = inst.ptrPre ? `先把 ${name} 减 1，再` : inst.ptrPost ? '' : '';
    const after = inst.ptrPost ? `，然后 ${name} 加 1` : inst.disp ? `（在 ${name} 基础上再偏移 ${inst.disp}）` : '';
    if (op === 'ld' || op === 'ldd') {
      const v = readData(ctx, addr);
      if (v == null) return badAddr(ctx, addr);
      regs[rd] = v;
      pointerAfter(ctx);
      return go(ctx, 'execute', 'load', `${how}按 ${name} 指向的 ${hex16(addr)} 读出 ${hex(v)}，放进 R${rd}${after}`);
    }
    const log = writeData(ctx, addr, regs[rr]);
    if (log === null) return badAddr(ctx, addr);
    pointerAfter(ctx);
    return go(ctx, 'execute', 'load', `${how}把 R${rr} 里的 ${hex(regs[rr])} 写到 ${name} 指向的 ${hex16(addr)}${after}`, ctx.next, false, log);
  }

  if (op === 'lpm' || op === 'elpm') {
    const z = ptrWord(regs, 30);
    const addr = op === 'elpm' ? ((readIo(ctx, 0x3b) << 16) | z) : z;
    const v = addr >= 0 && addr < ctx.flash.length ? ctx.flash[addr] : 0;
    regs[rd] = v;
    pointerAfter(ctx);
    const bumped = inst.ptrPost ? '，Z 随后加 1' : '';
    return go(ctx, 'execute', 'load', `从程序存储器 ${hex16(addr)} 读出 ${hex(v)}，放进 R${rd}${bumped}`);
  }

  if (op === 'spm' || op === 'espm') {
    const z = ptrWord(regs, 30) & 0xfffe;
    if (z + 1 < ctx.flash.length) {
      ctx.flash[z] = regs[0];
      ctx.flash[z + 1] = regs[1];
    }
    pointerAfter(ctx);
    const bumped = op === 'espm' ? '，然后 Z 加 2' : '';
    return go(ctx, 'execute', 'load', `把 R1:R0 里的一个字写进程序存储器 ${hex16(z)}${bumped}`);
  }

  if (op === 'xch' || op === 'las' || op === 'lac' || op === 'lat') {
    const addr = ptrWord(regs, 30);
    const old = readData(ctx, addr);
    if (old == null) return badAddr(ctx, addr);
    const cur = regs[rd];
    let mem = cur;
    if (op === 'las') mem = old | cur;
    else if (op === 'lac') mem = old & (~cur & 0xff);
    else if (op === 'lat') mem = old ^ cur;
    writeData(ctx, addr, mem);
    regs[rd] = old;
    if (op === 'xch') return go(ctx, 'execute', 'load', `把 R${rd} 和地址 ${hex16(addr)} 里的数对调，寄存器拿到 ${hex(old)}`);
    if (op === 'las') return go(ctx, 'execute', 'load', `先把地址 ${hex16(addr)} 的旧值 ${hex(old)} 放进 R${rd}，再把内存按位或成 ${hex(mem)}`);
    if (op === 'lac') return go(ctx, 'execute', 'load', `先把地址 ${hex16(addr)} 的旧值 ${hex(old)} 放进 R${rd}，再按 R${rd} 原来的位把内存清一清`);
    return go(ctx, 'execute', 'load', `先把地址 ${hex16(addr)} 的旧值 ${hex(old)} 放进 R${rd}，再把内存按位翻转成 ${hex(mem)}`);
  }

  return go(ctx, 'exception', 'misc', `还不会执行 ${op}`, ctx.pc, true);
}
