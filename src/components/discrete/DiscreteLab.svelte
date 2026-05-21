<script lang="ts">
  import KatexBlock from '../matrix/KatexBlock.svelte';
  import {
    truthTable,
    parseSetInput,
    setOp,
    combSteps,
    nCr,
    nPr,
    parseEdges,
    buildAdjMatrix,
    circleLayout,
    type SetOp,
  } from '../../lib/discrete/engine';
  import { onMount } from 'svelte';
  import { setupCanvas } from '../../lib/plot/canvas2d';

  type Mode = 'truth' | 'sets' | 'comb' | 'graph';

  let mode = $state<Mode>('truth');
  let logicExpr = $state('A and (not B or C)');
  let setA = $state('1, 2, 3, 4');
  let setB = $state('3, 4, 5, 6');
  let setOpKind = $state<SetOp>('union');
  let combN = $state(5);
  let combR = $state(2);
  let combKind = $state<'C' | 'P'>('C');
  let graphN = $state(5);
  let graphEdges = $state('1-2\n2-3\n3-4\n4-5\n5-1\n2-4');
  let combStep = $state(0);

  let graphCanvas: HTMLCanvasElement | null = null;

  const tt = $derived(truthTable(logicExpr));
  const setAarr = $derived(parseSetInput(setA));
  const setBarr = $derived(parseSetInput(setB));
  const setResult = $derived(setOp(setAarr, setBarr, setOpKind));
  const combAllSteps = $derived(combSteps(combN, combR, combKind));
  const combVal = $derived(combKind === 'C' ? nCr(combN, combR) : nPr(combN, combR));

  const SET_LABELS: Record<SetOp, string> = {
    union: 'A ∪ B',
    intersect: 'A ∩ B',
    diff: 'A \\ B',
    symdiff: 'A △ B',
  };

  function drawGraph() {
    if (!graphCanvas) return;
    const { ctx, cw, ch } = setupCanvas(graphCanvas);
    ctx.fillStyle = '#0e0816';
    ctx.fillRect(0, 0, cw, ch);
    const n = graphN;
    const edges = parseEdges(graphEdges, n);
    const pos = circleLayout(n, cw / 2, ch / 2, Math.min(cw, ch) * 0.32);
    const adj = buildAdjMatrix(n, edges);

    ctx.strokeStyle = 'rgba(180,140,255,0.55)';
    ctx.lineWidth = 2;
    for (const e of edges) {
      ctx.beginPath();
      ctx.moveTo(pos[e.from].x, pos[e.from].y);
      ctx.lineTo(pos[e.to].x, pos[e.to].y);
      ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#b48cff';
      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c0f30';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), pos[i].x, pos[i].y);
    }
  }

  $effect(() => {
    void mode;
    void graphN;
    void graphEdges;
    if (mode === 'graph' && graphCanvas) requestAnimationFrame(drawGraph);
  });

  onMount(() => {
    const ro = new ResizeObserver(() => { if (mode === 'graph') drawGraph(); });
    if (graphCanvas) ro.observe(graphCanvas);
    return () => ro.disconnect();
  });
</script>

