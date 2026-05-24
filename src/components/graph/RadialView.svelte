<script lang="ts">
  // 圆环辐射：按 folder 分扇区，节点按度数从外往里排；孤岛塞最内圈并加描边
  import type { RawLink, RawNode, WikiData, GraphSettings } from './graph-data';
  import { noteHref } from './graph-data';
  import { ZP_MIN, ZP_MAX, clamp } from './use-zoom-pan';
  import ZoomControls from './ZoomControls.svelte';
  import GraphHudNode from './GraphHudNode.svelte';
  import {
    HUD_GRAPH,
    hudLinkStroke,
    hudNodeCoreColor,
    resolveGraphColor,
  } from './graph-hud-theme';
  import { useGraphHudTheme } from '../../features/ui/hud-mode.svelte';

  interface Props {
    data: WikiData;
    folderFocus: string | null;
    settings: GraphSettings;
    onSelect?: (id: string | null) => void;
  }
  let { data, folderFocus, settings, onSelect }: Props = $props();

  const hudTheme = useGraphHudTheme();

  const VB = 1000;
  const cx = 500, cy = 500;
  const rOuter = 440;
  const rInner = 160;
  const rOrphan = 110;

  type Place = { node: RawNode; folder: string; x: number; y: number; angle: number; r: number; color: string; orphan: boolean };

  let hoveredId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);

  // zoom/pan 状态
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };
  let svgEl: SVGSVGElement | null = null;

  const visibleNodes = $derived(
    settings.showOrphans
      ? data.nodes
      : data.nodes.filter((n) => n.inDegree + n.outDegree > 0)
  );

  const folders = $derived(Array.from(new Set(visibleNodes.map((n) => n.folder))).sort());

  // 算所有节点坐标（含孤岛）
  const placed = $derived.by<Place[]>(() => {
    const F = folders.length;
    if (F === 0) return [];
    const gap = (Math.PI * 2) * 0.012;
    const sector = (Math.PI * 2 - gap * F) / F;

    const byFolder = new Map<string, RawNode[]>();
    for (const n of visibleNodes) {
      if (!byFolder.has(n.folder)) byFolder.set(n.folder, []);
      byFolder.get(n.folder)!.push(n);
    }
    const out: Place[] = [];
    folders.forEach((f, i) => {
      const arr = (byFolder.get(f) || []).slice();
      arr.sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree));
      const start = -Math.PI / 2 + i * (sector + gap);
      const color = resolveGraphColor(f, folders, hudTheme.hud);

      // 拆出孤岛
      const orphans = arr.filter((n) => n.inDegree + n.outDegree === 0);
      const conn = arr.filter((n) => n.inDegree + n.outDegree > 0);

      // 普通节点：从外向内
      const len = conn.length;
      conn.forEach((n, j) => {
        const a = start + (sector * (j + 0.5)) / Math.max(1, len);
        const tt = len > 1 ? j / (len - 1) : 0.5;
        const r = rInner + (rOuter - rInner) * (1 - tt);
        out.push({ node: n, folder: f, angle: a, r, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, color, orphan: false });
      });
      // 孤岛节点：内圈紧密排
      orphans.forEach((n, j) => {
        const a = start + (sector * (j + 0.5)) / Math.max(1, orphans.length);
        const r = rOrphan - (j % 3) * 18;
        out.push({ node: n, folder: f, angle: a, r, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, color, orphan: true });
      });
    });
    return out;
  });

  const placedMap = $derived(new Map(placed.map((p) => [p.node.id, p])));

  const focusId = $derived(hoveredId ?? selectedId);
  const highlightSet = $derived.by(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const l of data.links) {
      if (l.source === focusId) set.add(l.target);
      else if (l.target === focusId) set.add(l.source);
    }
    return set;
  });

  function isDim(id: string) {
    if (folderFocus && placedMap.get(id)?.folder !== folderFocus) return true;
    if (!highlightSet) return false;
    return !highlightSet.has(id);
  }

  function nodeR(p: Place) {
    const base = p.orphan ? 2.4 : (2.5 + Math.sqrt(p.node.inDegree + p.node.outDegree) * 2.2);
    return base * settings.nodeScale;
  }

  function edgePath(a: Place, b: Place) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const tx = cx + (mx - cx) * 0.15;
    const ty = cy + (my - cy) * 0.15;
    return `M ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${tx.toFixed(1)},${ty.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }

  function onNodeClick(id: string) {
    if (settings.clickToOpen) {
      location.href = noteHref(id);
      return;
    }
    selectedId = selectedId === id ? null : id;
    onSelect?.(selectedId);
  }

  // ============ zoom / pan（viewBox 坐标系） ============
  function clientToVB(clientX: number, clientY: number) {
    if (!svgEl) return { x: 0, y: 0, kx: 1, ky: 1 };
    const box = svgEl.getBoundingClientRect();
    const kx = VB / box.width;
    const ky = VB / box.height;
    return { x: (clientX - box.left) * kx, y: (clientY - box.top) * ky, kx, ky };
  }
  function setZoomCentered(factor: number, clientX: number, clientY: number) {
    const { x: cx, y: cy } = clientToVB(clientX, clientY);
    const next = clamp(zoom * factor, ZP_MIN, ZP_MAX);
    const k = next / zoom;
    panX = cx - (cx - panX) * k;
    panY = cy - (cy - panY) * k;
    zoom = next;
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoomCentered(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }
  function onPanDown(e: PointerEvent) {
    const t = e.target as Element;
    if (t.closest('[data-nid]')) return;
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    svgEl?.setPointerCapture?.(e.pointerId);
  }
  function onPanMove(e: PointerEvent) {
    if (!panning) return;
    const { kx, ky } = clientToVB(0, 0);
    panX = panStart.px + (e.clientX - panStart.x) * kx;
    panY = panStart.py + (e.clientY - panStart.y) * ky;
  }
  function onPanUp(e: PointerEvent) {
    if (!panning) return;
    panning = false;
    svgEl?.releasePointerCapture?.(e.pointerId);
  }
  function zoomIn()  { if (!svgEl) return; const b = svgEl.getBoundingClientRect(); setZoomCentered(1.25, b.left + b.width/2, b.top + b.height/2); }
  function zoomOut() { if (!svgEl) return; const b = svgEl.getBoundingClientRect(); setZoomCentered(1/1.25, b.left + b.width/2, b.top + b.height/2); }
  function resetView() { zoom = 1; panX = 0; panY = 0; }
</script>

<svg
  bind:this={svgEl}
  viewBox="0 0 {VB} {VB}"
  preserveAspectRatio="xMidYMid meet"
  class="g-svg"
  class:g-svg--hud={hudTheme.hud}
  onwheel={onWheel}
  onpointerdown={onPanDown}
  onpointermove={onPanMove}
  onpointerup={onPanUp}
  onpointercancel={onPanUp}
>
  <defs>
    {#if hudTheme.hud}
      <radialGradient id="rv-bg" cx="50%" cy="48%" r="58%">
        <stop offset="0%" stop-color="#101d36" stop-opacity="0.95" />
        <stop offset="60%" stop-color="#0b1426" stop-opacity="0.98" />
        <stop offset="100%" stop-color="#050a14" stop-opacity="1" />
      </radialGradient>
      <pattern id="rv-hud-grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(245,242,235,0.05)" stroke-width="0.5" />
      </pattern>
    {:else}
      <radialGradient id="rv-bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3b234b" stop-opacity="0.9" />
        <stop offset="60%" stop-color="#1a1024" stop-opacity="0.95" />
        <stop offset="100%" stop-color="#0a0418" stop-opacity="1" />
      </radialGradient>
      <radialGradient id="rv-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="rv-link" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(255 208 230 / 0.55)" />
        <stop offset="100%" stop-color="rgb(180 140 255 / 0.55)" />
      </linearGradient>
    {/if}
  </defs>

  <rect x="0" y="0" width={VB} height={VB} fill="url(#rv-bg)" opacity={settings.bgDim} />
  {#if hudTheme.hud}
    <rect x="0" y="0" width={VB} height={VB} fill="url(#rv-hud-grid)" opacity={settings.bgDim * 0.85} />
  {/if}

  <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>

  <!-- 同心圆刻度 -->
  <g fill="none" stroke={hudTheme.hud ? 'rgba(245,242,235,0.08)' : 'rgba(255,255,255,0.06)'}>
    {#each [80, 140, 220, 300, 380, 440] as r}
      <circle cx={cx} cy={cy} r={r} />
    {/each}
  </g>

  <!-- 扇区底色 + 文件夹标签 -->
  <g>
    {#each folders as f, i}
      {@const gap = (Math.PI * 2) * 0.012}
      {@const sec = (Math.PI * 2 - gap * folders.length) / Math.max(1, folders.length)}
      {@const a0 = -Math.PI / 2 + i * (sec + gap)}
      {@const a1 = a0 + sec}
      {@const lx = cx + Math.cos((a0 + a1) / 2) * (rOuter + 40)}
      {@const ly = cy + Math.sin((a0 + a1) / 2) * (rOuter + 40)}
      {@const sectorColor = resolveGraphColor(f, folders, hudTheme.hud)}
      <path
        d={`M ${cx} ${cy} L ${cx + Math.cos(a0) * (rOuter + 16)} ${cy + Math.sin(a0) * (rOuter + 16)} A ${rOuter + 16} ${rOuter + 16} 0 0 1 ${cx + Math.cos(a1) * (rOuter + 16)} ${cy + Math.sin(a1) * (rOuter + 16)} Z`}
        fill={sectorColor}
        fill-opacity={folderFocus === f ? 0.18 : (folderFocus ? 0.04 : (hudTheme.hud ? 0.06 : 0.08))}
        stroke={sectorColor}
        stroke-opacity={hudTheme.hud ? 0.35 : 0.25}
        stroke-width="0.6"
      />
      <text x={lx} y={ly} text-anchor="middle" alignment-baseline="middle"
            fill={sectorColor} font-size="14" font-weight="700"
            opacity={folderFocus && folderFocus !== f ? 0.3 : 1}
            style={hudTheme.hud ? 'letter-spacing:0.08em;text-transform:uppercase' : ''}>{f}</text>
    {/each}
  </g>

  <!-- 边 -->
  <g opacity={settings.edgeOpacity}>
    {#each data.links as l}
      {@const a = placedMap.get(l.source)}
      {@const b = placedMap.get(l.target)}
      {#if a && b}
        {@const dim = (folderFocus && a.folder !== folderFocus && b.folder !== folderFocus) || (highlightSet && !(highlightSet.has(l.source) && highlightSet.has(l.target)))}
        {@const hi = highlightSet && highlightSet.has(l.source) && highlightSet.has(l.target)}
        <path d={edgePath(a, b)} fill="none"
              stroke={hudTheme.hud ? hudLinkStroke(!!dim, !!hi) : (dim ? 'rgba(255,255,255,0.04)' : 'url(#rv-link)')}
              stroke-width={(dim ? 0.4 : (hi ? 1.1 : 0.9)) * settings.edgeScale}
              stroke-linecap="round" />
      {/if}
    {/each}
  </g>

  <!-- 节点 -->
  <g>
    {#each placed as p (p.node.id)}
      {@const r = nodeR(p)}
      {@const dim = isDim(p.node.id)}
      {@const showLabel = settings.showLabels === 'always' || (settings.showLabels === 'hover' && focusId === p.node.id)}
        {@const starColor = resolveGraphColor(p.folder, folders, hudTheme.hud)}
        <g
          data-nid={p.node.id}
          class="g-node {selectedId === p.node.id ? 'is-sel' : ''} {dim ? 'is-dim' : ''} {p.orphan ? 'is-orphan' : ''} {settings.clickToOpen ? 'is-link' : ''}"
          onmouseenter={() => (hoveredId = p.node.id)}
          onmouseleave={() => (hoveredId = null)}
          onclick={() => onNodeClick(p.node.id)}
          ondblclick={() => (location.href = noteHref(p.node.id))}
        >
          {#if hudTheme.hud}
            <GraphHudNode
              x={p.x}
              y={p.y}
              r={r}
              color={starColor}
              core={hudNodeCoreColor(p.node, starColor)}
              orphan={p.orphan}
              selected={selectedId === p.node.id}
            />
          {:else}
            {#if !p.orphan}
              <circle cx={p.x} cy={p.y} r={r * 2.8} fill="url(#rv-glow)" />
            {/if}
            <circle cx={p.x} cy={p.y} r={r} fill={p.color}
                    stroke={p.orphan ? 'rgb(255 255 255 / 0.45)' : 'none'}
                    stroke-width="0.6"
                    stroke-dasharray={p.orphan ? '1.5,1.5' : ''}>
              <title>{p.node.title}（{p.folder}） · 入{p.node.inDegree}/出{p.node.outDegree}{p.orphan ? ' · 孤岛' : ''}{settings.clickToOpen ? ' · 单击跳转' : ''}</title>
            </circle>
          {/if}
          <title>{p.node.title}（{p.folder}） · 入{p.node.inDegree}/出{p.node.outDegree}{p.orphan ? ' · 孤岛' : ''}{settings.clickToOpen ? ' · 单击跳转' : ''}</title>
          {#if showLabel}
            <text x={p.x} y={p.y - r - 6} text-anchor="middle" class="g-label">{p.node.title}</text>
          {/if}
        </g>
    {/each}
  </g>

  <!-- 中心 KPI -->
  <g transform={`translate(${cx} ${cy})`}>
    <circle r="86" fill={hudTheme.hud ? 'rgb(5 10 20 / 0.72)' : 'rgb(0 0 0 / 0.55)'} stroke={hudTheme.hud ? 'rgba(245,242,235,0.18)' : 'rgba(255,255,255,0.12)'} />
    <text y="-10" text-anchor="middle" fill={hudTheme.hud ? HUD_GRAPH.label : '#fff'} font-size="42" font-weight="800">{data.nodes.length}</text>
    <text y="14" text-anchor="middle" fill={hudTheme.hud ? HUD_GRAPH.labelMuted : '#d0c4f0'} font-size="11" letter-spacing="2">{hudTheme.hud ? 'NODES' : '笔记节点'}</text>
    <text y="34" text-anchor="middle" fill={hudTheme.hud ? HUD_GRAPH.telemetry : '#9d8fc0'} font-size="10">{data.links.length} {hudTheme.hud ? 'LINKS' : '条双链'}</text>
  </g>

  </g>
</svg>

<ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />

<style>
  .g-svg {
    width: 100%; height: 100%; display: block;
    cursor: grab;
    touch-action: none;
  }
  .g-node { cursor: pointer; transition: opacity 0.2s ease; }
  .g-node.is-link { cursor: alias; }
  .g-node.is-dim { opacity: 0.18; }
  .g-node.is-orphan { opacity: 0.85; }
  .g-node.is-sel circle:last-of-type { stroke: #fff; stroke-width: 1.6; }
  .g-label {
    fill: #fff; font-size: 12px; font-weight: 600;
    paint-order: stroke; stroke: rgb(20 12 32 / 0.85); stroke-width: 3;
    pointer-events: none;
  }
</style>
