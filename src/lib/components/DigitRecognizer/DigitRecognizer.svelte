<script lang="ts">
  import { onMount } from 'svelte';
  import { NEURAL_LAB } from '../../neural-lab-meta';
  import DrawingCanvas from './canvas/DrawingCanvas.svelte';
  import NetworkPanel from './visualization/NetworkPanel.svelte';
  import PredictionBars from './visualization/PredictionBars.svelte';
  import { loadMnistModel, disposeModels, disposeTfEngine } from './model/modelLoader';
  import { runInference } from './model/predictor';
  import { canvasHasInk } from './canvas/canvasUtils';
  import type { FlowState, InferenceResult, ModelState } from './model/types';

  interface Props {
    embedded?: boolean;
    /** Tab 隐藏时释放 TF.js GPU，避免与公式 OCR 争抢 */
    paused?: boolean;
  }

  let { embedded = false, paused = false }: Props = $props();

  let modelState = $state<ModelState>({
    status: 'idle',
    error: null,
    model: null,
    vizModel: null,
  });
  let inference = $state<InferenceResult | null>(null);
  let flow = $state<FlowState>({ activeLayerIndex: 0, playing: false, speed: 1 });
  let inferring = $state(false);
  let inferStatus = $state('');
  let highAccuracy = $state(true);
  let hoverLayer = $state<number | null>(null);

  let drawRef = $state<{ getCanvas: () => HTMLCanvasElement | null } | null>(null);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let flowTimer: ReturnType<typeof setInterval> | null = null;
  function teardown() {
    flow.playing = false;
    clearDebounce();
    clearFlowTimer();
    disposeModels(modelState);
    modelState = { status: 'idle', error: null, model: null, vizModel: null };
    inference = null;
    void disposeTfEngine();
  }

  onMount(() => {
    if (!paused) void loadModel();
    const onPageHide = () => teardown();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      teardown();
    };
  });

  $effect(() => {
    if (paused) {
      if (modelState.model || modelState.vizModel) teardown();
      return;
    }
    if (modelState.status === 'idle' && !modelState.model) {
      void loadModel();
    }
  });

  async function loadModel() {
    modelState = { ...modelState, status: 'loading', error: null };
    try {
      const { model, vizModel } = await loadMnistModel();
      modelState = { status: 'ready', error: null, model, vizModel };
    } catch (e) {
      modelState = {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
        model: null,
        vizModel: null,
      };
    }
  }

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function clearFlowTimer() {
    if (flowTimer) {
      clearInterval(flowTimer);
      flowTimer = null;
    }
  }

  async function recognize() {
    const canvas = drawRef?.getCanvas();
    if (!canvas || !modelState.model || !modelState.vizModel || inferring) return;
    if (!canvasHasInk(canvas)) return;

    inferring = true;
    inferStatus = highAccuracy ? '双路推理 1/2…' : '推理中…';
    flow.playing = false;
    clearFlowTimer();

    try {
      inference = await runInference(modelState.model, modelState.vizModel, canvas, {
        highAccuracy,
        onProgress: (current, total, label) => {
          inferStatus =
            total > 1 ? `双路推理 ${current}/${total} · ${label}` : `推理中 · ${label}`;
        },
      });
      flow.activeLayerIndex = 0;
      startFlowPlayback();
    } catch (e) {
      modelState = {
        ...modelState,
        error: e instanceof Error ? e.message : String(e),
      };
    } finally {
      inferring = false;
      inferStatus = '';
    }
  }
  function onStrokeEnd() {
    clearDebounce();
    debounceTimer = setTimeout(() => {
      void recognize();
    }, 450);
  }

  function startFlowInterval(resetIndex = false) {
    if (!inference) return;
    if (resetIndex) flow.activeLayerIndex = 0;
    const max = inference.layers.length - 1;
    const interval = Math.max(300, 800 / flow.speed);
    clearFlowTimer();
    flowTimer = setInterval(() => {
      if (flow.activeLayerIndex >= max) {
        flow.playing = false;
        clearFlowTimer();
        return;
      }
      flow.activeLayerIndex += 1;
    }, interval);
  }

  function startFlowPlayback() {
    if (!inference) return;
    flow.playing = true;
    startFlowInterval(true);
  }

  let lastFlowSpeed = flow.speed;
  $effect(() => {
    if (!flow.playing || !inference) return;
    const speed = flow.speed;
    if (speed !== lastFlowSpeed) {
      lastFlowSpeed = speed;
      startFlowInterval(false);
    }
  });

  function toggleFlow() {
    if (flow.playing) {
      flow.playing = false;
      clearFlowTimer();
    } else if (inference) {
      if (flow.activeLayerIndex >= inference.layers.length - 1) flow.activeLayerIndex = 0;
      startFlowPlayback();
    }
  }

  function stepFlow(d: number) {
    if (!inference) return;
    flow.playing = false;
    clearFlowTimer();
    flow.activeLayerIndex = Math.max(
      0,
      Math.min(inference.layers.length - 1, flow.activeLayerIndex + d)
    );
  }

  function onClear() {
    inference = null;
    flow.activeLayerIndex = 0;
    flow.playing = false;
    clearFlowTimer();
  }
</script>

