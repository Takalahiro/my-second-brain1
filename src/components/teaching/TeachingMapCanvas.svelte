<script lang="ts">
 import { onMount, tick } from 'svelte';
 import PixelIcon from '../PixelIcon.svelte';
 import TeachingIslandScene from './TeachingIslandScene.svelte';
 import ZoomControls from '../graph/ZoomControls.svelte';
 import { clamp } from '../graph/use-zoom-pan';
 import {
 linksForMapNodes,
 type TeachingMapNode,
 type TeachingMapNodeId,
 } from '../../lib/teaching/registry';
 import {
 computeMapLayout,
 getWorldSize,
 linkCurvePath,
 panelSide,
 } from '../../lib/teaching/map-layout';

 interface Props {
 nodes: TeachingMapNode[];
 activeId: TeachingMapNodeId | null;
 onSelect: (id: TeachingMapNodeId) => void;
 }

 let { nodes, activeId, onSelect }: Props = $props();

 let canvasEl = $state<HTMLElement | null>(null);
 let viewportEl = $state<HTMLElement | null>(null);
 let viewW = $state(0);
 let viewH = $state(0);
 let worldW = $state(0);
 let worldH = $state(0);
 let ready = $state(false);

 /** 1 = 全图适配；显示百分比 = zoom × 100（与图谱视图一致） */
 const ZP_MIN = 0.35;
 const ZP_MAX = 16;

 let zoom = $state(1);
 let panX = $state(0);
 let panY = $state(0);
 let panning = $state(false);
 let dragPending = $state(false);
 let panStart = { x: 0, y: 0, px: 0, py: 0 };
 const DRAG_THRESHOLD = 4;

 const links = $derived(linksForMapNodes(nodes));
 const layout = $derived(computeMapLayout(nodes, worldW, worldH));
 const nodeIdsKey = $derived(nodes.map((n) => n.id).join('|'));
 const fitScale = $derived(
 viewW > 0 && worldW > 0 ? Math.min(viewW / worldW, viewH / worldH) : 1,
 );
 const viewScale = $derived(zoom * fitScale);

 let lastFitKey = '';

 function courseLabel(n: TeachingMapNode['courseCount']) {
 if (n === undefined) return '';
 return n === '∞' ? '∞ 门课程' : `${n} 门课程`;
 }

 function measureCanvas() {
 if (!canvasEl) return false;
 const rect = canvasEl.getBoundingClientRect();
 const nextW = Math.max(320, Math.round(rect.width));
 const nextH = Math.max(420, Math.round(rect.height));
 if (nextW === viewW && nextH === viewH) return false;
 viewW = nextW;
 viewH = nextH;
 const world = getWorldSize(viewW, viewH);
 worldW = world.width;
 worldH = world.height;
 return true;
 }

 function fitView(padding = 0.94) {
 if (viewW <= 0 || worldW <= 0) return;
 const fs = Math.min(viewW / worldW, viewH / worldH);
 zoom = padding;
 panX = (viewW - worldW * fs * zoom) / 2;
 panY = (viewH - worldH * fs * zoom) / 2;
 }

 function fitViewForLayout(key: string, force = false) {
 if (!force && key === lastFitKey) return;
 lastFitKey = key;
 fitView();
 }

 function setZoomCentered(factor: number, clientX: number, clientY: number) {
 if (!viewportEl) {
 zoom = clamp(zoom * factor, ZP_MIN, ZP_MAX);
 return;
 }
 const box = viewportEl.getBoundingClientRect();
 const px = clientX - box.left;
 const py = clientY - box.top;
 const next = clamp(zoom * factor, ZP_MIN, ZP_MAX);
 const s0 = zoom * fitScale;
 const s1 = next * fitScale;
 const k = s1 / s0;
 panX = px - (px - panX) * k;
 panY = py - (py - panY) * k;
 zoom = next;
 }

 function onWheel(e: WheelEvent) {
 const target = e.target as Element | null;
 if (target?.closest('.map-zoom-controls')) return;
 e.preventDefault();
 e.stopPropagation();
 const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
 setZoomCentered(factor, e.clientX, e.clientY);
 }

 function onPointerDown(e: PointerEvent) {
 if (e.button !== 0) return;
 const target = e.target as Element;
 if (target.closest('.map-node, .map-zoom-controls')) return;
 if (!target.closest('.map-world__surface, .map-viewport')) return;
 dragPending = true;
 panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
 }

 function onPointerMove(e: PointerEvent) {
 if (!dragPending && !panning) return;
 const dx = e.clientX - panStart.x;
 const dy = e.clientY - panStart.y;
 if (dragPending && !panning) {
 if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
 panning = true;
 dragPending = false;
 viewportEl?.setPointerCapture(e.pointerId);
 }
 if (!panning) return;
 panX = panStart.px + dx;
 panY = panStart.py + dy;
 }

 function onPointerUp(e: PointerEvent) {
 dragPending = false;
 if (!panning) return;
 panning = false;
 viewportEl?.releasePointerCapture(e.pointerId);
 }

 function selectNode(e: MouseEvent, id: TeachingMapNodeId) {
 e.stopPropagation();
 onSelect(id);
 }

 function zoomIn(e?: MouseEvent) {
 e?.stopPropagation();
 if (!viewportEl) return;
 const box = viewportEl.getBoundingClientRect();
 setZoomCentered(1.25, box.left + box.width / 2, box.top + box.height / 2);
 }

 function zoomOut(e?: MouseEvent) {
 e?.stopPropagation();
 if (!viewportEl) return;
 const box = viewportEl.getBoundingClientRect();
 setZoomCentered(1 / 1.25, box.left + box.width / 2, box.top + box.height / 2);
 }

 function resetView() {
 fitViewForLayout(nodeIdsKey, true);
 }

 onMount(() => {
 const canvas = canvasEl;
 let ro: ResizeObserver | null = null;
 const wheelOpts = { passive: false, capture: true } as const;

 void (async () => {
 await tick();
 measureCanvas();
 fitViewForLayout(nodeIdsKey, true);
 ready = true;
 ro = new ResizeObserver(() => {
 if (measureCanvas()) fitViewForLayout(nodeIdsKey, true);
 });
 if (canvas) ro.observe(canvas);
 })();

 canvas?.addEventListener('wheel', onWheel, wheelOpts);

 return () => {
 ro?.disconnect();
 canvas?.removeEventListener('wheel', onWheel, wheelOpts);
 };
 });

 $effect(() => {
 if (!ready || worldW <= 0) return;
 fitViewForLayout(nodeIdsKey);
 });

 function pos(id: TeachingMapNodeId) {
 return layout.get(id);
 }
