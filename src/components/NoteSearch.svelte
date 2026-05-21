<script lang="ts">
  import { onMount, tick } from 'svelte';

  type Note = { slug: string; title: string; description?: string; tags?: string[] };

  let query = $state('');
  let notes = $state<Note[]>([]);
  let loaded = $state(false);
  let open = $state(false);
  let activeIdx = $state(0);
  let inputEl: HTMLInputElement | null = null;
  let panelEl: HTMLDivElement | null = null;

  async function loadIfNeeded() {
    if (loaded) return;
    try {
      const res = await fetch('/data/notes.json');
      if (res.ok) notes = (await res.json()) as Note[];
    } catch {}
    loaded = true;
  }

  const tokens = $derived(query.trim().toLowerCase().split(/\s+/).filter(Boolean));
  const results = $derived.by<Array<Note & { score: number }>>(() => {
    if (tokens.length === 0) return notes.slice(0, 8).map((n) => ({ ...n, score: 0 }));
    const out: Array<Note & { score: number }> = [];
    for (const n of notes) {
      const t = n.title.toLowerCase();
      const d = (n.description || '').toLowerCase();
      const tagText = (n.tags || []).join(' ').toLowerCase();
      let score = 0;
      let allHit = true;
      for (const k of tokens) {
        const ti = t.indexOf(k);
        if (ti >= 0) { score += 20 - Math.min(15, ti); continue; }
        if (d.includes(k)) { score += 3; continue; }
        if (tagText.includes(k)) { score += 5; continue; }
        allHit = false; break;
      }
      if (allHit) out.push({ ...n, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 12);
  });

  $effect(() => { activeIdx = 0; void tokens; });

  function onFocus() {
    open = true;
    void loadIfNeeded();
  }
  function onBlur() {
    setTimeout(() => { open = false; }, 120);
  }
  async function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(results.length - 1, activeIdx + 1); await scrollActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); await scrollActive(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const t = results[activeIdx];
      if (t) location.href = `/notes/${encodeURI(t.slug)}/`;
    } else if (e.key === 'Escape') {
      open = false; inputEl?.blur();
    }
  }
  async function scrollActive() {
    await tick();
    panelEl?.querySelector('.ns-item.is-active')?.scrollIntoView({ block: 'nearest' });
  }

  // 全局 Ctrl/Cmd+K 唤起
  onMount(() => {
    const onGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputEl?.focus();
      }
    };
    window.addEventListener('keydown', onGlobal);
    return () => window.removeEventListener('keydown', onGlobal);
  });

  function highlight(text: string): string {
    if (!tokens.length) return escape(text);
    let safe = escape(text);
    for (const k of tokens) {
      const re = new RegExp(`(${escapeRe(k)})`, 'ig');
      safe = safe.replace(re, '<mark>$1</mark>');
    }
    return safe;
  }
  function escape(s: string) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }
  function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
</script>

<div class="note-search">
  <div class="ns-input-wrap">
    <span class="ns-icon" aria-hidden="true">⌕</span>
    <input
      bind:this={inputEl}
      type="text"
      class="ns-input"
      placeholder="搜索笔记 / 标签…（⌘K）"
      bind:value={query}
      onfocus={onFocus}
      onblur={onBlur}
      onkeydown={onKey}
      aria-label="搜索"
    />
    {#if query}
      <button type="button" class="ns-clear" onclick={() => { query = ''; inputEl?.focus(); }} aria-label="清空">×</button>
    {/if}
    <kbd class="ns-kbd" aria-hidden="true">⌘K</kbd>
  </div>

  {#if open}
    <div class="ns-panel" bind:this={panelEl} role="listbox">
      {#if !loaded}
        <div class="ns-empty">载入中…</div>
      {:else if results.length === 0}
        <div class="ns-empty">没有匹配的笔记</div>
      {:else}
        <ul>
          {#each results as r, i (r.slug)}
            <li>
              <a
                class="ns-item {i === activeIdx ? 'is-active' : ''}"
                href={`/notes/${encodeURI(r.slug)}/`}
                onmouseenter={() => { activeIdx = i; }}
                role="option"
                aria-selected={i === activeIdx}
              >
                <span class="ns-it-icon">📝</span>
                <span class="ns-it-main">
                  <span class="ns-it-title">{@html highlight(r.title)}</span>
                  {#if r.description}
                    <span class="ns-it-desc">{@html highlight(r.description)}</span>
                  {/if}
                </span>
                {#if r.tags && r.tags.length > 0}
                  <span class="ns-it-tags">{r.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}</span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
        <footer class="ns-foot">{results.length} 条 · ↑↓ 选择 · Enter 打开 · Esc 关闭</footer>
      {/if}
    </div>
  {/if}
</div>

<style>
  .note-search {
    position: relative;
    width: 100%;
    max-width: 360px;
  }
  .ns-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .ns-icon {
    position: absolute;
    left: 10px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
    font-size: 1rem;
    pointer-events: none;
  }
  .ns-input {
    width: 100%;
    height: 38px;
    box-sizing: border-box;
    padding: 0 36px 0 32px;
    border-radius: var(--radius-button, 10px);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    font-size: 0.85rem;
    outline: none;
    color: var(--text-primary);
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .ns-input:focus {
    border-color: var(--pixel-pink, #ff8de8);
    background: var(--bg-primary);
  }
  .ns-clear {
    position: absolute;
    right: 38px; top: 50%;
    transform: translateY(-50%);
    background: transparent; border: 0;
    color: var(--text-secondary);
    cursor: pointer; font-size: 1rem;
    padding: 0 4px;
  }
  .ns-clear:hover { color: var(--text-primary); }
  .ns-kbd {
    position: absolute;
    right: 8px; top: 50%;
    transform: translateY(-50%);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1px 6px;
    font-size: 0.65rem;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .ns-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0; left: 0;
    z-index: 50;
    background: var(--glass-bg-strong);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-normal);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    max-height: 70vh;
    overflow: auto;
    padding: 6px;
  }
  .ns-empty {
    padding: 22px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
  .ns-panel ul { list-style: none; margin: 0; padding: 0; }
  .ns-item {
    display: grid;
    grid-template-columns: 22px 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-primary);
    transition: background 0.12s ease;
  }
  .ns-item.is-active {
    background: linear-gradient(135deg, rgba(255, 141, 232, 0.18), rgba(180, 140, 255, 0.18));
  }
  .ns-it-icon { text-align: center; }
  .ns-it-main { display: flex; flex-direction: column; min-width: 0; }
  .ns-it-title {
    font-weight: 600; font-size: 0.86rem;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ns-it-desc {
    font-size: 0.72rem;
    color: var(--text-secondary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ns-it-tags {
    font-size: 0.7rem;
    color: var(--text-secondary);
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 999px;
    padding: 1px 8px;
  }
  .ns-item :global(mark) {
    background: rgba(255, 220, 100, 0.55);
    color: inherit;
    border-radius: 3px;
    padding: 0 1px;
  }
  :global(.dark) .ns-item :global(mark) {
    background: rgba(255, 200, 80, 0.32);
    color: #fff;
  }
  .ns-foot {
    padding: 6px 8px 4px;
    font-size: 0.66rem;
    color: var(--text-secondary);
    text-align: right;
    border-top: 1px dashed var(--border-color);
    margin-top: 4px;
  }
  @media (max-width: 768px) {
    .note-search { width: 100%; min-width: 0; }
    .ns-it-tags { display: none; }
    .ns-kbd { display: none; }
    .ns-input { padding-right: 28px; font-size: 0.8rem; }
    .ns-input-wrap { min-width: 0; }
  }
</style>
