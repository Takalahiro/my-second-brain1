<script lang="ts">
  import type { Component } from 'svelte';
  import { NEURAL_LAB } from '../../../neural-lab-meta';
  import NetworkDiagram from './NetworkDiagram.svelte';
  import type { InferenceResult } from '../model/types';

  export type VizMode = '2d' | '3d' | 'diagram';

  interface Props {
    inference?: InferenceResult | null;
    activeLayerIndex?: number;
    hoverLayer?: number | null;
    flowPlaying?: boolean;
    onhover?: (i: number | null) => void;
  }
  let {
    inference = null,
    activeLayerIndex = 0,
    hoverLayer = null,
    flowPlaying = false,
    onhover,
  }: Props = $props();

  let mode = $state<VizMode>('diagram');

  let Visualizer2D = $state<Component | null>(null);
  let Scene3D = $state<Component | null>(null);

  $effect(() => {
    if (mode === '2d' && !Visualizer2D) {
      void import('./NetworkVisualizer.svelte').then((m) => {
        Visualizer2D = m.default;
      });
    }
    if (mode === '3d' && !Scene3D) {
      void import('../visualization3d/NetworkScene3D.svelte').then((m) => {
        Scene3D = m.default;
      });
    }
  });

  const subtitle = $derived(
    mode === '2d'
      ? 'LeNet 逐层特征图'
      : mode === '3d'
        ? '3D 竖向 · 每层实时展示数字变形'
        : '神经元连接图 · 竖向数据流'
  );
</script>

<section class="net-panel">
  <header class="np-head">
    <div>
      <h2>{NEURAL_LAB.demoMnist.panelTitle}</h2>
      <p>{subtitle}</p>
    </div>
    <div class="np-tabs" role="tablist" aria-label="可视化模式">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'diagram'}
        class:active={mode === 'diagram'}
        onclick={() => (mode = 'diagram')}
      >连接图</button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === '2d'}
        class:active={mode === '2d'}
        onclick={() => (mode = '2d')}
      >2D 层叠</button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === '3d'}
        class:active={mode === '3d'}
        onclick={() => (mode = '3d')}
      >3D 立体</button>
    </div>
  </header>

  <div class="np-body">
    {#if mode === 'diagram'}
      <NetworkDiagram {inference} {activeLayerIndex} {hoverLayer} {flowPlaying} {onhover} />
    {:else if mode === '2d' && Visualizer2D}
      <Visualizer2D {inference} {activeLayerIndex} {hoverLayer} {onhover} />
    {:else if mode === '3d' && Scene3D}
      <Scene3D {inference} {activeLayerIndex} {hoverLayer} {flowPlaying} {onhover} />
    {:else}
      <p class="np-loading">正在加载 {mode === '3d' ? '3D' : '2D'} 视图…</p>
    {/if}
  </div>
</section>

<style>
  .net-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    height: 100%;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: linear-gradient(160deg, rgb(180 140 255 / 0.05), rgb(0 0 0 / 0.18));
    backdrop-filter: blur(10px);
  }
  .np-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  .np-head h2 { margin: 0; font-size: 0.95rem; color: #d4c0ff; }
  .np-head p { margin: 4px 0 0; font-size: 0.72rem; color: var(--text-secondary); }
  .np-tabs {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: 10px;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: rgb(255 255 255 / 0.03);
  }
  .np-tabs button {
    padding: 6px 10px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.68rem;
    cursor: pointer;
    transition: background var(--motion-step-fast), color var(--motion-step-fast);
  }
  .np-tabs button.active {
    background: linear-gradient(135deg, rgb(180 140 255 / 0.35), rgb(126 200 255 / 0.25));
    color: var(--text-primary);
    font-weight: 650;
  }
  .np-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .np-body :global(.net-viz),
  .np-body :global(.scene3d),
  .np-body :global(.net-diagram) {
    flex: 1;
    min-height: 360px;
  }
  .np-body :global(.net-viz) {
    padding: 0;
    border: 0;
    background: transparent;
    backdrop-filter: none;
  }
  .np-loading {
    flex: 1;
    display: grid;
    place-items: center;
    margin: 0;
    min-height: 360px;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }
</style>
