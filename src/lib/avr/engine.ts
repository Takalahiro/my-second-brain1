/** AVR 汇编教学模拟：完整指令集，按效果逐步执行（非周期精确）。 */

import { AVR_MNEMONIC_SET, encodeInst, executeInst, type Inst } from './isa';

export type AvrEvent = 'execute' | 'branch' | 'io' | 'halt' | 'exception';

export type AvrCategory = 'alu' | 'load' | 'ctrl' | 'io' | 'misc';

export type AvrSnapshot = {
  regs: number[];
  portb: number;
  ddrb: number;
  /** SREG：I T H S V N Z C */
  i: boolean;
  t: boolean;
  h: boolean;
  s: boolean;
  v: boolean;
  n: boolean;
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
  disp?: number;
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

const DATA_BASE = 0x100;
const MAX_STEPS = 256;
const REPEAT_FOLD = 40;

function emptySnap(): AvrSnapshot {
  return {
    regs: Array(32).fill(0),
    portb: 0,
    ddrb: 0,
    i: false,
    t: false,
    h: false,
    s: false,
    v: false,
    n: false,
    z: false,
    c: false,
    data: [],
  };
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

function parseByte(tok: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(tok)) {
    const n = Number(tok);
    return n <= 0xff ? n : null;
  }
  if (/^\$[0-9a-f]+$/i.test(tok)) {
    const n = parseInt(tok.slice(1), 16);
    return n <= 0xff ? n : null;
  }
  if (/^\d+$/.test(tok)) {
    const n = Number(tok);
    return n <= 0xff ? n : null;
  }
  return null;
}

function parseWord(tok: string): number | null {
  if (/^0x[0-9a-f]+$/i.test(tok)) {
    const n = Number(tok);
    return n <= 0xffff ? n : null;
  }
  if (/^\$[0-9a-f]+$/i.test(tok)) {
    const n = parseInt(tok.slice(1), 16);
    return n <= 0xffff ? n : null;
  }
  if (/^\d+$/.test(tok)) {
    const n = Number(tok);
    return n <= 0xffff ? n : null;
  }
  return null;
}

function splitOps(rest: string): string[] {
  return rest.split(',').map((s) => s.trim()).filter(Boolean);
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
      const byteDir = /^(?:([A-Za-z_]\w*):)?\s*\.(?:byte|db)\s+(.+)$/i.exec(text);
      if (byteDir) {
        const parts = byteDir[2].split(',').map((s) => s.trim()).filter(Boolean);
        const bytes: number[] = [];
        for (const part of parts) {
          const n = parseByte(part);
          if (n == null) return failAll(`L${lineNo}: .byte 需要 0–255 的数`);
          bytes.push(n);
        }
        if (!bytes.length) return failAll(`L${lineNo}: .byte 缺少数值`);
        const err = place(byteDir[1]?.toLowerCase() ?? null, bytes, lineNo);
        if (err) return failAll(err);
        continue;
      }
      const wordDir = /^(?:([A-Za-z_]\w*):)?\s*\.dw\s+(.+)$/i.exec(text);
      if (wordDir) {
        const parts = wordDir[2].split(',').map((s) => s.trim()).filter(Boolean);
        const bytes: number[] = [];
        for (const part of parts) {
          const n = parseWord(part);
          if (n == null) return failAll(`L${lineNo}: .dw 需要 0–65535 的数`);
          bytes.push(n & 0xff, (n >> 8) & 0xff);
        }
        if (!bytes.length) return failAll(`L${lineNo}: .dw 缺少数值`);
        const err = place(wordDir[1]?.toLowerCase() ?? null, bytes, lineNo);
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
    if (!AVR_MNEMONIC_SET.has(mnemonic)) {
      return failAll(`L${lineNo}: 不认识的指令 ${parts[0]}`);
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
    const encoded = encodeInst(row, labels, dataSymbols);
    if (typeof encoded === 'string') return failAll(`L${row.line}: ${encoded}`);
    program.push(encoded);
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
  return {
    regs: s.regs.slice(),
    portb: s.portb,
    ddrb: s.ddrb,
    i: s.i,
    t: s.t,
    h: s.h,
    s: s.s,
    v: s.v,
    n: s.n,
    z: s.z,
    c: s.c,
    data: data.slice(),
  };
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
    const ioOp = inst.op === 'in' || inst.op === 'out' || inst.op === 'sbi' || inst.op === 'cbi' || inst.op === 'sbic' || inst.op === 'sbis';
    return {
      op: inst.op,
      rd: inst.rd,
      rr: inst.rr,
      k: inst.k,
      io: ioOp ? inst.a : undefined,
      ptr,
      post: inst.ptrPost,
      pre: inst.ptrPre,
      disp: inst.disp,
    };
  }

  const flash = new Uint8Array(0x10000);
  const sp = { v: 0x08ff };
  let runError: string | null = null;

  while (!stop && steps.length < MAX_STEPS) {
    if (pc < 0 || pc >= program.length) {
      push(null, 'halt', 'misc', pc >= program.length ? '程序走到头了' : '程序计数器跑出这段代码了');
      break;
    }

    const seen = (hits.get(pc) ?? 0) + 1;
    hits.set(pc, seen);
    if (seen >= REPEAT_FOLD) {
      const inst = program[pc];
      push(inst, 'halt', 'ctrl', '这条指令已经重复太多次，循环在这里收起来，免得一直转下去', seen);
      break;
    }

    const inst = program[pc];
    const next = pc + 1;
    const outcome = executeInst({
      inst,
      state,
      sram,
      flash,
      io,
      pc,
      next,
      programLength: program.length,
      sp,
    });
    if (outcome.log) logs.push(outcome.log);
    push(inst, outcome.event, outcome.category, outcome.explanation);
    pc = outcome.pc;
    if (outcome.event === 'exception') {
      runError = outcome.explanation;
      stop = true;
    } else if (outcome.stop) {
      stop = true;
    }
  }

  if (!stop && steps.length >= MAX_STEPS && steps[steps.length - 1]?.event !== 'halt') {
    push(program[Math.min(pc, program.length - 1)] ?? null, 'halt', 'misc', '步数太多，这次追踪先停在这里');
  }

  const sol = symbols.sol;
  if (sol != null) {
    logs.push(`sol = "${readCString(sram, sol)}"`);
  }

  return { steps, log: logs.join('\n'), error: runError, dataBase, symbols };
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

export const SAMPLE_BLINK = `; AVR 教学模拟 · PORTB 走灯
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
