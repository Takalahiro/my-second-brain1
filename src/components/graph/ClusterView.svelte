<script lang="ts">
  /**
   * 同心簇环：每个 folder 作为一个独立的小行星系统。
   *  - folder 的中心节点是该 folder 中度数最高的笔记
   *  - 其余按度数 desc 顺时针排满
   *  - folder 之间排成黄金角网格（spiral 排布）
   *  - 孤岛在 folder 系统的外圈淡显示
   * 风格：太阳系/星座感
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

  const VB_W = 1600;
  const VB_H = 1000;

  let hoveredId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);

  // zoom/pan
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

  type Place = { node: RawNode; x: number; y: number; folder: string; color: string; orphan: boolean; isCenter: boolean };

  const placed = $derived.by<Place[]>(() => {
    if (folders.length === 0) return [];
    // 计算每个 folder 的列表
    const byFolder = new Map<string, RawNode[]>();
    for (const n of visibleNodes) {
      if (!byFolder.has(n.folder)) byFolder.set(n.folder, []);
      byFolder.get(n.folder)!.push(n);
    }
    for (const arr of byFolder.values()) {
      arr.sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree));
    }
    // 网格布局（4 列）
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(folders.length))));
    const rows = Math.ceil(folders.length / cols);
    const cellW = VB_W / cols;
    const cellH = VB_H / rows;

    const out: Place[] = [];
    folders.forEach((f, idx) => {
      const arr = byFolder.get(f) || [];
      if (arr.length === 0) return;
      const ci = idx % cols;
      const ri = Math.floor(idx / cols);
      const cx = cellW * ci + cellW / 2;
      const cy = cellH * ri + cellH / 2;
      const radius = Math.min(cellW, cellH) * 0.36;

      const color = folderColor(f, folders);
      const center = arr[0];
      const orbiting = arr.slice(1);

      out.push({
        node: center,
        x: cx,
        y: cy,
        folder: f,
        color,
        orphan: center.inDegree + center.outDegree === 0,
        isCenter: true,
      });

      // orbiting：按度数分两层
      const inner = orbiting.filter((_, i) => i % 2 === 0);
      const outer = orbiting.filter((_, i) => i % 2 === 1);
      [inner, outer].forEach((layer, li) => {
        const r = radius * (li === 0 ? 0.6 : 1);
        const offset = li * Math.PI / Math.max(1, layer.length);
        layer.forEach((n, i) => {
          const a = (i / Math.max(1, layer.length)) * Math.PI * 2 + offset;
          out.push({
            node: n,
            x: cx + Math.cos(a) * r,
            y: cy + Math.sin(a) * r,
            folder: f,
            color,
            orphan: n.inDegree + n.outDegree === 0,
            isCenter: false,
          });
        });
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
    let base: number;
    if (p.isCenter) base = 8 + Math.sqrt(p.node.inDegree + p.node.outDegree) * 1.8;
    else if (p.orphan) base = 2.4;
    else base = 2.8 + Math.sqrt(p.node.inDegree + p.node.outDegree) * 1.4;
    return base * settings.nodeScale;
  }

  function onNodeClick(id: string) {
    if (settings.clickToOpen) {
      location.href = noteHref(id);
      return;
    }
    selectedId = selectedId === id ? null : id;
    onSelect?.(selectedId);
  }

  // ============ zoom / pan ============
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

  /** folder 网格中心 */
  const centers = $derived.by(() => {
    if (folders.length === 0) return [] as { folder: string; cx: number; cy: number; r: number; color: string }[];
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(folders.length))));
    const rows = Math.ceil(folders.length / cols);
    const cellW = VB_W / cols;
    const cellH = VB_H / rows;
    return folders.map((f, idx) => {
      const ci = idx % cols;
      const ri = Math.floor(idx / cols);
      return {
        folder: f,
        cx: cellW * ci + cellW / 2,
        cy: cellH * ri + cellH / 2,
        r: Math.min(cellW, cellH) * 0.42,
        color: folderColor(f, folders),
      };
    });
  });
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
    <radialGradient id="cv-bg" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#231434" />
      <stop offset="60%" stop-color="#10081b" />
      <stop offset="100%" stop-color="#04020a" />
    </radialGradient>
    <radialGradient id="cv-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#fff" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#cv-bg)" opacity={settings.bgDim} />

  <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>

  <!-- 文件夹"行星轨道" -->
  <g class="cv-orbits">
    {#each centers as c}
      <circle cx={c.cx} cy={c.cy} r={c.r * 0.6} fill="none" stroke={c.color} stroke-opacity="0.18" stroke-dasharray="2,4" />
      <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={c.color} stroke-opacity="0.14" stroke-dasharray="2,4" />
      <text x={c.cx} y={c.cy - c.r - 14} text-anchor="middle" fill={c.color} font-size="14" font-weight="700"
            opacity={folderFocus && folderFocus !== c.folder ? 0.3 : 1}>{c.folder}</text>
    {/each}
  </g>

  <!-- 边 -->
  <g opacity={settings.edgeOpacity}>
    {#each data.links as l}
      {@const a = placedMap.get(l.source)}
      {@const b = placedMap.get(l.target)}
      {#if a && b}
        {@const hi = highlightSet && highlightSet.has(l.source) && highlightSet.has(l.target)}
        {@const dim = (folderFocus && a.folder !== folderFocus && b.folder !== folderFocus) || (highlightSet && !hi)}
        {@const sameFolder = a.folder === b.folder}
        <line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={hi ? '#ffd0e6' : (dim ? 'rgba(255,255,255,0.03)' : (sameFolder ? a.color + '99' : 'url(#cv-cross-grad)'))}
          stroke-width={(hi ? 1.4 : (dim ? 0.3 : (sameFolder ? 0.6 : 0.5))) * settings.edgeScale}
          stroke-linecap="round"
          stroke-dasharray={sameFolder ? '' : '3,3'}
        />
      {/if}
    {/each}
    <defs>
      <linearGradient id="cv-cross-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgb(255 208 230 / 0.6)" />
        <stop offset="100%" stop-color="rgb(180 140 255 / 0.6)" />
      </linearGradient>
    </defs>
  </g>

  <!-- 节点 -->
  <g>
    {#each placed as p (p.node.id)}
      {@const r = nodeR(p)}
      {@const dim = isDim(p.node.id)}
      {@const showLabel = (
        settings.showLabels === 'always'
        || (settings.showLabels === 'hover' && focusId === p.node.id)
        || (settings.showLabels !== 'never' && p.isCenter)
      )}
      <g
        data-nid={p.node.id}
        class="g-node {selectedId === p.node.id ? 'is-sel' : ''} {dim ? 'is-dim' : ''} {p.orphan ? 'is-orphan' : ''} {p.isCenter ? 'is-center' : ''} {settings.clickToOpen ? 'is-link' : ''}"
        onmouseenter={() => (hoveredId = p.node.id)}
        onmouseleave={() => (hoveredId = null)}
        onclick={() => onNodeClick(p.node.id)}
        ondblclick={() => (location.href = noteHref(p.node.id))}
      >
        <circle cx={p.x} cy={p.y} r={r * (p.isCenter ? 1.8 : 2.4)} fill="url(#cv-glow)" />
        <circle cx={p.x} cy={p.y} r={r} fill={p.color}
                stroke={p.isCenter ? '#fff' : (p.orphan ? 'rgb(255 255 255 / 0.45)' : 'none')}
                stroke-width={p.isCenter ? 1.2 : 0.6}
                stroke-dasharray={p.orphan && !p.isCenter ? '1.5,1.5' : ''}>
          <title>{p.node.title}（{p.folder}） · 入{p.node.inDegree}/出{p.node.outDegree}{p.orphan ? ' · 孤岛' : ''}{p.isCenter ? ' · 中心' : ''}{settings.clickToOpen ? ' · 单击跳转' : ''}</title>
        </circle>
        {#if showLabel}
          <text x={p.x} y={p.y + r + 14} text-anchor="middle" class="g-label">{p.node.title}</text>
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
  .g-node.is-dim { opacity: 0.18; }
  .g-node.is-orphan { opacity: 0.78; }
  .g-node.is-sel circle:last-of-type { stroke: #fff; stroke-width: 1.8; }
  .g-label {
    fill: #fff; font-size: 11px; font-weight: 600;
    paint-order: stroke; stroke: rgb(20 12 32 / 0.85); stroke-width: 2.5;
    pointer-events: none;
  }
  .g-node.is-center .g-label { font-size: 14px; font-weight: 800; }
</style>
