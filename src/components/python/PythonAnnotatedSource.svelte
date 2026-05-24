<script lang="ts">
  import { tick } from 'svelte';
  import { buildLineTraceModel, stepIndexForLine } from '../../lib/python/trace-model';
  import type { PythonTraceStep } from '../../lib/python/tracer';
  import { EVENT_LABELS } from '../../lib/python/tracer';

  interface Props {
    code: string;
    steps?: PythonTraceStep[];
    activeStep?: number;
    onStepPick?: (index: number) => void;
    scrollRef?: HTMLDivElement | null;
  }

  let {
    code,
    steps = [],
    activeStep = 0,
    onStepPick,
    scrollRef = $bindable(null),
  }: Props = $props();

  const rows = $derived(buildLineTraceModel(code, steps, activeStep));
  const current = $derived(steps[activeStep]);

  let rowRefs: Record<number, HTMLDivElement | undefined> = $state({});

  $effect(() => {
    void activeStep;
    void tick().then(() => {
      const ln = current?.line;
      if (!ln || !scrollRef) return;
      const el = rowRefs[ln];
      if (!el) return;
      const top = el.offsetTop - scrollRef.clientHeight * 0.35;
      scrollRef.scrollTop = Math.max(0, top);
    });
  });

  function pickLine(line: number) {
    const idx = stepIndexForLine(steps, line, true);
    if (idx >= 0) onStepPick?.(idx);
  }
</script>

<div class="py-annotated" bind:this={scrollRef}>
  {#each rows as row (row.line)}
    <div
      class="py-trace-row"
      class:active={row.state === 'active'}
      class:executed={row.state === 'executed'}
      class:pending={row.state === 'pending'}
      class:static={row.state === 'static'}
      class:error={row.state === 'error'}
      style="--depth: {row.isActiveLine ? (current?.depth ?? 0) : 0}"
      bind:this={rowRefs[row.line]}
    >
      <button
        type="button"
        class="py-trace-lane"
        title={row.stepIndices.length ? `${row.stepIndices.length} 个追踪点` : '未执行'}
        onclick={() => pickLine(row.line)}
        disabled={!row.stepIndices.length}
      >
        {#if row.isActiveLine && current}
          <span class="py-trace-pip" data-event={current.event}></span>
        {:else if row.stepIndices.length}
          <span class="py-trace-dot" data-event={row.event ?? 'line'}></span>
        {:else}
          <span class="py-trace-dot empty"></span>
        {/if}
      </button>

      <button type="button" class="py-trace-ln" onclick={() => pickLine(row.line)}>
        {row.line}
      </button>

      <button type="button" class="py-trace-code" onclick={() => pickLine(row.line)}>
        <code>{@html row.html}</code>
      </button>

      {#if row.isActiveLine && current}
        <div class="py-trace-callout">
          <span class="py-trace-tag" data-event={current.event}>{EVENT_LABELS[current.event]}</span>
          {#if current.func && current.func !== '<module>'}
            <span class="py-trace-fn">{current.func}()</span>
          {/if}
          <p class="py-trace-expl">{current.explanation}</p>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .py-annotated {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 8px 0;
    background: var(--code-bg);
    font-family: 'IBM Plex Mono', 'Consolas', monospace;
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .py-trace-row {
    display: grid;
    grid-template-columns: 28px 36px 1fr;
    gap: 0 8px;
    padding: 0 12px 0 8px;
    border-left: 3px solid transparent;
    transition:
      background var(--motion-step-fast) var(--motion-step-ease),
      border-color var(--motion-step-fast);
  }

  .py-trace-row.executed {
    background: rgb(127 230 196 / 0.04);
  }

  .py-trace-row.pending {
    opacity: 0.42;
  }

  .py-trace-row.static {
    background: rgb(126 200 255 / 0.06);
    border-left-color: rgb(126 200 255 / 0.35);
  }

  .py-trace-row.active {
    background: rgb(127 230 196 / 0.1);
    border-left-color: #7fe6c4;
    padding-left: calc(8px + var(--depth, 0) * 6px);
  }

  .py-trace-row.error {
    background: rgb(255 100 100 / 0.1);
    border-left-color: #ff9d9d;
  }

  .py-trace-lane,
  .py-trace-ln,
  .py-trace-code {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    padding: 2px 0;
  }

  .py-trace-lane {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 7px;
    cursor: pointer;
  }

  .py-trace-lane:disabled {
    cursor: default;
  }

  .py-trace-ln {
    color: rgb(255 255 255 / 0.28);
    font-size: 0.72rem;
    text-align: right;
    padding-top: 4px;
    user-select: none;
  }

  .py-trace-row.active .py-trace-ln {
    color: #7fe6c4;
    font-weight: 700;
  }

  .py-trace-code {
    min-width: 0;
    white-space: pre-wrap;
    word-break: break-word;
    padding: 4px 0;
  }

  .py-trace-code code {
    font: inherit;
    background: none;
  }

  .py-trace-code :global(.py-hl-keyword) { color: #c792ea; font-weight: 600; }
  .py-trace-code :global(.py-hl-builtin) { color: #82aaff; }
  .py-trace-code :global(.py-hl-string) { color: #a5e844; }
  .py-trace-code :global(.py-hl-comment) { color: rgb(255 255 255 / 0.38); font-style: italic; }
  .py-trace-code :global(.py-hl-number) { color: #f78c6c; }
  .py-trace-code :global(.py-hl-decorator) { color: #ffd580; }

  .py-trace-dot,
  .py-trace-pip {
    display: block;
    border-radius: 999px;
    background: rgb(180 140 255 / 0.55);
  }

  .py-trace-dot {
    width: 6px;
    height: 6px;
    margin-top: 2px;
  }

  .py-trace-dot.empty {
    background: rgb(255 255 255 / 0.08);
  }

  .py-trace-dot[data-event='call'],
  .py-trace-pip[data-event='call'] {
    background: #7ec8ff;
  }

  .py-trace-dot[data-event='return'],
  .py-trace-pip[data-event='return'] {
    background: #ffd56a;
  }

  .py-trace-dot[data-event='exception'],
  .py-trace-pip[data-event='exception'] {
    background: #ff9d9d;
  }

  .py-trace-pip {
    width: 10px;
    height: 10px;
    box-shadow: 0 0 0 3px rgb(127 230 196 / 0.25);
    animation: py-pip-pulse 1.2s ease-in-out infinite;
  }

  @keyframes py-pip-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.85; }
  }

  .py-trace-callout {
    grid-column: 2 / -1;
    margin: 2px 0 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgb(0 0 0 / 0.22);
    border: 1px solid rgb(127 230 196 / 0.22);
  }

  .py-trace-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 700;
    background: rgb(180 140 255 / 0.2);
    color: #d4c0ff;
    margin-right: 6px;
  }

  .py-trace-tag[data-event='call'] { background: rgb(126 200 255 / 0.2); color: #9dccff; }
  .py-trace-tag[data-event='return'] { background: rgb(255 200 120 / 0.2); color: #ffd56a; }
  .py-trace-tag[data-event='exception'] { background: rgb(255 120 120 / 0.2); color: #ff9d9d; }

  .py-trace-fn {
    font-size: 0.68rem;
    color: var(--text-secondary);
  }

  .py-trace-expl {
    margin: 8px 0 0;
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--text-primary);
  }
</style>
