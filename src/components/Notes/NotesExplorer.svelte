<script lang="ts">
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
  }
  interface Category {
    title: string;
    folderEmoji?: string;
    folders?: FolderCard[];
    notes: Note[];
  }
  interface Props {
    categories: Category[];
  }

  let { categories }: Props = $props();
  let searchQuery = $state('');
  let viewMode = $state<'grid' | 'list'>('grid');

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
          folders: matchedFolders.length > 0 || q ? matchedFolders : c.folders,
          notes: matchedNotes.length > 0 || q ? matchedNotes : c.notes,
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
    <div class="notes-view-switch">
      <button
        type="button"
        class="pixel-button view-btn {viewMode === 'grid' ? 'is-active' : ''}"
        onclick={() => (viewMode = 'grid')}
      >🔲</button>
      <button
        type="button"
        class="pixel-button view-btn {viewMode === 'list' ? 'is-active' : ''}"
        onclick={() => (viewMode = 'list')}
      >📋</button>
    </div>
  </div>
</section>

{#if filtered.length === 0}
  <p class="notes-empty">没有匹配的笔记。</p>
{:else}
  {#each filtered as category (category.title)}
    <NoteGrid
      title={category.title}
      folders={category.folders ?? []}
      notes={category.notes}
      folderEmoji={category.folderEmoji}
      {viewMode}
    />
  {/each}
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
  .notes-view-switch {
    display: inline-flex;
    gap: 0.4rem;
  }
  .view-btn {
    min-width: 40px;
    padding: 0.45rem 0.6rem;
  }
  .view-btn.is-active {
    background: var(--accent-pink);
  }

  .notes-empty {
    margin: 1.25rem 0;
    color: var(--text-secondary);
  }
</style>
