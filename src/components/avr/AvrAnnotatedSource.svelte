<script lang="ts">
  import { tick } from 'svelte';
  import { buildLineTraceModel, stepIndexForLine } from '../../lib/avr/trace-model';
  import type { AvrTraceStep } from '../../lib/avr/engine';

  interface Props {
    code: string;
    steps?: AvrTraceStep[];
    activeStep?: number;
    onStepPick?: (index: number) => void;
  }

  let { code, steps = [], activeStep = 0, onStepPick }: Props = $props();

  const rows = $derived(buildLineTraceModel(code, steps, activeStep));
  const current = $derived(steps[activeStep]);
  let scrollRef = $state<HTMLDivElement | null>(null);
  let rowRefs: Record<number, HTMLDivElement | undefined> = {};

  $effect(() => {
    void activeStep;
    void tick().then(() => {
      const ln = current?.line;
      if (!ln || !scrollRef) return;
      const el = rowRefs[ln];
      if (!el) return;
      scrollRef.scrollTop = Math.max(0, el.offsetTop - scrollRef.clientHeight * 0.35);
    });
  });
</script>

<div class="avr-annotated" bind:this={scrollRef}>
  {#each rows as row (row.line)}
    <div
      class="avr-row"
      class:active={row.state === 'active'}
      class:executed={row.state === 'executed'}
      class:pending={row.state === 'pending'}
      class:error={row.state === 'error'}
      bind:this={rowRefs[row.line]}
    >
      <button type="button" class="avr-ln" onclick={() => {
        const idx = stepIndexForLine(steps, row.line);
        if (idx >= 0) onStepPick?.(idx);
      }}>{row.line}</button>
      <button type="button" class="avr-code" onclick={() => {
        const idx = stepIndexForLine(steps, row.line);
        if (idx >= 0) onStepPick?.(idx);
      }}><code>{@html row.html}</code></button>
    </div>
  {/each}
</div>

<style>
  .avr-annotated {
    flex: 1;
    min-height: 0;
    overflow: auto;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: var(--text-sm);
    line-height: 1.55;
  }
  .avr-row {
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    border-left: 3px solid transparent;
  }
  .avr-row.active {
    background: var(--color-success-soft);
    border-left-color: var(--color-success);
  }
  .avr-row.executed { background: var(--overlay-subtle); }
  .avr-row.error { background: var(--color-error-soft); }
  .avr-ln, .avr-code {
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    padding: 0 var(--space-2);
    font: inherit;
    cursor: pointer;
  }
  .avr-ln { color: var(--text-muted); text-align: right; }
  .avr-code { white-space: pre; }
</style>
