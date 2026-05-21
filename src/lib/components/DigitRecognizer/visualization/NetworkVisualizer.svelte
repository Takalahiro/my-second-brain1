<script lang="ts">
  import LayerView from './LayerView.svelte';
  import DataFlow from './DataFlow.svelte';
  import type { InferenceResult } from '../model/types';

  interface Props {
    inference?: InferenceResult | null;
    activeLayerIndex?: number;
    hoverLayer?: number | null;
    onhover?: (i: number | null) => void;
  }
  let {
    inference = null,
    activeLayerIndex = 0,
    hoverLayer = null,
    onhover,
  }: Props = $props();

  const layers = $derived(inference?.layers ?? []);
</script>

<section class="net-viz">
  {#if layers.length === 0}
    <div class="nv-empty">
      <p>在左侧画板写数字，查看数据如何流过各层</p>
      <ul>
        <li>Conv2D 提取笔画特征</li>
        <li>MaxPool 降维</li>
        <li>Dense + Softmax 分类 0–9</li>
      </ul>
    </div>
  {:else}
    <div class="nv-stack">
      {#each layers as layer, i}
        <LayerView
          {layer}
          index={i}
          active={i === activeLayerIndex}
          hovered={hoverLayer === i}
          {onhover}
        />
        {#if i < layers.length - 1}
          <DataFlow active={i === activeLayerIndex} />
        {/if}
      {/each}
    </div>
  {/if}
</section>

<style>
  .net-viz {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    height: 100%;
  }
  .nv-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.82rem;
    border: 1px dashed rgb(180 140 255 / 0.2);
    border-radius: 12px;
  }
  .nv-empty ul { text-align: left; margin: 12px auto 0; padding-left: 20px; line-height: 1.6; }
  .nv-stack {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 4px;
  }
</style>
