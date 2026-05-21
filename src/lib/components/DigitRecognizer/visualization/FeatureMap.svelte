<script lang="ts">
  import { onMount } from 'svelte';
  import type { LayerActivation } from '../model/types';

  interface Props {
    layer: LayerActivation;
    maxChannels?: number;
    size?: number;
    lit?: boolean;
  }
  let { layer, maxChannels = 16, size = 120, lit = false }: Props = $props();

  let canvas: HTMLCanvasElement | null = null;
  const kind = $derived(layer.meta.kind);

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0612';
    ctx.fillRect(0, 0, size, size);

    if (kind === 'input' || kind === 'conv2d' || kind === 'pool') {
      drawFeatureMaps(ctx, layer, size, maxChannels);
    } else if (kind === 'flatten' || kind === 'dense') {
      drawBars(ctx, layer, size);
    }
  }

  function drawFeatureMaps(
    ctx: CanvasRenderingContext2D,
    act: LayerActivation,
    sz: number,
    maxC: number
  ) {
    const shape = act.shape;
    let h = 28,
      w = 28,
      c = 1;
    if (shape.length === 4) {
      h = shape[1] ?? 28;
      w = shape[2] ?? 28;
      c = shape[3] ?? 1;
    } else if (shape.length === 3) {
      h = shape[0] ?? 28;
      w = shape[1] ?? 28;
      c = shape[2] ?? 1;
    }

    const data = act.data as Float32Array;
    const cols = Math.ceil(Math.sqrt(Math.min(c, maxC)));
    const rows = Math.ceil(Math.min(c, maxC) / cols);
    const cell = sz / Math.max(cols, rows);
    const pad = 1;

    for (let ch = 0; ch < Math.min(c, maxC); ch++) {
      const col = ch % cols;
      const row = Math.floor(ch / cols);
      const ox = col * cell + pad;
      const oy = row * cell + pad;
      const cw = cell - pad * 2;
      const chData = sliceChannel(data, h, w, c, ch);
      let min = Infinity,
        max = -Infinity;
      for (const v of chData) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const span = max - min || 1;
      const img = ctx.createImageData(Math.floor(cw), Math.floor(cw));
      for (let y = 0; y < Math.floor(cw); y++) {
        for (let x = 0; x < Math.floor(cw); x++) {
          const sy = Math.floor((y / cw) * h);
          const sx = Math.floor((x / cw) * w);
          const v = chData[sy * w + sx] ?? 0;
          const n = (v - min) / span;
          const px = (y * Math.floor(cw) + x) * 4;
          const cval = Math.floor(n * 255);
          img.data[px] = 180 + cval * 0.3;
          img.data[px + 1] = 140 + cval * 0.4;
          img.data[px + 2] = 255;
          img.data[px + 3] = 40 + n * 215;
        }
      }
      ctx.putImageData(img, ox, oy);
    }
  }

  function sliceChannel(data: Float32Array, h: number, w: number, c: number, ch: number) {
    const out = new Float32Array(h * w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[y * w + x] = data[(y * w + x) * c + ch] ?? 0;
      }
    }
    return out;
  }

  function drawBars(ctx: CanvasRenderingContext2D, act: LayerActivation, sz: number) {
    const vals = act.data as number[];
    const n = Math.min(vals.length, act.meta.kind === 'flatten' ? 48 : 64);
    const step = Math.max(1, Math.floor(vals.length / n));
    const sampled: number[] = [];
    for (let i = 0; i < vals.length; i += step) sampled.push(vals[i] ?? 0);
    const max = Math.max(...sampled.map(Math.abs), 1e-6);
    const barW = sz / sampled.length;
    sampled.forEach((v, i) => {
      const h = (Math.abs(v) / max) * (sz - 8);
      ctx.fillStyle = v >= 0 ? 'rgba(180,140,255,0.85)' : 'rgba(255,120,180,0.7)';
      ctx.fillRect(i * barW + 1, sz - h - 4, barW - 2, h);
    });
  }

  $effect(() => {
    void layer;
    void lit;
    draw();
  });

  onMount(draw);
</script>

<canvas bind:this={canvas} class="fmap" class:lit width={size} height={size}></canvas>

<style>
  .fmap {
    border-radius: 8px;
    border: 1px solid rgb(180 140 255 / 0.2);
    transition: box-shadow var(--motion-step), border-color var(--motion-step);
  }
  .fmap.lit {
    border-color: rgb(180 140 255 / 0.55);
    box-shadow: 0 0 20px rgb(180 140 255 / 0.35);
    animation: viz-highlight-pulse-soft 1.3s ease-in-out infinite;
  }
</style>
