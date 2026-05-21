<script lang="ts">
  import { onMount } from 'svelte';
  import KatexBlock from '../matrix/KatexBlock.svelte';
  import CalcStepPlayer from '../calculus/CalcStepPlayer.svelte';
  import NumberSpin from '../calculus/NumberSpin.svelte';
  import {
    DISTRIBUTIONS,
    HYPOTHESIS_TESTS,
    PROB_TOPICS,
    buildHypothesisSteps,
    buildProbabilitySteps,
    defaultParams,
    fmt,
    getDistribution,
    histogram,
    probInInterval,
    sampleDistribution,
    simulateClt,
    type DistId,
    type HypothesisTestId,
    type ProbTopicId,
    type StatStepSequence,
  } from '../../lib/statistics';
  import {
    autoYBounds,
    drawCurve,
    drawGrid,
    setupCanvas,
  } from '../../lib/plot/canvas2d';
  import { normalPdf } from '../../lib/statistics/math-utils';

  type Mode = 'distribution' | 'hypothesis' | 'probability';

  let mode = $state<Mode>('distribution');
  let distId = $state<DistId>('normal');
  let distParams = $state<Record<string, number>>(defaultParams(getDistribution('normal')));
  let plotCdf = $state(false);
  let shadeA = $state(-1);
  let shadeB = $state(1);

  let testId = $state<HypothesisTestId>('t-one');
  let alpha = $state(0.05);
  let tail = $state<'two' | 'left' | 'right'>('two');
  let data1 = $state('2.1, 2.4, 1.9, 2.8, 2.2');
  let data2 = $state('3.1, 3.4, 2.9, 3.2');
  let mu0 = $state(2);
  let sigmaKnown = $state(1);
  let p0 = $state(0.5);
  let expected = $state('10, 20, 30');
  let matrix = $state('10 20\n15 25');

  let probTopic = $state<ProbTopicId>('bayes');
  let pA = $state(0.4);
  let pB = $state(0.5);
  let pAB = $state(0.2);
  let prior = $state(0.01);
  let likelihood = $state(0.95);
  let falsePos = $state(0.05);
  let partitions = $state('0.3, 0.5, 0.2');
  let sampleN = $state(30);
  let popMean = $state(0);
  let popStd = $state(1);

  let sequence = $state<StatStepSequence | null>(null);
  let playerStep = $state(0);
  let canvas: HTMLCanvasElement | null = null;

  const def = $derived(getDistribution(distId));
  const discreteDists = $derived(DISTRIBUTIONS.filter((d) => d.kind === 'discrete'));
  const continuousDists = $derived(DISTRIBUTIONS.filter((d) => d.kind === 'continuous'));
  const mu = $derived(def.mean(distParams));
  const varVal = $derived(def.variance(distParams));
  const shadeProb = $derived(probInInterval(def, distParams, shadeA, shadeB));

  function selectDist(id: DistId) {
    distId = id;
    distParams = defaultParams(getDistribution(id));
  }

  function runHypothesis() {
    sequence = buildHypothesisSteps({
      testId,
      alpha,
      tail,
      data1,
      data2,
      mu0,
      sigma: sigmaKnown,
      p0,
      expected,
      matrix,
    });
    playerStep = 0;
  }

  function runProbability() {
    sequence = buildProbabilitySteps({
      topic: probTopic,
      pA,
      pB,
      pAB,
      prior,
      likelihood,
      pBgivenA: falsePos,
      partitions,
      sampleN,
      popMean,
      popStd,
    });
    playerStep = 0;
  }

  function appendData(target: 'data1' | 'data2', val: string) {
    if (target === 'data1') data1 = data1 ? `${data1}, ${val}` : val;
    else data2 = data2 ? `${data2}, ${val}` : val;
  }

  function draw() {
    if (!canvas) return;
    const { ctx, cw, ch } = setupCanvas(canvas);

    if (mode === 'probability' && probTopic === 'clt') {
      const n = sampleN;
      const means = simulateClt(n, 800, popMean, popStd);
      const hist = histogram(means, 24);
      const se = popStd / Math.sqrt(n);
      const theory = hist.x.map((x) => ({ x, y: normalPdf(x, popMean, se) }));
      const yAll = [...hist.y, ...theory.map((p) => p.y)];
      const { yMin, yMax } = autoYBounds(yAll);
      const sup = { min: Math.min(...means), max: Math.max(...means) };
      const bounds = { xMin: sup.min - 0.5, xMax: sup.max + 0.5, yMin, yMax };
      drawGrid(ctx, cw, ch, bounds);
      drawCurve(ctx, hist.x, hist.y, cw, ch, bounds, { stroke: '#7ec8ff', width: 2 });
      drawCurve(ctx, theory.map((p) => p.x), theory.map((p) => p.y), cw, ch, bounds, { stroke: '#00ff9d', width: 2, dash: [5, 4] });
      ctx.fillStyle = '#9d8fc0';
      ctx.font = '11px sans-serif';
      ctx.fillText(`CLT: n=${n} 次抽样，蓝=样本均值分布，绿=理论 N(μ,σ²/n)`, 48, 16);
      return;
    }

    if (mode === 'distribution') {
      const sup = def.support(distParams);
      const { x, y } = sampleDistribution(def, distParams, sup.min, sup.max, 300, plotCdf);
      const { yMin, yMax } = autoYBounds(y);
      const bounds = { xMin: sup.min, xMax: sup.max, yMin, yMax };
      drawGrid(ctx, cw, ch, bounds);

      if (def.kind === 'discrete' && !plotCdf) {
        const barW = Math.max(8, (cw - 60) / Math.max(x.length, 1) * 0.7);
        const { toX, toY } = awaitImportMappers(cw, ch, bounds);
        for (let i = 0; i < x.length; i++) {
          const px = toX(x[i]) - barW / 2;
          const py = toY(y[i]);
          const py0 = toY(0);
          ctx.fillStyle = 'rgba(180,140,255,0.55)';
          ctx.fillRect(px, Math.min(py, py0), barW, Math.abs(py0 - py));
        }
      } else {
        drawCurve(ctx, x, y, cw, ch, bounds, {
          stroke: plotCdf ? '#00ff9d' : '#b48cff',
          width: 2.5,
        });
      }

      if (!plotCdf && shadeA < shadeB) {
        shadeRegion(ctx, cw, ch, bounds, def, distParams, shadeA, shadeB);
      }
      return;
    }

    // hypothesis: show normal/t reference if z-mean
    if (mode === 'hypothesis') {
      const sup = { min: -4, max: 4 };
      const xs: number[] = [];
      const ys: number[] = [];
      for (let i = 0; i <= 200; i++) {
        const x = sup.min + (i / 200) * (sup.max - sup.min);
        xs.push(x);
        ys.push(normalPdf(x));
      }
      const { yMin, yMax } = autoYBounds(ys);
      const bounds = { xMin: sup.min, xMax: sup.max, yMin, yMax };
      drawGrid(ctx, cw, ch, bounds);
      drawCurve(ctx, xs, ys, cw, ch, bounds, { stroke: '#b48cff', width: 2, fill: 'rgba(180,140,255,0.1)' });
      const zc = 1.96;
      shadeRegionContinuous(ctx, cw, ch, bounds, (x) => normalPdf(x), zc, sup.max);
      shadeRegionContinuous(ctx, cw, ch, bounds, (x) => normalPdf(x), sup.min, -zc);
      ctx.fillStyle = '#9d8fc0';
      ctx.font = '11px sans-serif';
      ctx.fillText('标准正态参考曲线 · 阴影为 α=0.05 双侧拒绝域', 48, 16);
    }
  }

  function awaitImportMappers(cw: number, ch: number, bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) {
    const pad = { left: 44, right: 16, top: 20, bottom: 28 };
    const pw = cw - pad.left - pad.right;
    const ph = ch - pad.top - pad.bottom;
    const toX = (x: number) => pad.left + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * pw;
    const toY = (y: number) => pad.top + ph - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * ph;
    return { toX, toY };
  }

  function shadeRegion(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
    d: typeof def,
    params: Record<string, number>,
    a: number,
    b: number
  ) {
    const { x, y } = sampleDistribution(d, params, bounds.xMin, bounds.xMax, 300, false);
    const pts = x.map((xi, i) => ({ x: xi, y: xi >= a && xi <= b ? y[i] : 0 }));
    drawCurve(ctx, pts.map((p) => p.x), pts.map((p) => p.y), cw, ch, bounds, {
      stroke: '#00ff9d',
      width: 1.5,
    });
  }

  function shadeRegionContinuous(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number },
    pdf: (x: number) => number,
    a: number,
    b: number
  ) {
    const n = 100;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i <= n; i++) {
      const x = a + (i / n) * (b - a);
      xs.push(x);
      ys.push(pdf(x));
    }
    drawCurve(ctx, xs, ys, cw, ch, bounds, { stroke: '#ff9d9d', width: 1.5 });
  }

  $effect(() => {
    void mode;
    void distId;
    void distParams;
    void plotCdf;
    void shadeA;
    void shadeB;
    void probTopic;
    void sampleN;
    void popMean;
    void popStd;
    void testId;
    void sequence;
    void playerStep;
    if (canvas) requestAnimationFrame(draw);
  });

  onMount(() => {
    const ro = new ResizeObserver(() => draw());
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<div class="stat-lab">
  <aside class="sl-sidebar">
    <section class="sl-section">
      <h2>统计学可视化</h2>
      <p class="sl-intro">概率分布 · 假设检验 · 概率论逐步指导</p>
      <div class="sl-modes">
        <button type="button" class:active={mode === 'distribution'} onclick={() => (mode = 'distribution')}>概率分布</button>
        <button type="button" class:active={mode === 'hypothesis'} onclick={() => { mode = 'hypothesis'; sequence = null; }}>假设检验</button>
        <button type="button" class:active={mode === 'probability'} onclick={() => { mode = 'probability'; sequence = null; }}>概率论指导</button>
      </div>
    </section>

    {#if mode === 'distribution'}
      <section class="sl-section">
        <h3>离散分布</h3>
        <div class="sl-pills">
          {#each discreteDists as d}
            <button type="button" class:active={distId === d.id} onclick={() => selectDist(d.id)}>{d.nameZh}</button>
          {/each}
        </div>
        <h3>连续分布</h3>
        <div class="sl-pills">
          {#each continuousDists as d}
            <button type="button" class:active={distId === d.id} onclick={() => selectDist(d.id)}>{d.nameZh}</button>
          {/each}
        </div>
      </section>
      <section class="sl-section">
        {#each def.params as pr}
          <NumberSpin
            value={distParams[pr.id]}
            step={pr.step}
            min={pr.min}
            max={pr.max}
            label={pr.label}
            onchange={(v) => { distParams = { ...distParams, [pr.id]: v }; }}
          />
        {/each}
        <div class="sl-toggle">
          <button type="button" class:active={!plotCdf} onclick={() => (plotCdf = false)}>{def.kind === 'discrete' ? 'PMF' : 'PDF'}</button>
          <button type="button" class:active={plotCdf} onclick={() => (plotCdf = true)}>CDF</button>
        </div>
        {#if !plotCdf}
          <div class="sl-row">
            <NumberSpin bind:value={shadeA} step={0.5} label="区间下限" />
            <NumberSpin bind:value={shadeB} step={0.5} label="区间上限" />
          </div>
          <p class="sl-hint">P({shadeA} ≤ X ≤ {shadeB}) ≈ {fmt(shadeProb)}</p>
        {/if}
        <div class="sl-card">
          <KatexBlock tex={def.latex} display />
          <p>E[X] = {fmt(mu)}，Var(X) = {fmt(varVal)}</p>
        </div>
      </section>
    {:else if mode === 'hypothesis'}
      <section class="sl-section">
        <div class="sl-tests">
          {#each HYPOTHESIS_TESTS as t}
            <button type="button" class:active={testId === t.id} onclick={() => (testId = t.id)}>
              <strong>{t.label}</strong><span>{t.desc}</span>
            </button>
          {/each}
        </div>
      </section>
      <section class="sl-section">
        <NumberSpin bind:value={alpha} step={0.01} min={0.01} max={0.2} label="显著性水平 α" />
        <div class="sl-toggle">
          {#each [['two','双侧'], ['left','左尾'], ['right','右尾']] as [id, lbl]}
            <button type="button" class:active={tail === id} onclick={() => (tail = id as typeof tail)}>{lbl}</button>
          {/each}
        </div>
        <label class="sl-field">样本数据 1<input bind:value={data1} /></label>
        <div class="sl-data-pad">
          {#each ['1','2','3','4','5','6','7','8','9','0','.'] as k}
            <button type="button" onclick={() => appendData('data1', k)}>{k}</button>
          {/each}
        </div>
        {#if testId === 't-two'}
          <label class="sl-field">样本数据 2<input bind:value={data2} /></label>
        {/if}
        {#if testId === 'z-mean' || testId === 't-one'}
          <NumberSpin bind:value={mu0} step={0.1} label="H₀ 均值 μ₀" />
        {/if}
        {#if testId === 'z-mean'}
          <NumberSpin bind:value={sigmaKnown} step={0.1} min={0.01} label="已知 σ" />
        {/if}
        {#if testId === 'z-prop'}
          <NumberSpin bind:value={p0} step={0.05} min={0.01} max={0.99} label="H₀ 比例 p₀" />
        {/if}
        {#if testId === 'chi2-gof'}
          <label class="sl-field">期望频数<input bind:value={expected} /></label>
        {/if}
        {#if testId === 'chi2-indep' || testId === 'anova'}
          <label class="sl-field">矩阵（每行一组/一行）<textarea bind:value={matrix} rows="3"></textarea></label>
        {/if}
        <button type="button" class="sl-run" onclick={runHypothesis}>▶ 逐步检验</button>
      </section>
    {:else}
      <section class="sl-section">
        <div class="sl-tests">
          {#each PROB_TOPICS as t}
            <button type="button" class:active={probTopic === t.id} onclick={() => (probTopic = t.id)}>
              <strong>{t.label}</strong><span>{t.desc}</span>
            </button>
          {/each}
        </div>
      </section>
      <section class="sl-section">
        {#if probTopic === 'conditional' || probTopic === 'independence'}
          <NumberSpin bind:value={pA} step={0.05} min={0} max={1} label="P(A)" />
          <NumberSpin bind:value={pB} step={0.05} min={0} max={1} label="P(B)" />
          <NumberSpin bind:value={pAB} step={0.05} min={0} max={1} label="P(A∩B)" />
        {:else if probTopic === 'bayes'}
          <NumberSpin bind:value={prior} step={0.01} min={0.001} max={0.5} label="先验 P(H)" />
          <NumberSpin bind:value={likelihood} step={0.01} min={0.5} max={1} label="灵敏度 P(D|H)" />
          <NumberSpin bind:value={falsePos} step={0.01} min={0.01} max={0.5} label="假阳性 P(D|¬H)" />
        {:else if probTopic === 'total'}
          <label class="sl-field">划分 P(Bᵢ)<input bind:value={partitions} placeholder="0.3, 0.5, 0.2" /></label>
        {:else if probTopic === 'clt'}
          <NumberSpin bind:value={sampleN} step={1} min={5} max={100} label="样本量 n" />
          <NumberSpin bind:value={popMean} step={0.1} label="总体均值 μ" />
          <NumberSpin bind:value={popStd} step={0.1} min={0.1} label="总体标准差 σ" />
        {/if}
        <button type="button" class="sl-run" onclick={runProbability}>▶ 逐步推导</button>
      </section>
    {/if}
  </aside>

  <main class="sl-main">
    <canvas bind:this={canvas} class="sl-canvas"></canvas>
    <div class="sl-legend">
      {#if mode === 'distribution'}
        <span><i style="background:#b48cff"></i> {plotCdf ? 'CDF' : def.kind === 'discrete' ? 'PMF' : 'PDF'}</span>
        {#if !plotCdf}<span><i style="background:#00ff9d"></i> P(a≤X≤b)</span>{/if}
      {:else if mode === 'hypothesis'}
        <span><i style="background:#b48cff"></i> 参考分布</span>
        <span><i style="background:#ff9d9d"></i> 拒绝域</span>
      {:else if probTopic === 'clt'}
        <span><i style="background:#7ec8ff"></i> 样本均值直方图</span>
        <span><i style="background:#00ff9d"></i> 理论正态</span>
      {:else}
        <span>概率论公式推导见下方步骤</span>
      {/if}
    </div>
    {#if mode !== 'distribution'}
      <div class="sl-player">
        <CalcStepPlayer sequence={sequence} bind:playerStep />
      </div>
    {/if}
  </main>
</div>

<style>
  .stat-lab {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr;
    gap: 16px;
    min-height: calc(100vh - 100px);
    padding: 12px 16px 20px;
  }
  .sl-sidebar { display: flex; flex-direction: column; gap: 12px; overflow: auto; max-height: calc(100vh - 100px); }
  .sl-section {
    padding: 14px; border-radius: 16px;
    border: 1px solid var(--border-color); background: var(--bg-secondary);
  }
  .sl-section h2, .sl-section h3 { margin: 0 0 8px; font-size: 0.82rem; color: var(--text-secondary); }
  .sl-section h3 { margin-top: 10px; font-size: 0.72rem; }
  .sl-intro { margin: 0 0 10px; font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45; }
  .sl-modes { display: flex; flex-direction: column; gap: 6px; }
  .sl-modes button {
    padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; text-align: left; font-size: 0.78rem;
  }
  .sl-modes button.active { background: rgb(255 180 220 / 0.15); border-color: rgb(255 180 220 / 0.4); }
  .sl-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .sl-pills button {
    padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; font-size: 0.68rem; cursor: pointer;
  }
  .sl-pills button.active { background: rgb(180 140 255 / 0.2); border-color: rgb(180 140 255 / 0.45); font-weight: 650; }
  .sl-toggle { display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap; }
  .sl-toggle button {
    padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; font-size: 0.72rem;
  }
  .sl-toggle button.active { background: rgb(0 255 157 / 0.15); border-color: rgb(0 255 157 / 0.35); }
  .sl-row { display: flex; gap: 8px; }
  .sl-row > :global(*) { flex: 1; }
  .sl-hint { margin: 6px 0 0; font-size: 0.72rem; color: #00ff9d; }
  .sl-card {
    margin-top: 10px; padding: 10px; border-radius: 10px;
    background: rgb(180 140 255 / 0.08); border: 1px solid rgb(180 140 255 / 0.18);
  }
  .sl-card p { margin: 8px 0 0; font-size: 0.74rem; color: var(--text-secondary); }
  .sl-tests { display: flex; flex-direction: column; gap: 6px; }
  .sl-tests button {
    padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; text-align: left;
    display: flex; flex-direction: column; gap: 2px;
  }
  .sl-tests button strong { font-size: 0.78rem; }
  .sl-tests button span { font-size: 0.66rem; color: var(--text-secondary); }
  .sl-tests button.active { background: rgb(255 180 220 / 0.12); border-color: rgb(255 180 220 / 0.35); }
  .sl-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 8px; }
  .sl-field input, .sl-field textarea {
    padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--code-bg); color: inherit; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem;
  }
  .sl-data-pad { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 8px; }
  .sl-data-pad button {
    padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);
    background: var(--bg-primary); cursor: pointer; font-size: 0.78rem;
  }
  .sl-run {
    width: 100%; margin-top: 8px; padding: 10px; border-radius: 10px; border: 0;
    background: linear-gradient(135deg, #ffb4dc, #b48cff); color: #1c0f30; font-weight: 650; cursor: pointer;
  }
  .sl-main {
    padding: 12px; border-radius: 16px; border: 1px solid var(--border-color);
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgb(255 180 220 / 0.08), transparent 55%), var(--bg-secondary);
    display: flex; flex-direction: column; gap: 8px; min-height: 420px;
  }
  .sl-canvas { flex: 1; min-height: 280px; width: 100%; border-radius: 12px; }
  .sl-legend { display: flex; gap: 16px; font-size: 0.72rem; color: var(--text-secondary); padding: 0 8px; flex-wrap: wrap; }
  .sl-legend span { display: flex; align-items: center; gap: 6px; }
  .sl-legend i { width: 12px; height: 12px; border-radius: 3px; display: block; }
  .sl-player {
    padding: 12px; border-radius: 12px; border: 1px solid rgb(255 180 220 / 0.15);
    background: rgb(255 180 220 / 0.05); max-height: 280px; overflow: auto;
  }
  @media (max-width: 960px) { .stat-lab { grid-template-columns: 1fr; } .sl-sidebar { max-height: none; } }
</style>
