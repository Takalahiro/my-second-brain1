<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { AvrTraceResult } from '../../lib/avr/engine';
  import { EVENT_LABELS } from '../../lib/avr/engine';

  interface Props {
    trace: AvrTraceResult | null;
    activeStep?: number;
  }
  let { trace, activeStep = $bindable(0) }: Props = $props();

  let playing = $state(false);
  let speed = $state(1);
  let listEl = $state<HTMLDivElement | null>(null);

  const steps = $derived(trace?.steps ?? []);
  const progress = $derived(steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 100);

  $effect(() => {
    void trace;
    activeStep = 0;
    playing = false;
  });

  $effect(() => {
    void activeStep;
    const item = listEl?.querySelector(`[data-step="${activeStep}"]`);
    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  let timer: ReturnType<typeof setInterval> | null = null;
  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function togglePlay() {
    if (playing) {
      playing = false;
      clearTimer();
      return;
    }
    if (activeStep >= steps.length - 1) activeStep = 0;
    playing = true;
    timer = setInterval(() => {
      if (activeStep >= steps.length - 1) {
        playing = false;
        clearTimer();
        return;
      }
      activeStep += 1;
    }, Math.max(280, 720 / speed));
  }

  function goto(i: number) {
    playing = false;
    clearTimer();
    activeStep = Math.max(0, Math.min(steps.length - 1, i));
  }

  onDestroy(clearTimer);
</script>

{#if trace && steps.length > 0}
  <section class="avr-timeline">
    <header class="avr-tl-head">
      <span class="avr-tl-badge">时间线</span>
      <span class="avr-tl-count">{activeStep + 1} / {steps.length}</span>
    </header>
    <div class="avr-tl-bar-wrap"><div class="avr-tl-bar" style="width: {progress}%"></div></div>
    <div class="avr-tl-list" bind:this={listEl}>
      {#each steps as s, i (s.id)}
        <button type="button" class="avr-tl-item" class:active={i === activeStep} data-step={i} onclick={() => goto(i)}>
          <span class="avr-tl-meta">
            <span class="avr-ev" data-event={s.event}>{EVENT_LABELS[s.event]}</span>
            <span>L{s.line || '—'}</span>
            <span>PC {s.pc}</span>
          </span>
          <span class="avr-expl">{s.explanation}</span>
        </button>
      {/each}
    </div>
    <div class="avr-tl-ctrl">
      <button type="button" disabled={activeStep === 0} onclick={() => goto(activeStep - 1)} aria-label="上一步">◀</button>
      <button type="button" class="play" onclick={togglePlay}>{playing ? '暂停' : '播放'}</button>
      <button type="button" disabled={activeStep >= steps.length - 1} onclick={() => goto(activeStep + 1)} aria-label="下一步">▶</button>
      <label class="avr-speed">速度<input type="range" min="0.5" max="2.5" step="0.25" bind:value={speed} /></label>
    </div>
  </section>
{:else}
  <p class="avr-tl-empty">运行后在这里逐步查看取指结果</p>
{/if}

<style>
  .avr-timeline { display: flex; flex-direction: column; min-height: 0; height: 100%; gap: var(--space-2); }
  .avr-tl-head, .avr-tl-ctrl { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
  .avr-tl-badge, .avr-ev {
    font-size: var(--text-xs);
    padding: 0 var(--space-2);
    border-radius: 999px;
    background: var(--overlay-subtle);
  }
  .avr-ev[data-event='io'] { color: var(--accent); }
  .avr-ev[data-event='branch'] { color: var(--accent-out); }
  .avr-ev[data-event='execute'] { color: var(--color-success); }
  .avr-ev[data-event='halt'] { color: var(--text-muted); }
  .avr-ev[data-event='exception'] { color: var(--color-error); }
  .avr-tl-count { font-variant-numeric: tabular-nums; font-size: var(--text-xs); color: var(--text-muted); }
  .avr-tl-bar-wrap { height: 4px; background: var(--overlay-subtle); border-radius: 999px; overflow: hidden; }
  .avr-tl-bar { height: 100%; background: var(--accent); }
  .avr-tl-list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: var(--space-1); }
  .avr-tl-item {
    text-align: left;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    border-radius: var(--radius-button);
    padding: var(--space-2);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .avr-tl-item.active { border-color: var(--accent); background: var(--overlay-subtle); }
  .avr-tl-meta { display: flex; gap: var(--space-2); font-size: var(--text-xs); color: var(--text-muted); align-items: center; }
  .avr-expl { font-size: var(--text-sm); }
  .avr-tl-ctrl button, .avr-speed {
    font-size: var(--text-xs);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: var(--radius-button);
    padding: var(--space-1) var(--space-2);
  }
  .avr-tl-ctrl button.play { background: var(--accent); color: var(--on-accent); border-color: transparent; }
  .avr-tl-ctrl button:disabled { opacity: 0.4; }
  .avr-speed { display: flex; align-items: center; gap: var(--space-1); }
  .avr-tl-empty { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }
</style>
