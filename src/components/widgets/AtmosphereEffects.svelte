<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    rainDrops?: boolean;
    sakura?: boolean;
    sceneId?: string;
    active?: boolean;
  }

  let { rainDrops = false, sakura = false, sceneId = '', active = true }: Props = $props();

  let canvasBack: HTMLCanvasElement | null = null;
  let canvasFront: HTMLCanvasElement | null = null;
  let lowPerf = $state(false);

  const showRain = $derived(active && rainDrops);
  const showSakura = $derived(active && sakura && sceneId === 'kyoto');
  const showAny = $derived(showRain || showSakura);

  function rand(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  type RainDrop = {
    x: number;
    y: number;
    len: number;
    speed: number;
    opacity: number;
    wind: number;
    layer: number;
  };

  type SakuraPetal = {
    x: number;
    y: number;
    size: number;
    rot: number;
    rotSpeed: number;
    speed: number;
    drift: number;
    sway: number;
    swayPhase: number;
    r: number;
    g: number;
    b: number;
  };

  type Settled = {
    surfaceId: string;
    localX: number;
    localY: number;
    kind: 'rain' | 'sakura';
    size: number;
    rot: number;
    life: number;
    r?: number;
    g?: number;
    b?: number;
  };

  function spawnRain(w: number, h: number): RainDrop {
    const layer = Math.random();
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      len: layer < 0.3 ? rand(8, 14) : layer < 0.7 ? rand(14, 22) : rand(22, 36),
      speed: layer < 0.3 ? rand(6, 10) : layer < 0.7 ? rand(10, 16) : rand(16, 24),
      opacity: layer < 0.3 ? rand(0.04, 0.08) : layer < 0.7 ? rand(0.06, 0.12) : rand(0.1, 0.18),
      wind: rand(-0.8, -0.2),
      layer,
    };
  }

  function spawnPetal(w: number, h: number): SakuraPetal {
    return {
      x: Math.random() * w,
      y: Math.random() * h - h * 0.2,
      size: rand(5, 11),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02),
      speed: rand(0.35, 0.9),
      drift: rand(-0.4, 0.4),
      sway: rand(0.4, 1.2),
      swayPhase: rand(0, Math.PI * 2),
      r: rand(248, 255),
      g: rand(170, 210),
      b: rand(188, 220),
    };
  }

  function capForSurface(rect: DOMRect) {
    return Math.min(14, Math.max(4, Math.floor((rect.width * rect.height) / 11000)));
  }

  function getSurfaces() {
    const map = new Map<string, DOMRect>();
    document.querySelectorAll('[data-atmosphere-surface]').forEach((el) => {
      const id = el.getAttribute('data-atmosphere-surface');
      if (!id) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 24) return;
      map.set(id, rect);
    });
    return map;
  }

  function drawPetal(ctx: CanvasRenderingContext2D, p: SakuraPetal, alpha = 0.72) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    const s = p.size;
    ctx.fillStyle = `rgb(${p.r | 0} ${p.g | 0} ${p.b | 0})`;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.bezierCurveTo(s * 0.55, -s * 0.35, s * 0.55, s * 0.35, 0, s * 0.5);
    ctx.bezierCurveTo(-s * 0.55, s * 0.35, -s * 0.55, -s * 0.35, 0, -s * 0.5);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = `rgb(${Math.min(255, p.r + 8)} ${Math.min(255, p.g + 12)} ${Math.min(255, p.b + 8)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.18, s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  onMount(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lowPerf =
      reduced ||
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      window.matchMedia('(max-width: 768px)').matches;
  });

  $effect(() => {
    if (!canvasBack || !canvasFront || !active) return;

    const ctxBack = canvasBack.getContext('2d');
    const ctxFront = canvasFront.getContext('2d');
    if (!ctxBack || !ctxFront) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const rain: RainDrop[] = [];
    const petals: SakuraPetal[] = [];
    const settled: Settled[] = [];
    let raf = 0;
    let last = performance.now();
    let windBase = -0.35;
    let windTarget = -0.35;
    let windAt = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, lowPerf ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      for (const c of [canvasBack!, canvasFront!]) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }
      ctxBack.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxFront.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureCounts(rainOn: boolean, sakuraOn: boolean) {
      const rainTarget = rainOn ? (lowPerf ? 55 : 95) : 0;
      while (rain.length < rainTarget) rain.push(spawnRain(w, h));
      rain.length = rainTarget;

      const petalTarget = sakuraOn ? (lowPerf ? 18 : 32) : 0;
      while (petals.length < petalTarget) petals.push(spawnPetal(w, h));
      petals.length = petalTarget;
    }

    function trySettle(
      x: number,
      y: number,
      kind: 'rain' | 'sakura',
      surfaces: Map<string, DOMRect>,
      petal?: SakuraPetal,
    ) {
      for (const [id, rect] of surfaces) {
        if (x < rect.left - 2 || x > rect.right + 2) continue;
        const band = Math.min(22, rect.height * 0.14);
        if (y < rect.top - 1 || y > rect.top + band) continue;

        const onSurface = settled.filter((s) => s.surfaceId === id);
        if (onSurface.length >= capForSurface(rect)) return true;

        settled.push({
          surfaceId: id,
          localX: x - rect.left + rand(-1, 1),
          localY: Math.max(2, y - rect.top + rand(0, 4)),
          kind,
          size: kind === 'rain' ? rand(1.6, 3.8) : rand(4, 9),
          rot: kind === 'sakura' ? rand(0, Math.PI * 2) : rand(-0.2, 0.2),
          life: 1,
          r: petal?.r,
          g: petal?.g,
          b: petal?.b,
        });
        return true;
      }
      return false;
    }

    function drawSettled(surfaces: Map<string, DOMRect>) {
      ctxFront.clearRect(0, 0, w, h);
      for (let i = settled.length - 1; i >= 0; i--) {
        const s = settled[i];
        const rect = surfaces.get(s.surfaceId);
        if (!rect) {
          settled.splice(i, 1);
          continue;
        }
        s.life -= 0.00035;
        if (s.life <= 0.05) {
          settled.splice(i, 1);
          continue;
        }

        const x = rect.left + s.localX;
        const y = rect.top + s.localY;
        const a = Math.min(0.85, s.life * 0.9);

        if (s.kind === 'rain') {
          ctxFront.save();
          ctxFront.globalAlpha = a * 0.55;
          const g = ctxFront.createRadialGradient(x - 0.5, y - 0.5, 0, x, y, s.size * 1.4);
          g.addColorStop(0, 'rgba(255,255,255,0.55)');
          g.addColorStop(0.5, 'rgba(200,220,240,0.35)');
          g.addColorStop(1, 'rgba(160,190,220,0.05)');
          ctxFront.fillStyle = g;
          ctxFront.beginPath();
          ctxFront.ellipse(x, y, s.size, s.size * 0.82, s.rot, 0, Math.PI * 2);
          ctxFront.fill();
          ctxFront.restore();
        } else {
          ctxFront.save();
          ctxFront.translate(x, y);
          ctxFront.rotate(s.rot);
          ctxFront.globalAlpha = a * 0.78;
          const sz = s.size;
          const pr = s.r ?? 252;
          const pg = s.g ?? 188;
          const pb = s.b ?? 210;
          ctxFront.fillStyle = `rgb(${pr | 0} ${pg | 0} ${pb | 0})`;
          ctxFront.beginPath();
          ctxFront.moveTo(0, -sz * 0.5);
          ctxFront.bezierCurveTo(sz * 0.55, -sz * 0.35, sz * 0.55, sz * 0.35, 0, sz * 0.5);
          ctxFront.bezierCurveTo(-sz * 0.55, sz * 0.35, -sz * 0.55, -sz * 0.35, 0, -sz * 0.5);
          ctxFront.fill();
          ctxFront.restore();
        }
      }
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const rainOn = showRain;
      const sakuraOn = showSakura;

      if (document.hidden || !showAny) {
        ctxBack.clearRect(0, 0, w, h);
        ctxFront.clearRect(0, 0, w, h);
        settled.length = 0;
        return;
      }

      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      ensureCounts(rainOn, sakuraOn);

      if (!rainOn && !sakuraOn) {
        settled.length = 0;
      }

      if (now > windAt) {
        windTarget = rand(-0.55, -0.15);
        windAt = now + rand(4000, 9000);
      }
      windBase += (windTarget - windBase) * 0.002 * dt;

      const surfaces = getSurfaces();
      ctxBack.clearRect(0, 0, w, h);

      if (rainOn) {
        ctxBack.lineCap = 'round';
        for (const drop of rain) {
          drop.y += drop.speed * dt;
          drop.x += (drop.wind + windBase * drop.layer) * dt;

          const tipX = drop.x + drop.wind * 2.5;
          const tipY = drop.y + drop.len;

          if (trySettle(tipX, tipY, 'rain', surfaces)) {
            Object.assign(drop, spawnRain(w, h));
            drop.y = -drop.len - Math.random() * 40;
            continue;
          }

          ctxBack.strokeStyle = `rgba(196, 210, 228, ${drop.opacity})`;
          ctxBack.lineWidth = drop.layer > 0.65 ? 1.1 : 0.65;
          ctxBack.beginPath();
          ctxBack.moveTo(drop.x, drop.y);
          ctxBack.lineTo(tipX, tipY);
          ctxBack.stroke();

          if (drop.y > h + drop.len || drop.x < -40 || drop.x > w + 40) {
            Object.assign(drop, spawnRain(w, h));
            drop.y = -drop.len - Math.random() * 40;
          }
        }
      }

      if (sakuraOn) {
        const t = now * 0.001;
        for (const p of petals) {
          p.y += p.speed * dt;
          p.x += (p.drift + Math.sin(t * p.sway + p.swayPhase) * 0.35) * dt;
          p.rot += p.rotSpeed * dt;

          const footX = p.x;
          const footY = p.y + p.size * 0.45;

          if (trySettle(footX, footY, 'sakura', surfaces, p)) {
            Object.assign(p, spawnPetal(w, h));
            p.y = -p.size * 2;
            continue;
          }

          drawPetal(ctxBack, p);

          if (p.y > h + p.size * 2) {
            Object.assign(p, spawnPetal(w, h));
            p.y = -p.size * 2;
          }
        }
      }

      drawSettled(surfaces);
    }

    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  });
</script>

{#if active}
  <canvas class="atmosphere-canvas atmosphere-canvas-back" bind:this={canvasBack} aria-hidden="true"></canvas>
  <canvas class="atmosphere-canvas atmosphere-canvas-front" bind:this={canvasFront} aria-hidden="true"></canvas>
{/if}

<style>
  .atmosphere-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }
  .atmosphere-canvas-back {
    z-index: 0;
    opacity: 0.92;
  }
  .atmosphere-canvas-front {
    z-index: 55;
  }
</style>
