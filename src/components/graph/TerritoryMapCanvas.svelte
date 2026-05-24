<script lang="ts">
  import type { WikiData } from './graph-data';
  import {
    buildTerritoryMapModel,
    depthLabel,
    entityVisible,
    linkVisible,
    lodLabel,
    visibleWorldRect,
    worldFitScale,
    type MapEntity,
    LOD,
  } from './territory-map-model';
  import { clamp } from './use-zoom-pan';
  import ZoomControls from './ZoomControls.svelte';
  import GraphHudNode from './GraphHudNode.svelte';
  import { HUD_GRAPH } from './graph-hud-theme';
  import { useGraphHudTheme } from '../../features/ui/hud-mode.svelte';

  interface Props {
    data: WikiData;
    compact?: boolean;
    onSelectPath?: (path: string | null) => void;
  }
  let { data, compact = false, onSelectPath }: Props = $props();

  const hudTheme = useGraphHudTheme();

  const VB_W = 1200;
  const VB_H = 760;
  const ZP_MIN = 0.25;
  const ZP_MAX = 22;

  let svgEl: SVGSVGElement | null = null;
  let hoveredId = $state<string | null>(null);
  let zoom = $state(0.85);
  let panX = $state(0);
  let panY = $state(0);
  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };
  let linkPhase = $state(0);
  let rafId: number | null = null;

  const model = $derived(buildTerritoryMapModel(data.nodes, data.links));
  const fitScale = $derived(worldFitScale(VB_W, VB_H, model.worldW, model.worldH));
  const viewScale = $derived(zoom * fitScale);
  const viewRect = $derived(visibleWorldRect(panX, panY, zoom, VB_W, VB_H, model.worldW, model.worldH));

  const visibleEntities = $derived(
    model.entities.filter((e) => entityVisible(e, zoom, viewRect)),
  );
  const visibleEntityIds = $derived(new Set(visibleEntities.map((e) => e.id)));
  const visibleLinks = $derived(
    model.links.filter(
      (l) => linkVisible(l, zoom) && visibleEntityIds.has(l.sourceId) && visibleEntityIds.has(l.targetId),
    ),
  );

  const hovered = $derived(model.entities.find((e) => e.id === hoveredId) ?? null);

  function labelSize(e: MapEntity) {
    if (e.kind === 'note') return 0;
    const { w, h } = e.bounds;
    if (w < 28 || h < 20) return 0;
    if (w < 50) return compact ? 6 : 7;
    if (w < 90) return compact ? 7 : 8;
    return compact ? 8 : Math.min(11, 6 + e.depth);
  }

  function onPointerDown(e: PointerEvent) {
    const t = e.target as Element;
    if (t.closest('[data-hit]')) return;
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    svgEl?.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!panning) return;
    panX = panStart.px + (e.clientX - panStart.x);
    panY = panStart.py + (e.clientY - panStart.y);
  }
  function onPointerUp(e: PointerEvent) {
    if (panning) panning = false;
    svgEl?.releasePointerCapture?.(e.pointerId);
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoomCentered(e.deltaY < 0 ? 1.11 : 1 / 1.11, e.clientX, e.clientY);
  }
  function setZoomCentered(factor: number, clientX: number, clientY: number) {
    if (!svgEl) {
      zoom = clamp(zoom * factor, ZP_MIN, ZP_MAX);
      return;
    }
    const box = svgEl.getBoundingClientRect();
    const px = clientX - box.left;
    const py = clientY - box.top;
    const next = clamp(zoom * factor, ZP_MIN, ZP_MAX);
    const s0 = zoom * fitScale;
    const s1 = next * fitScale;
    const wx = (px - panX - VB_W / 2) / s0 + model.worldW / 2;
    const wy = (py - panY - VB_H / 2) / s0 + model.worldH / 2;
    zoom = next;
    panX = px - VB_W / 2 - (wx - model.worldW / 2) * s1;
    panY = py - VB_H / 2 - (wy - model.worldH / 2) * s1;
  }
  function zoomIn() {
    if (!svgEl) return;
    const box = svgEl.getBoundingClientRect();
    setZoomCentered(1.2, box.left + box.width / 2, box.top + box.height / 2);
  }
  function zoomOut() {
    if (!svgEl) return;
    const box = svgEl.getBoundingClientRect();
    setZoomCentered(1 / 1.2, box.left + box.width / 2, box.top + box.height / 2);
  }
  function resetView() {
    zoom = 0.85;
    panX = 0;
    panY = 0;
    onSelectPath?.(null);
  }

  function onEntityClick(e: MapEntity) {
    if (e.href) {
      if (e.kind === 'note') location.href = e.href;
      else onSelectPath?.(e.path);
    }
  }

  function tickLinks() {
    linkPhase = (linkPhase + 0.012) % 1;
    rafId = requestAnimationFrame(tickLinks);
  }

  $effect(() => {
    if (zoom >= LOD.link && !rafId) rafId = requestAnimationFrame(tickLinks);
    if (zoom < LOD.link && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    };
  });