</script>

<div class="map-canvas" bind:this={canvasEl}>
 <div class="map-canvas__bg map-canvas__bg--stars" aria-hidden="true"></div>
 <div class="map-canvas__bg map-canvas__bg--mist" aria-hidden="true"></div>
 <div class="map-canvas__bg map-canvas__bg--vignette" aria-hidden="true"></div>

 <div
 class="map-viewport"
 class:is-panning={panning}
 bind:this={viewportEl}
 onpointerdown={onPointerDown}
 onpointermove={onPointerMove}
 onpointerup={onPointerUp}
 onpointercancel={onPointerUp}
 >
 {#if ready && worldW > 0}
 <div class="map-pan-layer" style={`transform:translate(${panX}px,${panY}px);`}>
 <div
 class="map-world"
 style={`width:${worldW}px;height:${worldH}px;transform:scale(${viewScale});`}
 >
 <div class="map-world__surface" aria-hidden="true"></div>
 <svg
 class="map-canvas__links"
 viewBox="0 0 {worldW} {worldH}"
 width={worldW}
 height={worldH}
 aria-hidden="true"
 >
 {#each links as link (link.source + link.target)}
 {@const a = pos(link.source)}
 {@const b = pos(link.target)}
 {#if a && b}
 <path d={linkCurvePath(a, b)} class="map-link" />
 {/if}
 {/each}
 </svg>

 {#each nodes as node (node.id)}
 {@const p = pos(node.id)}
 {#if p}
 <article
 class="map-node"
 class:is-hub={node.tier === 'hub'}
 class:is-major={node.tier === 'major'}
 class:is-minor={node.tier === 'minor'}
 class:is-active={activeId === node.id}
 style={`left:${p.x}px;top:${p.y}px;--node-accent:${node.accent};--node-glow:${node.glow};--node-scale:${node.scale ?? 1};`}
 >
 <button
 type="button"
 class="map-node__island"
 aria-label={node.title}
 onclick={(e) => selectNode(e, node.id)}
 >
 <TeachingIslandScene
 building={node.building}
 accent={node.accent}
 active={activeId === node.id}
 compact={node.compact}
 />
 </button>

 {#if node.tier === 'major' || node.tier === 'hub'}
 <div
 class="map-panel map-panel--{panelSide(node.id)}"
 role="button"
 tabindex="0"
 onclick={(e) => selectNode(e, node.id)}
 onkeydown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 onSelect(node.id);
 }
 }}
 >
 <div class="map-panel__icon">
 <PixelIcon name={node.icon} size={18} />
 </div>
 <h3>{node.title}</h3>
 <p>{node.tagline}</p>
 {#if node.courseCount !== undefined}
 <span class="map-panel__count">{courseLabel(node.courseCount)}</span>
 {/if}
 {#if node.tier !== 'hub'}
 <span class="map-panel__cta">进入岛屿 →</span>
 {/if}
 </div>
 {:else}
 <div
 class="map-chip"
 role="button"
 tabindex="0"
 onclick={(e) => selectNode(e, node.id)}
 onkeydown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 onSelect(node.id);
 }
 }}
 >
 <span>{node.title}</span>
 </div>
 {/if}
 </article>
 {/if}
 {/each}
 </div>
 </div>
 {/if}
 </div>

 {#if ready}
 <div class="map-zoom-controls">
 <ZoomControls {zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetView} />
 </div>
 <p class="map-hint">滚轮缩放 · 拖拽平移 · 点击岛屿探索</p>
 {/if}

 {#if nodes.filter((n) => n.tier !== 'hub').length === 0}
 <p class="map-empty">没有匹配的岛屿，试试换个关键词或分类。</p>
 {/if}
</div>
