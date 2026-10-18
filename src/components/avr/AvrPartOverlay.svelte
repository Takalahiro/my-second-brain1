<script lang="ts">
  import type { AvrTraceStep } from '../../lib/avr/engine';
  import type { PartId } from '../../lib/avr/datapath';
  import { pointerAddr } from '../../lib/avr/datapath';
  import {
    changedRegs,
    encodeFields,
    flagCells,
    flagHex,
    insnCycles,
    type BitField,
  } from '../../lib/avr/spec';
  import type { ArchId } from '../../lib/avr/datapath';

  interface Props {
    part: PartId;
    step: AvrTraceStep | null;
    prev: AvrTraceStep | null;
    steps: AvrTraceStep[];
    arch: ArchId;
    seek: number | null;
    onClose: () => void;
    onSeek: (reg: number) => void;
    onPick: (index: number) => void;
  }

  let { part, step, prev, steps, arch, seek, onClose, onSeek, onPick }: Props = $props();

  const changed = $derived(changedRegs(step, prev));
  const flags = $derived(flagCells(step, prev));
  const fields = $derived(encodeFields(step));

  function hex(n: number, width = 2) {
    return (n >>> 0).toString(16).toUpperCase().padStart(width, '0');
  }

  const program = $derived.by(() => {
    const seen = new Set<number>();
    const rows: { pc: number; source: string; cycles: number; index: number }[] = [];
    for (const s of steps) {
      if (seen.has(s.pc)) continue;
      seen.add(s.pc);
      rows.push({ pc: s.pc, source: s.source, cycles: insnCycles(s, arch), index: s.id });
    }
    return rows;
  });

  const dataRows = $derived.by(() => {
    if (!step) return [];
    const base = 0x100;
    const focus = pointerAddr(step);
    const start = Math.max(0, (focus ?? base) - base - 4);
    return step.snap.data.slice(start, start + 12).map((value, i) => ({
      addr: base + start + i,
      value,
      hot: focus != null && base + start + i === focus,
    }));
  });

  const alu = $derived.by(() => {
    const op = step?.flow?.op ?? '';
    const rd = step?.flow?.rd;
    const rr = step?.flow?.rr;
    const a = rd != null ? (prev?.snap.regs[rd] ?? 0) : 0;
    const b = step?.flow?.k ?? (rr != null ? (prev?.snap.regs[rr] ?? 0) : 0);
    const out = rd != null ? (step?.snap.regs[rd] ?? 0) : 0;
    const write = op !== 'cpi' && op !== 'cp';
    return { op, a, b, out, c: step?.snap.c ? 1 : 0, write, rd };
  });

  const pcJump = $derived.by(() => {
    const from = prev?.pc ?? step?.pc ?? 0;
    const to = step?.pc ?? 0;
    const branch = step?.event === 'branch' && to !== from + 1;
    return { from, to, branch };
  });

  function kindClass(kind: BitField['kind']) {
    return `field-${kind}`;
  }
</script>

<div class="card">
  <header>
    <strong>{part.toUpperCase()}</strong>
    <button type="button" onclick={onClose}>关闭</button>
  </header>

  {#if part === 'sreg'}
    <p class="fold">折叠 {flagHex(step)}</p>
    <div class="flags">
      {#each flags as cell}
        <div class="flag" class:na={cell.delta === 'na'} class:up={cell.delta === 'up'} class:down={cell.delta === 'down'}>
          <span>{cell.name}</span>
          <b>{cell.delta === 'na' ? '·' : cell.value}</b>
          <em>{cell.delta === 'up' ? '↑' : cell.delta === 'down' ? '↓' : cell.delta === 'same' ? '=' : ''}</em>
        </div>
      {/each}
    </div>
  {:else if part === 'regs' && step}
    <div class="grid">
      {#each step.snap.regs as value, i}
        <button
          type="button"
          class:hot={step.flow?.rd === i || step.flow?.rr === i}
          class:changed={changed.has(i)}
          class:seek={seek === i}
          onclick={() => onSeek(i)}
        >r{i}: 0x{hex(value)}</button>
      {/each}
    </div>
  {:else if part === 'alu'}
    <p>A 0x{hex(alu.a)} · {alu.op.toUpperCase() || '—'} · B 0x{hex(alu.b)}</p>
    <p>进位 C={alu.c}</p>
    <p>{alu.write ? `结果 0x${hex(alu.out)} 写回 R${alu.rd ?? '?'}` : '比较不写回寄存器，只更新标志'}</p>
  {:else if part === 'pmem'}
    <ul>
      {#each program as row}
        <li class:here={step?.pc === row.pc}>
          <button type="button" onclick={() => onPick(row.index)}>#{row.pc} {row.source} · {row.cycles} 拍</button>
        </li>
      {/each}
    </ul>
  {:else if part === 'dmem'}
    <ul>
      {#each dataRows as row}
        <li class:here={row.hot}>0x{hex(row.addr, 4)} = 0x{hex(row.value)}</li>
      {/each}
    </ul>
  {:else if part === 'pc'}
    <p class="jump" class:branch={pcJump.branch}>#{pcJump.from} → #{pcJump.to}</p>
    <p>{pcJump.branch ? '分支改写 PC' : '顺序 +1 字（字节 +2）'}</p>
  {:else if part === 'ir'}
    <p class="bits">
      {#each fields as field}
        <span class={kindClass(field.kind)} title={field.name}>{field.bits}</span>
      {/each}
    </p>
    <p class="legend"><i class="field-op">opcode</i> <i class="field-rd">Rd</i> <i class="field-rr">Rr</i> <i class="field-k">K</i></p>
  {:else}
    <p>译码器不保存数据，只打开控制信号。</p>
  {/if}
</div>

<style>
  .card {
    width: 16rem;
    max-height: 16rem;
    overflow: auto;
    padding: var(--space-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }
  header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-2); }
  header button, .grid button, ul button {
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text-muted);
    border-radius: var(--radius-button);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .fold, p, li { margin: var(--space-1) 0 0; font-size: var(--text-xs); color: var(--text-muted); }
  .flags, .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; margin-top: var(--space-1); }
  .grid { grid-template-columns: repeat(2, 1fr); }
  .flag, .grid button { padding: 2px; text-align: center; }
  .flag.na { opacity: 0.4; }
  .flag.up b, .flag.down b { color: var(--accent); }
  .grid button.hot { border-color: var(--accent); color: var(--text); }
  .grid button.changed { color: var(--accent-in); }
  .grid button.seek { outline: 2px solid var(--accent); }
  ul { list-style: none; margin: 0; padding: 0; max-height: 10rem; overflow: auto; }
  li.here { color: var(--text); }
  li.here button { color: var(--text); border-color: var(--accent); }
  .jump { font-size: var(--text-sm); color: var(--text); }
  .jump.branch { color: var(--accent); }
  .bits { display: flex; gap: 4px; font-family: var(--font-mono, ui-monospace, monospace); }
  .field-op { color: var(--accent); }
  .field-rd { color: var(--accent-in); }
  .field-rr { color: var(--accent-out); }
  .field-k { color: var(--text-muted); }
  .legend i { font-style: normal; margin-right: var(--space-1); }
</style>
