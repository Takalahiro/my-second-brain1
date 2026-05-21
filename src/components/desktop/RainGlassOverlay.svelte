<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    active?: boolean;
    /** bar = menu bar; widget = floating panels */
    size?: 'bar' | 'widget';
  }

  let { active = true, size = 'bar' }: Props = $props();

  let canvas: HTMLCanvasElement | null = null;
  let host: HTMLDivElement | null = null;

  type Bead = {
    x: number;
    y: number;
    r: number;
    phase: number;
    drip: number;
    dripLen: number;
    dripSpeed: number;
  };

  function rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  onMount(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  });

  $effect(() => {
    if (!canvas || !host || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let beads: Bead[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;

    function beadCount() {
      if (size === 'widget') {
        const area = w * h;
        return Math.max(3, Math.min(9, Math.floor(area / 7200)));
      }
      return Math.max(5, Math.min(12, Math.floor(w / 58)));
    }

    function layout() {
      const rect = host!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = beadCount();
      const rMin = size === 'widget' ? 1.8 : 2.4;
      const rMax = size === 'widget' ? 4.8 : 6.2;
      beads = Array.from({ length: count }, () => ({
        x: rand(8, w - 8),
        y: rand(h * 0.12, h * 0.86),
        r: rand(rMin, rMax),
        phase: rand(0, Math.PI * 2),
        drip: rand(0, 1) > 0.58 ? rand(0, h * 0.32) : 0,
        dripLen: rand(size === 'widget' ? 4 : 6, size === 'widget' ? 16 : 22),
        dripSpeed: rand(0.08, size === 'widget' ? 0.22 : 0.28),
      }));
    }

    function drawBead(b: Bead, t: number) {
      const wobble = Math.sin(t * 0.0009 + b.phase) * (size === 'widget' ? 0.25 : 0.35);
      const x = b.x + wobble;
      const y = b.y;
      const r = b.r;

      ctx.save();

      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = r * 0.35;
      ctx.shadowOffsetY = r * 0.12;

      const body = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.05, x, y + r * 0.08, r * 1.35);
      body.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      body.addColorStop(0.22, 'rgba(220, 235, 250, 0.28)');
      body.addColorStop(0.62, 'rgba(170, 200, 230, 0.14)');
      body.addColorStop(1, 'rgba(120, 150, 180, 0.04)');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.06, r * 1.08, r * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(80, 110, 140, 0.22)';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.06, r * 0.95, r * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();

      const spec = ctx.createRadialGradient(x - r * 0.42, y - r * 0.38, 0, x - r * 0.25, y - r * 0.2, r * 0.55);
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      spec.addColorStop(0.45, 'rgba(255, 255, 255, 0.18)');
      spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.28, y - r * 0.22, r * 0.38, r * 0.26, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.restore();
    }

    function drawDrip(b: Bead) {
      if (b.drip <= 0) return;
      const x = b.x;
      const y0 = b.y + b.r * 0.75;
      const y1 = y0 + b.drip;

      ctx.save();
      ctx.lineCap = 'round';
      const g = ctx.createLinearGradient(x, y0, x + 0.8, y1);
      g.addColorStop(0, 'rgba(210, 228, 248, 0.22)');
      g.addColorStop(0.5, `rgba(190, 215, 240, ${0.12 + b.drip / b.dripLen * 0.08})`);
      g.addColorStop(1, 'rgba(160, 190, 220, 0)');

      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(0.45, b.r * 0.22);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + 1.2, y0 + b.drip * 0.45, x + 0.5, y1);
      ctx.stroke();

      ctx.fillStyle = 'rgba(220, 235, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x + 0.5, y1, b.r * 0.22, b.r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);

      for (const b of beads) {
        if (b.drip > 0) {
          b.drip += b.dripSpeed;
          if (b.drip > b.dripLen + h * 0.15) {
            b.drip = 0;
            b.dripLen = rand(size === 'widget' ? 6 : 8, size === 'widget' ? 18 : 26);
            if (Math.random() > 0.65) b.drip = 0.01;
          }
        } else if (Math.random() > 0.997) {
          b.drip = 0.01;
          b.dripLen = rand(size === 'widget' ? 8 : 10, size === 'widget' ? 20 : 28);
          b.dripSpeed = rand(0.1, size === 'widget' ? 0.26 : 0.32);
        }
        drawDrip(b);
        drawBead(b, now);
      }

      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = size === 'widget' ? 0.28 : 0.35;
      const sheen = ctx.createLinearGradient(0, 0, w, h * 0.4);
      sheen.addColorStop(0, 'rgba(255,255,255,0.08)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    layout();
    const ro = new ResizeObserver(() => layout());
    ro.observe(host);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  });
</script>

{#if active}
  <div class="rain-glass-overlay is-{size}" bind:this={host} aria-hidden="true">
    <canvas bind:this={canvas}></canvas>
  </div>
{/if}

<style>
  .rain-glass-overlay {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    z-index: 4;
  }
  .rain-glass-overlay canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
