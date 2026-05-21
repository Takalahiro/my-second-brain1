<script lang="ts">
  import { onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { StepSequence } from '../../lib/matrix/types';
  import { HIGHLIGHT_LEGEND, OPERATION_LABELS, phaseMeta } from '../../lib/matrix/phase-meta';
  import KatexBlock from './KatexBlock.svelte';
  import MatrixDisplay from './MatrixDisplay.svelte';
  import AnimatedNumber from '../shared/AnimatedNumber.svelte';

  interface Props {
    sequence: StepSequence | null;
    useFraction?: boolean;
  }
  let { sequence, useFraction = false }: Props = $props();

  let stepIndex = $state(0);
  let playing = $state(false);
  let speed = $state(1);
  let showResult = $state(false);

  const steps = $derived(sequence?.steps ?? []);
  const current = $derived(steps[stepIndex] ?? null);
  const progress = $derived(steps.length > 1 ? (stepIndex / (steps.length - 1)) * 100 : 100);
  const progressTween = tweened(0, { duration: 420, easing: cubicOut });
  const displayStep = $derived(stepIndex + 1);
  const phase = $derived(phaseMeta(current?.phase));
  const isLast = $derived(stepIndex >= steps.length - 1);
  const opLabel = $derived(sequence ? OPERATION_LABELS[sequence.operation] ?? sequence.operation : '');

  $effect(() => {
    void progressTween.set(progress);
  });

  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    void sequence;
    stepIndex = 0;
    playing = false;
    showResult = false;
  });

  $effect(() => {
    if (isLast) showResult = true;
  });

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startPlay() {
    clearTimer();
    playing = true;
    const interval = Math.max(300, 1400 / speed);
    timer = setInterval(() => {
      if (stepIndex >= steps.length - 1) {
        playing = false;
        clearTimer();
        return;
      }
      stepIndex += 1;
    }, interval);
  }

  function togglePlay() {
    if (playing) {
      playing = false;
      clearTimer();
    } else {
      if (stepIndex >= steps.length - 1) stepIndex = 0;
      startPlay();
    }
  }

  function prev() {
    playing = false;
    clearTimer();
    stepIndex = Math.max(0, stepIndex - 1);
  }

  function next() {
    playing = false;
    clearTimer();
    stepIndex = Math.min(steps.length - 1, stepIndex + 1);
  }

  function goto(i: number) {
    playing = false;
    clearTimer();
    stepIndex = i;
  }

  onDestroy(clearTimer);
</script>

