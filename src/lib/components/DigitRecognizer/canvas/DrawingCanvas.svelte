<script lang="ts">
  import { onMount } from 'svelte';
  import {
    CANVAS_SIZE,
    clearCanvas,
    drawSampleDigit,
    getPointerPos,
    initCanvas,
    setupDrawingContext,
  } from '../canvas/canvasUtils';

  interface Props {
    highAccuracy?: boolean;
    onstrokeend?: () => void;
    onrecognize?: () => void;
    onclear?: () => void;
  }
  let {
    highAccuracy = $bindable(true),
    onstrokeend,
    onrecognize,
    onclear,
  }: Props = $props();

  let canvas: HTMLCanvasElement | null = null;
  let drawing = false;
  let last: { x: number; y: number } | null = null;

  onMount(() => {
    if (canvas) initCanvas(canvas);
  });

  function startDraw(e: PointerEvent) {
    if (!canvas) return;
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    last = getPointerPos(canvas, e);
    if (last) {
      const ctx = canvas.getContext('2d')!;
      setupDrawingContext(ctx);
      ctx.beginPath();
      ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  }

  function moveDraw(e: PointerEvent) {
    if (!drawing || !canvas || !last) return;
    const p = getPointerPos(canvas, e);
    if (!p) return;
    const ctx = canvas.getContext('2d')!;
    setupDrawingContext(ctx);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  }

  function endDraw(e: PointerEvent) {
    if (!canvas) return;
    drawing = false;
    last = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    onstrokeend?.();
  }

  function handleClear() {
    if (canvas) clearCanvas(canvas);
    onclear?.();
  }

  function handleSample(n: number) {
    if (canvas) drawSampleDigit(canvas, n);
    onstrokeend?.();
  }

  export function getCanvas() {
    return canvas;
  }
</script>

<section class="draw-panel">
  <header class="dp-head">
    <h2>手写画板</h2>
    <span class="dp-hint">280×280 → 28×28 MNIST</span>
  </header>
  <div class="dp-canvas-wrap">
    <canvas
      bind:this={canvas}
      class="dp-canvas"
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onpointerdown={startDraw}
      onpointermove={moveDraw}
      onpointerup={endDraw}
      onpointerleave={endDraw}
    ></canvas>
    <div class="dp-grid" aria-hidden="true"></div>
  </div>
  <div class="dp-actions">
    <button type="button" class="dp-btn" onclick={handleClear}>清除</button>
    <button type="button" class="dp-btn primary" onclick={() => onrecognize?.()}>识别</button>
    <label class="dp-toggle">
      <input type="checkbox" bind:checked={highAccuracy} />
      高精度（双路推理）
    </label>
  </div>
  <div class="dp-samples">
    <span class="dp-samples-lbl">示例</span>
    {#each Array.from({ length: 10 }, (_, i) => i) as n}
      <button type="button" class="sample" onclick={() => handleSample(n)}>{n}</button>
    {/each}
  </div>
</section>

<style>
  .draw-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgb(180 140 255 / 0.25);
    background: linear-gradient(145deg, rgb(180 140 255 / 0.08), rgb(0 0 0 / 0.2));
    backdrop-filter: blur(12px);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 8px 32px rgb(0 0 0 / 0.2);
  }
  .dp-head h2 { margin: 0; font-size: 0.95rem; color: #d4c0ff; }
  .dp-hint { font-size: 0.68rem; color: var(--text-secondary); }
  .dp-canvas-wrap {
    position: relative;
    align-self: center;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgb(180 140 255 / 0.35);
    box-shadow: 0 0 24px rgb(180 140 255 / 0.15);
  }
  .dp-canvas {
    display: block;
    width: 280px;
    height: 280px;
    touch-action: none;
    cursor: crosshair;
    background: #000;
  }
  .dp-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgb(180 140 255 / 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgb(180 140 255 / 0.06) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .dp-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .dp-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: var(--text-secondary);
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid rgb(180 140 255 / 0.2);
    cursor: pointer;
    user-select: none;
    flex: 1 1 100%;
  }
  .dp-toggle input { accent-color: #b48cff; }
  .dp-btn {
    flex: 1; padding: 10px; border-radius: 10px;
    border: 1px solid rgb(180 140 255 / 0.3);
    background: rgb(255 255 255 / 0.04); color: inherit; cursor: pointer;
    font-size: 0.82rem; transition: background var(--motion-step-fast);
  }
  .dp-btn.primary {
    background: linear-gradient(135deg, #b48cff, #7ec8ff);
    color: #1c0f30; border: 0; font-weight: 650;
  }
  .dp-samples { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .dp-samples-lbl { font-size: 0.68rem; color: var(--text-secondary); margin-right: 4px; }
  .sample {
    width: 28px; height: 28px; border-radius: 6px;
    border: 1px solid rgb(180 140 255 / 0.25);
    background: rgb(180 140 255 / 0.1); color: inherit;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; cursor: pointer;
  }
  .sample:hover { background: rgb(180 140 255 / 0.25); }
</style>