<div class="disc-lab">
  <aside class="dl-sidebar">
    <section class="dl-section">
      <h2>离散数学可视化</h2>
      <div class="dl-modes">
        <button type="button" class:active={mode === 'truth'} onclick={() => (mode = 'truth')}>命题逻辑 · 真值表</button>
        <button type="button" class:active={mode === 'sets'} onclick={() => (mode = 'sets')}>集合运算</button>
        <button type="button" class:active={mode === 'comb'} onclick={() => { mode = 'comb'; combStep = 0; }}>排列组合</button>
        <button type="button" class:active={mode === 'graph'} onclick={() => (mode = 'graph')}>图论 · 邻接矩阵</button>
      </div>
    </section>

    {#if mode === 'truth'}
      <section class="dl-section">
        <label class="dl-field">
          命题表达式
          <input bind:value={logicExpr} placeholder="A and (not B or C)" />
        </label>
        <p class="dl-hint">支持 and / or / not / ( )，变量用大写字母 A-Z</p>
      </section>
    {:else if mode === 'sets'}
      <section class="dl-section">
        <label class="dl-field">集合 A<input bind:value={setA} /></label>
        <label class="dl-field">集合 B<input bind:value={setB} /></label>
        <div class="dl-set-ops">
          {#each [['union','∪'], ['intersect','∩'], ['diff','\\'], ['symdiff','△']] as [id, sym]}
            <button type="button" class:active={setOpKind === id} onclick={() => (setOpKind = id as SetOp)}>{sym}</button>
          {/each}
        </div>
      </section>
    {:else if mode === 'comb'}
      <section class="dl-section">
        <div class="dl-row">
          <label>n<input type="number" min="0" max="20" bind:value={combN} /></label>
          <label>r<input type="number" min="0" max="20" bind:value={combR} /></label>
        </div>
        <div class="dl-set-ops">
          <button type="button" class:active={combKind === 'C'} onclick={() => { combKind = 'C'; combStep = 0; }}>组合 C</button>
          <button type="button" class:active={combKind === 'P'} onclick={() => { combKind = 'P'; combStep = 0; }}>排列 P</button>
        </div>
        <input type="range" min="0" max={combAllSteps.length - 1} bind:value={combStep} />
      </section>
    {:else}
      <section class="dl-section">
        <label class="dl-field">顶点数 n<input type="number" min="2" max="12" bind:value={graphN} /></label>
        <label class="dl-field">
          边（每行一条）
          <textarea bind:value={graphEdges} rows="4" spellcheck="false"></textarea>
        </label>
        <p class="dl-hint">格式：1-2 或 1→3（无向图）</p>
      </section>
    {/if}
  </aside>

  <main class="dl-main">
    {#if mode === 'truth'}
      <div class="dl-panel">
        <h3>真值表</h3>
        <div class="dl-tt-wrap">
          <table class="dl-tt">
            <thead>
              <tr>
                {#each tt.vars as v}<th>{v}</th>{/each}
                <th class="result-col">结果</th>
              </tr>
            </thead>
            <tbody>
              {#each tt.rows as row, i}
                <tr class:row-alt={i % 2 === 1}>
                  {#each tt.vars as v}
                    <td class:val-t={row.inputs[v]} class:val-f={!row.inputs[v]}>{row.inputs[v] ? 'T' : 'F'}</td>
                  {/each}
                  <td class="result-col" class:val-t={row.result} class:val-f={!row.result}>{row.result ? 'T' : 'F'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="dl-caption">共 2<sup>{tt.vars.length}</sup> = {tt.rows.length} 行 · 绿色 T / 红色 F</p>
      </div>
    {:else if mode === 'sets'}
      <div class="dl-panel">
        <h3>{SET_LABELS[setOpKind]}</h3>
        <svg class="dl-venn" viewBox="0 0 400 220" aria-hidden="true">
          <defs>
            <clipPath id="clipA"><circle cx="150" cy="110" r="80" /></clipPath>
            <clipPath id="clipB"><circle cx="250" cy="110" r="80" /></clipPath>
          </defs>
          <circle cx="150" cy="110" r="80" fill="rgb(180 140 255 / 0.2)" stroke="#b48cff" stroke-width="2" />
          <circle cx="250" cy="110" r="80" fill="rgb(0 255 157 / 0.12)" stroke="#00ff9d" stroke-width="2" />
          <text x="100" y="110" fill="#c8b0ff" font-size="14" font-weight="700">A</text>
          <text x="290" y="110" fill="#9dffd0" font-size="14" font-weight="700">B</text>
          {#if setOpKind === 'intersect'}
            <circle cx="200" cy="110" r="30" fill="rgb(255 200 80 / 0.35)" />
          {/if}
        </svg>
        <div class="dl-set-result">
          <div><span class="lbl">A</span> {'{'}{setAarr.join(', ')}{'}'}</div>
          <div><span class="lbl">B</span> {'{'}{setBarr.join(', ')}{'}'}</div>
          <div class="hl"><span class="lbl">结果</span> {'{'}{setResult.join(', ') || '∅'}{'}'}</div>
        </div>
        <KatexBlock tex={`${SET_LABELS[setOpKind]} = \\{${setResult.join(',')}\\}`} display />
      </div>
    {:else if mode === 'comb'}
      <div class="dl-panel">
        <h3>{combKind === 'C' ? '组合' : '排列'} · 逐步推导</h3>
        <div class="dl-big-num">{combVal.toString()}</div>
        {#if combAllSteps[combStep]}
          <div class="dl-step-card">
            <KatexBlock tex={combAllSteps[combStep].latex} display />
            <p>{combAllSteps[combStep].explanation}</p>
          </div>
        {/if}
      </div>
    {:else}
      <div class="dl-panel dl-graph-panel">
        <h3>无向图</h3>
        <canvas bind:this={graphCanvas} class="dl-graph-canvas"></canvas>
        <h4>邻接矩阵</h4>
        <div class="dl-adj-wrap">
          <table class="dl-adj">
            <thead><tr><th></th>{#each Array(graphN) as _, i}<th>{i + 1}</th>{/each}</tr></thead>
            <tbody>
              {#each buildAdjMatrix(graphN, parseEdges(graphEdges, graphN)) as row, i}
                <tr>
                  <th>{i + 1}</th>
                  {#each row as v}<td class:one={v === 1}>{v}</td>{/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .disc-lab {
    display: grid;
    grid-template-columns: minmax(280px, 340px) 1fr;
    gap: 16px;
    min-height: calc(100vh - 100px);
    padding: 12px 16px 20px;
  }
  .dl-sidebar { display: flex; flex-direction: column; gap: 12px; overflow: auto; max-height: calc(100vh - 100px); }
  .dl-section {
    padding: 14px; border-radius: 16px; border: 1px solid var(--border-color); background: var(--bg-secondary);
  }
  .dl-section h2 { margin: 0 0 10px; font-size: 0.82rem; color: var(--text-secondary); letter-spacing: 0.05em; }
  .dl-modes { display: flex; flex-direction: column; gap: 6px; }
  .dl-modes button {
    padding: 9px 12px; border-radius: 10px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; text-align: left; font-size: 0.78rem;
  }
  .dl-modes button.active { background: rgb(255 158 212 / 0.12); border-color: rgb(255 158 212 / 0.35); }
  .dl-field { display: flex; flex-direction: column; gap: 4px; font-size: 0.74rem; color: var(--text-secondary); margin-bottom: 8px; }
  .dl-field input, .dl-field textarea {
    padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--code-bg); color: inherit; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem;
  }
  .dl-hint { margin: 0; font-size: 0.72rem; color: var(--text-secondary); }
  .dl-row { display: flex; gap: 8px; }
  .dl-row label { flex: 1; font-size: 0.72rem; color: var(--text-secondary); }
  .dl-row input { width: 100%; margin-top: 4px; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--code-bg); color: inherit; }
  .dl-set-ops { display: flex; gap: 4px; flex-wrap: wrap; }
  .dl-set-ops button {
    padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; cursor: pointer; font-size: 0.85rem;
  }
  .dl-set-ops button.active { background: rgb(255 158 212 / 0.15); border-color: rgb(255 158 212 / 0.4); }

  .dl-main {
    padding: 16px; border-radius: 16px; border: 1px solid var(--border-color);
    background: radial-gradient(ellipse 70% 50% at 80% 0%, rgb(255 158 212 / 0.08), transparent 50%), var(--bg-secondary);
    overflow: auto;
  }
  .dl-panel h3 { margin: 0 0 14px; font-size: 1rem; }
  .dl-panel h4 { margin: 16px 0 8px; font-size: 0.82rem; color: var(--text-secondary); }

  .dl-tt-wrap { overflow: auto; border-radius: 12px; border: 1px solid var(--border-color); }
  .dl-tt { width: 100%; border-collapse: collapse; font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; }
  .dl-tt th, .dl-tt td { padding: 10px 16px; text-align: center; border-bottom: 1px solid rgb(255 255 255 / 0.06); }
  .dl-tt th { background: rgb(255 255 255 / 0.04); font-size: 0.72rem; color: var(--text-secondary); }
  .dl-tt .result-col { background: rgb(255 158 212 / 0.06); }
  .dl-tt .val-t { color: #6dff9a; font-weight: 700; }
  .dl-tt .val-f { color: #ff9d9d; font-weight: 600; }
  .dl-tt .row-alt { background: rgb(255 255 255 / 0.02); }
  .dl-caption { margin: 10px 0 0; font-size: 0.72rem; color: var(--text-secondary); }

  .dl-venn { width: 100%; max-width: 400px; display: block; margin: 0 auto 16px; }
  .dl-set-result { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; }
  .dl-set-result .lbl { color: var(--text-secondary); margin-right: 8px; }
  .dl-set-result .hl { color: #ffd56a; font-weight: 600; }

  .dl-big-num {
    font-size: 2.4rem; font-weight: 700; font-family: 'IBM Plex Mono', monospace;
    color: #ff9ed4; text-align: center; margin: 12px 0;
  }
  .dl-step-card {
    padding: 14px; border-radius: 12px; background: rgb(255 158 212 / 0.08); border: 1px solid rgb(255 158 212 / 0.2);
  }
  .dl-step-card p { margin: 10px 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.55; }

  .dl-graph-canvas { width: 100%; min-height: 280px; border-radius: 12px; margin-bottom: 8px; }
  .dl-adj-wrap { overflow: auto; }
  .dl-adj { border-collapse: collapse; font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; }
  .dl-adj th, .dl-adj td { padding: 6px 10px; border: 1px solid rgb(255 255 255 / 0.08); text-align: center; }
  .dl-adj td.one { background: rgb(180 140 255 / 0.25); color: #d4c0ff; font-weight: 700; }

  @media (max-width: 960px) { .disc-lab { grid-template-columns: 1fr; } .dl-sidebar { max-height: none; } }
</style>
