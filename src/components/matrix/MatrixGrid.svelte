<script lang="ts">
  import type { Matrix } from '../../lib/matrix/types';
  import { identity, zeros } from '../../lib/matrix/core';
  import { matrixToMatlab, parseMatlabMatrix } from '../../lib/matrix/parse';

  interface Props {
    label?: string;
    rows?: number;
    cols?: number;
    data?: Matrix;
    onchange?: (data: Matrix) => void;
  }
  let {
    label = 'A',
    rows = $bindable(3),
    cols = $bindable(3),
    data = $bindable(identity(3)),
    onchange,
  }: Props = $props();

  let textMode = $state(false);
  let textValue = $state('[1 0 0; 0 1 0; 0 0 1]');
  let parseErr = $state<string | null>(null);

  function resize(r: number, c: number) {
    const nr = Math.max(1, Math.min(10, r));
    const nc = Math.max(1, Math.min(10, c));
    const next = zeros(nr, nc);
    for (let i = 0; i < nr; i++) {
      for (let j = 0; j < nc; j++) {
        next[i][j] = data[i]?.[j] ?? 0;
      }
    }
    rows = nr;
    cols = nc;
    data = next;
    syncText();
    onchange?.(next);
  }

  function syncText() {
    textValue = matrixToMatlab(data);
  }

  function emit() {
    syncText();
    onchange?.(data);
  }

  function setCell(r: number, c: number, raw: string) {
    const v = raw.trim() === '' ? 0 : Number(raw);
    data[r][c] = Number.isFinite(v) ? v : 0;
    data = data.map((row) => [...row]);
    emit();
  }

  function applyText() {
    try {
      data = parseMatlabMatrix(textValue);
      rows = data.length;
      cols = data[0]?.length ?? 1;
      parseErr = null;
      textMode = false;
      onchange?.(data);
    } catch (e) {
      parseErr = e instanceof Error ? e.message : String(e);
    }
  }

  function doIdentity() {
    const n = Math.min(rows, cols);
    resize(n, n);
    data = identity(n);
    emit();
  }

  function doZero() {
    data = zeros(rows, cols);
    emit();
  }

  function doRandom() {
    data = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => Math.floor(Math.random() * 9) - 4)
    );
    emit();
  }

  function doTranspose() {
    data = data[0].map((_, j) => data.map((row) => row[j]));
    const t = rows;
    rows = cols;
    cols = t;
    emit();
  }

  syncText();
</script>

<div class="mx-grid-panel">
  <div class="mx-grid-head">
    <span class="mx-grid-title">{label}</span>
    <div class="mx-grid-size">
      <label>
        行
        <input
          type="number"
          min="1"
          max="10"
          value={rows}
          onchange={(e) => resize(Number((e.target as HTMLInputElement).value), cols)}
        />
      </label>
      <label>
        列
        <input
          type="number"
          min="1"
          max="10"
          value={cols}
          onchange={(e) => resize(rows, Number((e.target as HTMLInputElement).value))}
        />
      </label>
    </div>
  </div>

  <div class="mx-grid-tools">
    <button type="button" onclick={doIdentity}>I</button>
    <button type="button" onclick={doZero}>0</button>
    <button type="button" onclick={doRandom}>随机</button>
    <button type="button" onclick={doTranspose}>Aᵀ</button>
    <button type="button" class:active={textMode} onclick={() => { textMode = !textMode; syncText(); }}>
      文本
    </button>
  </div>

  {#if textMode}
    <div class="mx-text-mode">
      <textarea bind:value={textValue} rows="3" spellcheck="false"></textarea>
      {#if parseErr}<p class="mx-err">{parseErr}</p>{/if}
      <button type="button" class="apply" onclick={applyText}>应用 MATLAB 格式</button>
    </div>
  {:else}
    <div class="mx-cell-grid" style="--cols: {cols}">
      {#each data as row, r}
        {#each row as val, c}
          <input
            type="text"
            class="mx-cell"
            value={val}
            onchange={(e) => setCell(r, c, (e.target as HTMLInputElement).value)}
          />
        {/each}
      {/each}
    </div>
  {/if}
</div>

<style>
  .mx-grid-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
  }
  .mx-grid-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .mx-grid-title {
    font-weight: 700;
    font-size: 0.88rem;
    color: #b48cff;
  }
  .mx-grid-size {
    display: flex;
    gap: 8px;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .mx-grid-size label { display: flex; align-items: center; gap: 4px; }
  .mx-grid-size input {
    width: 44px;
    padding: 3px 6px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--code-bg);
    color: inherit;
  }
  .mx-grid-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .mx-grid-tools button {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: inherit;
    font-size: 0.72rem;
    cursor: pointer;
  }
  .mx-grid-tools button:hover,
  .mx-grid-tools button.active {
    background: rgb(180 140 255 / 0.2);
    border-color: rgb(180 140 255 / 0.4);
  }
  .mx-cell-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(44px, 1fr));
    gap: 4px;
  }
  .mx-cell {
    width: 100%;
    padding: 6px 4px;
    text-align: center;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.78rem;
  }
  .mx-text-mode textarea {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.78rem;
    resize: vertical;
  }
  .mx-err { margin: 4px 0 0; font-size: 0.72rem; color: #ff9d9d; }
  .apply {
    margin-top: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    border: 0;
    background: linear-gradient(135deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.76rem;
  }
</style>
