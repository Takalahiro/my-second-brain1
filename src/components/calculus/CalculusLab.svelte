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
  import {
    evalFn,
    numericalDerivative,
    riemannSum,
    sampleFn,
    type RiemannMode,
  } from '../../lib/calculus/engine';
  import {
    autoYBounds,
    drawCurve,
    drawGrid,
    drawPulsePoint,
    makeMappers,
    setupCanvas,
    DEFAULT_PAD,
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
  let pulseNow = $state(0);

  const currentViz = $derived(sequence?.steps[playerStep]?.viz ?? {});

  function runSteps() {
    if (mode === 'derivative') sequence = buildDerivativeSteps(expr, x0);
    else if (mode === 'integral') sequence = buildIntegralSteps(expr, aInt, bInt, riemannMode);
    else sequence = buildTaylorSteps(expr, taylorCenter, taylorOrder, taylorEvalAt);
    playerStep = 0;
  }

  function draw() {
    if (!canvas) return;
    const { ctx, cw, ch } = setupCanvas(canvas);

    if (mode === 'taylor') {
      const order = currentViz.taylorOrder ?? taylorOrder;
      const coeffs = taylorCoeffsAt(expr, taylorCenter, order);
      const poly = (x: number) => evalTaylorPoly(coeffs, taylorCenter, x);
      const pts = sampleFn(expr, xMin, xMax, 300);
      const polyPts = pts.map((p) => ({ x: p.x, y: poly(p.x) }));
      const yAll = [...pts.map((p) => p.y), ...polyPts.map((p) => p.y)].filter(Number.isFinite);
      const { yMin, yMax } = autoYBounds(yAll);
      const bounds = { xMin, xMax, yMin, yMax };
      const { toX, toY } = makeMappers(cw, ch, bounds, DEFAULT_PAD);

      drawGrid(ctx, cw, ch, bounds);
      drawCurve(ctx, pts.map((p) => p.x), pts.map((p) => p.y), cw, ch, bounds, { stroke: '#7ec8ff', width: 2.5 });
      drawCurve(ctx, polyPts.map((p) => p.x), polyPts.map((p) => p.y), cw, ch, bounds, {
        stroke: '#00ff9d',
        width: 2,
        dash: [6, 4],
      });

      // 展开中心 a
      const ya = evalFn(expr, taylorCenter);
      drawPulsePoint(ctx, toX(taylorCenter), toY(ya), '#ffd56a', 6, pulseNow);
      ctx.fillStyle = '#ffd56a';
      ctx.font = '10px sans-serif';
      ctx.fillText(`a=${taylorCenter}`, toX(taylorCenter) + 8, toY(ya) - 8);

      const hx = currentViz.highlightX ?? taylorEvalAt;
      if (Number.isFinite(hx)) {
        const yf = evalFn(expr, hx);
        const yp = poly(hx);
        drawPulsePoint(ctx, toX(hx), toY(yf), '#7ec8ff', 5, pulseNow);
        drawPulsePoint(ctx, toX(hx), toY(yp), '#00ff9d', 4, pulseNow);
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

    const pts = sampleFn(expr, xMin, xMax, 300);
    const yAll = [...pts.map((p) => p.y)];
    const bounds = { xMin, xMax, yMin: 0, yMax: 1 };

    if (mode === 'derivative') {
      const h = currentViz.derivH ?? 0.5;
      const y0v = evalFn(expr, x0);
      yAll.push(y0v);
      if (h > 0) yAll.push(evalFn(expr, x0 + h));
      const { yMin, yMax } = autoYBounds(yAll);
      Object.assign(bounds, { yMin, yMax });
      const { toX, toY } = makeMappers(cw, ch, bounds, DEFAULT_PAD);

      drawGrid(ctx, cw, ch, bounds);
      drawCurve(ctx, pts.map((p) => p.x), pts.map((p) => p.y), cw, ch, bounds, { stroke: '#b48cff', width: 2.5 });

      drawPulsePoint(ctx, toX(x0), toY(y0v), '#00ff9d', 6, pulseNow);

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
        drawPulsePoint(ctx, toX(x0 + h), toY(y1), '#ffd56a', 4, pulseNow);
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

    // integral
    const n = currentViz.riemannN ?? 8;
    const riemann = riemannSum(expr, aInt, bInt, n, riemannMode);
    for (const r of riemann.rects) yAll.push(r.y1);
    const { yMin, yMax } = autoYBounds(yAll);
    Object.assign(bounds, { yMin, yMax });
    const { toX, toY } = makeMappers(cw, ch, bounds, DEFAULT_PAD);

    drawGrid(ctx, cw, ch, bounds);
    drawCurve(ctx, pts.map((p) => p.x), pts.map((p) => p.y), cw, ch, bounds, { stroke: '#b48cff', width: 2.5 });

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
    void sequence;
    void playerStep;
  });

  onMount(() => {
    runSteps();
    const ro = new ResizeObserver(() => draw());
    if (canvas) ro.observe(canvas);
    let raf = 0;
    const tick = (t: number) => {
      pulseNow = t;
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  });
</script>

<div class="calc-lab">
  <aside class="cl-sidebar">
    <section class="cl-section">
      <h2>微积分可视化</h2>
      <p class="cl-intro">用按钮输入公式与数字，无需手写 MATLAB 语法</p>
      <div class="cl-modes">
        <button type="button" class:active={mode === 'taylor'} onclick={() => { mode = 'taylor'; sequence = null; runSteps(); }}>Taylor · 余项</button>
        <button type="button" class:active={mode === 'derivative'} onclick={() => { mode = 'derivative'; sequence = null; runSteps(); }}>导数 · 切线</button>
        <button type="button" class:active={mode === 'integral'} onclick={() => { mode = 'integral'; sequence = null; runSteps(); }}>定积分 · 黎曼和</button>
      </div>
    </section>

    <section class="cl-section">
      <FormulaKeypad bind:value={expr} />
    </section>

    <section class="cl-section">
      <div class="cl-row">
        <NumberSpin bind:value={xMin} step={0.5} label="x 最小" />
        <NumberSpin bind:value={xMax} step={0.5} label="x 最大" />
      </div>

      {#if mode === 'derivative'}
        <NumberSpin bind:value={x0} step={0.1} label="切点 x₀" />
      {:else if mode === 'integral'}
        <div class="cl-row">
          <NumberSpin bind:value={aInt} step={0.1} label="积分下限 a" />
          <NumberSpin bind:value={bInt} step={0.1} label="积分上限 b" />
        </div>
        <div class="cl-riemann-modes">
          {#each [['left','左端点'], ['mid','中点'], ['right','右端点'], ['trap','梯形']] as [id, lbl]}
            <button type="button" class:active={riemannMode === id} onclick={() => (riemannMode = id as RiemannMode)}>{lbl}</button>
          {/each}
        </div>
      {:else}
        <NumberSpin bind:value={taylorCenter} step={0.1} label="展开中心 a" />
        <NumberSpin bind:value={taylorEvalAt} step={0.1} label="验证点 x" />
        <label class="cl-range">Taylor 阶数 n = {taylorOrder}
          <input type="range" min="1" max="8" bind:value={taylorOrder} />
        </label>
      {/if}

      <button type="button" class="cl-run" onclick={runSteps}>▶ 开始逐步演示</button>
    </section>
  </aside>

  <main class="cl-main">
    <canvas bind:this={canvas} class="cl-canvas"></canvas>
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
    padding: 12px; border-radius: 16px; border: 1px solid var(--border-color);
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgb(126 200 255 / 0.08), transparent 55%), var(--bg-secondary);
    display: flex; flex-direction: column; gap: 8px; min-height: 420px;
  }
  .cl-canvas { flex: 1; min-height: 280px; width: 100%; border-radius: 12px; }
  .cl-legend { display: flex; gap: 16px; font-size: 0.72rem; color: var(--text-secondary); padding: 0 8px; flex-wrap: wrap; }
  .cl-legend span { display: flex; align-items: center; gap: 6px; }
  .cl-legend i { width: 12px; height: 12px; border-radius: 3px; display: block; }
  .cl-player-wrap {
    padding: 12px; border-radius: 12px;
    border: 1px solid rgb(126 200 255 / 0.15);
    background: rgb(126 200 255 / 0.05);
    max-height: 280px; overflow: auto;
  }
  @media (max-width: 960px) { .calc-lab { grid-template-columns: 1fr; } .cl-sidebar { max-height: none; } }
</style>
