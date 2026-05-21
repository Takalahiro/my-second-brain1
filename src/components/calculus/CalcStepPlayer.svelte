<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { CalcStepSequence } from '../../lib/calculus/types';
  import type { StatStepSequence } from '../../lib/statistics/types';
  import KatexBlock from '../matrix/KatexBlock.svelte';
  import AnimatedNumber from '../shared/AnimatedNumber.svelte';

  type AnySequence = CalcStepSequence | StatStepSequence | null;

  interface Props {
    sequence: AnySequence;
    playerStep?: number;
  }
  let { sequence, playerStep = $bindable(0) }: Props = $props();

  let stepIndex = $state(0);
  let playing = $state(false);
  let speed = $state(1);

  const steps = $derived(sequence?.steps ?? []);
  const current = $derived(steps[stepIndex] ?? null);
  const progress = $derived(steps.length > 1 ? (stepIndex / (steps.length - 1)) * 100 : 100);
  const progressTween = tweened(0, { duration: 400, easing: cubicOut });
  const displayStep = $derived(stepIndex + 1);

  $effect(() => { void progressTween.set(progress); });
  $effect(() => { void sequence; stepIndex = 0; playerStep = 0; playing = false; });
  $effect(() => { playerStep = stepIndex; });

  let timer: ReturnType<typeof setInterval> | null = null;
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function togglePlay() {
    if (playing) { playing = false; clearTimer(); return; }
    if (stepIndex >= steps.length - 1) stepIndex = 0;
    playing = true;
    timer = setInterval(() => {
      if (stepIndex >= steps.length - 1) { playing = false; clearTimer(); return; }
      stepIndex += 1;
    }, Math.max(400, 1200 / speed));
  }

  onDestroy(clearTimer);
</script>

