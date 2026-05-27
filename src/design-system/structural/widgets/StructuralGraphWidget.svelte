<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getGraphBodyComponent } from '../resolveWidgetBody';
  import { noteHref, loadWiki, watchWikiRefresh } from '../../../components/graph/graph-data';
  import {
    createForceController,
    reheatForce,
    stepForceSimulation,
    type ForceSimController,
  } from '../../../components/graph/force-simulation';
  import GraphSettingsPanel from './graph/GraphSettingsPanel.svelte';
  import type { GraphLink, GraphNode } from './graph/graph-types';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('graph'));
  const skin = resolveStructuralSkin();
  const GraphBody = getGraphBodyComponent(skin);

  const STATE_KEY = 'second-brain:graph-state';

  let nodes = $state<GraphNode[]>([]);
  let links = $state<GraphLink[]>([]);
  let nodeMap: Map<string, GraphNode> = new Map();
  let loadErr = $state<string | null>(null);
  let bgAlpha = $state(0.78);
  let onlyConnected = $state(false);
  let folderFilter = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let hoveredId = $state<string | null>(null);
  let kRepel = $state(820);
  let kSpring = $state(0.022);
  let edgeLen = $state(70);
  let clickToOpen = $state(true);
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let simFrame = $state(0);
  let simCtrl: ForceSimController = createForceController();
  let raf: number | null = null;

  const folderPalette = [
    '#ff9ed4', '#b48cff', '#7dd0ff', '#7fe6c4',
    '#ffd86b', '#ff9d6b', '#a4b8ff', '#ffa3a3', '#9fffbb', '#ff8de8',
  ];

  const folders = $derived(Array.from(new Set(nodes.map((n) => n.folder))).sort());

  onMount(() => {
    void loadGraph();
    const stopWatch = watchWikiRefresh(() => {
      void loadGraph(false);
    });
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.bgAlpha === 'number') bgAlpha = s.bgAlpha;
        if (typeof s.onlyConnected === 'boolean') onlyConnected = s.onlyConnected;
        if (typeof s.kRepel === 'number') kRepel = s.kRepel;
        if (typeof s.kSpring === 'number') kSpring = s.kSpring;
        if (typeof s.edgeLen === 'number') edgeLen = s.edgeLen;
        if (typeof s.clickToOpen === 'boolean') clickToOpen = s.clickToOpen;
      }
    } catch {
      /* ignore */
    }
    return () => {
      stopWatch();
      if (raf) cancelAnimationFrame(raf);
    };
  });

  function colorForFolder(f: string, idx: number) {
    return folderPalette[idx % folderPalette.length];
  }

  function persist() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ bgAlpha, onlyConnected, kRepel, kSpring, edgeLen, clickToOpen }),
      );
    } catch {
      /* ignore */
    }
  }

  async function loadGraph(reseed = true) {
    try {
      const data = await loadWiki({ fresh: !reseed });
      const prevPos = reseed ? null : new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y, fixed: n.fixed }]));
      const folderList = Array.from(new Set(data.nodes.map((n) => n.folder)));
      const folderIdx = new Map(folderList.map((f, i) => [f, i] as const));
      const useNodes = onlyConnected
        ? data.nodes.filter((n) => n.inDegree + n.outDegree > 0)
        : data.nodes;
      const ids = new Set(useNodes.map((n) => n.id));
      nodes = useNodes.map((n) => {
        const prev = prevPos?.get(n.id);
        return {
          ...n,
          x: prev?.x ?? (Math.random() - 0.5) * 400,
          y: prev?.y ?? (Math.random() - 0.5) * 300,
          vx: 0,
          vy: 0,
          fixed: prev?.fixed,
          color: colorForFolder(n.folder, folderIdx.get(n.folder) ?? 0),
        };
      });
      nodeMap = new Map(nodes.map((n) => [n.id, n]));
      links = data.links.filter((l) => ids.has(l.source) && ids.has(l.target));
      kickSimulation();
    } catch {
      loadErr = '尚未生成 wikilinks.json，请运行 pnpm prepare:vault';
    }
  }

  function kickSimulation() {
    if (raf) cancelAnimationFrame(raf);
    reheatForce(simCtrl, 1);
    const tick = () => {
      if (simCtrl.running && nodes.length > 0) {
        const moved = stepForceSimulation(nodes, links, nodeMap, simCtrl, {
          kRepel,
          kSpring,
          edgeLen,
          repelCutoff: 40000,
          centerPull: 0.002,
        });
        if (moved) simFrame++;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function onNodeClick(id: string) {
    if (clickToOpen) {
      location.href = noteHref(id);
      return;
    }
    selectedId = selectedId === id ? null : id;
  }

  function onNodeMove(id: string, x: number, y: number) {
    const n = nodeMap.get(id);
    if (!n) return;
    n.x = x;
    n.y = y;
    n.vx = 0;
    n.vy = 0;
    simFrame++;
  }

  function onNodeDragEnd(id: string) {
    const n = nodeMap.get(id);
    if (n) n.fixed = false;
  }

  function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }
</script>

<SkinFloatingShell
  layoutKey="graph-layout"
  {title}
  defaultW={680}
  defaultH={540}
  minW={360}
  minH={320}
  maxW={1400}
  maxH={1100}
  defaultAlpha={bgAlpha}
  {onClose}
>
  {#snippet settings()}
    <GraphSettingsPanel
      {ui}
      {bgAlpha}
      {kRepel}
      {edgeLen}
      {folderFilter}
      {folders}
      {onlyConnected}
      {clickToOpen}
      onBgAlpha={(v) => {
        bgAlpha = v;
        persist();
      }}
      onKRepel={(v) => {
        kRepel = v;
        persist();
        kickSimulation();
      }}
      onEdgeLen={(v) => {
        edgeLen = v;
        persist();
        kickSimulation();
      }}
      onFolderFilter={(v) => (folderFilter = v)}
      onOnlyConnected={(v) => {
        onlyConnected = v;
        persist();
        void loadGraph();
      }}
      onClickToOpen={(v) => {
        clickToOpen = v;
        persist();
      }}
      onRekick={() => {
        reheatForce(simCtrl, 0.9);
        kickSimulation();
      }}
      onResetView={resetView}
    />
  {/snippet}

  <GraphBody
    {ui}
    {nodes}
    {links}
    {nodeMap}
    {loadErr}
    {folderFilter}
    {selectedId}
    hoveredId={hoveredId}
    {clickToOpen}
    {simFrame}
    {zoom}
    {panX}
    {panY}
    showDetail={true}
    {noteHref}
    onHover={(id) => (hoveredId = id)}
    onSelect={(id) => (selectedId = id)}
    onNodeClick={onNodeClick}
    onGotoNote={(id) => {
      location.href = noteHref(id);
    }}
    onPanZoom={(px, py, z) => {
      panX = px;
      panY = py;
      zoom = z;
    }}
    onNodeMove={onNodeMove}
    onNodeDragEnd={onNodeDragEnd}
    onReheat={() => reheatForce(simCtrl, 0.25)}
  />
</SkinFloatingShell>
