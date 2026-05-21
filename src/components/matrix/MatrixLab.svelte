<script lang="ts">
  import type { Matrix, OperationId, StepSequence } from '../../lib/matrix/types';
  import { OPERATIONS, runMatrixOperation } from '../../lib/matrix';
  import { OPERATION_LABELS } from '../../lib/matrix/phase-meta';
  import { identity } from '../../lib/matrix/core';
  import MatrixGrid from './MatrixGrid.svelte';
  import StepPlayer from './StepPlayer.svelte';

  let op = $state<OperationId>('inverse');
  let method = $state('gauss-jordan');
  let useFraction = $state(true);

  let rowsA = $state(3);
  let colsA = $state(3);
  let matrixA = $state<Matrix>(identity(3));

  let rowsB = $state(3);
  let colsB = $state(3);
  let matrixB = $state<Matrix>(identity(3));

  let rowsBv = $state(3);
  let vectorB = $state<Matrix>([[1], [2], [3]]);

  let sequence = $state<StepSequence | null>(null);
  let error = $state<string | null>(null);
  let running = $state(false);

  const currentOp = $derived(OPERATIONS.find((o) => o.id === op)!);
  const methods = $derived(currentOp.methods);
  const selectedMethod = $derived(methods.find((m) => m.id === method));

  $effect(() => {
    if (!methods.some((m) => m.id === method)) {
      method = methods[0]?.id ?? '';
    }
  });

  function run() {
    error = null;
    running = true;
    try {
      sequence = runMatrixOperation(
        op,
        method,
        matrixA,
        currentOp.needsB ? matrixB : undefined,
        currentOp.needsVector ? vectorB : undefined
      );
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      sequence = null;
    } finally {
      running = false;
    }
  }
</script>

<div class="matrix-lab">
  <aside class="ml-sidebar">
    <section class="ml-section ml-section-input">
      <h2>① 输入矩阵</h2>
      <MatrixGrid label="A" bind:rows={rowsA} bind:cols={colsA} bind:data={matrixA} />
      {#if currentOp.needsB}
        <MatrixGrid label="B" bind:rows={rowsB} bind:cols={colsB} bind:data={matrixB} />
      {/if}
      {#if currentOp.needsVector}
        <MatrixGrid label="b (列向量)" bind:rows={rowsBv} cols={1} bind:data={vectorB} />
      {/if}
      <label class="ml-frac">
        <input type="checkbox" bind:checked={useFraction} />
        <span>以分数显示（更直观）</span>
      </label>
    </section>

    <section class="ml-section">
      <h2>② 选择运算</h2>
      <div class="ml-ops">
        {#each OPERATIONS as item}
          <button
            type="button"
            class="ml-op"
            class:active={op === item.id}
            onclick={() => { op = item.id; sequence = null; }}
          >
            <span class="ml-op-icon">{item.icon}</span>
            <span class="ml-op-text">{item.label}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="ml-section ml-section-run">
      <h2>③ 算法 & 运行</h2>
      {#if selectedMethod}
        <p class="ml-method-hint">{selectedMethod.desc}</p>
      {/if}
      <div class="ml-methods">
        {#each methods as m}
          <label class="ml-method" class:active={method === m.id}>
            <input type="radio" bind:group={method} value={m.id} />
            <div>
              <strong>{m.label}</strong>
              <span>{m.desc}</span>
            </div>
          </label>
        {/each}
      </div>
      <button type="button" class="ml-run" onclick={run} disabled={running}>
        <span class="ml-run-icon">{running ? '…' : '▶'}</span>
        {running ? '正在生成步骤…' : `可视化 ${OPERATION_LABELS[op] ?? op}`}
      </button>
      {#if error}
        <p class="ml-err">{error}</p>
      {/if}
    </section>
  </aside>

  <main class="ml-main">
    <StepPlayer {sequence} {useFraction} />
  </main>
</div>

<style>
  .matrix-lab {
    display: grid;
    grid-template-columns: minmax(300px, 380px) 1fr;
    gap: 16px;
    min-height: calc(100vh - 100px);
    padding: 12px 16px 20px;
  }
  .ml-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: auto;
    max-height: calc(100vh - 100px);
  }
  .ml-section {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    box-shadow: 0 4px 20px rgb(0 0 0 / 0.08);
  }
  .ml-section h2 {
    margin: 0 0 12px;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
  }
  .ml-section-input {
    background:
      linear-gradient(160deg, rgb(180 140 255 / 0.06), transparent 40%),
      var(--bg-secondary);
  }
  .ml-section-run {
    border-color: rgb(0 255 157 / 0.15);
  }
  .ml-frac {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 0.76rem;
    color: var(--text-secondary);
    cursor: pointer;
  }
  .ml-frac input { accent-color: #b48cff; }
  .ml-ops {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .ml-op {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: inherit;
    font-size: 0.72rem;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
  }
  .ml-op:hover { transform: translateY(-1px); }
  .ml-op.active {
    background: rgb(180 140 255 / 0.18);
    border-color: rgb(180 140 255 / 0.45);
    box-shadow: 0 4px 12px rgb(180 140 255 / 0.12);
  }
  .ml-op-icon {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: rgb(180 140 255 / 0.12);
    font-weight: 700;
    font-size: 0.68rem;
    color: #b48cff;
    flex-shrink: 0;
  }
  .ml-op.active .ml-op-icon {
    background: rgb(180 140 255 / 0.28);
    color: #fff;
  }
  .ml-op-text { line-height: 1.25; }
  .ml-method-hint {
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.04);
    font-size: 0.74rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }
  .ml-methods {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ml-method {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 0.74rem;
    transition: background 0.2s, border-color 0.2s;
  }
  .ml-method:hover { background: rgb(255 255 255 / 0.03); }
  .ml-method.active {
    border-color: rgb(0 255 157 / 0.28);
    background: rgb(0 255 157 / 0.06);
  }
  .ml-method strong { display: block; font-size: 0.8rem; margin-bottom: 2px; }
  .ml-method span { color: var(--text-secondary); font-size: 0.68rem; line-height: 1.4; }
  .ml-method input { margin-top: 4px; accent-color: #00ff9d; flex-shrink: 0; }
  .ml-run {
    width: 100%;
    margin-top: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 0;
    background: linear-gradient(135deg, #00ff9d 0%, #7ec8ff 50%, #b48cff 100%);
    color: #0a1f12;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 6px 20px rgb(0 255 157 / 0.2);
  }
  .ml-run:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgb(0 255 157 / 0.28);
  }
  .ml-run:disabled { opacity: 0.65; cursor: wait; transform: none; }
  .ml-run-icon { font-size: 1rem; }
  .ml-err {
    margin: 10px 0 0;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 0.74rem;
    color: #ffb8b8;
    background: rgb(255 80 80 / 0.1);
    border: 1px solid rgb(255 120 120 / 0.2);
  }
  .ml-main {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background:
      radial-gradient(ellipse 70% 50% at 80% 0%, rgb(180 140 255 / 0.08), transparent 50%),
      var(--bg-secondary);
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
    box-shadow: 0 8px 32px rgb(0 0 0 / 0.12);
  }
  @media (max-width: 960px) {
    .matrix-lab { grid-template-columns: 1fr; }
    .ml-sidebar { max-height: none; }
  }
</style>
