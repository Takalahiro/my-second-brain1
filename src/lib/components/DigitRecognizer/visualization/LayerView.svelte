<script lang="ts">
  import FeatureMap from './FeatureMap.svelte';
  import type { LayerActivation } from '../model/types';

  interface Props {
    layer: LayerActivation;
    index: number;
    active?: boolean;
    hovered?: boolean;
    onhover?: (i: number | null) => void;
  }
  let { layer, index, active = false, hovered = false, onhover }: Props = $props();

  const lit = $derived(active || hovered);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="layer-view"
  class:active
  class:hovered
  onmouseenter={() => onhover?.(index)}
  onmouseleave={() => onhover?.(null)}
>
  <div class="lv-head">
    <span class="lv-idx">{index + 1}</span>
    <div class="lv-titles">
      <strong>{layer.meta.name}</strong>
      <span>{layer.meta.typeLabel}</span>
    </div>
    <span class="lv-shape">{layer.meta.shapeLabel}</span>
  </div>
  <FeatureMap {layer} lit={lit} size={layer.meta.kind === 'dense' ? 140 : 128} />
  {#if hovered || active}
    <p class="lv-detail">{layer.meta.detail}</p>
  {/if}
</div>

<style>
  .layer-view {
    padding: 12px;
    border-radius: 14px;
    border: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(255 255 255 / 0.03);
    transition:
      border-color var(--motion-step),
      background var(--motion-step),
      transform var(--motion-step-fast);
  }
  .layer-view.active {
    border-color: rgb(180 140 255 / 0.5);
    background: rgb(180 140 255 / 0.1);
    transform: scale(1.02);
  }
  .layer-view.hovered { border-color: rgb(126 200 255 / 0.4); }
  .lv-head {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .lv-idx {
    width: 22px; height: 22px; border-radius: 6px;
    background: rgb(180 140 255 / 0.2); color: #d4c0ff;
    font-size: 0.68rem; font-weight: 700;
    display: grid; place-items: center;
  }
  .lv-titles { flex: 1; min-width: 120px; }
  .lv-titles strong { display: block; font-size: 0.82rem; }
  .lv-titles span { font-size: 0.68rem; color: var(--text-secondary); font-family: 'IBM Plex Mono', monospace; }
  .lv-shape {
    font-size: 0.68rem; padding: 2px 8px; border-radius: 999px;
    background: rgb(0 255 157 / 0.1); color: #9dffd0;
    font-family: 'IBM Plex Mono', monospace;
  }
  .lv-detail {
    margin: 8px 0 0; font-size: 0.72rem; color: var(--text-secondary); line-height: 1.45;
  }
</style>
