<script lang="ts">
  import { onMount } from 'svelte';
  import {
    computeTelemetry,
    startChartEngine,
    startDeepSpaceEngine,
    type HudWallpaperFx,
    type HudWallpaperTelemetry,
  } from '../../lib/hud-wallpaper-engine';
  import {
    bindHudWallpaperInput,
    setHudWallpaperReducedMotion,
  } from '../../lib/hud-wallpaper-input';
  import { isDarkThemeActive, subscribeHudMode } from '../../features/ui/hud-mode.svelte';

  let deepCanvas: HTMLCanvasElement | null = $state(null);
  let chartCanvas: HTMLCanvasElement | null = $state(null);

  let telemetry = $state<HudWallpaperTelemetry>(computeTelemetry());
  let reducedMotion = $state(false);
  let fx = $state<HudWallpaperFx>({
    scanX: 0,
    scanY: 0,
    plotterX: 0,
    plotterY: 0,
    bracketPulse: 0.7,
    crosshairScale: 1,
    glitchStrength: 0,
    parallaxNx: 0,
    parallaxNy: 0,
  });
  let dark = $state(isDarkThemeActive());

  const parallaxTransform = $derived(
    `translate(${fx.parallaxNx * 10}px, ${fx.parallaxNy * 8}px)`,
  );
  const crosshairTransform = $derived(
    `translate(${fx.parallaxNx * 18}px, ${fx.parallaxNy * 14}px) scale(${fx.crosshairScale})`,
  );

  onMount(() => {
    document.documentElement.dataset.hudWallpaper = '1';
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setHudWallpaperReducedMotion(reducedMotion);
    const unbindInput = bindHudWallpaperInput();

    const syncTheme = () => {
      dark = isDarkThemeActive();
    };
    syncTheme();
    const unsubHud = subscribeHudMode(() => syncTheme());
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-ui'] });

    return () => {
      delete document.documentElement.dataset.hudWallpaper;
      unbindInput();
      unsubHud();
      obs.disconnect();
    };
  });

  $effect(() => {
    const canvas = dark ? deepCanvas : chartCanvas;
    if (!canvas) return;

    const onTelemetry = (t: HudWallpaperTelemetry) => {
      telemetry = t;
    };

    const engine = dark
      ? startDeepSpaceEngine(canvas, onTelemetry)
      : startChartEngine(canvas, onTelemetry);

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    let fxRaf = 0;
    const tickFx = () => {
      fx = engine.getFx();
      fxRaf = requestAnimationFrame(tickFx);
    };
    fxRaf = requestAnimationFrame(tickFx);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(fxRaf);
      engine.stop();
    };
  });
</script>

<div class="hud-wallpaper" aria-hidden="true" class:is-reduced={reducedMotion}>
  {#if fx.glitchStrength > 0.05}
    <div
      class="hud-wp-glitch"
      class:hud-wp-glitch--chart={!dark}
      style:opacity={fx.glitchStrength * 0.85}
    ></div>
  {/if}

  <div class="hud-wp hud-wp--deep">
    <canvas bind:this={deepCanvas} class="hud-wp__canvas"></canvas>

    <div class="hud-wp-deep__frame" style:transform={parallaxTransform}>
      <span class="hud-wp-corner hud-wp-corner--tl" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--tr" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--bl" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--br" style:opacity={fx.bracketPulse}></span>
      <div
        class="hud-wp-crosshair"
        style:transform={crosshairTransform}
        style:opacity={0.35 + fx.bracketPulse * 0.25}
      ></div>
      <div class="hud-wp-vscan" style:top="{fx.scanY}%"></div>
    </div>

    <div class="hud-wp-deep__overlay" style:transform={parallaxTransform}>
      <span class="hud-wp-deep__tl">
        [RA {telemetry.raLabel} / DEC {telemetry.decLabel}]<span class="hud-wp-blink">▮</span>
      </span>
      <span class="hud-wp-deep__tr">{telemetry.missionLabel}</span>
      <span class="hud-wp-deep__bl">◢ SECTOR M-42 / ORION</span>
      <span class="hud-wp-deep__br">[STELLAR CHART v2.6 · UTC {telemetry.utcLabel}]</span>
      <div class="hud-wp-deep__scan">
        <div class="hud-wp-deep__scan-track">
          <div class="hud-wp-deep__scan-cursor" style:left="{fx.scanX}%"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="hud-wp hud-wp--chart">
    <canvas bind:this={chartCanvas} class="hud-wp__canvas"></canvas>

    <div class="hud-wp-chart__frame" style:transform={parallaxTransform}>
      <span class="hud-wp-corner hud-wp-corner--tl hud-wp-corner--chart" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--tr hud-wp-corner--chart" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--bl hud-wp-corner--chart" style:opacity={fx.bracketPulse}></span>
      <span class="hud-wp-corner hud-wp-corner--br hud-wp-corner--chart" style:opacity={fx.bracketPulse}></span>
      <div class="hud-wp-chart__vplot" style:top="{fx.scanY}%"></div>
      <div class="hud-wp-chart__hplot" style:left="{fx.scanX}%"></div>
    </div>

    <div
      class="hud-wp-chart__edge-labels hud-wp-chart__edge-labels--top"
      style:transform="translateX({Math.sin(fx.plotterX * 0.02) * 6 + fx.parallaxNx * 8}px)"
    >
      {#each ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h'] as label}
        <span>{label}</span>
      {/each}
    </div>
    <div
      class="hud-wp-chart__edge-labels hud-wp-chart__edge-labels--left"
      style:transform="translateY({Math.cos(fx.plotterY * 0.02) * 5 + fx.parallaxNy * 6}px)"
    >
      {#each ['+60°', '+30°', '0°', '-30°', '-60°'] as label}
        <span>{label}</span>
      {/each}
    </div>
    <div class="hud-wp-chart__typo" style:transform={parallaxTransform}>
      <h1 class="hud-wp-chart__title">[ ORION / SECTOR M-42 ]</h1>
      <p class="hud-wp-chart__meta">LST {telemetry.chartSidereal} · {telemetry.missionLabel}</p>
      <p class="hud-wp-chart__footer">PLATE No. 042 / DEEP SKY OBJECTS · UTC {telemetry.utcLabel}</p>
    </div>
  </div>
</div>
