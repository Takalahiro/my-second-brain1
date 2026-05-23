<script lang="ts">
  import { onMount } from 'svelte';
  import FormulaKeypad from './FormulaKeypad.svelte';
  import NumberSpin from './NumberSpin.svelte';
  import CalcStepPlayer from './CalcStepPlayer.svelte';
  import {
    buildDerivativeSteps,
    buildIntegralSteps,
    buildTaylorSteps,
    evalTaylorPoly,
    taylorCoeffsAt,
  } from '../../lib/calculus/steps';
  import type { CalcStepSequence } from '../../lib/calculus/types';
  import { stablePlotBounds } from '../../lib/calculus/plot-bounds';
  import {
    evalFn,
    numericalDerivative,
    riemannSum,
    sampleFn,
    type RiemannMode,
  } from '../../lib/calculus/engine';
  import {
    drawCurve,
    drawGrid,
    makeMappers,
    setupCanvas,
    DEFAULT_PAD,
    type PlotBounds,
  } from '../../lib/plot/canvas2d';

  type Mode = 'derivative' | 'integral' | 'taylor';

  let mode = $state<Mode>('taylor');
  let expr = $state('sin(x)');
  let xMin = $state(-4);
  let xMax = $state(4);
  let x0 = $state(1);
  let aInt = $state(0);
  let bInt = $state(2);
  let riemannMode = $state<RiemannMode>('mid');
  let taylorOrder = $state(5);
  let taylorCenter = $state(0);
  let taylorEvalAt = $state(1.5);

  let sequence = $state<CalcStepSequence | null>(null);
  let playerStep = $state(0);

  let canvas: HTMLCanvasElement | null = null;

  const currentViz = $derived(sequence?.steps[playerStep]?.viz ?? {});

  const plotBounds = $derived.by((): PlotBounds => {
    return stablePlotBounds(mode, expr, xMin, xMax, {
      x0,
      aInt,
      bInt,
      riemannMode,
      taylorCenter,
      taylorOrder,
    });
  });

  function runSteps() {
    if (mode === 'derivative') sequence = buildDerivativeSteps(expr, x0);
    else if (mode === 'integral') sequence = buildIntegralSteps(expr, aInt, bInt, riemannMode);
    else sequence = buildTaylorSteps(expr, taylorCenter, taylorOrder, taylorEvalAt);
    playerStep = 0;
  }

  function switchMode(next: Mode) {
    if (mode === next) return;
    mode = next;
    runSteps();
  }

  function drawStaticPoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 5) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = `${color}33`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw() {
    if (!canvas) return;
    const { ctx, cw, ch } = setupCanvas(canvas);
    const bounds = plotBounds;
    const { toX, toY } = makeMappers(cw, ch, bounds, DEFAULT_PAD);
    const pts = sampleFn(expr, xMin, xMax, 300);

    drawGrid(ctx, cw, ch, bounds);
    drawCurve(ctx, pts.map((p) => p.x), pts.map((p) => p.y), cw, ch, bounds, {
      stroke: mode === 'taylor' ? '#7ec8ff' : '#b48cff',
      width: 2.5,
    });

    if (mode === 'taylor') {
      const order = currentViz.taylorOrder ?? taylorOrder;
      const coeffs = taylorCoeffsAt(expr, taylorCenter, order);
      const poly = (x: number) => evalTaylorPoly(coeffs, taylorCenter, x);
      const polyPts = pts.map((p) => ({ x: p.x, y: poly(p.x) }));
      drawCurve(ctx, polyPts.map((p) => p.x), polyPts.map((p) => p.y), cw, ch, bounds, {
        stroke: '#00ff9d',
        width: 2,
        dash: [6, 4],
      });

      const ya = evalFn(expr, taylorCenter);
      drawStaticPoint(ctx, toX(taylorCenter), toY(ya), '#ffd56a', 6);
      ctx.fillStyle = '#ffd56a';
      ctx.font = '10px sans-serif';
      ctx.fillText(`a=${taylorCenter}`, toX(taylorCenter) + 8, toY(ya) - 8);

      const hx = currentViz.highlightX ?? taylorEvalAt;
      if (Number.isFinite(hx)) {
        const yf = evalFn(expr, hx);
        const yp = poly(hx);
        drawStaticPoint(ctx, toX(hx), toY(yf), '#7ec8ff', 5);
        drawStaticPoint(ctx, toX(hx), toY(yp), '#00ff9d', 4);
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(toX(hx), toY(yf));
        ctx.lineTo(toX(hx), toY(yp));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      return;
    }

    if (mode === 'derivative') {
      const h = currentViz.derivH ?? 0.5;
      const y0v = evalFn(expr, x0);
      drawStaticPoint(ctx, toX(x0), toY(y0v), '#00ff9d', 6);

      if (h > 0) {
        const y1 = evalFn(expr, x0 + h);
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = 'rgba(255,200,120,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(x0), toY(y0v));
        ctx.lineTo(toX(x0 + h), toY(y1));
        ctx.stroke();
        ctx.setLineDash([]);
        drawStaticPoint(ctx, toX(x0 + h), toY(y1), '#ffd56a', 4);
      }

      const slope = h > 0 ? (evalFn(expr, x0 + h) - y0v) / h : numericalDerivative(expr, x0);
      const dx = (xMax - xMin) * 0.25;
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(toX(x0 - dx), toY(y0v - slope * dx));
      ctx.lineTo(toX(x0 + dx), toY(y0v + slope * dx));
      ctx.stroke();
      return;
    }

    const n = currentViz.riemannN ?? 8;
    const riemann = riemannSum(expr, aInt, bInt, n, riemannMode);
    for (const r of riemann.rects) {
      const x0p = toX(r.x0);
      const x1p = toX(r.x1);
      const y0p = toY(0);
      const y1p = toY(r.y1);
      ctx.fillStyle = 'rgba(0,255,157,0.18)';
      ctx.strokeStyle = 'rgba(0,255,157,0.45)';
      ctx.fillRect(x0p, Math.min(y0p, y1p), x1p - x0p, Math.abs(y1p - y0p));
      ctx.strokeRect(x0p, Math.min(y0p, y1p), x1p - x0p, Math.abs(y1p - y0p));
    }
  }

  $effect(() => {
    void mode;
    void expr;
    void xMin;
    void xMax;
    void x0;
    void aInt;
    void bInt;
    void riemannMode;
    void taylorOrder;
    void taylorCenter;
    void taylorEvalAt;
    void playerStep;
    void plotBounds;
    draw();
  });

  onMount(() => {
    runSteps();
    const ro = new ResizeObserver(() => draw());
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<div class="calc-lab">
  <aside class="cl-sidebar">
    <section class="cl-section">
      <h2>微积分可视化</h2>
      <p class="cl-intro">① 选模式 → ② 输入公式 → ③ 调参数 → ④ ▶ 逐步演示</p>
      <div class="cl-modes">
        <button type="button" class:active={mode === 'taylor'} onclick={() => switchMode('taylor')}>Taylor · 余项</button>
        <button type="button" class:active={mode === 'derivative'} onclick={() => switchMode('derivative')}>导数 · 切线</button>
        <button type="button" class:active={mode === 'integral'} onclick={() => switchMode('integral')}>定积分 · 黎曼和</button>
      </div>
    </section>

    <section class="cl-section">
      <FormulaKeypad bind:value={expr} />
    </section>

    <section class="cl-section cl-params">
      <div class="cl-row">
        <NumberSpin bind:value={xMin} step={0.5} label="x 最小" />
        <NumberSpin bind:value={xMax} step={0.5} label="x 最大" />
      </div>

      <div class="cl-mode-fields">
        <div class="cl-mode-panel" class:visible={mode === 'derivative'}>
          <NumberSpin bind:value={x0} step={0.1} label="切点 x₀" />
        </div>
        <div class="cl-mode-panel" class:visible={mode === 'integral'}>
          <div class="cl-row">
            <NumberSpin bind:value={aInt} step={0.1} label="积分下限 a" />
            <NumberSpin bind:value={bInt} step={0.1} label="积分上限 b" />
          </div>
          <div class="cl-riemann-modes">
            {#each [['left','左端点'], ['mid','中点'], ['right','右端点'], ['trap','梯形']] as [id, lbl]}
              <button type="button" class:active={riemannMode === id} onclick={() => (riemannMode = id as RiemannMode)}>{lbl}</button>
            {/each}
          </div>
        </div>
        <div class="cl-mode-panel" class:visible={mode === 'taylor'}>
          <NumberSpin bind:value={taylorCenter} step={0.1} label="展开中心 a" />
          <NumberSpin bind:value={taylorEvalAt} step={0.1} label="验证点 x" />
          <label class="cl-range">Taylor 阶数 n = {taylorOrder}
            <input type="range" min="1" max="8" bind:value={taylorOrder} />
          </label>
        </div>
      </div>

      <button type="button" class="cl-run" onclick={runSteps}>▶ 开始逐步演示</button>
    </section>
  </aside>

  <main class="cl-main">
    <div class="cl-viz-frame">
      <canvas bind:this={canvas} class="cl-canvas" width="640" height="320"></canvas>
      <div class="cl-legend">
        {#if mode === 'derivative'}
          <span><i style="background:#b48cff"></i> y=f(x)</span>
          <span><i style="background:#ffd56a"></i> 割线</span>
          <span><i style="background:#00ff9d"></i> 切线</span>
        {:else if mode === 'integral'}
          <span><i style="background:#b48cff"></i> f(x)</span>
          <span><i style="background:#00ff9d"></i> 黎曼矩形</span>
        {:else}
          <span><i style="background:#7ec8ff"></i> 原函数</span>
          <span><i style="background:#00ff9d"></i> Pₙ(x)</span>
          <span><i style="background:#ffd56a"></i> 展开点 a</span>
        {/if}
      </div>
    </div>
    <div class="cl-player-wrap">
      <CalcStepPlayer {sequence} bind:playerStep />
    </div>
  </main>
</div>

<style>
  .calc-lab {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr;
    gap: 16px;
    min-height: calc(100vh - 100px);
    padding: 12px 16px 20px;
  }
  .cl-sidebar { display: flex; flex-direction: column; gap: 12px; overflow: auto; max-height: calc(100vh - 100px); }
  .cl-section {
    padding: 14px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }
  .cl-section h2 { margin: 0 0 6px; font-size: 0.82rem; color: var(--text-secondary); letter-spacing: 0.05em; }
  .cl-intro { margin: 0 0 10px; font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; }
  .cl-modes { display: flex; flex-direction: column; gap: 6px; }
  .cl-modes button {
    padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; text-align: left; font-size: 0.78rem;
  }
  .cl-modes button.active { background: rgb(126 200 255 / 0.15); border-color: rgb(126 200 255 / 0.4); }
  .cl-row { display: flex; gap: 8px; margin-bottom: 8px; }
  .cl-row > :global(*) { flex: 1; }
  .cl-mode-fields {
    position: relative;
    min-height: 132px;
    margin-bottom: 4px;
  }
  .cl-mode-panel {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }
  .cl-mode-panel.visible {
    position: relative;
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
  }
  .cl-range { display: block; font-size: 0.72rem; color: var(--text-secondary); margin: 8px 0; }
  .cl-range input { width: 100%; margin-top: 4px; }
  .cl-riemann-modes { display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap; }
  .cl-riemann-modes button {
    padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; font-size: 0.72rem;
  }
  .cl-riemann-modes button.active { background: rgb(0 255 157 / 0.15); border-color: rgb(0 255 157 / 0.35); }
  .cl-run {
    width: 100%; margin-top: 10px; padding: 10px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, #7ec8ff, #00ff9d); color: #0a1f12; font-weight: 650;
    cursor: pointer; font-size: 0.82rem;
  }
  .cl-main {
    padding: 12px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgb(126 200 255 / 0.08), transparent 55%), var(--bg-secondary);
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 420px;
  }
  .cl-viz-frame {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid rgb(126 200 255 / 0.12);
    background: rgb(0 0 0 / 0.15);
  }
  .cl-canvas {
    display: block;
    width: 100%;
    height: 320px;
    border-radius: 10px;
  }
  .cl-legend { display: flex; gap: 16px; font-size: 0.72rem; color: var(--text-secondary); padding: 0 4px; flex-wrap: wrap; }
  .cl-legend span { display: flex; align-items: center; gap: 6px; }
  .cl-legend i { width: 12px; height: 12px; border-radius: 3px; display: block; }
  .cl-player-wrap {
    flex: 1;
    min-height: 200px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgb(126 200 255 / 0.15);
    background: rgb(126 200 255 / 0.05);
    overflow: auto;
  }
  @media (max-width: 960px) { .calc-lab { grid-template-columns: 1fr; } .cl-sidebar { max-height: none; } }
</style>
