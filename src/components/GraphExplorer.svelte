<script lang="ts">
  import { onMount } from 'svelte';
  import {
    folderColor, loadWiki, loadSettings, noteHref, saveSettings,
    DEFAULT_SETTINGS, type GraphSettings, type WikiData,
  } from './graph/graph-data';
  import { GRAPH_VIEW_ICONS, type PixelIconName } from '../lib/pixel-icons';
  import PixelIcon from './PixelIcon.svelte';
  import { isHudSkinActive, subscribeHudMode } from '../features/ui/hud-mode.svelte';
  import ForceView from './graph/ForceView.svelte';
  import RadialView from './graph/RadialView.svelte';
  import ArcView from './graph/ArcView.svelte';
  import ClusterView from './graph/ClusterView.svelte';
  import NoteTiles from './graph/NoteTiles.svelte';
  import TerritoryMapCanvas from './graph/TerritoryMapCanvas.svelte';
  import SettingsPanel from './graph/SettingsPanel.svelte';

  type ViewKey = 'force' | 'radial' | 'arc' | 'cluster' | 'territory' | 'tiles' | 'settings';
  type Tab = { id: ViewKey; name: string; icon: PixelIconName; desc: string };
  const tabs: Tab[] = [
    { id: 'force',     name: '力导向',   icon: GRAPH_VIEW_ICONS.force, desc: '物理仿真布局；收敛后静止，不再抖动' },
    { id: 'territory', name: '文件夹地图', icon: GRAPH_VIEW_ICONS.territory, desc: '滚轮缩放自动展开：国家→州→城市→笔记；双链白光弧线' },
    { id: 'radial',    name: '圆环辐射', icon: GRAPH_VIEW_ICONS.radial, desc: '按目录划扇区，度高靠外' },
    { id: 'arc',      name: '弧线和弦', icon: GRAPH_VIEW_ICONS.arc, desc: '一字排开，弧线连接' },
    { id: 'cluster',  name: '同心簇环', icon: GRAPH_VIEW_ICONS.cluster, desc: '每目录一个小行星系' },
    { id: 'tiles',    name: '笔记瓦片', icon: GRAPH_VIEW_ICONS.tiles, desc: '卡片网格全览' },
    { id: 'settings', name: '设置',     icon: GRAPH_VIEW_ICONS.settings, desc: '集中调整孤岛/标签/交互/外观/物理参数' },
  ];

  let view = $state<ViewKey>('force');
  let hudMode = $state(false);
  let data = $state<WikiData | null>(null);
  let loadErr = $state<string | null>(null);
  let folderFocus = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let settings = $state<GraphSettings>({ ...DEFAULT_SETTINGS });

  function patchSettings(p: Partial<GraphSettings>) {
    settings = { ...settings, ...p };
    saveSettings(settings);
  }
  function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings(settings);
  }

  onMount(() => {
    hudMode = isHudSkinActive();
    const off = subscribeHudMode((v) => { hudMode = v; });
    try {
      const raw = localStorage.getItem('second-brain:graph-view');
      if (raw && tabs.find((t) => t.id === raw)) view = raw as ViewKey;
    } catch {}
    settings = loadSettings();
    void load();
    return off;
  });

  async function load() {
    try {
      data = await loadWiki();
    } catch (e) {
      console.error('[GraphExplorer] loadWiki failed', e);
      loadErr = e instanceof Error ? e.message : '尚未生成 wikilinks.json，请运行 pnpm prepare:vault';
    }
  }

  function setView(v: ViewKey) {
    view = v;
    try { localStorage.setItem('second-brain:graph-view', v); } catch {}
  }

  const folders = $derived(data ? Array.from(new Set(data.nodes.map((n) => n.folder))).sort() : []);
  const stats = $derived(data ? {
    total: data.nodes.length,
    edges: data.links.length,
    broken: data.broken?.length ?? 0,
    orphans: data.nodes.filter((n) => n.inDegree + n.outDegree === 0).length,
  } : { total: 0, edges: 0, broken: 0, orphans: 0 });

  const selectedNode = $derived(data && selectedId ? data.nodes.find((n) => n.id === selectedId) ?? null : null);
  const selectedNeighbors = $derived.by(() => {
    if (!data || !selectedId) return [] as Array<{ id: string; title: string; folder: string; color: string; dir: 'in' | 'out' }>;
    const out: Array<{ id: string; title: string; folder: string; color: string; dir: 'in' | 'out' }> = [];
    const idToNode = new Map(data.nodes.map((n) => [n.id, n] as const));
    for (const l of data.links) {
      if (l.source === selectedId) {
        const n = idToNode.get(l.target);
        if (n) out.push({ id: n.id, title: n.title, folder: n.folder, color: folderColor(n.folder, folders), dir: 'out' });
      } else if (l.target === selectedId) {
        const n = idToNode.get(l.source);
        if (n) out.push({ id: n.id, title: n.title, folder: n.folder, color: folderColor(n.folder, folders), dir: 'in' });
      }
    }
    return out.slice(0, 60);
  });