<div class="digit-lab">
  {#if !embedded}
    <header class="dl-head">
      <div>
        <h1>{NEURAL_LAB.title}</h1>
        <p class="dl-sub">
          <span class="dl-demo-tag">演示</span>
          {NEURAL_LAB.demoMnist.title}
          <span class="dl-demo-desc">{NEURAL_LAB.demoMnist.subtitle}</span>
        </p>
      </div>
      <div class="dl-status">
        {#if modelState.status === 'idle'}
          <span class="badge">等待加载…</span>
        {:else if modelState.status === 'loading'}
          <span class="badge">加载模型…</span>
        {:else if modelState.status === 'error'}
          <span class="badge err">{modelState.error}</span>
          <button type="button" class="dl-btn" onclick={() => loadModel()}>重试</button>
        {:else if modelState.status === 'ready'}
          <span class="badge ok">模型就绪</span>
        {/if}
        {#if inferring}
          <span class="badge run">{inferStatus || '推理中…'}</span>
        {/if}      </div>
    </header>
  {:else}
    <div class="dl-status dl-status--embedded">
      {#if modelState.status === 'loading'}
        <span class="badge">加载模型…</span>
      {:else if modelState.status === 'error'}
        <span class="badge err">{modelState.error}</span>
        <button type="button" class="dl-btn" onclick={() => loadModel()}>重试</button>
      {:else if modelState.status === 'ready'}
        <span class="badge ok">MNIST 就绪</span>
      {/if}
      {#if inferring}
        <span class="badge run">{inferStatus || '推理中…'}</span>
      {/if}
    </div>
  {/if}

  <div class="dl-workspace">
    <DrawingCanvas
      bind:this={drawRef}
      bind:highAccuracy
      onstrokeend={onStrokeEnd}
      onrecognize={recognize}
      onclear={onClear}
    />
    <div class="dl-right">
      <NetworkPanel
        {inference}
        activeLayerIndex={flow.activeLayerIndex}
        flowPlaying={flow.playing}
        {hoverLayer}
        onhover={(i) => (hoverLayer = i)}
      />

      <div class="dl-flow-ctrl">
        <button type="button" class="dl-btn" onclick={() => stepFlow(-1)} disabled={!inference}>◀ 层</button>
        <button type="button" class="dl-btn primary" onclick={toggleFlow} disabled={!inference}>
          {flow.playing ? '⏸ 暂停' : '▶ 数据流'}
        </button>
        <button type="button" class="dl-btn" onclick={() => stepFlow(1)} disabled={!inference}>层 ▶</button>
        <label class="dl-speed">
          速度
          <input type="range" min="0.25" max="2" step="0.25" bind:value={flow.speed} />
          {flow.speed}×
        </label>
      </div>
    </div>
  </div>

  <PredictionBars
    probabilities={inference?.prediction.probabilities}
    predicted={inference?.prediction.predicted ?? 0}
    confidence={inference?.prediction.confidence ?? 0}
    variantLabel={inference?.variantLabel}
    variantSummaries={inference?.variantSummaries}
  /></div>

<style>
  .digit-lab {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: calc(100vh - 88px);
    padding: 12px 16px 20px;
    color: var(--text-primary);
  }
  .dl-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }
  .dl-head h1 { margin: 0; font-size: 1.35rem; }
  .dl-sub {
    margin: 6px 0 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .dl-demo-tag {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgb(180 140 255 / 0.18);
    color: #c4a8ff;
    border: 1px solid rgb(180 140 255 / 0.28);
  }
  .dl-demo-desc {
    opacity: 0.92;
  }
  .dl-status { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .dl-status--embedded { justify-content: flex-end; margin-bottom: 4px; }
  .badge {
    font-size: 0.72rem; padding: 4px 10px; border-radius: 999px;
    border: 1px solid var(--border-color); color: var(--text-secondary);
  }
  .badge.ok { color: #9dffd0; border-color: rgb(0 255 157 / 0.35); }
  .badge.err { color: #ff9d9d; border-color: rgb(255 120 120 / 0.35); max-width: 240px; }
  .badge.run { color: #d4c0ff; border-color: rgb(180 140 255 / 0.35); }
  .dl-workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(280px, 340px) 1fr;
    gap: 16px;
  }
  .dl-right {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }
  .dl-right :global(.net-panel) { flex: 1; }
  .dl-flow-ctrl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgb(180 140 255 / 0.15);
    background: rgb(180 140 255 / 0.05);
  }
  .dl-btn {
    padding: 8px 12px; border-radius: 8px;
    border: 1px solid rgb(180 140 255 / 0.3);
    background: rgb(255 255 255 / 0.04); color: inherit; cursor: pointer; font-size: 0.78rem;
  }
  .dl-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dl-btn.primary {
    background: linear-gradient(135deg, #b48cff, #7ec8ff);
    color: #1c0f30; border: 0; font-weight: 650;
  }
  .dl-speed {
    display: flex; align-items: center; gap: 6px; margin-left: auto;
    font-size: 0.68rem; color: var(--text-secondary);
  }
  .dl-speed input { width: 80px; }
  @media (max-width: 960px) {
    .dl-workspace { grid-template-columns: 1fr; }
    .digit-lab { min-height: auto; }
  }
</style>
