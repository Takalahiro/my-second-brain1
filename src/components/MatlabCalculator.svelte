<script lang="ts">
  import type { Component } from 'svelte';
  import { evaluate, plotFunction, CALC_HELP, type CalcResult } from '../lib/calc-engine';

  interface Props {
    // 紧凑模式（小组件用）
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  type TabId = 'matrix' | 'calculus' | 'discrete' | 'statistics' | 'expr';
  let tab = $state<TabId>('matrix');

  // Vite 需要在构建期静态分析 lazy 路径；裸 import('.svelte') 在 Astro dev 下会 404 源文件
  const labModules = import.meta.glob<{ default: Component }>([
    './matrix/MatrixLab.svelte',
    './calculus/CalculusLab.svelte',
    './discrete/DiscreteLab.svelte',
    './statistics/StatisticsLab.svelte',
  ]);

  const labPaths: Record<Exclude<TabId, 'expr'>, string> = {
    matrix: './matrix/MatrixLab.svelte',
    calculus: './calculus/CalculusLab.svelte',
    discrete: './discrete/DiscreteLab.svelte',
    statistics: './statistics/StatisticsLab.svelte',
  };

  function loadLab(id: Exclude<TabId, 'expr'>) {
    const loader = labModules[labPaths[id]];
    if (!loader) return Promise.reject(new Error(`未知模块: ${id}`));
    return loader();
  }

  let LabComponent = $state<Component | null>(null);
  let labLoading = $state(false);
  let labError = $state<string | null>(null);
  let labLoadSeq = 0;

  let expr = $state('');
  let plotExpr = $state('sin(x)');
  let history = $state<Array<{ expr: string; result: string; ok: boolean }>>([]);
  let lastResult = $state<CalcResult | null>(null);
  let xMin = $state(-6.28);
  let xMax = $state(6.28);
  let plotCanvas: HTMLCanvasElement | null = null;

  function submit() {
    if (!expr.trim()) return;
    const r = evaluate(expr);
    lastResult = r;
    history = [
      { expr: expr.trim(), result: r.ok ? r.formatted : r.error, ok: r.ok },
      ...history.slice(0, 49),
    ];
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function insertToken(tok: string) {
    expr += tok;
  }

  function drawPlot() {
    if (!plotCanvas) return;
    const ctx = plotCanvas.getContext('2d');
    if (!ctx) return;
    const W = plotCanvas.width;
    const H = plotCanvas.height;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    plotCanvas.width = plotCanvas.clientWidth * dpr;
    plotCanvas.height = plotCanvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const cw = plotCanvas.clientWidth;
    const ch = plotCanvas.clientHeight;

    ctx.fillStyle = '#0e0816';
    ctx.fillRect(0, 0, cw, ch);

    const data = plotFunction(plotExpr, xMin, xMax, 300);
    if ('error' in data) {
      ctx.fillStyle = '#ff9d9d';
      ctx.font = '12px sans-serif';
      ctx.fillText(data.error, 12, 24);
      return;
    }

    const valid = data.y.filter((v) => isFinite(v));
    if (valid.length === 0) return;
    let yMin = Math.min(...valid);
    let yMax = Math.max(...valid);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const pad = 0.08;
    const yr = yMax - yMin || 1;
    yMin -= yr * pad;
    yMax += yr * pad;

    const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * (cw - 48) + 40;
    const toY = (y: number) => ch - 24 - ((y - yMin) / (yMax - yMin)) * (ch - 48);

    // 网格
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const y = 24 + ((ch - 48) * i) / 8;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(cw - 8, y); ctx.stroke();
    }

    // 零线
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.moveTo(40, toY(0));
      ctx.lineTo(cw - 8, toY(0));
      ctx.stroke();
    }

    // 曲线
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < data.x.length; i++) {
      const yv = data.y[i];
      if (!isFinite(yv)) { started = false; continue; }
      const px = toX(data.x[i]);
      const py = toY(yv);
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    const grad = ctx.createLinearGradient(40, 0, cw, 0);
    grad.addColorStop(0, '#ff9ed4');
    grad.addColorStop(1, '#b48cff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 轴标签
    ctx.fillStyle = '#9d8fc0';
    ctx.font = '10px sans-serif';
    ctx.fillText(plotExpr, 44, 16);
    ctx.fillText(`${xMin.toFixed(1)}`, 42, ch - 6);
    ctx.fillText(`${xMax.toFixed(1)}`, cw - 36, ch - 6);
  }

  $effect(() => {
    void plotExpr;
    void xMin;
    void xMax;
    if (plotCanvas && !compact) {
      requestAnimationFrame(drawPlot);
    }
  });

  $effect(() => {
    if (compact || tab === 'expr') {
      LabComponent = null;
      labLoading = false;
      labError = null;
      return;
    }
    const currentTab = tab;
    const seq = ++labLoadSeq;
    labLoading = true;
    labError = null;
    LabComponent = null;
    loadLab(currentTab)
      .then((mod) => {
        if (seq !== labLoadSeq) return;
        LabComponent = mod.default;
      })
      .catch((err) => {
        if (seq !== labLoadSeq) return;
        labError = err instanceof Error ? err.message : String(err);
      })
      .finally(() => {
        if (seq === labLoadSeq) labLoading = false;
      });
  });

  const KEYPAD = [
    ['7', '8', '9', '/', '*'],
    ['4', '5', '6', '+', '-'],
    ['1', '2', '3', '^', '()'],
    ['0', '.', 'i', 'pi', 'e'],
    ['sin(', 'cos(', 'tan(', 'sqrt(', 'log('],
    ['[', ';', ']', 'inv(', 'det('],
  ];
</script>

<div class="matlab-calc" class:compact>
  {#if !compact}
    <header class="mc-head">
      <div>
        <h1>MATLAB 计算器</h1>
        <p class="mc-sub">矩阵 · 微积分 · 离散数学 · 统计学 · 表达式</p>
      </div>
      <nav class="mc-tabs">
        <button type="button" class:active={tab === 'matrix'} onclick={() => (tab = 'matrix')}>
          矩阵
        </button>
        <button type="button" class:active={tab === 'calculus'} onclick={() => (tab = 'calculus')}>
          微积分
        </button>
        <button type="button" class:active={tab === 'discrete'} onclick={() => (tab = 'discrete')}>
          离散数学
        </button>
        <button type="button" class:active={tab === 'statistics'} onclick={() => (tab = 'statistics')}>
          统计学
        </button>
        <button type="button" class:active={tab === 'expr'} onclick={() => (tab = 'expr')}>
          表达式
        </button>
      </nav>
    </header>
  {/if}

  {#if !compact && tab !== 'expr'}
    {#if labLoading}
      <div class="mc-lab-loading">正在加载{tab === 'matrix' ? '矩阵' : tab === 'calculus' ? '微积分' : tab === 'discrete' ? '离散数学' : '统计学'}模块…</div>
    {:else if labError}
      <div class="mc-lab-error" role="alert">模块加载失败：{labError}</div>
    {:else if LabComponent}
      <LabComponent />
    {/if}
  {:else}
  <div class="mc-body">
    <section class="mc-command">
      <div class="mc-input-row">
        <span class="mc-prompt">&gt;&gt;</span>
        <input
          type="text"
          class="mc-input"
          bind:value={expr}
          onkeydown={onKey}
          placeholder="输入表达式，Enter 计算"
          autocomplete="off"
        />
        <button type="button" class="mc-run" onclick={submit}>执行</button>
      </div>

      {#if lastResult}
        <div class="mc-result" class:err={!lastResult.ok}>
          {#if lastResult.ok}
            <span class="mc-ans">ans =</span>
            <pre>{lastResult.formatted}</pre>
          {:else}
            <pre>{lastResult.error}</pre>
          {/if}
        </div>
      {/if}

      <div class="mc-keypad">
        {#each KEYPAD as row}
          <div class="mc-krow">
            {#each row as key}
              <button type="button" class="mc-key" onclick={() => insertToken(key)}>{key}</button>
            {/each}
          </div>
        {/each}
      </div>

      {#if !compact && history.length > 0}
        <div class="mc-history">
          <div class="mc-hlbl">历史</div>
          <ul>
            {#each history.slice(0, 8) as h}
              <li>
                <button type="button" class="mc-hitem" onclick={() => { expr = h.expr; }}>
                  <code>{h.expr}</code>
                  <span class={h.ok ? 'ok' : 'bad'}>{h.result}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    {#if !compact}
      <section class="mc-viz">
        <div class="mc-viz-head">
          <span>函数可视化</span>
          <input type="text" class="mc-plot-expr" bind:value={plotExpr} onchange={drawPlot} placeholder="sin(x)" />
          <label class="mc-range">
            x:
            <input type="number" bind:value={xMin} step="0.5" onchange={drawPlot} />
            —
            <input type="number" bind:value={xMax} step="0.5" onchange={drawPlot} />
          </label>
          <button type="button" class="mc-run small" onclick={drawPlot}>绘制</button>
        </div>
        <canvas bind:this={plotCanvas} class="mc-canvas"></canvas>
        <ul class="mc-help">
          {#each CALC_HELP as line}
            <li>{line}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
  {/if}
</div>

<style>
  .matlab-calc {
    color: var(--text-primary);
    display: flex; flex-direction: column;
    gap: 12px;
    height: calc(100vh - 88px);
    padding: 12px 16px;
  }
  .matlab-calc.compact {
    height: 100%;
    padding: 0;
    gap: 8px;
  }
  .mc-head h1 { margin: 0; font-size: 1.35rem; }
  .mc-sub { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.84rem; }
  .mc-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .mc-tabs button {
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .mc-tabs button.active {
    background: rgb(180 140 255 / 0.25);
    border-color: rgb(180 140 255 / 0.45);
    font-weight: 650;
  }
  .mc-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    padding: 0 16px;
  }

  .mc-lab-loading,
  .mc-lab-error {
    margin: 0 16px;
    padding: 24px 16px;
    border-radius: 12px;
    border: 1px dashed rgb(180 140 255 / 0.25);
    text-align: center;
    font-size: 0.88rem;
    color: var(--text-secondary);
  }

  .mc-lab-error {
    color: #ff9d9d;
    border-color: rgb(255 120 120 / 0.35);
    background: rgb(255 80 80 / 0.08);
  }

  .mc-body {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.2fr);
    gap: 14px;
  }
  .matlab-calc.compact .mc-body {
    grid-template-columns: 1fr;
  }

  .mc-command, .mc-viz {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 14px;
    padding: 12px;
    display: flex; flex-direction: column;
    gap: 10px;
    min-height: 0;
    overflow: auto;
  }

  .mc-input-row {
    display: flex; align-items: center; gap: 8px;
  }
  .mc-prompt {
    color: #b48cff;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .mc-input {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.88rem;
  }
  .mc-run {
    padding: 8px 16px;
    border-radius: 8px;
    border: 0;
    background: linear-gradient(135deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .mc-run.small { padding: 5px 12px; font-size: 0.76rem; }

  .mc-result {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgb(180 140 255 / 0.12);
    border: 1px solid rgb(180 140 255 / 0.25);
  }
  .mc-result.err {
    background: rgb(255 80 80 / 0.1);
    border-color: rgb(255 120 120 / 0.3);
  }
  .mc-result pre {
    margin: 4px 0 0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.82rem;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .mc-ans { font-size: 0.72rem; color: var(--text-secondary); }

  .mc-keypad { display: flex; flex-direction: column; gap: 4px; }
  .mc-krow { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
  .mc-key {
    padding: 6px 4px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    cursor: pointer;
  }
  .mc-key:hover { background: rgb(180 140 255 / 0.2); }

  .mc-history { margin-top: 4px; }
  .mc-hlbl { font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 4px; }
  .mc-history ul { list-style: none; margin: 0; padding: 0; }
  .mc-hitem {
    width: 100%; text-align: left;
    display: flex; justify-content: space-between; gap: 8px;
    padding: 4px 6px; border: 0; background: transparent;
    cursor: pointer; font-size: 0.74rem;
    border-radius: 6px;
  }
  .mc-hitem:hover { background: var(--chrome-hover); }
  .mc-hitem code { color: var(--code-fg); }
  .mc-hitem .ok { color: #7fe6c4; }
  .mc-hitem .bad { color: #ff9d9d; }

  .mc-viz-head {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    font-size: 0.82rem; font-weight: 600;
  }
  .mc-plot-expr {
    flex: 1; min-width: 120px;
    padding: 5px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: monospace;
  }
  .mc-range {
    display: flex; align-items: center; gap: 4px;
    font-size: 0.74rem; color: var(--text-secondary);
  }
  .mc-range input { width: 56px; padding: 3px 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: inherit; }

  .mc-canvas {
    flex: 1; min-height: 220px;
    width: 100%;
    border-radius: 10px;
    border: 1px solid rgb(255 255 255 / 0.08);
  }
  .mc-help {
    margin: 0; padding: 0 0 0 16px;
    font-size: 0.68rem; color: var(--text-secondary);
    line-height: 1.5;
  }

  @media (max-width: 900px) {
    .mc-body { grid-template-columns: 1fr; }
    .matlab-calc { height: auto; }
  }
</style>
