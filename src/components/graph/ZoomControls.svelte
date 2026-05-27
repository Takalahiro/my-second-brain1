<script lang="ts">
  interface Props {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
  }
  let { zoom, onZoomIn, onZoomOut, onReset }: Props = $props();
</script>

<div class="zoom-controls" aria-label="缩放控件">
  <button type="button" class="zc-btn" onclick={onZoomIn} title="放大 (滚轮上)" aria-label="放大">＋</button>
  <button type="button" class="zc-btn zc-zoom-val" onclick={onReset} title="重置缩放/平移" aria-label="重置">
    {(zoom * 100).toFixed(0)}%
  </button>
  <button type="button" class="zc-btn" onclick={onZoomOut} title="缩小 (滚轮下)" aria-label="缩小">－</button>
</div>

<style>
  .zoom-controls {
    position: absolute;
    bottom: 14px; right: 14px;
    z-index: 5;
    display: flex; flex-direction: column;
    gap: 4px;
    background: var(--graph-panel-bg);
    padding: 4px;
    border: 1px solid var(--graph-canvas-border);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .zc-btn {
    background: var(--widget-control-bg);
    border: 1px solid var(--widget-control-border);
    color: var(--graph-panel-text);
    width: 32px; height: 28px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.86rem;
    font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background 0.12s ease;
  }
  .zc-btn:hover { background: var(--widget-control-hover); }
  .zc-zoom-val {
    font-variant-numeric: tabular-nums;
    font-size: 0.7rem;
    font-weight: 600;
    width: 32px;
  }
</style>
