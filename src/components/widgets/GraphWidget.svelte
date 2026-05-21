<script lang="ts">
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { noteHref } from '../graph/graph-data';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type Node = {
    id: string;
    title: string;
    folder: string;
    inDegree: number;
    outDegree: number;
    x: number; y: number; vx: number; vy: number;
    fixed?: boolean;
    color: string;
  };
  type Link = { source: string; target: string; alias?: string | null };
  type RawWiki = {
    nodes: { id: string; title: string; folder: string; inDegree: number; outDegree: number }[];
    links: { source: string; target: string; alias?: string | null }[];
  };

  const STATE_KEY  = 'second-brain:graph-state';
  const LAYOUT_KEY = 'second-brain:graph-layout';

  let nodes = $state<Node[]>([]);
  let links = $state<Link[]>([]);
  let nodeMap: Map<string, Node> = new Map();

  let loadErr = $state<string | null>(null);
  let bgAlpha = $state(0.78);
  let showSettings = $state(false);
  let onlyConnected = $state(false); // 默认显示孤岛
  let folderFilter = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let hoveredId = $state<string | null>(null);

  // 力学参数
  let kRepel = $state(820);
  let kSpring = $state(0.022);
  let damping = $state(0.86);
  let edgeLen = $state(70);
  let running = false;

  /** 单击节点直接跳转笔记 */
  let clickToOpen = $state(true);

  // 缩放/平移
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let panning = false;
  let panStart = { x: 0, y: 0, px: 0, py: 0 };

  // 节点拖拽
  let dragNodeId: string | null = null;

  let viewW = $state(640);
  let viewH = $state(420);
  let svgEl: SVGSVGElement | null = null;

  // 窗口
  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(680);
  let height = $state(540);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let minimized = $state(false);
  let maximized = $state(false);

  let raf: number | null = null;
  /** 每帧递增，驱动 Svelte 5 重绘节点坐标 */
  let simFrame = $state(0);
  let canvasEl: HTMLDivElement | null = null;

  /** 文件夹配色 */
  const folderPalette = [
    '#ff9ed4', '#b48cff', '#7dd0ff', '#7fe6c4',
    '#ffd86b', '#ff9d6b', '#a4b8ff', '#ffa3a3',
    '#9fffbb', '#ff8de8',
  ];
  function colorForFolder(f: string, idx: number) {
    return folderPalette[idx % folderPalette.length];
  }

  onMount(() => {
    void loadGraph();
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
        if (typeof s.onlyConnected === 'boolean') onlyConnected = s.onlyConnected;
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.kRepel === 'number') kRepel = s.kRepel;
        if (typeof s.kSpring === 'number') kSpring = s.kSpring;
        if (typeof s.edgeLen === 'number') edgeLen = s.edgeLen;
        if (typeof s.clickToOpen === 'boolean') clickToOpen = s.clickToOpen;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 360, 1400);
        if (typeof s.h === 'number') height = clamp(s.h, 320, 1100);
        rotation = layoutRotation(s);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 100));
      posY = Math.max(24, Math.min(window.innerHeight - height - 24, 100));
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  });

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

  async function loadGraph() {
    try {
      const res = await fetch('/data/wikilinks.json');
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as RawWiki;
      const folders = Array.from(new Set(data.nodes.map((n) => n.folder)));
      const folderIdx = new Map(folders.map((f, i) => [f, i] as const));
      const useNodes = onlyConnected
        ? data.nodes.filter((n) => n.inDegree + n.outDegree > 0)
        : data.nodes;
      const ids = new Set(useNodes.map((n) => n.id));
      nodes = useNodes.map((n, i) => ({
        ...n,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 300,
        vx: 0, vy: 0,
        color: colorForFolder(n.folder, folderIdx.get(n.folder) ?? 0),
      }));
      nodeMap = new Map(nodes.map((n) => [n.id, n]));
      links = data.links.filter((l) => ids.has(l.source) && ids.has(l.target));
      kickSimulation();
    } catch (e) {
      loadErr = '尚未生成 wikilinks.json，请运行 pnpm prepare:vault';
    }
  }

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  function kickSimulation() {
    if (raf) cancelAnimationFrame(raf);
    running = true;
    let energy = 1;
    const tick = () => {
      if (!running) return;
      step();
      // 估算能量，低能时降速
      energy = nodes.reduce((s, n) => s + (n.vx * n.vx + n.vy * n.vy), 0) / Math.max(1, nodes.length);
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  /** 一帧力学：库仑斥力 + Hooke 弹簧 + 阻尼 + 中心引力 */
  function step() {
    const N = nodes.length;
    if (N === 0) return;
    const filtered = folderFilter ? nodes.filter((n) => n.folder === folderFilter) : nodes;
    // 斥力 O(N^2)，N<=200 OK
    for (let i = 0; i < N; i++) {
      const a = nodes[i];
      if (a.fixed) continue;
      for (let j = i + 1; j < N; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        let d2 = dx * dx + dy * dy + 0.01;
        if (d2 > 40000) continue;
        const inv = kRepel / d2;
        const fx = dx * inv;
        const fy = dy * inv;
        a.vx += fx; a.vy += fy;
        if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
      }
    }
    // 弹簧
    for (const l of links) {
      const a = nodeMap.get(l.source);
      const b = nodeMap.get(l.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const diff = (d - edgeLen) * kSpring;
      const fx = (dx / d) * diff;
      const fy = (dy / d) * diff;
      if (!a.fixed) { a.vx += fx; a.vy += fy; }
      if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
    }
    // 中心引力 + 阻尼 + 积分
    for (const n of nodes) {
      if (n.fixed) { n.vx = 0; n.vy = 0; continue; }
      n.vx -= n.x * 0.002;
      n.vy -= n.y * 0.002;
      n.vx *= damping;
      n.vy *= damping;
      // 限制最大速度，避免抖动飞出
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 20) { n.vx = (n.vx / sp) * 20; n.vy = (n.vy / sp) * 20; }
      n.x += n.vx;
      n.y += n.vy;
    }
    simFrame++;
  }

  function nodeR(n: Node) {
    return Math.min(14, 3.5 + Math.sqrt(n.inDegree + n.outDegree) * 1.4);
  }

  /** 同 folder 的可选过滤列表 */
  const folders = $derived(Array.from(new Set(nodes.map((n) => n.folder))).sort());

  /** 邻居集合（用于高亮）*/
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

  // 节点拖拽
  function onSvgPointerDown(e: PointerEvent) {
    const t = e.target as Element;
    const nodeG = t.closest('[data-nid]');
    if (nodeG) {
      const id = nodeG.getAttribute('data-nid')!;
      dragNodeId = id;
      const n = nodeMap.get(id);
      if (n) n.fixed = true;
      svgEl?.setPointerCapture?.(e.pointerId);
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // 否则 → 平移
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    svgEl?.setPointerCapture?.(e.pointerId);
  }
  function onSvgPointerMove(e: PointerEvent) {
    if (dragNodeId) {
      const n = nodeMap.get(dragNodeId);
      if (!n || !svgEl) return;
      const pt = clientToWorld(e.clientX, e.clientY);
      n.x = pt.x; n.y = pt.y; n.vx = 0; n.vy = 0;
      simFrame++;
    } else if (panning) {
      panX = panStart.px + (e.clientX - panStart.x);
      panY = panStart.py + (e.clientY - panStart.y);
    }
  }
  function onSvgPointerUp(e: PointerEvent) {
    if (dragNodeId) {
      const n = nodeMap.get(dragNodeId);
      if (n) n.fixed = false;
      dragNodeId = null;
    }
    if (panning) panning = false;
    svgEl?.releasePointerCapture?.(e.pointerId);
  }
  function clientToWorld(cx: number, cy: number) {
    if (!svgEl) return { x: 0, y: 0 };
    const box = svgEl.getBoundingClientRect();
    const wx = (cx - box.left - box.width / 2 - panX) / zoom;
    const wy = (cy - box.top - box.height / 2 - panY) / zoom;
    return { x: wx, y: wy };
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const k = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom = clamp(zoom * k, 0.3, 4);
  }

  function onNodeClick(id: string) {
    if (clickToOpen) {
      gotoNote(id);
      return;
    }
    selectedId = selectedId === id ? null : id;
  }
  function gotoNote(id: string) {
    location.href = noteHref(id);
  }

  function resetView() {
    zoom = 1; panX = 0; panY = 0;
  }
  function rekick() {
    for (const n of nodes) {
      n.vx = (Math.random() - 0.5) * 30;
      n.vy = (Math.random() - 0.5) * 30;
    }
    kickSimulation();
  }

  function persist() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ bgAlpha, onlyConnected, minimized, maximized, kRepel, kSpring, edgeLen, clickToOpen })); } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResizeCb({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x; posY = y; width = w; height = h; clampPos();
  }
  function clampPos() {
    if (typeof window === 'undefined') return;
    posX = clamp(posX, 4, Math.max(4, window.innerWidth - width - 4));
    posY = clamp(posY, 4, Math.max(4, window.innerHeight - 80));
  }
  function doMinimize() { minimized = !minimized; if (minimized) maximized = false; persist(); }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persist(); }
  function toggleSettings() { showSettings = !showSettings; }

  const selectedNode = $derived(selectedId ? nodeMap.get(selectedId) ?? null : null);

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 360, minHeight: 320, maxWidth: 1400, maxHeight: 1100 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="graph-widget {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="关系图谱"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="gw-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="gw-title">
      <span aria-hidden="true">🕸️</span>
      <span>关系图谱</span>
    </div>
    <span class="gw-stats" data-no-drag>{nodes.length} 节点 · {links.length} 边</span>
    <button type="button" class="gw-cog" onclick={toggleSettings} aria-label="设置" data-no-drag>⚙</button>
    <a href="/graph" class="gw-cog" data-no-drag title="打开独立页面">↗</a>
  </header>

  {#if !minimized}
    {#if showSettings}
      <div class="gw-cfg" data-no-drag>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">毛玻璃</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={bgAlpha}
                 oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
          <span class="gw-cfg-val">{Math.round(bgAlpha * 100)}%</span>
        </div>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">斥力</span>
          <input type="range" min="200" max="2000" step="20" value={kRepel}
                 oninput={(e) => { kRepel = Number((e.currentTarget as HTMLInputElement).value); persist(); kickSimulation(); }} />
          <span class="gw-cfg-val">{kRepel}</span>
        </div>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">边长</span>
          <input type="range" min="30" max="200" step="2" value={edgeLen}
                 oninput={(e) => { edgeLen = Number((e.currentTarget as HTMLInputElement).value); persist(); kickSimulation(); }} />
          <span class="gw-cfg-val">{edgeLen}</span>
        </div>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">分组</span>
          <select bind:value={folderFilter} class="gw-select">
            <option value={null}>全部目录</option>
            {#each folders as f}
              <option value={f}>{f}</option>
            {/each}
          </select>
        </div>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">孤岛</span>
          <label class="gw-switch">
            <input type="checkbox" checked={!onlyConnected}
                   onchange={(e) => { onlyConnected = !(e.currentTarget as HTMLInputElement).checked; persist(); loadGraph(); }} />
            <span>显示无双链节点</span>
          </label>
        </div>
        <div class="gw-cfg-row">
          <span class="gw-cfg-lbl">点击</span>
          <label class="gw-switch">
            <input type="checkbox" checked={clickToOpen}
                   onchange={(e) => { clickToOpen = (e.currentTarget as HTMLInputElement).checked; persist(); }} />
            <span>单击节点直接跳转笔记</span>
          </label>
        </div>
        <div class="gw-cfg-row">
          <button type="button" class="gw-btn" onclick={rekick}>重新布局</button>
          <button type="button" class="gw-btn" onclick={resetView}>居中视图</button>
        </div>
      </div>
    {/if}

    <div class="gw-canvas" data-no-drag bind:this={canvasEl}>
      {#if loadErr}
        <p class="gw-empty">{loadErr}</p>
      {:else if nodes.length === 0}
        <p class="gw-empty">载入中…</p>
      {:else}
        <svg
          bind:this={svgEl}
          viewBox={`${-viewW / 2} ${-viewH / 2} ${viewW} ${viewH}`}
          preserveAspectRatio="xMidYMid meet"
          class="gw-svg"
          onpointerdown={onSvgPointerDown}
          onpointermove={onSvgPointerMove}
          onpointerup={onSvgPointerUp}
          onpointercancel={onSvgPointerUp}
          onwheel={onWheel}
        >
          <defs>
            <radialGradient id="gw-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#fff" stop-opacity="0" />
            </radialGradient>
            <filter id="gw-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gw-link-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="rgb(255 208 230 / 0.55)" />
              <stop offset="100%" stop-color="rgb(180 140 255 / 0.55)" />
            </linearGradient>
          </defs>

          <g transform={`translate(${panX} ${panY}) scale(${zoom})`} data-sim={simFrame}>
            <!-- 边 -->
            <g class="gw-links">
              {#each links as l}
                {@const a = nodeMap.get(l.source)}
                {@const b = nodeMap.get(l.target)}
                {#if a && b}
                  {@const dim = (folderFilter && !(a.folder === folderFilter || b.folder === folderFilter)) || (highlightSet && !(highlightSet.has(a.id) && highlightSet.has(b.id)))}
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={dim ? 'rgba(255,255,255,0.05)' : 'url(#gw-link-grad)'}
                    stroke-width="0.9"
                    stroke-linecap="round"
                  />
                {/if}
              {/each}
            </g>

            <!-- 节点 -->
            <g class="gw-nodes">
              {#each nodes as n (n.id)}
                {@const r = nodeR(n)}
                {@const dim = (folderFilter && n.folder !== folderFilter) || isDim(n.id)}
                {@const orphan = n.inDegree + n.outDegree === 0}
                <g
                  data-nid={n.id}
                  class="gw-node {n.id === selectedId ? 'is-sel' : ''} {dim ? 'is-dim' : ''} {orphan ? 'is-orphan' : ''} {clickToOpen ? 'is-link' : ''}"
                  onmouseenter={() => (hoveredId = n.id)}
                  onmouseleave={() => (hoveredId = null)}
                  onclick={() => onNodeClick(n.id)}
                  ondblclick={() => gotoNote(n.id)}
                >
                  {#if !orphan}
                    <circle cx={n.x} cy={n.y} r={r * 2.2} fill="url(#gw-node-glow)" />
                  {/if}
                  <circle cx={n.x} cy={n.y} r={r} fill={n.color} filter={n.id === selectedId ? 'url(#gw-glow)' : null}
                          stroke={orphan ? 'rgb(255 255 255 / 0.45)' : 'none'}
                          stroke-width="0.6"
                          stroke-dasharray={orphan ? '1.5,1.5' : ''}>
                    <title>{n.title}（{n.folder}） · 入{n.inDegree}/出{n.outDegree}{orphan ? ' · 孤岛' : ''}</title>
                  </circle>
                  {#if n.id === selectedId || (hoveredId && n.id === hoveredId)}
                    <text x={n.x} y={n.y - r - 4} text-anchor="middle" class="gw-label" fill="#fff">{n.title}</text>
                  {/if}
                </g>
              {/each}
            </g>
          </g>
        </svg>
      {/if}

      {#if selectedNode}
        <aside class="gw-detail">
          <div class="gw-det-title">{selectedNode.title}</div>
          <div class="gw-det-sub">{selectedNode.folder} · 入度 {selectedNode.inDegree} · 出度 {selectedNode.outDegree}</div>
          <div class="gw-det-actions">
            <a class="gw-btn" href={noteHref(selectedNode.id)}>打开笔记</a>
            <button type="button" class="gw-btn" onclick={() => (selectedId = null)}>取消选中</button>
          </div>
        </aside>
      {/if}
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={360} minHeight={320}
      maxWidth={1400} maxHeight={1100}
      disabled={maximized}
      onResize={onResizeCb}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .graph-widget {
    --w-bg-alpha: 0.78;
    position: fixed;
    z-index: 38;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.42);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    overflow: hidden;
    touch-action: none;
  }
  .graph-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .graph-widget.is-active-drag { user-select: none; box-shadow: 0 24px 48px rgb(0 0 0 / 0.55); }

  .gw-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .graph-widget.is-active-drag .gw-header { cursor: grabbing; }
  .graph-widget.is-maximized .gw-header { cursor: default; }
  .gw-title { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; letter-spacing: 1px; font-weight: 600; color: rgb(255 255 255 / 0.78); }
  .gw-stats { margin-left: auto; font-size: 0.7rem; color: #b6a8d3; }
  .gw-cog {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.85rem;
    display: inline-flex; align-items: center; justify-content: center;
    text-decoration: none;
  }
  .gw-cog:hover { background: rgb(255 255 255 / 0.16); }

  .gw-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
    display: flex; flex-direction: column; gap: 6px;
  }
  .gw-cfg-row {
    display: grid;
    grid-template-columns: 64px 1fr 56px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .gw-cfg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .gw-cfg-row input[type='range']::-webkit-slider-thumb,
  .gw-cfg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }
  .gw-cfg-val { text-align: right; font-variant-numeric: tabular-nums; }
  .gw-cfg-lbl { color: #b6a8d3; }
  .gw-switch {
    grid-column: 2 / span 2;
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .gw-switch input { accent-color: #b48cff; }
  .gw-select {
    grid-column: 2 / span 2;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff;
    border-radius: 8px;
    padding: 3px 8px;
    font-size: 0.74rem;
  }
  :global(.dark) .gw-select option { background: #1a1126; color: #f0e6ff; }

  .gw-canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .gw-svg {
    width: 100%; height: 100%; display: block;
    background:
      radial-gradient(ellipse at 50% 50%, rgb(40 28 70 / 0.6) 0%, rgb(12 8 24 / 0.4) 70%, transparent 100%),
      linear-gradient(180deg, rgb(28 18 50 / 0.4), rgb(10 6 22 / 0.5));
    cursor: grab;
    touch-action: none;
  }
  .gw-empty {
    color: #b6a8d3;
    text-align: center;
    padding: 60px 20px;
    font-size: 0.85rem;
  }
  .gw-node { cursor: pointer; transition: opacity 0.2s ease; }
  .gw-node.is-link { cursor: alias; }
  .gw-node.is-dim { opacity: 0.18; }
  .gw-node.is-orphan { opacity: 0.78; }
  .gw-node circle:nth-child(2) {
    transition: stroke-width 0.2s ease, fill 0.2s ease;
  }
  .gw-node.is-sel circle:nth-child(2) {
    stroke: #fff;
    stroke-width: 1.4;
  }
  .gw-label {
    font-size: 9px;
    paint-order: stroke;
    stroke: rgb(20 12 32 / 0.85);
    stroke-width: 2.5;
    font-weight: 600;
    pointer-events: none;
  }

  .gw-detail {
    position: absolute;
    bottom: 12px; left: 12px;
    background: rgb(12 8 22 / 0.78);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 12px;
    padding: 8px 12px 10px;
    max-width: 70%;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .gw-det-title { font-size: 0.86rem; font-weight: 700; color: #fff; }
  .gw-det-sub { font-size: 0.72rem; color: #b6a8d3; margin-top: 2px; }
  .gw-det-actions { display: flex; gap: 6px; margin-top: 6px; }
  .gw-btn {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer;
    padding: 3px 10px; border-radius: 8px;
    font-size: 0.74rem;
    text-decoration: none;
  }
  .gw-btn:hover { background: rgb(255 255 255 / 0.16); }

  @media (max-width: 768px) {
    .graph-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 70px) !important;
      width: auto !important; height: 75vh !important;
    }
  }
</style>
