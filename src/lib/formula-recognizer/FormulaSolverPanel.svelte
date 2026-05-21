<script lang="ts">
  import { formulaSolver, formatSolverError } from './pyodide-solver';
  import { renderLatexPreview } from './mathjax';
  import StepLatexPreview from './StepLatexPreview.svelte';
  import type { SolveResult } from './solver-types';
  import { detectFormulaTask } from './latex-to-sympy';

  interface Props {
    latex?: string;
    autoSolve?: boolean;
  }

  let { latex = '', autoSolve = true }: Props = $props();

  let result = $state<SolveResult | null>(null);
  let solving = $state(false);
  let solverError = $state<string | null>(null);
  let answerEl: HTMLDivElement | null = null;
  let solveSeq = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const taskLabel = $derived(
    result?.task === 'normal'
      ? '概率统计'
      : result?.task === 'integral'
        ? '积分'
        : result?.task === 'derivative'
          ? '微分'
          : result?.task === 'equation'
            ? '方程'
            : '化简'
  );

  $effect(() => {
    if (!autoSolve || !latex.trim()) {
      result = null;
      solverError = null;
      return;
    }
    clearDebounce();
    debounceTimer = setTimeout(() => {
      void runSolve(latex);
    }, 400);
  });

  $effect(() => {
    if (answerEl && result?.answerLatex) {
      void renderLatexPreview(answerEl, result.answerLatex, {
        emptyText: '求解结果将显示在这里',
      });
    } else if (answerEl) {
      answerEl.innerHTML = '';
    }
  });

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  async function runSolve(input: string) {
    const seq = ++solveSeq;
    solving = true;
    solverError = null;
    try {
      const out = await formulaSolver.solve(input);
      if (seq !== solveSeq) return;
      result = out;
      if (!out.ok) solverError = out.error ?? '无法求解该表达式';
    } catch (err) {
      if (seq !== solveSeq) return;
      solverError = formatSolverError(err);
      result = null;
    } finally {
      if (seq === solveSeq) solving = false;
    }
  }

  export async function solveNow() {
    if (!latex.trim()) return;
    await runSolve(latex);
  }
</script>

<section class="fs-panel">
  <div class="fs-head">
    <div>
      <h2>运算求解</h2>
      <span class="fs-hint">
        SymPy · 支持微积分 / 方程 / 正态分布 Φ(x)
        {#if latex}
          · 检测到「{detectFormulaTask(latex)}」
        {/if}
      </span>
    </div>
    <button type="button" class="fs-btn" onclick={() => solveNow()} disabled={solving || !latex}>
      {solving ? '求解中…' : '重新求解'}
    </button>
  </div>

  {#if solving && formulaSolver.state === 'loading'}
    <p class="fs-note">正在加载 SymPy 引擎（首次约 10–20 MB）…</p>
  {/if}

  {#if solverError}
    <p class="fs-error" role="alert">{solverError}</p>
  {/if}

  {#if result?.ok && result.answerLatex}
    <div class="fs-answer-box">
      <span class="fs-tag">{taskLabel}</span>
      <div class="fs-answer" bind:this={answerEl}></div>
    </div>
  {/if}

  {#if result?.steps?.length}
    <ol class="fs-steps">
      {#each result.steps as step, i}
        <li class="fs-step">
          <span class="fs-step-num">{i + 1}</span>
          <div class="fs-step-body">
            <strong>{step.title}</strong>
            <StepLatexPreview latex={step.latex} />
            {#if step.note}
              <span class="fs-step-note">{step.note}</span>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {:else if !solving && !solverError}
    <p class="fs-note">
      {#if latex}
        {autoSolve ? '识别完成后将自动尝试符号求解与化简。' : '点击「重新求解」进行 SymPy 符号运算。'}
      {:else}
        手写或上传公式后，可在此查看求解步骤与答案。
      {/if}
    </p>
  {/if}
</section>

<style>
  .fs-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgb(126 200 255 / 0.25);
    background: linear-gradient(145deg, rgb(126 200 255 / 0.06), rgb(0 0 0 / 0.1));
  }

  .fs-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .fs-head h2 {
    margin: 0;
    font-size: 0.95rem;
    color: #a8d4ff;
  }

  .fs-hint {
    display: block;
    margin-top: 4px;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }

  .fs-btn {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid rgb(126 200 255 / 0.35);
    background: rgb(126 200 255 / 0.12);
    color: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .fs-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .fs-note {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .fs-error {
    margin: 0;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 0.82rem;
    color: #ff9d9d;
    background: rgb(255 100 100 / 0.08);
    border: 1px solid rgb(255 120 120 / 0.2);
  }

  .fs-answer-box {
    position: relative;
    padding: 16px;
    border-radius: 12px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(126 200 255 / 0.22);
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fs-tag {
    position: absolute;
    top: 8px;
    left: 10px;
    font-size: 0.62rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgb(126 200 255 / 0.15);
    color: #a8d4ff;
  }

  .fs-answer {
    width: 100%;
    display: flex;
    justify-content: center;
    overflow-x: auto;
  }

  .fs-answer :global(.fr-mathjax-output) {
    font-size: 1.2rem;
    color: var(--text-primary);
  }

  .fs-steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .fs-step {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .fs-step-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 0.68rem;
    font-weight: 700;
    background: rgb(126 200 255 / 0.2);
    color: #a8d4ff;
  }

  .fs-step-body {
    flex: 1;
    min-width: 0;
  }

  .fs-step-body strong {
    display: block;
    font-size: 0.82rem;
    margin-bottom: 6px;
  }

  .fs-step-note {
    display: block;
    margin-top: 4px;
    font-size: 0.68rem;
    color: var(--text-secondary);
  }
</style>
