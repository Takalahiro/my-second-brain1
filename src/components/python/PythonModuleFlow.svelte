<script lang="ts">
  import { tick } from 'svelte';
  import {
    buildModuleBuckets,
    buildInvocationFrames,
    moduleStats,
  } from '../../lib/python/trace-model';
  import type { PythonTraceStep } from '../../lib/python/tracer';
  import { EVENT_LABELS, MODULE_META, type TraceModuleKind } from '../../lib/python/tracer';

  interface Props {
    steps: PythonTraceStep[];
    activeStep?: number;
    onStepPick?: (index: number) => void;
  }

  let { steps, activeStep = 0, onStepPick }: Props = $props();

  type LayoutMode = 'columns' | 'stack';

  let layout = $state<LayoutMode>('columns');
  let visibleKinds = $state<Set<TraceModuleKind>>(
    new Set(['call', 'line', 'return', 'exception']),
  );

  const buckets = $derived(buildModuleBuckets(steps));
  const frames = $derived(buildInvocationFrames(steps));
  const stats = $derived(moduleStats(steps));
  const filteredBuckets = $derived(buckets.filter((b) => visibleKinds.has(b.kind)));

  let scrollEl = $state<HTMLDivElement | null>(null);

  $effect(() => {
    void activeStep;
    void layout;
    void tick().then(() => {
      scrollEl?.querySelector('.pmf-card.active, .pmf-seg.active')?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  });

  function toggleKind(kind: TraceModuleKind) {
    const next = new Set(visibleKinds);
    if (next.has(kind)) {
      if (next.size <= 1) return;
      next.delete(kind);
    } else {
      next.add(kind);
    }
    visibleKinds = next;
  }

  function pick(index: number) {
    onStepPick?.(index);
  }
</script>

<div class="py-modflow">
  <header class="pmf-toolbar">
    <div class="pmf-layout-toggle">
      <button type="button" class:active={layout === 'columns'} onclick={() => { layout = 'columns'; }}>
        分模块
      </button>
      <button type="button" class:active={layout === 'stack'} onclick={() => { layout = 'stack'; }}>
        调用栈
      </button>
    </div>
    <div class="pmf-filters">
      {#each Object.entries(MODULE_META) as [kind, meta]}
        {@const k = kind as TraceModuleKind}
        {@const count = stats[k]}
        {#if count > 0}
          <button
            type="button"
            class="pmf-chip"
            class:on={visibleKinds.has(k)}
            style="--chip-color: {meta.color}"
            onclick={() => toggleKind(k)}
          >
            {meta.short} {count}
          </button>
        {/if}
      {/each}
    </div>
  </header>

  <div class="pmf-body" bind:this={scrollEl}>
    {#if layout === 'columns'}
      <div class="pmf-columns" style="--cols: {filteredBuckets.length}">
        {#each filteredBuckets as bucket (bucket.kind)}
          <section class="pmf-col" style="--mod-color: {bucket.color}; --mod-bg: {bucket.bg}">
            <header class="pmf-col-head">
              <h3>{bucket.label}</h3>
              <p>{bucket.desc}</p>
              <span class="pmf-count">{bucket.items.length}</span>
            </header>
            <div class="pmf-col-list">
              {#each bucket.items as { index, step } (index)}
                <button
                  type="button"
                  class="pmf-card"
                  class:active={index === activeStep}
                  data-event={step.event}
                  onclick={() => pick(index)}
                >
                  <span class="pmf-card-meta">
                    <span class="pmf-tag">{EVENT_LABELS[step.event]}</span>
                    <span class="pmf-ln">L{step.line}</span>
                    {#if step.func && step.func !== '<module>'}
                      <span class="pmf-fn">{step.func}()</span>
                    {/if}
                  </span>
                  <span class="pmf-expl">{step.explanation}</span>
                  {#if step.source.trim()}
                    <code class="pmf-src">{step.source.trim()}</code>
                  {/if}
                </button>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {:else}
      <div class="pmf-stack">
        {#each frames as frame (frame.id)}
          <article
            class="pmf-frame"
            style="margin-left: {Math.min(frame.depth, 6) * 14}px"
          >
            <header class="pmf-frame-head">
              <span class="pmf-frame-fn">{frame.func}()</span>
              {#if frame.depth > 0}
                <span class="pmf-frame-depth">depth {frame.depth}</span>
              {/if}
            </header>
            <div class="pmf-frame-body">
              {#each frame.segments as seg (seg.index)}
                {#if visibleKinds.has(seg.kind)}
                  <button
                    type="button"
                    class="pmf-seg"
                    class:active={seg.index === activeStep}
                    data-event={seg.kind}
                    style="--seg-color: {MODULE_META[seg.kind].color}"
                    onclick={() => pick(seg.index)}
                  >
                    <span class="pmf-seg-kind">{MODULE_META[seg.kind].short}</span>
                    <span class="pmf-seg-ln">L{seg.step.line}</span>
                    <span class="pmf-seg-expl">{seg.step.explanation}</span>
                    {#if seg.step.source.trim()}
                      <code>{seg.step.source.trim()}</code>
                    {/if}
                  </button>
                {/if}
              {/each}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .py-modflow {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--code-bg);
  }

  .pmf-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .pmf-layout-toggle {
    display: flex;
    gap: 4px;
    padding: 2px;
    border-radius: 999px;
    background: rgb(0 0 0 / 0.2);
  }

  .pmf-layout-toggle button {
    padding: 4px 12px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.72rem;
    cursor: pointer;
  }

  .pmf-layout-toggle button.active {
    background: rgb(180 140 255 / 0.25);
    color: var(--text-primary);
    font-weight: 600;
  }

  .pmf-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: auto;
  }

  .pmf-chip {
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid rgb(255 255 255 / 0.12);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.66rem;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .pmf-chip.on {
    border-color: var(--chip-color);
    background: color-mix(in srgb, var(--chip-color) 18%, transparent);
    color: var(--chip-color);
    font-weight: 650;
  }

  .pmf-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 10px;
  }

  .pmf-columns {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(180px, 1fr));
    gap: 10px;
    min-height: 100%;
    align-items: start;
  }

  .pmf-col {
    display: flex;
    flex-direction: column;
    min-height: 120px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--mod-color) 35%, transparent);
    background: var(--mod-bg);
    overflow: hidden;
  }

  .pmf-col-head {
    padding: 10px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.06);
    position: relative;
  }

  .pmf-col-head h3 {
    margin: 0;
    font-size: 0.82rem;
    color: var(--mod-color);
  }

  .pmf-col-head p {
    margin: 4px 0 0;
    font-size: 0.64rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .pmf-count {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--mod-color);
    font-variant-numeric: tabular-nums;
  }

  .pmf-col-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    max-height: 420px;
    overflow: auto;
  }

  .pmf-card,
  .pmf-seg {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    text-align: left;
    border-radius: 8px;
    border: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    color: inherit;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.12s;
  }

  .pmf-card {
    padding: 8px 10px;
  }

  .pmf-card:hover,
  .pmf-seg:hover {
    border-color: rgb(255 255 255 / 0.18);
    transform: translateY(-1px);
  }

  .pmf-card.active,
  .pmf-seg.active {
    border-color: var(--mod-color, #7fe6c4);
    background: rgb(127 230 196 / 0.12);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--mod-color, #7fe6c4) 40%, transparent);
  }

  .pmf-seg.active {
    border-color: var(--seg-color);
    background: color-mix(in srgb, var(--seg-color) 14%, transparent);
  }

  .pmf-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 0.68rem;
  }

  .pmf-tag {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 0.58rem;
    font-weight: 700;
    background: rgb(180 140 255 / 0.2);
    color: #d4c0ff;
  }

  .pmf-card[data-event='call'] .pmf-tag { background: rgb(126 200 255 / 0.2); color: #9dccff; }
  .pmf-card[data-event='return'] .pmf-tag { background: rgb(255 213 106 / 0.2); color: #ffd56a; }
  .pmf-card[data-event='exception'] .pmf-tag { background: rgb(255 120 120 / 0.2); color: #ff9d9d; }

  .pmf-ln,
  .pmf-fn,
  .pmf-seg-ln {
    font-family: 'IBM Plex Mono', monospace;
    color: var(--text-secondary);
  }

  .pmf-expl,
  .pmf-seg-expl {
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .pmf-src,
  .pmf-seg code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.68rem;
    color: rgb(255 255 255 / 0.55);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .pmf-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pmf-frame {
    border-radius: 12px;
    border: 1px solid rgb(255 255 255 / 0.1);
    background: rgb(0 0 0 / 0.15);
    overflow: hidden;
  }

  .pmf-frame-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgb(180 140 255 / 0.08);
    border-bottom: 1px solid rgb(255 255 255 / 0.06);
  }

  .pmf-frame-fn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.78rem;
    font-weight: 650;
    color: #d4c0ff;
  }

  .pmf-frame-depth {
    font-size: 0.62rem;
    color: var(--text-secondary);
  }

  .pmf-frame-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }

  .pmf-seg {
    padding: 8px 10px;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
  }

  .pmf-seg-kind {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.58rem;
    font-weight: 700;
    background: color-mix(in srgb, var(--seg-color) 22%, transparent);
    color: var(--seg-color);
    flex-shrink: 0;
  }

  .pmf-seg code {
    flex-basis: 100%;
    margin-top: 2px;
  }

  @media (max-width: 900px) {
    .pmf-columns {
      grid-template-columns: 1fr;
    }
    .pmf-col-list {
      max-height: 240px;
    }
  }
</style>