{#if sequence && current}
  <section class="step-player">
    <header class="sp-top">
      <div class="sp-op-badge">{opLabel}</div>
      <div class="sp-step-counter">
        <AnimatedNumber value={displayStep} duration={420} class="sp-step-num" />
        <span class="sp-step-sep">/</span>
        <span class="sp-step-total">{steps.length}</span>
      </div>
    </header>

    <div class="sp-stage" style="--phase-color: {phase.color}; --phase-bg: {phase.bg}">
      <div class="sp-stage-head">
        <span class="sp-phase" style="background: {phase.bg}; color: {phase.color}">{phase.label}</span>
        <h3 class="sp-title">{current.title}</h3>
      </div>

      <p class="sp-hint">{phase.hint}</p>
      <p class="sp-expl">{current.explanation}</p>

      {#key current.id}
        <div
          class="sp-body viz-step-enter"
          in:fly={{ y: 12, duration: 400, easing: cubicOut }}
          out:fly={{ y: -8, duration: 320, easing: cubicOut }}
        >
          {#if current.latex}
            <div class="sp-latex">
              <span class="sp-latex-lbl">公式</span>
              <KatexBlock tex={current.latex} display />
            </div>
          {/if}

          {#if current.highlights.length > 0}
            <div class="sp-legend">
              {#each HIGHLIGHT_LEGEND as item}
                <span class="sp-leg-item">
                  <i style="background: {item.color}"></i>
                  {item.label}
                </span>
              {/each}
            </div>
          {/if}

          <div class="sp-matrices" class:single={current.matrices.length === 1}>
            {#each current.matrices as m (m.key)}
              {@const hl = current.highlights.find((h) => h.matrixKey === m.key) ?? null}
              <MatrixDisplay
                data={m.data}
                label={m.label}
                matrixKey={m.key}
                highlight={hl}
                {useFraction}
              />
            {/each}
          </div>
        </div>
      {/key}
    </div>

    {#if sequence.resultText}
      <details class="sp-result-panel" bind:open={showResult}>
        <summary>
          <span>最终结果</span>
          <span class="sp-result-toggle">{showResult ? '收起' : '展开'}</span>
        </summary>
        <pre>{sequence.resultText}</pre>
        {#if sequence.resultLatex}
          <div class="sp-result-latex">
            <KatexBlock tex={sequence.resultLatex} display />
          </div>
        {/if}
      </details>
    {/if}

    <div class="sp-progress-wrap">
      <div class="sp-progress">
        <div class="sp-bar" style="width: {$progressTween}%"></div>
      </div>
      <span class="sp-pct"><AnimatedNumber value={Math.round(progress)} duration={400} />%</span>
    </div>

    <div class="sp-timeline">
      {#each steps as s, i}
        {@const pm = phaseMeta(s.phase)}
        <button
          type="button"
          class="sp-node"
          class:active={i === stepIndex}
          class:done={i < stepIndex}
          title={s.title}
          style="--node-color: {pm.color}"
          onclick={() => goto(i)}
        >
          <span class="sp-node-dot"></span>
          <span class="sp-node-num">{i + 1}</span>
        </button>
      {/each}
    </div>

    <div class="sp-controls">
      <button type="button" class="sp-btn" onclick={prev} disabled={stepIndex === 0} aria-label="上一步">
        ◀
      </button>
      <button type="button" class="sp-btn sp-play" onclick={togglePlay}>
        {playing ? '⏸ 暂停' : stepIndex >= steps.length - 1 ? '↺ 重播' : '▶ 播放'}
      </button>
      <button type="button" class="sp-btn" onclick={next} disabled={stepIndex >= steps.length - 1} aria-label="下一步">
        ▶
      </button>
      <label class="sp-speed">
        <span>速度</span>
        <input type="range" min="0.25" max="3" step="0.25" bind:value={speed} />
        <span class="sp-speed-val">{speed}×</span>
      </label>
    </div>
  </section>
{:else}
  <div class="step-empty" in:fade={{ duration: 300 }}>
    <div class="step-empty-icon" aria-hidden="true">
      <span>⎡ 1  2 ⎤</span>
      <span>⎣ 3  4 ⎦</span>
    </div>
    <h3>矩阵可视化实验室</h3>
    <p>在左侧输入矩阵，选择运算与算法，点击「开始可视化」。</p>
    <ul class="step-empty-tips">
      <li><strong>高亮行/列</strong> — 看清当前操作作用在哪里</li>
      <li><strong>绿色焦点</strong> — 这一步正在改动的元素</li>
      <li><strong>逐步播放</strong> — 像老师板书一样慢慢推导</li>
    </ul>
  </div>
{/if}

<style>
  .step-player {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
    flex: 1;
  }

  .sp-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .sp-op-badge {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 650;
    background: rgb(180 140 255 / 0.15);
    border: 1px solid rgb(180 140 255 / 0.28);
    color: #d4c0ff;
  }
  .sp-step-counter {
    font-variant-numeric: tabular-nums;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.82rem;
    color: var(--text-secondary);
    display: flex;
    align-items: baseline;
    gap: 3px;
  }
  .sp-step-counter :global(.sp-step-num) {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .sp-step-sep { opacity: 0.45; }
  .sp-step-total { opacity: 0.7; }

  .sp-stage {
    flex: 1;
    min-height: 0;
    padding: 16px 18px;
    border-radius: 16px;
    background:
      radial-gradient(ellipse 80% 60% at 10% 0%, var(--phase-bg), transparent 55%),
      linear-gradient(160deg, rgb(255 255 255 / 0.04), rgb(0 0 0 / 0.12));
    border: 1px solid rgb(255 255 255 / 0.08);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
    overflow: auto;
    transition:
      background var(--motion-step) var(--motion-step-ease),
      border-color var(--motion-step) var(--motion-step-ease);
  }
  .sp-stage-head {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .sp-phase {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
  }
  .sp-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 650;
    line-height: 1.35;
  }
  .sp-hint {
    margin: 0 0 6px;
    font-size: 0.72rem;
    color: var(--phase-color, #b48cff);
    font-weight: 600;
  }
  .sp-expl {
    margin: 0 0 14px;
    font-size: 0.86rem;
    line-height: 1.65;
    color: var(--text-secondary);
    max-width: 62ch;
  }

  .sp-latex {
    padding: 12px 14px;
    border-radius: 12px;
    background: rgb(0 0 0 / 0.2);
    border: 1px solid rgb(180 140 255 / 0.18);
    margin-bottom: 14px;
    overflow-x: auto;
  }
  .sp-latex-lbl {
    display: block;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .sp-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-bottom: 12px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgb(255 255 255 / 0.03);
  }
  .sp-leg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    color: var(--text-secondary);
  }
  .sp-leg-item i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: block;
  }

  .sp-matrices {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    align-items: flex-start;
    padding: 8px 0;
  }
  .sp-matrices.single {
    justify-content: center;
  }

  .sp-result-panel {
    border-radius: 12px;
    border: 1px solid rgb(0 255 157 / 0.22);
    background: rgb(0 255 157 / 0.06);
    overflow: hidden;
  }
  .sp-result-panel summary {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 0.78rem;
    font-weight: 650;
    list-style: none;
  }
  .sp-result-panel summary::-webkit-details-marker { display: none; }
  .sp-result-toggle { color: var(--text-secondary); font-weight: 500; }
  .sp-result-panel pre {
    margin: 0;
    padding: 0 14px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.76rem;
    white-space: pre-wrap;
    color: #9dffd0;
  }
  .sp-result-latex {
    padding: 0 14px 12px;
    overflow-x: auto;
  }

  .sp-progress-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sp-progress {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    overflow: hidden;
  }
  .sp-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #00ff9d, #b48cff);
    box-shadow: 0 0 12px rgb(0 255 157 / 0.35);
    transition: width var(--motion-step) var(--motion-step-ease);
  }
  .sp-pct {
    font-size: 0.68rem;
    font-variant-numeric: tabular-nums;
    color: var(--text-secondary);
    min-width: 2.5em;
  }

  .sp-timeline {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 88px;
    overflow: auto;
    padding: 4px 0;
  }
  .sp-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    color: inherit;
    min-width: 32px;
    transition:
      background var(--motion-step) var(--motion-step-ease),
      border-color var(--motion-step) var(--motion-step-ease),
      transform var(--motion-step-fast) var(--motion-step-ease);
  }
  .sp-node-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgb(255 255 255 / 0.15);
    transition:
      transform var(--motion-step) var(--motion-step-ease),
      background var(--motion-step) var(--motion-step-ease),
      box-shadow var(--motion-step) var(--motion-step-ease);
  }
  .sp-node-num {
    font-size: 0.62rem;
    font-variant-numeric: tabular-nums;
    opacity: 0.65;
    transition: opacity var(--motion-step-fast) var(--motion-step-ease);
  }
  .sp-node.done .sp-node-dot { background: var(--node-color); opacity: 0.45; }
  .sp-node.active {
    border-color: var(--node-color);
    background: rgb(255 255 255 / 0.04);
  }
  .sp-node.active .sp-node-dot {
    background: var(--node-color);
    transform: scale(1.35);
    box-shadow: 0 0 8px color-mix(in srgb, var(--node-color) 60%, transparent);
    animation: viz-dot-pulse 1.2s ease-in-out infinite;
  }
  .sp-node.active .sp-node-num { opacity: 1; font-weight: 700; }

  .sp-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid rgb(255 255 255 / 0.06);
  }
  .sp-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: inherit;
    cursor: pointer;
    font-size: 0.85rem;
    display: grid;
    place-items: center;
    transition: background var(--motion-step-fast) var(--motion-step-ease), opacity var(--motion-step-fast);
  }
  .sp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .sp-btn.sp-play {
    width: auto;
    padding: 0 18px;
    font-weight: 650;
    border: 0;
    background: linear-gradient(135deg, #00ff9d, #b48cff);
    color: #0a1f12;
  }
  .sp-speed {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .sp-speed input { width: 88px; accent-color: #b48cff; }
  .sp-speed-val { min-width: 2em; font-variant-numeric: tabular-nums; }

  .step-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 32px 24px;
    gap: 12px;
    border-radius: 16px;
    background:
      radial-gradient(circle at 50% 20%, rgb(180 140 255 / 0.12), transparent 55%),
      rgb(255 255 255 / 0.02);
    border: 1px dashed rgb(255 255 255 / 0.1);
  }
  .step-empty-icon {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 1.1rem;
    line-height: 1.5;
    color: rgb(180 140 255 / 0.7);
    margin-bottom: 8px;
  }
  .step-empty h3 {
    margin: 0;
    font-size: 1.15rem;
  }
  .step-empty p {
    margin: 0;
    max-width: 36ch;
    color: var(--text-secondary);
    font-size: 0.88rem;
    line-height: 1.55;
  }
  .step-empty-tips {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
    text-align: left;
    max-width: 36ch;
  }
  .step-empty-tips li {
    font-size: 0.78rem;
    color: var(--text-secondary);
    padding: 6px 0;
    border-bottom: 1px solid rgb(255 255 255 / 0.05);
  }
  .step-empty-tips li:last-child { border-bottom: 0; }
  .step-empty-tips strong { color: #c8b0ff; font-weight: 600; }

  :global(:root:not(.dark)) .sp-stage {
    background:
      radial-gradient(ellipse 80% 60% at 10% 0%, var(--phase-bg), transparent 55%),
      linear-gradient(160deg, #fff, #f5f0ff);
  }
  :global(:root:not(.dark)) .sp-latex {
    background: rgb(180 140 255 / 0.06);
  }
</style>
