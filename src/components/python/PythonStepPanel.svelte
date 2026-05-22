<script lang="ts">
  import { onDestroy } from 'svelte';
  import AnimatedNumber from '../shared/AnimatedNumber.svelte';
  import type { PythonTraceResult } from '../../lib/python/tracer';
  import { EVENT_LABELS } from '../../lib/python/tracer';

  interface Props {
    trace: PythonTraceResult | null;
    activeStep?: number;
    compact?: boolean;
  }
  let { trace, activeStep = $bindable(0), compact = false }: Props = $props();

  let playing = $state(false);
  let speed = $state(1);
  let listEl = $state<HTMLDivElement | null>(null);

  const steps = $derived(trace?.steps ?? []);
  const current = $derived(steps[activeStep] ?? null);
  const progress = $derived(steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 100);

  $effect(() => {
    void trace;
    activeStep = 0;
    playing = false;
  });

  $effect(() => {
    void activeStep;
    if (!listEl) return;
    const item = listEl.querySelector(`[data-step="${activeStep}"]`);
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
    }, Math.max(300, 800 / speed));
  }

  function goto(i: number) {
    playing = false;
    clearTimer();
    activeStep = i;
  }

  onDestroy(clearTimer);
</script>

{#if trace && steps.length > 0}
  <section class="py-timeline" class:compact>
    <header class="pyt-head">
      <span class="pyt-badge">时间线</span>
      <span class="pyt-count">
        <AnimatedNumber value={activeStep + 1} duration={350} class="pyt-num" />
        <span>/ {steps.length}</span>
      </span>
    </header>

    <div class="pyt-bar-wrap">
      <div class="pyt-bar" style="width: {progress}%"></div>
    </div>

    <div class="pyt-list" bind:this={listEl}>
      {#each steps as s, i (s.id ?? i)}
        <button
          type="button"
          class="pyt-item"
          class:active={i === activeStep}
          class:done={i < activeStep}
          data-step={i}
          onclick={() => goto(i)}
        >
          <span class="pyt-rail">
            <span class="pyt-dot" data-event={s.event}></span>
            {#if i < steps.length - 1}
              <span class="pyt-line"></span>
            {/if}
          </span>
          <span class="pyt-body">
            <span class="pyt-meta">
              <span class="pyt-event" data-event={s.event}>{EVENT_LABELS[s.event]}</span>
              <span class="pyt-ln">L{s.line}</span>
              {#if s.depth}
                <span class="pyt-depth">depth {s.depth}</span>
              {/if}
            </span>
            <span class="pyt-expl">{s.explanation}</span>
          </span>
        </button>
      {/each}
    </div>

    <div class="pyt-ctrl">
      <button type="button" disabled={activeStep === 0} onclick={() => goto(activeStep - 1)} aria-label="上一步">◀</button>
      <button type="button" class="play" onclick={togglePlay}>{playing ? '⏸ 暂停' : '▶ 播放'}</button>
      <button type="button" disabled={activeStep >= steps.length - 1} onclick={() => goto(activeStep + 1)} aria-label="下一步">▶</button>
      {#if !compact}
        <label class="pyt-speed">速度<input type="range" min="0.5" max="2.5" step="0.25" bind:value={speed} /></label>
      {/if}
    </div>

    {#if trace.error}
      <p class="pyt-err">{trace.error}</p>
    {/if}
  </section>
{:else if trace?.error}
  <section class="py-timeline empty">
    <p class="pyt-err">{trace.error}</p>
  </section>
{:else}
  <section class="py-timeline empty">
    <p>运行后左侧源码会高亮当前行，这里显示完整执行时间线。</p>
    <ul>
      <li>点击时间线或源码行号跳转</li>
      <li>支持逐步播放与调用深度提示</li>
    </ul>
  </section>
{/if}

<style>
  .py-timeline {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    height: 100%;
  }

  .py-timeline.empty {
    padding: 14px;
    border-radius: 10px;
    border: 1px dashed rgb(255 255 255 / 0.12);
    color: var(--text-secondary);
    font-size: 0.78rem;
    line-height: 1.55;
  }

  .py-timeline.empty ul {
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .pyt-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .pyt-badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.66rem;
    font-weight: 650;
    background: rgb(180 140 255 / 0.12);
    color: #d4c0ff;
    border: 1px solid rgb(180 140 255 / 0.25);
  }

  .pyt-count {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
  }

  .pyt-count :global(.pyt-num) {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .pyt-bar-wrap {
    height: 3px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    overflow: hidden;
    flex-shrink: 0;
  }

  .pyt-bar {
    height: 100%;
    background: linear-gradient(90deg, #7fe6c4, #b48cff);
    transition: width var(--motion-step) var(--motion-step-ease);
  }

  .pyt-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-right: 4px;
  }

  .pyt-item {
    display: grid;
    grid-template-columns: 22px 1fr;
    gap: 10px;
    width: 100%;
    padding: 8px 8px 8px 4px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      background var(--motion-step-fast),
      border-color var(--motion-step-fast);
  }

  .pyt-item:hover {
    background: rgb(255 255 255 / 0.04);
  }

  .pyt-item.active {
    background: rgb(127 230 196 / 0.1);
    border-color: rgb(127 230 196 / 0.28);
  }

  .pyt-item.done {
    opacity: 0.55;
  }

  .pyt-rail {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 4px;
  }

  .pyt-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: rgb(180 140 255 / 0.7);
    flex-shrink: 0;
  }

  .pyt-dot[data-event='call'] { background: #7ec8ff; }
  .pyt-dot[data-event='return'] { background: #ffd56a; }
  .pyt-dot[data-event='exception'] { background: #ff9d9d; }

  .pyt-item.active .pyt-dot {
    box-shadow: 0 0 0 3px rgb(127 230 196 / 0.25);
  }

  .pyt-line {
    flex: 1;
    width: 2px;
    min-height: 12px;
    margin-top: 4px;
    background: rgb(255 255 255 / 0.1);
    border-radius: 1px;
  }

  .pyt-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pyt-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .pyt-event {
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    background: rgb(180 140 255 / 0.18);
    color: #d4c0ff;
  }

  .pyt-event[data-event='call'] { background: rgb(126 200 255 / 0.18); color: #9dccff; }
  .pyt-event[data-event='return'] { background: rgb(255 200 120 / 0.18); color: #ffd56a; }
  .pyt-event[data-event='exception'] { background: rgb(255 120 120 / 0.18); color: #ff9d9d; }

  .pyt-ln,
  .pyt-depth {
    font-size: 0.62rem;
    color: var(--text-secondary);
    font-family: 'IBM Plex Mono', monospace;
  }

  .pyt-expl {
    font-size: 0.76rem;
    line-height: 1.45;
    color: var(--text-primary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .pyt-item.active .pyt-expl {
    -webkit-line-clamp: unset;
  }

  .pyt-ctrl {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .pyt-ctrl button {
    height: 32px;
    min-width: 32px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: inherit;
    cursor: pointer;
  }

  .pyt-ctrl button:disabled {
    opacity: 0.35;
  }

  .pyt-ctrl button.play {
    border: 0;
    background: linear-gradient(135deg, #7fe6c4, #b48cff);
    color: #0a1f12;
    font-weight: 650;
  }

  .pyt-speed {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    font-size: 0.64rem;
    color: var(--text-secondary);
  }

  .pyt-speed input {
    width: 60px;
  }

  .pyt-err {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgb(255 80 80 / 0.1);
    color: #ff9d9d;
    font-size: 0.76rem;
  }
</style>
