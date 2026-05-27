<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { GraphBodyProps, GraphNode } from './graph-types';

  let {
    ui,
    nodes,
    links,
    nodeMap,
    loadErr,
    folderFilter,
    selectedId,
    hoveredId,
    clickToOpen,
    simFrame,
    zoom,
    panX,
    panY,
    showDetail,
    noteHref,
    onHover,
    onSelect,
    onNodeClick,
    onGotoNote,
    onPanZoom,
    onNodeMove,
    onNodeDragEnd,
    onReheat,
  }: GraphBodyProps = $props();

  const skin = resolveStructuralSkin();

  let viewW = $state(640);
  let viewH = $state(420);
  let canvasEl = $state<HTMLDivElement | null>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };
  let dragNodeId: string | null = null;

  $effect(() => {
    const el = canvasEl;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      viewW = Math.max(320, box.width);
      viewH = Math.max(240, box.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  });

  const highlightSet = $derived.by(() => {
    const id = hoveredId ?? selectedId;
    if (!id) return null;
    const set = new Set<string>([id]);
    for (const l of links) {
      if (l.source === id) set.add(l.target);
      else if (l.target === id) set.add(l.source);
    }
    return set;
  });

  function isDim(id: string) {
    if (!highlightSet) return false;
    return !highlightSet.has(id);
  }

  function nodeR(n: GraphNode) {
    return Math.min(14, 3.5 + Math.sqrt(n.inDegree + n.outDegree) * 1.4);
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  function clientToWorld(cx: number, cy: number) {
    if (!svgEl) return { x: 0, y: 0 };
    const box = svgEl.getBoundingClientRect();
    return {
      x: (cx - box.left - box.width / 2 - panX) / zoom,
      y: (cy - box.top - box.height / 2 - panY) / zoom,
    };
  }

  function onSvgPointerDown(e: PointerEvent) {
    const t = e.target as Element;
    const nodeG = t.closest('[data-nid]');
    if (nodeG) {
      dragNodeId = nodeG.getAttribute('data-nid')!;
      const n = nodeMap.get(dragNodeId);
      if (n) n.fixed = true;
      svgEl?.setPointerCapture?.(e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    svgEl?.setPointerCapture?.(e.pointerId);
  }

  function onSvgPointerMove(e: PointerEvent) {
    if (dragNodeId) {
      const pt = clientToWorld(e.clientX, e.clientY);
      onNodeMove(dragNodeId, pt.x, pt.y);
    } else if (panning) {
      onPanZoom(panStart.px + (e.clientX - panStart.x), panStart.py + (e.clientY - panStart.y), zoom);
    }
  }

  function onSvgPointerUp(e: PointerEvent) {
    if (dragNodeId) {
      onNodeDragEnd(dragNodeId);
      dragNodeId = null;
      onReheat();
    }
    if (panning) panning = false;
    svgEl?.releasePointerCapture?.(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const k = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    onPanZoom(panX, panY, clamp(zoom * k, 0.3, 4));
  }

  const selectedNode = $derived(selectedId ? (nodeMap.get(selectedId) ?? null) : null);
  void simFrame;
</script>

<div class="skin-graph skin-graph--{skin}">
  <div class="skin-graph__stats">{nodes.length} 节点 · {links.length} 边</div>
  <div class="skin-graph__canvas" data-no-drag bind:this={canvasEl}>
    {#if loadErr}
      <p class="skin-graph__empty">{loadErr}</p>
    {:else if nodes.length === 0}
      <p class="skin-graph__empty">{ui.loading}</p>
    {:else}
      <svg
        bind:this={svgEl}
        viewBox={`${-viewW / 2} ${-viewH / 2} ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        class="skin-graph__svg"
        onpointerdown={onSvgPointerDown}
        onpointermove={onSvgPointerMove}
        onpointerup={onSvgPointerUp}
        onpointercancel={onSvgPointerUp}
        onwheel={onWheel}
      >
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <g class="skin-graph__links">
            {#each links as l}
              {@const a = nodeMap.get(l.source)}
              {@const b = nodeMap.get(l.target)}
              {#if a && b}
                {@const dim =
                  (folderFilter && !(a.folder === folderFilter || b.folder === folderFilter)) ||
                  (highlightSet && !(highlightSet.has(a.id) && highlightSet.has(b.id)))}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  class="skin-graph__link"
                  class:is-dim={dim}
                />
              {/if}
            {/each}
          </g>
          <g class="skin-graph__nodes">
            {#each nodes as n (n.id)}
              {@const r = nodeR(n)}
              {@const dim = (folderFilter && n.folder !== folderFilter) || isDim(n.id)}
              {@const orphan = n.inDegree + n.outDegree === 0}
              <g
                data-nid={n.id}
                class="skin-graph__node"
                class:is-sel={n.id === selectedId}
                class:is-dim={dim}
                class:is-orphan={orphan}
                class:is-link={clickToOpen}
                onmouseenter={() => onHover(n.id)}
                onmouseleave={() => onHover(null)}
                onclick={() => onNodeClick(n.id)}
                ondblclick={() => onGotoNote(n.id)}
              >
                <circle cx={n.x} cy={n.y} r={r} fill={n.color} class="skin-graph__node-dot">
                  <title>{n.title}（{n.folder}）</title>
                </circle>
                {#if n.id === selectedId || n.id === hoveredId}
                  <text x={n.x} y={n.y - r - 4} text-anchor="middle" class="skin-graph__label">{n.title}</text>
                {/if}
              </g>
            {/each}
          </g>
        </g>
      </svg>
    {/if}

    {#if selectedNode && showDetail}
      <aside class="skin-graph__detail">
        <div class="skin-graph__detail-title">{selectedNode.title}</div>
        <div class="skin-graph__detail-sub">
          {selectedNode.folder} · 入度 {selectedNode.inDegree} · 出度 {selectedNode.outDegree}
        </div>
        <div class="skin-graph__detail-actions">
          <a class="skin-graph__btn" href={noteHref(selectedNode.id)}>打开笔记</a>
          <button type="button" class="skin-graph__btn" onclick={() => onSelect(null)}>取消选中</button>
        </div>
      </aside>
    {/if}
  </div>
</div>