</script>

<div class="tm-wrap" class:compact class:tm-hud-canvas={hudTheme.hud}>
  {#if !compact}
    <div class="tm-hud">
      <span class="tm-lod">{lodLabel(zoom)}</span>
      <span class="tm-z">×{zoom.toFixed(1)}</span>
    </div>
  {/if}

  <svg
    bind:this={svgEl}
    viewBox={`0 0 ${VB_W} ${VB_H}`}
    preserveAspectRatio="xMidYMid meet"
    class="tm-svg"
    class:g-svg--hud={hudTheme.hud}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onwheel={onWheel}
  >
    <defs>
      {#if hudTheme.hud}
        <radialGradient id="tm-ocean" cx="48%" cy="42%" r="75%">
          <stop offset="0%" stop-color="#101d36" />
          <stop offset="50%" stop-color="#0b1426" />
          <stop offset="100%" stop-color="#050a14" />
        </radialGradient>
        <pattern id="tm-hud-grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(245,242,235,0.05)" stroke-width="0.5" />
        </pattern>
        <linearGradient id="tm-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(245 242 235 / 0.08)" />
          <stop offset="100%" stop-color="rgb(0 0 0 / 0.15)" />
        </linearGradient>
        <linearGradient id="tm-pulse" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="48" y2="0">
          <stop offset="0%" stop-color="rgb(255 77 106 / 0)" />
          <stop offset="45%" stop-color="rgb(255 77 106 / 0.95)" />
          <stop offset="100%" stop-color="rgb(255 77 106 / 0)" />
        </linearGradient>
      {:else}
        <radialGradient id="tm-ocean" cx="48%" cy="42%" r="75%">
          <stop offset="0%" stop-color="#2a4a6e" />
          <stop offset="50%" stop-color="#142638" />
          <stop offset="100%" stop-color="#070e18" />
        </radialGradient>
        <linearGradient id="tm-shore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(255 255 255 / 0.07)" />
          <stop offset="100%" stop-color="rgb(0 0 0 / 0.1)" />
        </linearGradient>
        <linearGradient id="tm-pulse" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="48" y2="0">
          <stop offset="0%" stop-color="rgb(255 255 255 / 0)" />
          <stop offset="45%" stop-color="rgb(255 255 255 / 0.95)" />
          <stop offset="100%" stop-color="rgb(255 255 255 / 0)" />
        </linearGradient>
      {/if}
      <filter id="tm-link-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect width={VB_W} height={VB_H} fill="url(#tm-ocean)" />
    {#if hudTheme.hud}
      <rect width={VB_W} height={VB_H} fill="url(#tm-hud-grid)" />
    {/if}

    <g
      transform={`translate(${panX} ${panY}) translate(${VB_W / 2} ${VB_H / 2}) scale(${viewScale}) translate(${-model.worldW / 2} ${-model.worldH / 2})`}
    >
      <!-- 背景世界范围 hint -->
      <rect
        x={0}
        y={0}
        width={model.worldW}
        height={model.worldH}
        fill="none"
        stroke={hudTheme.hud ? 'rgba(245,242,235,0.08)' : 'rgb(255 255 255 / 0.04)'}
        stroke-width="2"
      />

      {#each visibleEntities as e (e.id)}
        {@const lifted = hoveredId === e.id}
        {@const fs = labelSize(e)}
        {#if e.kind === 'note'}
          {@const r = e.r ?? 3}
          <g data-region={e.id}>
            <circle
              data-hit
              cx={e.cx}
              cy={e.cy}
              r={r + 2}
              fill="transparent"
              class="tm-hit"
              onpointerdown={(ev) => ev.stopPropagation()}
              onmouseenter={() => (hoveredId = e.id)}
              onmouseleave={() => (hoveredId = null)}
              onclick={() => onEntityClick(e)}
              ondblclick={() => e.href && (location.href = e.href)}
            />
            <g class="tm-visual" class:is-lifted={lifted}>
              {#if hudTheme.hud}
                <GraphHudNode x={e.cx} y={e.cy} r={r} color={e.color} core={HUD_GRAPH.core} />
              {:else}
                <circle cx={e.cx} cy={e.cy} r={r} fill={e.color} stroke={e.stroke} stroke-width={e.strokeWidth} />
              {/if}
              {#if zoom >= 11 && r > 3}
                <text x={e.cx} y={e.cy - r - 2} text-anchor="middle" class="tm-note-label" font-size={5}>
                  {e.name.length > 12 ? `${e.name.slice(0, 10)}…` : e.name}
                </text>
              {/if}
            </g>
            <title>{e.name} · 笔记 · 双击打开</title>
          </g>
        {:else if e.kind === 'orphan-island'}
          <g data-region={e.id} class="tm-orphan">
            <path
              data-hit
              d={e.pathD}
              fill="transparent"
              stroke="none"
              class="tm-hit"
              onpointerdown={(ev) => ev.stopPropagation()}
              onmouseenter={() => (hoveredId = e.id)}
              onmouseleave={() => (hoveredId = null)}
              onclick={() => onEntityClick(e)}
              ondblclick={() => e.href && (location.href = e.href)}
            />
            <g class="tm-visual" class:is-lifted={lifted}>
              <path
                d={e.pathD}
                fill={e.color}
                fill-opacity={lifted ? 0.88 : 0.68}
                stroke={e.stroke}
                stroke-width={e.strokeWidth}
                stroke-dasharray="3 2"
                stroke-linejoin="round"
              />
              <path d={e.pathD} fill="url(#tm-shore)" opacity={0.22} pointer-events="none" />
              {#if zoom >= LOD.note}
                <circle cx={e.cx} cy={e.cy} r={e.r ?? 3} fill={e.color} stroke="rgb(255 255 255 / 0.5)" stroke-width="0.5" />
              {/if}
              {#if fs > 0 || zoom >= 2.5}
                <text x={e.cx} y={e.cy + (zoom >= LOD.note ? 8 : 0)} text-anchor="middle" dominant-baseline="middle" class="tm-label tm-orphan-label" font-size={fs > 0 ? fs : 6}>
                  {e.name.length > 10 ? `${e.name.slice(0, 8)}…` : e.name}
                </text>
              {/if}
            </g>
            <title>{e.name} · 孤岛 · 无双链 · 双击打开</title>
          </g>
        {:else}
          <g data-region={e.id}>
            <path
              data-hit
              d={e.pathD}
              fill="transparent"
              stroke="none"
              class="tm-hit"
              onpointerdown={(ev) => ev.stopPropagation()}
              onmouseenter={() => (hoveredId = e.id)}
              onmouseleave={() => (hoveredId = null)}
              onclick={() => onEntityClick(e)}
              ondblclick={() => e.href && (location.href = e.href)}
            />
            <g class="tm-visual" class:is-lifted={lifted}>
              <path
                d={e.pathD}
                fill={e.color}
                fill-opacity={lifted ? 0.9 : e.kind === 'country' ? 0.78 : 0.72}
                stroke={e.stroke}
                stroke-width={e.strokeWidth}
                stroke-linejoin="round"
              />
              <path d={e.pathD} fill="url(#tm-shore)" opacity={lifted ? 0.28 : 0.14} pointer-events="none" />
              {#if fs > 0}
                <text x={e.cx} y={e.cy - (fs > 7 ? 2 : 0)} text-anchor="middle" dominant-baseline="middle" class="tm-label" font-size={fs}>
                  {e.name.length > 14 ? `${e.name.slice(0, 12)}…` : e.name}
                </text>
              {/if}
            </g>
            <title>{e.name} · {depthLabel(e.kind)} · {e.path}</title>
          </g>
        {/if}
      {/each}

      {#if zoom >= LOD.link}
        <g class="tm-links">
          {#each visibleLinks as l (l.id)}
            <path d={l.pathD} fill="none" stroke={hudTheme.hud ? 'rgba(154,175,201,0.18)' : 'rgb(255 255 255 / 0.1)'} stroke-width="0.45" />
            <path
              d={l.pathD}
              fill="none"
              stroke={hudTheme.hud ? HUD_GRAPH.linkHi : 'rgb(255 255 255 / 0.85)'}
              stroke-width="0.9"
              stroke-dasharray="4 22"
              stroke-dashoffset={-linkPhase * 52}
              stroke-linecap="round"
              filter="url(#tm-link-glow)"
              class="tm-link-pulse"
            />
          {/each}
        </g>
      {/if}
    </g>
  </svg>

  <ZoomControls {zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />

  {#if hovered && !compact}
    <aside class="tm-tip">
      <strong>{hovered.name}</strong>
      <span>{depthLabel(hovered.kind)}{hovered.isOrphan ? ' · 无双链' : hovered.kind !== 'note' && hovered.kind !== 'orphan-island' ? ` · ${hovered.path}` : ''}</span>
      {#if hovered.href}
        <a class="tm-link" href={hovered.href}>{hovered.kind === 'note' || hovered.kind === 'orphan-island' ? '打开笔记' : '打开目录'}</a>
      {/if}
      <span class="tm-hint">滚轮缩放自动展开 · 无需点击</span>
    </aside>
  {/if}
</div>

<style>
  .tm-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
  }
  .tm-hud {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 6;
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(8 14 24 / 0.78);
    border: 1px solid rgb(212 196 160 / 0.35);
    font-size: 0.7rem;
    color: #d4c4a0;
    backdrop-filter: blur(6px);
    pointer-events: none;
  }
  .tm-z {
    color: rgb(180 200 230 / 0.8);
  }
  .tm-wrap.compact .tm-hud {
    display: none;
  }
  .tm-svg {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
    touch-action: none;
  }
  .tm-svg:active {
    cursor: grabbing;
  }
  .tm-hit {
    cursor: pointer;
  }
  .tm-visual {
    transition: transform 0.18s ease, filter 0.18s ease;
    pointer-events: none;
  }
  .tm-visual.is-lifted {
    transform: translateY(-2px);
    filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.22));
  }
  .tm-label {
    fill: rgb(255 255 255 / 0.92);
    font-weight: 700;
    paint-order: stroke;
    stroke: rgb(10 16 28 / 0.82);
    stroke-width: 2;
    pointer-events: none;
  }
  .tm-note-label {
    fill: rgb(255 255 255 / 0.85);
    paint-order: stroke;
    stroke: rgb(10 16 28 / 0.9);
    stroke-width: 1.5;
    pointer-events: none;
  }
  .tm-orphan-label {
    fill: rgb(255 255 255 / 0.78);
  }
  .tm-link-pulse {
    pointer-events: none;
  }
  .tm-tip {
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgb(8 14 24 / 0.85);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #eef4ff;
    font-size: 0.74rem;
    backdrop-filter: blur(8px);
    pointer-events: auto;
    max-width: 280px;
  }
  .tm-tip strong {
    font-size: 0.84rem;
  }
  .tm-tip span {
    color: rgb(180 200 230 / 0.85);
    word-break: break-all;
  }
  .tm-hint {
    color: #d4c4a0 !important;
    font-size: 0.66rem;
  }
  .tm-link {
    color: #ffd0e6;
    text-decoration: none;
    font-weight: 600;
  }
  .tm-link:hover {
    text-decoration: underline;
  }
</style>
