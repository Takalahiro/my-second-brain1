<script lang="ts">
  /**
   * 弧线和弦图：节点沿底部 baseline 一字排列，按 folder 分组并着色；
   * 链接以贝塞尔半圆弧画在上方；孤岛同样显示在 baseline，但没有弧线。
   * 风格：水墨/电路风。
   */
  import type { RawLink, WikiData, RawNode, GraphSettings } from './graph-data';
  import { folderColor, noteHref } from './graph-data';
  import { ZP_MIN, ZP_MAX, clamp } from './use-zoom-pan';
  import ZoomControls from './ZoomControls.svelte';

  interface Props {
    data: WikiData;
    folderFocus: string | null;
    settings: GraphSettings;
    onSelect?: (id: string | null) => void;
  }
  let { data, folderFocus, settings, onSelect }: Props = $props();

  let hoveredId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);

  // zoom/pan
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };
  let svgEl: SVGSVGElement | null = null;

  const VB_W = 1600;
  const VB_H = 760;
  const PAD = 40;
  const BASE_Y = VB_H - 60;

  const visibleNodes = $derived(
    settings.showOrphans
      ? data.nodes
      : data.nodes.filter((n) => n.inDegree + n.outDegree > 0)
  );

  const folders = $derived(Array.from(new Set(visibleNodes.map((n) => n.folder))).sort());

  type Place = { node: RawNode; x: number; folder: string; color: string; orphan: boolean };
  const placed = $derived.by<Place[]>(() => {
    // 按 folder 分组排列；每组内按 (deg desc) 排
    const grouped: { folder: string; items: RawNode[] }[] = folders.map((f) => ({
      folder: f,
      items: visibleNodes
        .filter((n) => n.folder === f)
        .slice()
        .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree)),
    }));
    const total = visibleNodes.length;
    const totalSpace = VB_W - PAD * 2;
    const groupGap = 16;
    const totalGaps = (grouped.length - 1) * groupGap;
    const usable = totalSpace - totalGaps;
    const list: Place[] = [];
    let x = PAD;
    grouped.forEach((g) => {
      const groupWidth = (g.items.length / total) * usable;
      const step = groupWidth / Math.max(1, g.items.length);
      g.items.forEach((n, i) => {
        const cx = x + step * (i + 0.5);
        list.push({
          node: n,
          x: cx,
          folder: g.folder,
          color: folderColor(g.folder, folders),
          orphan: n.inDegree + n.outDegree === 0,
        });
      });
      x += groupWidth + groupGap;
    });
    return list;
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
    const base = p.orphan ? 2.6 : (2.8 + Math.sqrt(p.node.inDegree + p.node.outDegree) * 1.6);
    return base * settings.nodeScale;
  }

  function arcPath(a: Place, b: Place) {
    const dx = Math.abs(a.x - b.x);
    const height = Math.min(BASE_Y - 60, dx * 0.55);
    const mx = (a.x + b.x) / 2;
    const my = BASE_Y - height;
    return `M ${a.x.toFixed(1)} ${BASE_Y} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${BASE_Y}`;
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
    const kx = VB_W / box.width;
    const ky = VB_H / box.height;
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
  function onWheel(e: WheelEvent) { e.preventDefault(); setZoomCentered(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }
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
  viewBox="0 0 {VB_W} {VB_H}"
  preserveAspectRatio="xMidYMid meet"
  class="g-svg"
  onwheel={onWheel}
  onpointerdown={onPanDown}
  onpointermove={onPanMove}
  onpointerup={onPanUp}
  onpointercancel={onPanUp}
>
  <defs>
    <linearGradient id="av-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e0620" />
      <stop offset="60%" stop-color="#1a1132" />
      <stop offset="100%" stop-color="#06030f" />
    </linearGradient>
    <linearGradient id="av-arc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgb(180 140 255 / 0.7)" />
      <stop offset="100%" stop-color="rgb(255 208 230 / 0.15)" />
    </linearGradient>
    <linearGradient id="av-arc-hi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd0e6" />
      <stop offset="100%" stop-color="#b48cff" />
    </linearGradient>
    <pattern id="av-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" stroke="rgba(255,255,255,0.04)" fill="none" />
    </pattern>
  </defs>

  <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#av-bg)" opacity={settings.bgDim} />
  <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#av-grid)" />

  <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>

  <!-- baseline -->
  <line x1={PAD - 10} y1={BASE_Y} x2={VB_W - PAD + 10} y2={BASE_Y} stroke="rgb(255 255 255 / 0.16)" stroke-width="1" />

  <!-- 弧线 -->
  <g opacity={settings.edgeOpacity}>
    {#each data.links as l}
      {@const a = placedMap.get(l.source)}
      {@const b = placedMap.get(l.target)}
      {#if a && b && a.x !== b.x}
        {@const hi = highlightSet && highlightSet.has(l.source) && highlightSet.has(l.target)}
        {@const dim = (folderFocus && a.folder !== folderFocus && b.folder !== folderFocus) || (highlightSet && !hi)}
        <path d={arcPath(a, b)} fill="none"
              stroke={hi ? 'url(#av-arc-hi)' : (dim ? 'rgba(255,255,255,0.04)' : 'url(#av-arc)')}
              stroke-width={(hi ? 1.4 : (dim ? 0.4 : 0.8)) * settings.edgeScale}
              stroke-linecap="round" />
      {/if}
    {/each}
  </g>

  <!-- 文件夹色带 -->
  <g>
    {#each placed as p, i (p.node.id)}
      {#if i === 0 || placed[i - 1].folder !== p.folder}
        {@const lastSame = (() => { let j = i; while (j < placed.length && placed[j].folder === p.folder) j++; return j - 1; })()}
        {@const x0 = Math.max(PAD - 4, p.x - 6)}
        {@const x1 = Math.min(VB_W - PAD + 4, placed[lastSame].x + 6)}
        <rect
          x={x0} y={BASE_Y + 10}
          width={Math.max(8, x1 - x0)}
          height="16"
          rx="6"
          fill={p.color}
          fill-opacity={folderFocus && folderFocus !== p.folder ? 0.18 : 0.7}
        />
        <text
          x={(x0 + x1) / 2}
          y={BASE_Y + 44}
          text-anchor="middle"
          fill={p.color}
          font-size="12"
          font-weight="700"
          opacity={folderFocus && folderFocus !== p.folder ? 0.3 : 1}
        >{p.folder}</text>
      {/if}
    {/each}
  </g>

  <!-- 节点 -->
  <g>
    {#each placed as p (p.node.id)}
      {@const r = nodeR(p)}
      {@const dim = isDim(p.node.id)}
      {@const showLabel = settings.showLabels === 'always' || (settings.showLabels === 'hover' && focusId === p.node.id)}
      <g
        data-nid={p.node.id}
        class="g-node {selectedId === p.node.id ? 'is-sel' : ''} {dim ? 'is-dim' : ''} {p.orphan ? 'is-orphan' : ''} {settings.clickToOpen ? 'is-link' : ''}"
        onmouseenter={() => (hoveredId = p.node.id)}
        onmouseleave={() => (hoveredId = null)}
        onclick={() => onNodeClick(p.node.id)}
        ondblclick={() => (location.href = noteHref(p.node.id))}
      >
        <circle cx={p.x} cy={BASE_Y} r={r} fill={p.color}
                stroke={p.orphan ? 'rgb(255 255 255 / 0.45)' : 'none'}
                stroke-width="0.6"
                stroke-dasharray={p.orphan ? '1.4,1.4' : ''}>
          <title>{p.node.title}（{p.folder}） · 入{p.node.inDegree}/出{p.node.outDegree}{p.orphan ? ' · 孤岛' : ''}{settings.clickToOpen ? ' · 单击跳转' : ''}</title>
        </circle>
        {#if showLabel}
          <line x1={p.x} y1={BASE_Y - r - 2} x2={p.x} y2={BASE_Y - r - 18} stroke={p.color} stroke-width="1" />
          <text x={p.x} y={BASE_Y - r - 22} text-anchor="middle" class="g-label">{p.node.title}</text>
        {/if}
      </g>
    {/each}
  </g>

  </g>
</svg>

<ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />

<style>
  .g-svg { width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
  .g-node { cursor: pointer; transition: opacity 0.2s ease; }
  .g-node.is-link { cursor: alias; }
  .g-node.is-dim { opacity: 0.2; }
  .g-node.is-orphan { opacity: 0.85; }
  .g-node.is-sel circle { stroke: #fff; stroke-width: 1.6; }
  .g-label {
    fill: #fff; font-size: 13px; font-weight: 700;
    paint-order: stroke; stroke: rgb(20 12 32 / 0.85); stroke-width: 3;
    pointer-events: none;
  }
</style>
