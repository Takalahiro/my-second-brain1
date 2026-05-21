<script lang="ts">
  import type { Matrix, MatrixHighlight } from '../../lib/matrix/types';
  import { formatNumber } from '../../lib/matrix/format';
  import { scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  interface Props {
    data: Matrix;
    label?: string;
    matrixKey?: string;
    highlight?: MatrixHighlight | null;
    useFraction?: boolean;
    compact?: boolean;
    showIndices?: boolean;
  }
  let {
    data,
    label = '',
    matrixKey = 'A',
    highlight = null,
    useFraction = false,
    compact = false,
    showIndices = true,
  }: Props = $props();

  const rows = $derived(data.length);
  const cols = $derived(data[0]?.length ?? 0);
  const hasHighlight = $derived(
    !!highlight &&
      highlight.matrixKey === matrixKey &&
      ((highlight.rows?.length ?? 0) > 0 ||
        (highlight.cols?.length ?? 0) > 0 ||
        (highlight.cells?.length ?? 0) > 0 ||
        !!highlight.activeCell)
  );

  function cellClass(r: number, c: number) {
    if (!highlight || highlight.matrixKey !== matrixKey) return '';
    const parts: string[] = [];
    const isActive = highlight.activeCell?.[0] === r && highlight.activeCell?.[1] === c;
    const isRow = highlight.rows?.includes(r);
    const isCol = highlight.cols?.includes(c);
    const isCell = highlight.cells?.some(([cr, cc]) => cr === r && cc === c);
    if (isRow && !isActive) parts.push('hl-row');
    if (isCol && !isActive) parts.push('hl-col');
    if (isCell && !isActive) parts.push('hl-cell');
    if (isActive) parts.push('hl-active');
    return parts.join(' ');
  }
</script>

<div class="mx-display" class:compact class:has-highlight={hasHighlight}>
  {#if label}
    <div class="mx-label-row">
      <span class="mx-label">{label}</span>
      <span class="mx-dim">{rows}×{cols}</span>
    </div>
  {/if}

  <div class="mx-bracket-wrap">
    {#if showIndices && rows > 0}
      <div class="mx-row-idx" aria-hidden="true">
        {#each data as _, r}
          <span class:lit={highlight?.rows?.includes(r)} class:pulse-lit={highlight?.rows?.includes(r)}>{r + 1}</span>
        {/each}
      </div>
    {/if}

    <div class="mx-bracket-inner">
      <div class="mx-table-wrap">
        <table class="mx-table">
          <tbody>
            {#each data as row, r}
              <tr>
                {#each row as val, c}
                  <td class={cellClass(r, c)}>
                    {#if highlight?.activeCell?.[0] === r && highlight?.activeCell?.[1] === c}
                      <span
                        class="mx-val mx-val-pulse viz-pulse-active"
                        in:scale={{ duration: 400, easing: cubicOut, start: 0.88 }}
                      >
                        {formatNumber(val, useFraction)}
                      </span>
                    {:else}
                      <span class="mx-val">{formatNumber(val, useFraction)}</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if showIndices && cols > 0}
      <div class="mx-col-idx" aria-hidden="true">
        {#each data[0] as _, c}
          <span class:lit={highlight?.cols?.includes(c)} class:pulse-lit={highlight?.cols?.includes(c)}>{c + 1}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .mx-display {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .mx-label-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .mx-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #c8b0ff;
    letter-spacing: 0.02em;
  }
  .mx-dim {
    font-size: 0.66rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .mx-bracket-wrap {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr auto;
    gap: 4px 8px;
    align-items: center;
  }
  .mx-row-idx {
    grid-row: 1;
    grid-column: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 2px;
    padding: 12px 0;
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
    color: rgb(255 255 255 / 0.28);
    text-align: right;
    min-width: 1.2em;
  }
  .mx-row-idx span.lit { color: #b48cff; font-weight: 700; }
  .mx-row-idx span.pulse-lit { animation: viz-row-pulse 1.3s ease-in-out infinite; border-radius: 4px; padding: 0 2px; }
  .mx-col-idx {
    grid-row: 2;
    grid-column: 2;
    display: flex;
    justify-content: space-around;
    gap: 2px;
    padding: 0 16px;
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
    color: rgb(255 255 255 / 0.28);
  }
  .mx-col-idx span.lit { color: #6dffcc; font-weight: 700; }
  .mx-col-idx span.pulse-lit { animation: viz-col-pulse 1.3s ease-in-out infinite; border-radius: 4px; padding: 0 2px; }

  .mx-bracket-inner {
    grid-row: 1;
    grid-column: 2;
    position: relative;
    padding: 0 14px;
  }
  .mx-bracket-inner::before,
  .mx-bracket-inner::after {
    content: '';
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 8px;
    border: 2px solid rgb(180 140 255 / 0.45);
  }
  .mx-bracket-inner::before {
    left: 0;
    border-right: 0;
    border-radius: 10px 0 0 10px;
  }
  .mx-bracket-inner::after {
    right: 0;
    border-left: 0;
    border-radius: 0 10px 10px 0;
  }

  .mx-table-wrap {
    overflow: auto;
    border-radius: 12px;
    background: linear-gradient(145deg, rgb(255 255 255 / 0.04), rgb(0 0 0 / 0.18));
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.06),
      0 8px 24px rgb(0 0 0 / 0.18);
  }
  .has-highlight .mx-table-wrap {
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.06),
      0 0 0 1px rgb(180 140 255 / 0.15),
      0 12px 32px rgb(0 0 0 / 0.22);
  }

  .mx-table {
    border-collapse: separate;
    border-spacing: 4px;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.88rem;
    padding: 10px 8px;
    margin: 0 auto;
  }
  .mx-display.compact .mx-table { font-size: 0.76rem; padding: 6px 4px; }

  .mx-table td {
    padding: 8px 12px;
    text-align: center;
    min-width: 2.8em;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.03);
    border: 1px solid transparent;
    transition:
      background var(--motion-step) var(--motion-step-ease),
      color var(--motion-step) var(--motion-step-ease),
      box-shadow var(--motion-step) var(--motion-step-ease),
      transform var(--motion-step) var(--motion-step-ease);
  }
  .mx-val {
    display: inline-block;
    font-variant-numeric: tabular-nums;
    transition: transform var(--motion-step) var(--motion-step-ease);
  }

  .mx-table td.hl-row {
    background: rgb(180 140 255 / 0.14);
    border-color: rgb(180 140 255 / 0.2);
    animation: viz-row-pulse 1.3s ease-in-out infinite;
  }
  .mx-table td.hl-col {
    background: rgb(0 255 170 / 0.1);
    border-color: rgb(0 255 170 / 0.18);
    animation: viz-col-pulse 1.3s ease-in-out infinite;
  }
  .mx-table td.hl-cell {
    background: rgb(255 200 120 / 0.14);
    animation: viz-highlight-pulse-soft 1.5s ease-in-out infinite;
  }
  .mx-table td.hl-active {
    background: rgb(0 255 100 / 0.2);
    color: #d4ffe3;
    border-color: rgb(0 255 100 / 0.55);
    box-shadow: 0 0 16px rgb(0 255 100 / 0.25);
    font-weight: 700;
    z-index: 1;
    position: relative;
    animation: viz-highlight-pulse 1.25s ease-in-out infinite;
  }

  :global(:root:not(.dark)) .mx-table-wrap {
    background: linear-gradient(145deg, rgb(255 255 255 / 0.9), rgb(240 236 255 / 0.95));
  }
  :global(:root:not(.dark)) .mx-table td {
    background: rgb(255 255 255 / 0.7);
    color: #1a1230;
  }
  :global(:root:not(.dark)) .mx-table td.hl-active {
    color: #0a4020;
  }
  :global(:root:not(.dark)) .mx-bracket-inner::before,
  :global(:root:not(.dark)) .mx-bracket-inner::after {
    border-color: rgb(140 100 220 / 0.45);
  }
</style>
