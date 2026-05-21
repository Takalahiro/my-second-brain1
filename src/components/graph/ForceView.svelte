<script lang="ts">
  /**
   * 力导向（页面级），包含孤岛节点。
   * 孤岛被放在外围用同一物理仿真，但不参与弹簧（无边）。
   */
  import { onMount } from 'svelte';
  import type { RawNode, RawLink, WikiData, GraphSettings } from './graph-data';
  import { folderColor, noteHref } from './graph-data';
  import { ZP_MIN, ZP_MAX, clamp } from './use-zoom-pan';
  import ZoomControls from './ZoomControls.svelte';
  import {
    createForceController,
    reheatForce,
    stepForceSimulation,
    type ForceSimController,
  } from './force-simulation';

  interface Props {
    data: WikiData;
    folderFocus: string | null;
    settings: GraphSettings;
    onSelect?: (id: string | null) => void;
  }
  let { data, folderFocus, settings, onSelect }: Props = $props();

  type Node = RawNode & { x: number; y: number; vx: number; vy: number; color: string; fixed?: boolean };

  let nodes = $state<Node[]>([]);
  let nodeMap: Map<string, Node> = new Map();
  let links = $state<RawLink[]>([]);
  let folders = $state<string[]>([]);
  let svgEl: SVGSVGElement | null = null;
  let raf: number | null = null;
  let hoveredId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);

  // 物理参数从 settings 读取
  const kRepel = $derived(settings.forceRepel);
  const kSpring = $derived(settings.forceSpring);
  const edgeLen = $derived(settings.forceEdgeLen);

  let simCtrl: ForceSimController = createForceController();

  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };
  let dragNodeId: string | null = null;
  /** 每帧递增，驱动 Svelte 5 重绘节点坐标 */
  let simFrame = $state(0);

  onMount(() => {
    rebuild();
    tickLoop();
    return () => { if (raf) cancelAnimationFrame(raf); };
  });

  function rebuild() {
    folders = Array.from(new Set(data.nodes.map((n) => n.folder))).sort();
    const source = settings.showOrphans
      ? data.nodes
      : data.nodes.filter((n) => n.inDegree + n.outDegree > 0);
    nodes = source.map((n) => ({
      ...n,
      x: (Math.random() - 0.5) * 700,
      y: (Math.random() - 0.5) * 500,
      vx: 0, vy: 0,
      color: folderColor(n.folder, folders),
    }));
    nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const ids = new Set(nodes.map((n) => n.id));
    links = data.links.filter((l) => ids.has(l.source) && ids.has(l.target));
    reheatForce(simCtrl, 1);
  }

  $effect(() => {
    kRepel;
    kSpring;
    edgeLen;
    if (nodes.length > 0) reheatForce(simCtrl, 0.45);
  });

  // settings 变化时（如显示/隐藏孤岛）需要重建节点集合
  let lastShowOrphans = settings.showOrphans;
  $effect(() => {
    if (settings.showOrphans !== lastShowOrphans) {
      lastShowOrphans = settings.showOrphans;
      rebuild();
    }
  });

  function tickLoop() {
    raf = requestAnimationFrame(() => {
      if (simCtrl.running && nodes.length > 0) {
        const moved = stepForceSimulation(nodes, links, nodeMap, simCtrl, {
          kRepel,
          kSpring,
          edgeLen,
        });
        if (moved) simFrame++;
      }
      tickLoop();
    });
  }

  function nodeR(n: Node) {
    const deg = n.inDegree + n.outDegree;
    const base = deg === 0 ? 3 : Math.min(14, 3.5 + Math.sqrt(deg) * 1.4);
    return base * settings.nodeScale;
  }

  const focusId = $derived(hoveredId ?? selectedId);
  const highlightSet = $derived.by(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const l of links) {
      if (l.source === focusId) set.add(l.target);
      else if (l.target === focusId) set.add(l.source);
    }
    return set;
  });

  function isDim(id: string) {
    if (folderFocus && nodeMap.get(id)?.folder !== folderFocus) return true;
    if (!highlightSet) return false;
    return !highlightSet.has(id);
  }

  function onPointerDown(e: PointerEvent) {
    const t = e.target as Element;
    const g = t.closest('[data-nid]');
    if (g) {
      const id = g.getAttribute('data-nid')!;
      const n = nodeMap.get(id);
      if (n) n.fixed = true;
      dragNodeId = id;
      svgEl?.setPointerCapture?.(e.pointerId);
      e.stopPropagation();
      return;
    }
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    svgEl?.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (dragNodeId) {
      const n = nodeMap.get(dragNodeId);
      if (!n || !svgEl) return;
      const box = svgEl.getBoundingClientRect();
      n.x = (e.clientX - box.left - box.width / 2 - panX) / zoom;
      n.y = (e.clientY - box.top - box.height / 2 - panY) / zoom;
      n.vx = 0;
      n.vy = 0;
      simFrame++;
    } else if (panning) {
      panX = panStart.px + (e.clientX - panStart.x);
      panY = panStart.py + (e.clientY - panStart.y);
    }
  }
  function onPointerUp(e: PointerEvent) {
    if (dragNodeId) {
      const n = nodeMap.get(dragNodeId);
      if (n) n.fixed = false;
      dragNodeId = null;
      reheatForce(simCtrl, 0.25);
    }
    if (panning) panning = false;
    svgEl?.releasePointerCapture?.(e.pointerId);
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    setZoomCentered(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
  }
  /** 以指定 client 坐标为中心进行缩放 */
  function setZoomCentered(factor: number, clientX: number, clientY: number) {
    if (!svgEl) { zoom = clamp(zoom * factor, ZP_MIN, ZP_MAX); return; }
    const box = svgEl.getBoundingClientRect();
    const cx = clientX - box.left - box.width / 2;
    const cy = clientY - box.top - box.height / 2;
    const next = clamp(zoom * factor, ZP_MIN, ZP_MAX);
    const k = next / zoom;
    panX = cx - (cx - panX) * k;
    panY = cy - (cy - panY) * k;
    zoom = next;
  }
  function zoomIn() {
    if (!svgEl) { zoom = clamp(zoom * 1.25, ZP_MIN, ZP_MAX); return; }
    const box = svgEl.getBoundingClientRect();
    setZoomCentered(1.25, box.left + box.width / 2, box.top + box.height / 2);
  }
  function zoomOut() {
    if (!svgEl) { zoom = clamp(zoom / 1.25, ZP_MIN, ZP_MAX); return; }
    const box = svgEl.getBoundingClientRect();
    setZoomCentered(1 / 1.25, box.left + box.width / 2, box.top + box.height / 2);
  }
  function resetView() { zoom = 1; panX = 0; panY = 0; }

  function onClickNode(id: string) {
    if (settings.clickToOpen) {
      location.href = noteHref(id);
      return;
    }
    selectedId = selectedId === id ? null : id;
    onSelect?.(selectedId);
  }
</script>

<svg
  bind:this={svgEl}
  viewBox="-500 -380 1000 760"
  preserveAspectRatio="xMidYMid meet"
  class="g-svg"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onwheel={onWheel}
>
  <defs>
    <radialGradient id="fv-bg" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#3a234a" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#1a1024" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#0a0418" stop-opacity="1" />
    </radialGradient>
    <radialGradient id="fv-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#fff" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="fv-link" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(255 208 230 / 0.5)" />
      <stop offset="100%" stop-color="rgb(180 140 255 / 0.5)" />
    </linearGradient>
  </defs>

  <rect x="-500" y="-380" width="1000" height="760" fill="url(#fv-bg)" opacity={settings.bgDim} />

  <g transform={`translate(${panX} ${panY}) scale(${zoom})`} data-sim={simFrame}>
    <g opacity={settings.edgeOpacity}>
      {#each links as l}
        {@const a = nodeMap.get(l.source)}
        {@const b = nodeMap.get(l.target)}
        {#if a && b}
          {@const dim = (folderFocus && a.folder !== folderFocus && b.folder !== folderFocus) || (highlightSet && !(highlightSet.has(l.source) && highlightSet.has(l.target)))}
          <line
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={dim ? 'rgba(255,255,255,0.05)' : 'url(#fv-link)'}
            stroke-width={(dim ? 0.5 : 1) * settings.edgeScale}
            stroke-linecap="round"
          />
        {/if}
      {/each}
    </g>
    <g>
      {#each nodes as n (n.id)}
        {@const r = nodeR(n)}
        {@const dim = isDim(n.id)}
        {@const orphan = n.inDegree + n.outDegree === 0}
        {@const showLabel = settings.showLabels === 'always' || (settings.showLabels === 'hover' && focusId === n.id)}
        <g
          data-nid={n.id}
          class="g-node {selectedId === n.id ? 'is-sel' : ''} {dim ? 'is-dim' : ''} {orphan ? 'is-orphan' : ''} {settings.clickToOpen ? 'is-link' : ''}"
          onmouseenter={() => (hoveredId = n.id)}
          onmouseleave={() => (hoveredId = null)}
          onclick={() => onClickNode(n.id)}
          ondblclick={() => (location.href = noteHref(n.id))}
        >
          {#if !orphan}
            <circle cx={n.x} cy={n.y} r={r * 2.2} fill="url(#fv-glow)" />
          {/if}
          <circle cx={n.x} cy={n.y} r={r} fill={n.color} stroke={orphan ? 'rgb(255 255 255 / 0.4)' : 'none'} stroke-width="0.5" stroke-dasharray={orphan ? '1.5,1.5' : ''}>
            <title>{n.title}（{n.folder}） · 入{n.inDegree}/出{n.outDegree}{orphan ? ' · 孤岛' : ''}{settings.clickToOpen ? ' · 单击跳转' : ''}</title>
          </circle>
          {#if showLabel}
            <text x={n.x} y={n.y - r - 4} text-anchor="middle" class="g-label" fill="#fff">{n.title}</text>
          {/if}
        </g>
      {/each}
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
  .g-node.is-dim { opacity: 0.2; }
  .g-node.is-orphan { opacity: 0.78; }
  .g-node.is-sel circle:last-of-type { stroke: #fff; stroke-width: 1.6; }
  .g-label {
    font-size: 11px; font-weight: 600;
    paint-order: stroke;
    stroke: rgb(20 12 32 / 0.85);
    stroke-width: 2.5;
    pointer-events: none;
  }
</style>