</script>

<section class="graph-page" class:is-hud-mission={hudMode}>
  {#if hudMode}
    <div class="hud-mission-bar">
      <span class="hud-mission-id">KNOWLEDGE STAR MAP</span>
      <span class="hud-mission-patch" aria-hidden="true"></span>
      <span class="hud-mission-status">WIKILINK SCAN · CONSTELLATION NAV</span>
    </div>
  {/if}
  <header class="gp-head">
    <div>
      <h1>关系图谱</h1>
      <p class="gp-sub">{tabs.find((t) => t.id === view)?.desc ?? ''}</p>
    </div>
    <a class="gp-link" href="/">← 返回首页</a>
  </header>

  <div class="gp-tabs" role="tablist" aria-label="可视化风格切换">
    {#each tabs as t}
      <button
        type="button"
        class="gp-tab {view === t.id ? 'is-active' : ''}"
        onclick={() => setView(t.id)}
        role="tab"
        aria-selected={view === t.id}
      >
        <span class="gp-tab-icon"><PixelIcon name={t.icon} size={15} /></span>
        <span class="gp-tab-name">{t.name}</span>
      </button>
    {/each}
  </div>

  <div class="gp-stats">
    <div class="kpi"><strong>{stats.total}</strong><span>笔记总数</span></div>
    <div class="kpi"><strong>{stats.edges}</strong><span>双链总数</span></div>
    <div class="kpi"><strong>{stats.broken}</strong><span>悬空链接</span></div>
    <div class="kpi"><strong>{stats.orphans}</strong><span>孤岛笔记</span></div>
  </div>

  {#if view !== 'settings' && view !== 'territory' && view !== 'tiles'}
    <div class="gp-folders" aria-label="目录过滤">
      <button type="button" class:active={folderFocus === null} onclick={() => (folderFocus = null)}>
        <span class="dot all"></span>全部
      </button>
      {#each folders as f}
        {@const c = folderColor(f, folders)}
        <button type="button" class:active={folderFocus === f} style={`--c: ${c}`}
                onclick={() => (folderFocus = folderFocus === f ? null : f)}>
          <span class="dot" style={`background:${c}; box-shadow: 0 0 6px ${c}`}></span>{f}
        </button>
      {/each}
    </div>
  {/if}

  <div class="gp-canvas-row">
    <div class="gp-canvas">
      {#if loadErr}
        <p class="gp-empty">{loadErr}</p>
      {:else if !data}
        <p class="gp-empty">载入中…</p>
      {:else if view === 'force'}
        <ForceView data={data} folderFocus={folderFocus} settings={settings} onSelect={(id) => (selectedId = id)} />
      {:else if view === 'radial'}
        <RadialView data={data} folderFocus={folderFocus} settings={settings} onSelect={(id) => (selectedId = id)} />
      {:else if view === 'arc'}
        <ArcView data={data} folderFocus={folderFocus} settings={settings} onSelect={(id) => (selectedId = id)} />
      {:else if view === 'cluster'}
        <ClusterView data={data} folderFocus={folderFocus} settings={settings} onSelect={(id) => (selectedId = id)} />
      {:else if view === 'territory'}
        <TerritoryMapCanvas {data} onSelectPath={() => {}} />
      {:else if view === 'tiles'}
        <NoteTiles data={data} folderFocus={folderFocus} onSelect={(id) => (selectedId = id)} />
      {:else if view === 'settings'}
        <SettingsPanel settings={settings} onChange={patchSettings} onReset={resetSettings} />
      {/if}
    </div>

    {#if selectedNode}
      <aside class="gp-detail">
        <header class="det-head">
          <h3>{selectedNode.title}</h3>
          <button type="button" class="det-x" onclick={() => (selectedId = null)} aria-label="关闭">×</button>
        </header>
        <p class="det-sub">{selectedNode.folder} · 入 {selectedNode.inDegree} · 出 {selectedNode.outDegree}{selectedNode.inDegree + selectedNode.outDegree === 0 ? ' · 孤岛' : ''}</p>
        {#if selectedNeighbors.length === 0}
          <p class="det-empty">这是一座孤岛，没有任何双链邻居。</p>
        {:else}
          <p class="det-section">邻居 ({selectedNeighbors.length})</p>
          <ul class="det-list">
            {#each selectedNeighbors as nb (nb.id)}
              <li>
                <span class="dir" class:in={nb.dir === 'in'}>{nb.dir === 'in' ? '←' : '→'}</span>
                <button type="button" onclick={() => (selectedId = nb.id)} class="det-nb">
                  {nb.title}
                </button>
                <span class="nb-folder" style={`color:${nb.color}`}>{nb.folder}</span>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="det-actions">
          <a href={noteHref(selectedNode.id)} class="det-btn primary">打开笔记</a>
        </div>
      </aside>
    {/if}
  </div>
</section>

<style>
  .graph-page {
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .gp-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    flex-wrap: wrap; gap: 12px;
  }
  .gp-head h1 { margin: 0; font-size: 1.4rem; font-weight: 800; }
  .gp-sub { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.84rem; }
  .gp-link {
    text-decoration: none;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 5px 14px;
    font-size: 0.82rem;
    color: var(--text-primary);
  }

  .gp-tabs {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 6px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 14px;
  }
  .gp-tab {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 0.84rem;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
  }
  .gp-tab:hover { background: var(--chrome-hover); transform: translateY(-1px); }
  .gp-tab.is-active {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.22), rgba(180, 140, 255, 0.22));
    border-color: rgba(180, 140, 255, 0.5);
    box-shadow: 0 4px 12px rgb(180 140 255 / 0.18);
  }
  .gp-tab-icon { font-size: 0.95rem; }

  .gp-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .gp-stats .kpi {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex; flex-direction: column;
    text-align: center;
  }
  .gp-stats .kpi strong {
    font-size: 1.5rem; font-weight: 800;
    background: linear-gradient(135deg, #ff8de8, #b48cff);
    -webkit-background-clip: text; background-clip: text;
    color: transparent;
    line-height: 1;
  }
  .gp-stats .kpi span { color: var(--text-secondary); font-size: 0.72rem; margin-top: 4px; }

  .gp-folders {
    display: flex; flex-wrap: wrap; gap: 6px;
  }
  .gp-folders button {
    --c: var(--text-primary);
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 0.74rem;
    cursor: pointer;
    color: var(--text-primary);
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .gp-folders button:hover { transform: translateY(-1px); }
  .gp-folders button.active {
    border-color: var(--c);
    box-shadow: 0 0 0 1px var(--c) inset;
  }
  .gp-folders .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--c);
  }
  .gp-folders .dot.all {
    background: conic-gradient(#ff9ed4, #b48cff, #7dd0ff, #7fe6c4, #ffd86b, #ff9ed4);
  }

  .gp-canvas-row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .gp-canvas {
    background: var(--graph-canvas-bg);
    border: 1px solid var(--graph-canvas-border);
    border-radius: 18px;
    overflow: hidden;
    aspect-ratio: 16 / 10;
    min-height: 480px;
    max-height: 84vh;
  }
  .gp-empty {
    padding: 80px;
    text-align: center;
    color: var(--text-secondary);
  }

  .gp-detail {
    position: absolute;
    top: 14px; right: 14px;
    width: min(320px, 80%);
    max-height: calc(100% - 28px);
    overflow: auto;
    background: var(--graph-panel-bg);
    color: var(--graph-panel-text);
    border: 1px solid var(--chrome-border);
    border-radius: 14px;
    padding: 12px 14px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--chrome-shadow);
  }
  .det-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 2px;
  }
  .det-head h3 { margin: 0; font-size: 0.96rem; flex: 1; }
  .det-x {
    width: 26px; height: 26px; border-radius: 999px;
    background: var(--chrome-subtle);
    border: 1px solid var(--chrome-border);
    color: var(--graph-panel-text); cursor: pointer;
  }
  .det-sub { font-size: 0.72rem; color: var(--graph-panel-muted); margin: 2px 0 8px; }
  .det-section { font-size: 0.74rem; color: var(--graph-panel-muted); margin: 6px 0 4px; }
  .det-empty { font-size: 0.78rem; color: var(--graph-panel-muted); padding: 6px 0; }
  .det-list { list-style: none; margin: 0; padding: 0; max-height: 260px; overflow: auto; }
  .det-list li {
    display: flex; align-items: center; gap: 6px;
    padding: 3px 0; font-size: 0.78rem;
  }
  .det-nb {
    background: transparent; border: 0; color: var(--graph-panel-text); cursor: pointer;
    padding: 0; text-align: left; flex: 1;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .det-nb:hover { color: var(--text-primary); text-decoration: underline; }
  .dir { color: #b48cff; font-weight: 700; min-width: 14px; text-align: center; }
  .dir.in { color: #ff9ed4; }
  .nb-folder {
    font-size: 0.64rem;
    max-width: 40%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .det-actions { display: flex; gap: 6px; margin-top: 8px; }
  .det-btn {
    background: var(--chrome-subtle);
    border: 1px solid var(--chrome-border);
    color: var(--graph-panel-text); cursor: pointer;
    padding: 4px 12px; border-radius: 8px;
    font-size: 0.76rem;
    text-decoration: none;
  }
  .det-btn.primary {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1c0f30; border-color: rgb(255 255 255 / 0.4);
  }

  @media (max-width: 768px) {
    .gp-stats { grid-template-columns: repeat(2, 1fr); }
    .gp-canvas { min-height: 380px; aspect-ratio: auto; max-height: none; }
    .gp-detail {
      position: static;
      width: auto;
      max-height: none;
    }
  }
</style>
