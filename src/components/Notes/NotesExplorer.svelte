<script lang="ts">
  import type { FolderNode as TreeNode } from '../../lib/folder-tree';
  import FolderNode from '../FolderNode.svelte';
  import NoteGrid from './NoteGrid.svelte';

  interface Note {
    id: string;
    title: string;
    emoji?: string;
    count?: number;
    lastUpdated?: string;
    slug: string;
  }
  interface FolderCard {
    id: string;
    title: string;
    emoji?: string;
    count?: number;
    lastUpdated?: string;
    href: string;
    depth?: number;
  }
  interface Category {
    title: string;
    folderEmoji?: string;
    folders?: FolderCard[];
    notes: Note[];
  }
  interface Props {
    categories: Category[];
    tree: TreeNode;
  }

  let { categories, tree }: Props = $props();
  let searchQuery = $state('');
  let mode = $state<'widgets' | 'recursive'>('widgets');
  let forceTick = $state(0);
  let forceAction = $state<'expand-all' | 'collapse-all' | null>(null);

  const MODE_KEY = 'second-brain:notes-display-mode';

  $effect(() => {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'widgets' || stored === 'recursive') {
      mode = stored;
    }
  });

  function setMode(next: 'widgets' | 'recursive') {
    mode = next;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MODE_KEY, next);
    }
  }

  function collapseAllFolders() {
    forceAction = 'collapse-all';
    forceTick++;
  }
  function expandAllFolders() {
    forceAction = 'expand-all';
    forceTick++;
  }

  const filtered = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    const next: Category[] = [];
    for (const c of categories) {
      const matchedFolders = (c.folders ?? []).filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.href.toLowerCase().includes(q)
      );
      const matchedNotes = c.notes.filter(
        (n) => n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q)
      );
      if (matchedNotes.length > 0 || matchedFolders.length > 0 || c.title.toLowerCase().includes(q)) {
        next.push({
          ...c,
          folders:
            q.length > 0
              ? matchedFolders
              : (c.folders ?? []),
          notes:
            q.length > 0
              ? matchedNotes
              : c.notes,
        });
      }
    }
    return next;
  });
</script>

<section class="notes-toolbar pixel-card glass-container">
  <div class="notes-toolbar-title">
    <span class="notes-toolbar-emoji">☕</span>
    <h1 class="notes-toolbar-text">Notes</h1>
  </div>

  <div class="notes-toolbar-actions">
    <input
      type="text"
      placeholder="搜索笔记..."
      bind:value={searchQuery}
      class="notes-search"
    />
    <div class="notes-layout-switch">
      <button
        type="button"
        class="pixel-button layout-btn {mode === 'widgets' ? 'is-active' : ''}"
        onclick={() => setMode('widgets')}
      >小组件</button>
      <button
        type="button"
        class="pixel-button layout-btn {mode === 'recursive' ? 'is-active' : ''}"
        onclick={() => setMode('recursive')}
      >折叠</button>
    </div>
  </div>
</section>

{#if mode === 'recursive'}
  <section class="tree-actions-bar pixel-card glass-container">
    <button
      type="button"
      class="pixel-button tree-action-btn"
      onclick={expandAllFolders}
    >一键展开</button>
    <button
      type="button"
      class="pixel-button tree-action-btn"
      onclick={collapseAllFolders}
    >一键折叠</button>
  </section>
{/if}

{#if mode === 'recursive'}
  <section class="recursive-wrap pixel-card glass-container">
    {#each tree.children as root (root.path)}
      <FolderNode
        node={root}
        depth={1}
        defaultExpandDepth={99}
        {forceTick}
        {forceAction}
      />
    {/each}
  </section>
{:else}
  {#if filtered.length === 0}
    <p class="notes-empty">没有匹配的笔记。</p>
  {:else}
    {#each filtered as category (category.title)}
      <NoteGrid
        title={category.title}
        folders={category.folders ?? []}
        notes={category.notes}
        folderEmoji={category.folderEmoji}
      />
    {/each}
  {/if}
{/if}

<style>
  .notes-toolbar {
    border-width: var(--border-thin);
    padding: 0.9rem 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    flex-wrap: wrap;
  }
  .notes-toolbar-title {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }
  .notes-toolbar-emoji {
    font-size: 1.7rem;
  }
  .notes-toolbar-text {
    margin: 0;
    font-size: 1.7rem;
    line-height: 1;
  }
  .notes-toolbar-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .notes-search {
    min-width: 210px;
    padding: 0.55rem 0.8rem;
    border: var(--border-thick) solid var(--border-color);
    border-radius: var(--radius-button);
    background: var(--glass-bg);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease);
  }
  .notes-search:focus {
    border-color: var(--accent-pink);
    box-shadow: var(--shadow-pixel);
  }
  .notes-layout-switch {
    display: inline-flex;
    gap: 0.4rem;
  }
  .layout-btn {
    min-width: 52px;
    padding: 0.45rem 0.65rem;
  }
  .layout-btn.is-active {
    background: var(--accent-lavender);
  }

  .notes-empty {
    margin: 1.25rem 0;
    color: var(--text-secondary);
  }

  .recursive-wrap {
    border-width: var(--border-thin);
    padding: 0.7rem 0.85rem;
    margin-bottom: 0.85rem;
  }

  .tree-actions-bar {
    border-width: var(--border-thin);
    padding: 0.5rem 0.65rem;
    margin: -0.65rem 0 1rem;
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    transition: opacity var(--motion-fast) var(--motion-ease),
      transform var(--motion-fast) var(--motion-ease);
  }
  .tree-action-btn {
    min-width: 86px;
    padding: 0.4rem 0.6rem;
  }
</style>