{#if sequence && current}
  <section class="csp">
    <header class="csp-head">
      <span class="csp-badge">{sequence.mode}</span>
      <span class="csp-count">
        <AnimatedNumber value={displayStep} duration={420} class="csp-count-current" />
        <span class="csp-count-sep">/</span>
        <span class="csp-count-total">{steps.length}</span>
      </span>
    </header>

    {#key current.id}
      <div
        class="csp-body viz-step-enter"
        in:fly={{ y: 12, duration: 400, easing: cubicOut }}
        out:fly={{ y: -8, duration: 320, easing: cubicOut }}
      >
        <h4>{current.title}</h4>
        <p>{current.explanation}</p>
        {#if current.latex}
          <div class="csp-latex"><KatexBlock tex={current.latex} display /></div>
        {/if}
      </div>
    {/key}

    <div class="csp-bar-wrap">
      <div class="csp-bar" style="width: {$progressTween}%"></div>
    </div>

    <div class="csp-thumbs">
      {#each steps as s, i}
        <button
          type="button"
          class="csp-thumb"
          class:active={i === stepIndex}
          class:done={i < stepIndex}
          onclick={() => { stepIndex = i; playing = false; clearTimer(); }}
        >
          <span class="csp-thumb-num">{i + 1}</span>
        </button>
      {/each}
    </div>

    <div class="csp-ctrl">
      <button type="button" disabled={stepIndex === 0} onclick={() => { stepIndex = Math.max(0, stepIndex - 1); playing = false; clearTimer(); }}>◀</button>
      <button type="button" class="play" onclick={togglePlay}>{playing ? '⏸' : '▶ 播放'}</button>
      <button type="button" disabled={stepIndex >= steps.length - 1} onclick={() => { stepIndex = Math.min(steps.length - 1, stepIndex + 1); playing = false; clearTimer(); }}>▶</button>
      <label class="csp-speed">速度<input type="range" min="0.25" max="3" step="0.25" bind:value={speed} /><span>{speed}×</span></label>
    </div>

    {#if sequence.resultText}
      <details class="csp-result" open={stepIndex >= steps.length - 1}>
        <summary>最终结果</summary>
        <pre>{sequence.resultText}</pre>
      </details>
    {/if}
  </section>
{:else}
  <div class="csp-empty">点击「开始逐步演示」查看推导过程</div>
{/if}

<style>
  .csp { display: flex; flex-direction: column; gap: 10px; }
  .csp-head { display: flex; justify-content: space-between; align-items: center; }
  .csp-badge {
    padding: 3px 10px; border-radius: 999px; font-size: 0.68rem; font-weight: 650;
    background: rgb(126 200 255 / 0.15); color: #9dccff;
    transition: background var(--motion-step) var(--motion-step-ease);
  }
  .csp-count {
    display: flex; align-items: baseline; gap: 3px;
    font-size: 0.72rem; color: var(--text-secondary); font-variant-numeric: tabular-nums;
  }
  .csp-count :global(.csp-count-current) {
    font-size: 1.05rem; font-weight: 700; color: var(--text-primary);
  }
  .csp-count-sep { opacity: 0.45; }
  .csp-count-total { opacity: 0.7; }
  .csp-body h4 { margin: 0 0 6px; font-size: 0.92rem; }
  .csp-body p { margin: 0 0 10px; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.55; }
  .csp-latex {
    padding: 10px; border-radius: 10px; background: rgb(0 0 0 / 0.2);
    border: 1px solid rgb(126 200 255 / 0.15); overflow-x: auto;
    transition: border-color var(--motion-step) var(--motion-step-ease);
  }
  .csp-bar-wrap { height: 4px; border-radius: 999px; background: rgb(255 255 255 / 0.08); overflow: hidden; }
  .csp-bar {
    height: 100%; background: linear-gradient(90deg, #7ec8ff, #00ff9d);
    transition: width var(--motion-step) var(--motion-step-ease);
  }
  .csp-thumbs { display: flex; flex-wrap: wrap; gap: 4px; max-height: 56px; overflow: auto; }
  .csp-thumb {
    width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border-color);
    background: var(--bg-primary); font-size: 0.62rem; cursor: pointer; color: inherit;
    transition:
      background var(--motion-step) var(--motion-step-ease),
      border-color var(--motion-step) var(--motion-step-ease),
      transform var(--motion-step) var(--motion-step-ease),
      opacity var(--motion-step) var(--motion-step-ease);
  }
  .csp-thumb.active {
    background: rgb(126 200 255 / 0.25); border-color: rgb(126 200 255 / 0.5); font-weight: 700;
    animation: viz-highlight-pulse-soft 1.4s ease-in-out infinite;
  }
  .csp-thumb.done { opacity: 0.5; }
  .csp-thumb-num { display: block; font-variant-numeric: tabular-nums; }
  .csp-ctrl { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .csp-ctrl button {
    width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer;
    transition: background var(--motion-step-fast) var(--motion-step-ease), opacity var(--motion-step-fast);
  }
  .csp-ctrl button:disabled { opacity: 0.35; }
  .csp-ctrl button.play {
    width: auto; padding: 0 14px;
    background: linear-gradient(135deg, #7ec8ff, #00ff9d); color: #0a1f12; border: 0; font-weight: 650;
  }
  .csp-speed { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 0.68rem; color: var(--text-secondary); }
  .csp-speed input { width: 72px; }
  .csp-result {
    border-radius: 10px; border: 1px solid rgb(0 255 157 / 0.2); background: rgb(0 255 157 / 0.06);
    transition: border-color var(--motion-step) var(--motion-step-ease);
  }
  .csp-result summary { padding: 8px 12px; cursor: pointer; font-size: 0.74rem; font-weight: 600; }
  .csp-result pre { margin: 0; padding: 0 12px 10px; font-size: 0.72rem; font-family: 'IBM Plex Mono', monospace; color: #9dffd0; white-space: pre-wrap; }
  .csp-empty { padding: 20px; text-align: center; font-size: 0.82rem; color: var(--text-secondary); border: 1px dashed rgb(255 255 255 / 0.1); border-radius: 12px; }
</style>
