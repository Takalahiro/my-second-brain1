<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
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

  const steps = $derived(trace?.steps ?? []);
  const current = $derived(steps[activeStep] ?? null);
  const progress = $derived(steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 100);

  $effect(() => {
    void trace;
    activeStep = 0;
    playing = false;
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
    }, Math.max(350, 900 / speed));
  }

  function goto(i: number) {
    playing = false;
    clearTimer();
    activeStep = i;
  }

  onDestroy(clearTimer);
</script>

{#if trace && steps.length > 0 && current}
  <section class="py-steps" class:compact>
    <header class="pys-head">
      <span class="pys-badge">执行追踪</span>
      <span class="pys-count">
        <AnimatedNumber value={activeStep + 1} duration={400} class="pys-num" />
        <span>/</span>
        <span>{steps.length}</span>
      </span>
    </header>

    {#key current.line + '-' + activeStep}
      <article
        class="pys-card viz-step-enter"
        in:fly={{ y: 10, duration: 400, easing: cubicOut }}
        out:fly={{ y: -6, duration: 320, easing: cubicOut }}
      >
        <div class="pys-meta">
          <span class="pys-event" data-event={current.event}>{EVENT_LABELS[current.event]}</span>
          <span class="pys-line">第 {current.line} 行</span>
          {#if current.func && current.func !== '<module>'}
            <span class="pys-fn">{current.func}()</span>
          {/if}
        </div>
        <p class="pys-expl">{current.explanation}</p>
        {#if current.source.trim()}
          <pre class="pys-src"><code>{current.source}</code></pre>
        {/if}
      </article>
    {/key}

    <div class="pys-bar-wrap">
      <div class="pys-bar" style="width: {progress}%"></div>
    </div>

    {#if !compact}
      <div class="pys-thumbs">
        {#each steps as s, i}
          <button
            type="button"
            class="pys-thumb"
            class:active={i === activeStep}
            class:done={i < activeStep}
            title={s.explanation}
            onclick={() => goto(i)}
          >
            {s.line}
          </button>
        {/each}
      </div>
    {/if}

    <div class="pys-ctrl">
      <button type="button" disabled={activeStep === 0} onclick={() => goto(activeStep - 1)}>◀</button>
      <button type="button" class="play" onclick={togglePlay}>{playing ? '⏸' : '▶ 逐步播放'}</button>
      <button type="button" disabled={activeStep >= steps.length - 1} onclick={() => goto(activeStep + 1)}>▶</button>
      {#if !compact}
        <label class="pys-speed">速度<input type="range" min="0.5" max="2.5" step="0.25" bind:value={speed} /></label>
      {/if}
    </div>

    {#if trace.error}
      <p class="pys-err">{trace.error}</p>
    {/if}
  </section>
{:else if trace?.error}
  <section class="py-steps empty">
    <p class="pys-err">{trace.error}</p>
  </section>
{:else}
  <section class="py-steps empty">
    <p>运行代码后，这里会逐步解释每一行在做什么</p>
    <ul>
      <li>import / 定义函数 / 赋值</li>
      <li>函数调用与 return</li>
      <li>print 输出与异常位置</li>
    </ul>
  </section>
{/if}

<style>
  .py-steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    height: 100%;
  }
  .py-steps.compact .pys-card { padding: 10px; }
  .py-steps.empty {
    padding: 16px;
    border-radius: 12px;
    border: 1px dashed rgb(255 255 255 / 0.12);
    color: var(--text-secondary);
    font-size: 0.78rem;
    line-height: 1.55;
  }
  .py-steps.empty ul { margin: 8px 0 0; padding-left: 18px; }
  .pys-head { display: flex; justify-content: space-between; align-items: center; }
  .pys-badge {
    padding: 3px 10px; border-radius: 999px; font-size: 0.68rem; font-weight: 650;
    background: rgb(127 230 196 / 0.12); color: #7fe6c4; border: 1px solid rgb(127 230 196 / 0.25);
  }
  .pys-count {
    display: flex; align-items: baseline; gap: 4px;
    font-size: 0.72rem; color: var(--text-secondary); font-variant-numeric: tabular-nums;
  }
  .pys-count :global(.pys-num) { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
  .pys-card {
    flex: 1; min-height: 0; overflow: auto;
    padding: 14px; border-radius: 12px;
    background: linear-gradient(145deg, rgb(127 230 196 / 0.08), rgb(180 140 255 / 0.06));
    border: 1px solid rgb(127 230 196 / 0.2);
    transition: border-color var(--motion-step) var(--motion-step-ease);
  }
  .pys-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .pys-event {
    padding: 2px 8px; border-radius: 999px; font-size: 0.64rem; font-weight: 700;
    background: rgb(180 140 255 / 0.2); color: #d4c0ff;
  }
  .pys-event[data-event='call'] { background: rgb(126 200 255 / 0.2); color: #9dccff; }
  .pys-event[data-event='return'] { background: rgb(255 200 120 / 0.2); color: #ffd56a; }
  .pys-event[data-event='exception'] { background: rgb(255 120 120 / 0.2); color: #ff9d9d; }
  .pys-line, .pys-fn { font-size: 0.68rem; color: var(--text-secondary); font-family: 'IBM Plex Mono', monospace; }
  .pys-expl { margin: 0 0 10px; font-size: 0.88rem; line-height: 1.55; }
  .pys-src {
    margin: 0; padding: 10px 12px; border-radius: 8px;
    background: rgb(0 0 0 / 0.25); border: 1px solid rgb(255 255 255 / 0.08);
    font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; overflow-x: auto;
  }
  .pys-bar-wrap { height: 4px; border-radius: 999px; background: rgb(255 255 255 / 0.08); overflow: hidden; }
  .pys-bar {
    height: 100%; background: linear-gradient(90deg, #7fe6c4, #b48cff);
    transition: width var(--motion-step) var(--motion-step-ease);
  }
  .pys-thumbs { display: flex; flex-wrap: wrap; gap: 4px; max-height: 52px; overflow: auto; }
  .pys-thumb {
    min-width: 28px; height: 26px; padding: 0 6px; border-radius: 6px;
    border: 1px solid var(--border-color); background: var(--bg-primary);
    font-size: 0.62rem; cursor: pointer; color: inherit; font-variant-numeric: tabular-nums;
    transition: background var(--motion-step) var(--motion-step-ease), transform var(--motion-step-fast);
  }
  .pys-thumb.active {
    background: rgb(127 230 196 / 0.2); border-color: rgb(127 230 196 / 0.45); font-weight: 700;
    animation: viz-highlight-pulse-soft 1.4s ease-in-out infinite;
  }
  .pys-thumb.done { opacity: 0.45; }
  .pys-ctrl { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .pys-ctrl button {
    width: 36px; height: 34px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer;
    transition: opacity var(--motion-step-fast);
  }
  .pys-ctrl button:disabled { opacity: 0.35; }
  .pys-ctrl button.play {
    width: auto; padding: 0 12px; border: 0;
    background: linear-gradient(135deg, #7fe6c4, #b48cff); color: #0a1f12; font-weight: 650;
  }
  .pys-speed { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 0.66rem; color: var(--text-secondary); }
  .pys-speed input { width: 64px; }
  .pys-err { margin: 0; padding: 8px 10px; border-radius: 8px; background: rgb(255 80 80 / 0.1); color: #ff9d9d; font-size: 0.76rem; }
</style>
