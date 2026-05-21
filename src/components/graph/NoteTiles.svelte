<script lang="ts">
  /**
   * 笔记瓦片网格：按 folder 分组的卡片网格，含搜索与孤岛标记。
   * 风格与 /notes 卡片一致。
   */
  import type { WikiData } from './graph-data';
  import { folderColor, noteHref } from './graph-data';

  interface Props {
    data: WikiData;
    folderFocus: string | null;
    onSelect?: (id: string | null) => void;
  }
  let { data, folderFocus, onSelect }: Props = $props();

  let query = $state('');

  const folders = $derived(Array.from(new Set(data.nodes.map((n) => n.folder))).sort());

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    let arr = data.nodes;
    if (folderFocus) arr = arr.filter((n) => n.folder === folderFocus);
    if (q) {
      arr = arr.filter((n) => n.title.toLowerCase().includes(q) || n.folder.toLowerCase().includes(q));
    }
    return arr;
  });

  const grouped = $derived.by(() => {
    const m = new Map<string, typeof data.nodes>();
    for (const n of filtered) {
      if (!m.has(n.folder)) m.set(n.folder, []);
      m.get(n.folder)!.push(n);
    }
    // 每组内：先非孤岛按度数降序，再孤岛
    for (const arr of m.values()) {
      arr.sort((a, b) => {
        const ao = a.inDegree + a.outDegree === 0 ? 1 : 0;
        const bo = b.inDegree + b.outDegree === 0 ? 1 : 0;
        if (ao !== bo) return ao - bo;
        return (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree);
      });
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  });
</script>

<div class="tiles-wrap">
  <header class="tiles-bar">
    <input
      type="search"
      class="tiles-search"
      placeholder="在 {filtered.length} 篇笔记中搜索…"
      bind:value={query}
    />
    <span class="tiles-meta">
      {filtered.length} / {data.nodes.length} · 孤岛 {data.nodes.filter((n) => n.inDegree + n.outDegree === 0).length}
    </span>
  </header>

  {#if grouped.length === 0}
    <div class="tiles-empty">没有匹配的笔记</div>
  {:else}
    <div class="tiles-scroll">
      {#each grouped as [folder, arr]}
        {@const color = folderColor(folder, folders)}
        <section class="tiles-group">
          <div class="tg-head">
            <span class="dot" style={`background:${color}; box-shadow: 0 0 8px ${color}`}></span>
            <span class="tg-name">{folder}</span>
            <span class="tg-count">{arr.length}</span>
          </div>
          <div class="tg-grid">
            {#each arr as n (n.id)}
              {@const orphan = n.inDegree + n.outDegree === 0}
              <a
                class="tile {orphan ? 'is-orphan' : ''}"
                href={noteHref(n.id)}
                style={`--c: ${color}`}
                onclick={(e) => { e.preventDefault(); onSelect?.(n.id); }}
                onauxclick={() => (location.href = noteHref(n.id))}
                title={n.id}
              >
                <span class="tile-emoji">{orphan ? '🏝' : '📝'}</span>
                <span class="tile-title">{n.title}</span>
                <span class="tile-meta">
                  {#if orphan}
                    <span class="tile-tag orphan">孤岛</span>
                  {:else}
                    <span class="tile-deg">↘ {n.inDegree}</span>
                    <span class="tile-deg">↗ {n.outDegree}</span>
                  {/if}
                </span>
              </a>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tiles-wrap {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #110926, #06030f);
    border-radius: 0;
    overflow: hidden;
  }
  .tiles-bar {
    padding: 12px 14px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    display: flex; align-items: center; gap: 12px;
    flex-wrap: wrap;
  }
  .tiles-search {
    flex: 1; min-width: 200px;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 10px;
    color: var(--graph-panel-text);
    padding: 6px 12px;
    font-size: 0.84rem;
  }
  .tiles-search:focus { outline: 1px solid #b48cff; }
  .tiles-meta {
    color: #b6a8d3;
    font-size: 0.74rem;
  }
  .tiles-scroll {
    flex: 1;
    overflow: auto;
    padding: 14px;
  }
  .tiles-empty {
    color: #b6a8d3;
    text-align: center;
    padding: 80px;
  }
  .tiles-group { margin-bottom: 18px; }
  .tg-head {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px;
    color: #ece4ff;
    font-size: 0.86rem;
    font-weight: 700;
  }
  .tg-head .dot { width: 10px; height: 10px; border-radius: 50%; }
  .tg-count {
    margin-left: auto;
    color: #9d8fc0;
    font-size: 0.7rem;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.12);
    border-radius: 999px;
    padding: 1px 8px;
  }
  .tg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 8px;
  }
  .tile {
    --c: #b48cff;
    display: flex; flex-direction: column; gap: 6px;
    padding: 10px 12px;
    background: rgb(255 255 255 / 0.05);
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 12px;
    color: var(--graph-panel-text);
    text-decoration: none;
    transition: transform 0.14s ease, background 0.18s ease, border-color 0.18s ease;
    min-height: 80px;
    position: relative;
  }
  .tile::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--c);
    border-radius: 3px 0 0 3px;
  }
  .tile:hover {
    background: rgb(255 255 255 / 0.1);
    border-color: var(--c);
    transform: translateY(-2px);
  }
  .tile.is-orphan { opacity: 0.85; }
  .tile-emoji { font-size: 1.05rem; }
  .tile-title {
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }
  .tile-meta {
    display: flex; gap: 6px;
    margin-top: auto;
    font-size: 0.66rem;
    color: #b6a8d3;
  }
  .tile-deg {
    background: rgb(255 255 255 / 0.06);
    border-radius: 999px;
    padding: 1px 7px;
  }
  .tile-tag.orphan {
    background: rgb(255 220 130 / 0.16);
    border: 1px solid rgb(255 220 130 / 0.35);
    color: #ffd97a;
    padding: 1px 7px;
    border-radius: 999px;
  }
</style>
