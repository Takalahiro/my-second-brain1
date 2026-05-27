<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import { evaluate, plotFunction, CALC_HELP, type CalcResult } from '../lib/calc-engine';
  import { isHudSkinActive, subscribeHudMode } from '../features/ui/hud-mode.svelte';

  interface Props {
    // 紧凑模式（小组件用）
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  type TabId = 'matrix' | 'calculus' | 'discrete' | 'statistics' | 'expr';
  let tab = $state<TabId>('matrix');
  let hudMode = $state(false);

  const TAB_MISSION: Record<TabId, string> = {
    matrix: 'MATRIX LAB',
    calculus: 'CALCULUS DECK',
    discrete: 'DISCRETE SYS',
    statistics: 'STATS TELEMETRY',
    expr: 'EXPR CONSOLE',
  };

  type LabId = Exclude<TabId, 'expr'>;
  type LabModule = { default: Component };

  async function loadLab(id: LabId): Promise<LabModule> {
    switch (id) {
      case 'matrix':
        return import('./matrix/MatrixLab.svelte');
      case 'calculus':
        return import('./calculus/CalculusLab.svelte');
      case 'discrete':
        return import('./discrete/DiscreteLab.svelte');
      case 'statistics':
        return import('./statistics/StatisticsLab.svelte');
      default:
        throw new Error(`Unknown lab: ${id satisfies never}`);
    }
  }

  const TAB_HINTS: Record<TabId, string> = {
    matrix: '输入矩阵 → 选运算 → ▶ 逐步演示',
    calculus: '按键拼公式 → 调参数 → ▶ 看割线/矩形/Taylor',
    discrete: '真值表 · 集合 · 组合 · 图论',
    statistics: '分布 · 假设检验 · 概率',
    expr: '像 MATLAB 一样输入表达式，Enter 执行',
  };

  const EXPR_PRESETS = [
    { label: 'sin(π/2)', expr: 'sin(pi/2)' },
    { label: '2×2 行列式', expr: 'det([1,2;3,4])' },
    { label: '2×2 逆矩阵', expr: 'inv([1,2;3,4])' },
    { label: 'e²', expr: 'e^2' },
    { label: '√2', expr: 'sqrt(2)' },
  ];

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
    const isHud = document.documentElement.dataset.ui === 'hud';
    const W = plotCanvas.width;
    const H = plotCanvas.height;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    plotCanvas.width = plotCanvas.clientWidth * dpr;
    plotCanvas.height = plotCanvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const cw = plotCanvas.clientWidth;
    const ch = plotCanvas.clientHeight;

    ctx.fillStyle = isHud ? '#0b1426' : '#0e0816';
    ctx.fillRect(0, 0, cw, ch);

    const data = plotFunction(plotExpr, xMin, xMax, 300);
    if ('error' in data) {
      ctx.fillStyle = isHud ? '#c8102e' : '#ff9d9d';
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
    ctx.strokeStyle = isHud ? 'rgba(245,242,235,0.08)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const y = 24 + ((ch - 48) * i) / 8;
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(cw - 8, y); ctx.stroke();
    }

    // 零线
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = isHud ? 'rgba(200,16,46,0.45)' : 'rgba(255,255,255,0.2)';
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
    if (isHud) {
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 1.5;
    } else {
      const grad = ctx.createLinearGradient(40, 0, cw, 0);
      grad.addColorStop(0, '#ff9ed4');
      grad.addColorStop(1, '#b48cff');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // 轴标签
    ctx.fillStyle = isHud ? '#9aafc9' : '#9d8fc0';
    ctx.font = '10px sans-serif';
    ctx.fillText(plotExpr, 44, 16);
    ctx.fillText(`${xMin.toFixed(1)}`, 42, ch - 6);
    ctx.fillText(`${xMax.toFixed(1)}`, cw - 36, ch - 6);
  }

  $effect(() => {
    void plotExpr;
    void xMin;
    void xMax;
    void hudMode;
    if (plotCanvas && !compact) {
      requestAnimationFrame(drawPlot);
    }
  });

  onMount(() => {
    hudMode = isHudSkinActive();
    const off = subscribeHudMode((v) => {
      hudMode = v;
      if (plotCanvas && !compact) requestAnimationFrame(drawPlot);
    });
    return off;
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

<div class="matlab-calc" class:compact class:is-hud-mission={hudMode}>
  {#if !compact && hudMode}
    <div class="hud-mission-bar">
      <span class="hud-mission-id">ORBITAL MATH LAB</span>
      <span class="hud-mission-patch" aria-hidden="true"></span>
      <span class="hud-mission-status">GRAV METRICS · TELEMETRY PLOT</span>
    </div>
  {/if}
  {#if !compact}
    <header class="mc-head">
      <div>
        <h1>MATLAB 计算器</h1>
        <p class="mc-sub">{TAB_HINTS[tab]}</p>
      </div>
      <nav class="mc-tabs" aria-label="计算器模块">
        <button type="button" class:active={tab === 'matrix'} onclick={() => (tab = 'matrix')} title="矩阵逐步可视化">
          矩阵
        </button>
        <button type="button" class:active={tab === 'calculus'} onclick={() => (tab = 'calculus')} title="导数 / 积分 / Taylor">
          微积分
        </button>
        <button type="button" class:active={tab === 'discrete'} onclick={() => (tab = 'discrete')} title="真值表 / 集合 / 组合 / 图">
          离散数学
        </button>
        <button type="button" class:active={tab === 'statistics'} onclick={() => (tab = 'statistics')} title="分布 / 检验 / 概率">
          统计学
        </button>
        <button type="button" class:active={tab === 'expr'} onclick={() => (tab = 'expr')} title="快速算式与绘图">
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
      <div class="hud-lab-frame">
        {#if hudMode}
          <div class="hud-lab-frame-head">
            <strong>{TAB_MISSION[tab]}</strong>
            <span>SIGNAL LOCK · MODULE READY</span>
          </div>
        {/if}
        <LabComponent />
      </div>
    {/if}
  {:else}
  <div class="mc-body">
    <section class="mc-command">
      <div class="mc-input-row">
        <span class="mc-prompt">&gt;&gt;</span>
        <input
          type="text"
          class="mc-input ui-input"
          bind:value={expr}
          onkeydown={onKey}
          placeholder="例如 sin(pi/2) 或 det([1,2;3,4])，按 Enter 计算"
          autocomplete="off"
          aria-label="表达式输入"
        />
        <button type="button" class="mc-run ui-button ui-button--primary" onclick={submit}>执行</button>
        <button type="button" class="mc-clear pixel-button ui-button ui-button--ghost" onclick={() => { expr = ''; lastResult = null; }} title="清空">清空</button>
      </div>

      <div class="mc-presets">
        <span class="mc-presets-label">快捷示例</span>
        {#each EXPR_PRESETS as p}
          <button type="button" class="mc-preset" onclick={() => { expr = p.expr; submit(); }}>{p.label}</button>
        {/each}
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
    color: var(--text, var(--text-primary));
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: calc(100dvh - var(--site-nav-offset, 88px));
    padding: var(--space-3) var(--space-4);
  }
  .matlab-calc.compact {
    height: 100%;
    padding: 0;
    gap: var(--space-2);
  }
  .mc-head h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }
  .mc-sub {
    margin: var(--space-1) 0 0;
    color: var(--text-muted, var(--text-secondary));
    font-size: var(--text-sm);
  }
  .mc-tabs {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .mc-tabs button {
    padding: var(--space-2) var(--space-3);
    border-radius: 999px;
    border: 1px solid var(--border, var(--border-color));
    background: var(--surface, var(--bg-secondary));
    color: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
    transition: background var(--motion-fast), border-color var(--motion-fast);
  }
  .mc-tabs button.active {
    background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 25%, transparent);
    border-color: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 45%, transparent);
    font-weight: var(--weight-semibold);
  }
  .mc-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-3);
    flex-wrap: wrap;
    padding: 0 var(--space-4);
  }

  .mc-lab-loading,
  .mc-lab-error {
    margin: 0 var(--space-4);
    padding: var(--space-5) var(--space-4);
    border-radius: var(--radius-card);
    border: 1px dashed color-mix(in srgb, var(--accent-out, var(--ui-accent)) 25%, transparent);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-muted, var(--text-secondary));
  }

  .mc-lab-error {
    color: var(--color-error);
    border-color: color-mix(in srgb, var(--color-error) 35%, transparent);
    background: var(--color-error-soft);
  }

  .mc-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(320px, 1.2fr);
    gap: var(--space-3);
  }
  .matlab-calc.compact .mc-body {
    grid-template-columns: 1fr;
  }

  .mc-command, .mc-viz {
    background: var(--surface, var(--bg-secondary));
    border: 1px solid var(--border, var(--border-color));
    border-radius: var(--radius-card);
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 0;
    overflow: auto;
    box-shadow: var(--shadow-sm);
  }

  .mc-input-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .mc-prompt {
    color: var(--accent-out, var(--ui-accent));
    font-family: var(--font-mono);
    font-weight: var(--weight-bold);
    font-size: var(--text-sm);
  }
  .mc-input {
    flex: 1;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--code-bg);
    color: var(--code-fg);
  }
  .mc-run {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-button);
    border: 0;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .mc-run.small { padding: var(--space-1) var(--space-3); font-size: var(--text-xs); }
  .mc-clear {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-xs);
  }

  .mc-presets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  .mc-presets-label {
    font-size: var(--text-xs);
    color: var(--text-muted, var(--text-secondary));
    margin-right: var(--space-1);
  }
  .mc-preset {
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
    border: 1px solid var(--border, var(--border-color));
    background: var(--bg, var(--bg-primary));
    color: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
    transition: background var(--motion-fast), border-color var(--motion-fast);
  }
  .mc-preset:hover {
    background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 18%, transparent);
    border-color: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 35%, transparent);
  }

  .mc-result {
    padding: var(--space-3);
    border-radius: var(--radius-button);
    background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-out, var(--ui-accent)) 25%, transparent);
  }
  .mc-result.err {
    background: var(--color-error-soft);
    border-color: color-mix(in srgb, var(--color-error) 30%, transparent);
  }
  .mc-result pre {
    margin: var(--space-1) 0 0;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    white-space: pre-wrap;
    word-break: break-all;
  }
  .mc-ans { font-size: var(--text-xs); color: var(--text-muted, var(--text-secondary)); }

  .mc-keypad { display: flex; flex-direction: column; gap: var(--space-1); }
  .mc-krow { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-1); }
  .mc-key {
    padding: var(--space-2) var(--space-1);
    border-radius: var(--radius-tag);
    border: 1px solid var(--border, var(--border-color));
    background: var(--bg, var(--bg-primary));
    color: var(--text, var(--text-primary));
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    cursor: pointer;
    transition: background var(--motion-fast);
  }
  .mc-key:hover { background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 20%, transparent); }

  .mc-history { margin-top: var(--space-1); }
  .mc-hlbl { font-size: var(--text-xs); color: var(--text-muted, var(--text-secondary)); margin-bottom: var(--space-1); }
  .mc-history ul { list-style: none; margin: 0; padding: 0; }
  .mc-hitem {
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: var(--text-xs);
    border-radius: var(--radius-tag);
  }
  .mc-hitem:hover { background: var(--overlay-medium, var(--chrome-hover)); }
  .mc-hitem code { color: var(--code-fg); }
  .mc-hitem .ok { color: var(--color-success); }
  .mc-hitem .bad { color: var(--color-error); }

  .mc-viz-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
  }
  .mc-plot-expr {
    flex: 1;
    min-width: 120px;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-tag);
    border: 1px solid var(--border, var(--border-color));
    background: var(--code-bg);
    color: var(--code-fg);
    font-family: var(--font-mono);
  }
  .mc-range {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-muted, var(--text-secondary));
  }
  .mc-range input {
    width: 56px;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-tag);
    border: 1px solid var(--border, var(--border-color));
    background: var(--bg, var(--bg-primary));
    color: inherit;
  }

  .mc-canvas {
    flex: 1;
    min-height: 220px;
    width: 100%;
    border-radius: var(--radius-button);
    border: 1px solid var(--border-subtle, var(--border-color));
  }
  .mc-help {
    margin: 0;
    padding: 0 0 0 var(--space-4);
    font-size: var(--text-xs);
    color: var(--text-muted, var(--text-secondary));
    line-height: var(--leading-normal);
  }

  @media (max-width: 900px) {
    .mc-body { grid-template-columns: 1fr; }
    .matlab-calc { height: auto; }
  }
</style>
