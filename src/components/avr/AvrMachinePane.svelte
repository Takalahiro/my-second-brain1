<script lang="ts">
  import type { AvrSnapshot } from '../../lib/avr/engine';

  interface Props {
    snap: AvrSnapshot | null;
    prev: AvrSnapshot | null;
    log?: string;
    symbols?: Record<string, number>;
    dataBase?: number;
  }
  let { snap, prev, log = '', symbols = {}, dataBase = 0 }: Props = $props();

  const solText = $derived.by(() => {
    const addr = symbols.sol;
    const data = snap?.data;
    if (addr == null || !data?.length) return '';
    const start = addr - dataBase;
    if (start < 0 || start >= data.length) return '';
    let s = '';
    for (let i = start; i < data.length; i++) {
      const c = data[i] ?? 0;
      if (c === 0) break;
      s += c >= 32 && c < 127 ? String.fromCharCode(c) : '·';
    }
    return s;
  });

  const xAddr = $derived(snap ? (snap.regs[26] | (snap.regs[27] << 8)) : 0);
  const zAddr = $derived(snap ? (snap.regs[30] | (snap.regs[31] << 8)) : 0);

  const bits = $derived((snap?.portb ?? 0).toString(2).padStart(8, '0').split(''));
  const regs = $derived(Array.from({ length: 16 }, (_, i) => i + 16));

  function hex(n: number) {
    return n > 0xff
      ? (n & 0xffff).toString(16).toUpperCase().padStart(4, '0')
      : (n & 0xff).toString(16).toUpperCase().padStart(2, '0');
  }
</script>

<div class="avr-machine">
  {#if symbols.sol != null}
    <div class="avr-pane-label">sol 缓冲区</div>
    <p class="avr-sol">{solText || '（空）'}</p>
    <div class="avr-flags">
      <span>X {hex(xAddr)}</span>
      <span>Z {hex(zAddr)}</span>
    </div>
  {/if}
  <div class="avr-pane-label">PORTB</div>
  <div class="avr-leds" aria-label="PORTB 灯">
    {#each bits as bit, i}
      <span class="avr-led" class:on={bit === '1'} title="bit {7 - i}">{bit}</span>
    {/each}
  </div>
  <div class="avr-flags">
    <span class:on={snap?.z}>Z {snap?.z ? 1 : 0}</span>
    <span class:on={snap?.c}>C {snap?.c ? 1 : 0}</span>
    <span>DDRB {hex(snap?.ddrb ?? 0)}</span>
  </div>
  <div class="avr-pane-label">R16–R31</div>
  <div class="avr-regs">
    {#each regs as r}
      {@const v = snap?.regs[r] ?? 0}
      {@const changed = prev != null && prev.regs[r] !== v}
      <span class:changed>R{r} {hex(v)}</span>
    {/each}
  </div>
  <pre class="avr-log">{log || '端口变化会记在这里'}</pre>
</div>

<style>
  .avr-machine { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3); min-height: 0; overflow: auto; }
  .avr-pane-label { font-size: var(--text-xs); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
  .avr-leds { display: flex; gap: var(--space-1); }
  .avr-led {
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.65rem;
    border: 1px solid var(--border);
    color: var(--text-muted);
    background: var(--bg);
  }
  .avr-led.on {
    background: var(--color-success);
    color: var(--on-accent);
    border-color: transparent;
  }
  .avr-flags, .avr-regs { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .avr-flags span, .avr-regs span {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: var(--text-xs);
    padding: 2px var(--space-2);
    border-radius: var(--radius-button);
    border: 1px solid var(--border);
    background: var(--bg);
  }
  .avr-flags span.on, .avr-regs span.changed {
    border-color: var(--accent);
    background: var(--overlay-subtle);
  }
  .avr-sol {
    margin: 0;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: var(--text-sm);
    color: var(--text);
  }
  .avr-log {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--text-muted);
    white-space: pre-wrap;
    font-family: var(--font-mono, ui-monospace, monospace);
  }
</style>
