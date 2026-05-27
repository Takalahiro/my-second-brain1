<script lang="ts">
  import type { FolderNode as TreeNode } from '../../lib/folder-tree';
  import type { PixelIconName } from '../../lib/pixel-icons';
  import { formatNextSyncLabel } from '../../lib/i18n/format';
  import { getMessages, initLocale, localeState } from '../../lib/i18n/locale.svelte';
  import FolderNode from '../FolderNode.svelte';
  import NoteGrid from './NoteGrid.svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import { onMount } from 'svelte';

  interface Note {
    id: string;
    title: string;
    icon?: PixelIconName;
    count?: number;
    lastUpdated?: string;
    slug: string;
  }
  interface FolderCard {
    id: string;
    title: string;
    icon?: PixelIconName;
    count?: number;
    lastUpdated?: string;
    href: string;
    depth?: number;
  }
  interface Category {
    title: string;
    folderIcon?: PixelIconName;
    folders?: FolderCard[];
    notes: Note[];
  }
  interface SyncMeta {
    lastSyncedAt: string;
    vaultCommit?: string | null;
    syncIntervalMinutes: number;
  }
  interface Props {
    categories: Category[];
    tree: TreeNode;
    syncMeta?: SyncMeta;
  }

  let { categories, tree, syncMeta }: Props = $props();
  let searchQuery = $state('');
  let forceTick = $state(0);
  let forceAction = $state<'expand-all' | 'collapse-all' | null>(null);

  const MODE_KEY = 'second-brain:notes-display-mode';

  // 同步读折叠模式：先看 html data-notes-mode（BaseLayout 预水合写的），再 localStorage，默认 widgets
  // 这样 client:only 首次渲染就对，不会闪一下
  function readInitialMode(): 'widgets' | 'recursive' {
    if (typeof document !== 'undefined') {
      const html = document.documentElement.getAttribute('data-notes-mode');
      if (html === 'widgets' || html === 'recursive') return html;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const v = localStorage.getItem(MODE_KEY);
        if (v === 'widgets' || v === 'recursive') return v;
      } catch {}
    }
    return 'widgets';
  }
  let mode = $state<'widgets' | 'recursive'>(readInitialMode());

  function setMode(next: 'widgets' | 'recursive') {
    mode = next;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-notes-mode', next);
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

  const nextSyncLabel = $derived(
    syncMeta
      ? formatNextSyncLabel(localeState.current, syncMeta.lastSyncedAt, syncMeta.syncIntervalMinutes)
      : null
  );

  const m = $derived(getMessages());

  onMount(() => initLocale());

  $effect(() => {
    if (typeof document !== 'undefined') document.title = m.notes.pageTitle;
  });

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
    <span class="notes-toolbar-icon"><PixelIcon name="cup" size={18} /></span>
    <div class="notes-toolbar-heading">
      <h1 class="notes-toolbar-text">{m.notes.title}</h1>
      {#if nextSyncLabel}
        <p class="notes-sync-hint">{nextSyncLabel}</p>
      {/if}
    </div>
  </div>

  <div class="notes-toolbar-actions">
    <input
      type="text"
      placeholder={m.notes.searchPlaceholder}
      bind:value={searchQuery}
      class="notes-search ui-input"
    />
    <div class="notes-layout-switch">
      <button
        type="button"
        class="pixel-button layout-btn {mode === 'widgets' ? 'is-active' : ''}"
        onclick={() => setMode('widgets')}
      >{m.notes.modeWidgets}</button>
      <button
        type="button"
        class="pixel-button layout-btn {mode === 'recursive' ? 'is-active' : ''}"
        onclick={() => setMode('recursive')}
      >{m.notes.modeTree}</button>
    </div>
  </div>
</section>

{#if mode === 'recursive'}
  <section class="tree-actions-bar pixel-card glass-container">
    <button
      type="button"
      class="pixel-button tree-action-btn"
      onclick={expandAllFolders}
    >{m.notes.expandAll}</button>
    <button
      type="button"
      class="pixel-button tree-action-btn"
      onclick={collapseAllFolders}
    >{m.notes.collapseAll}</button>
  </section>
{/if}

{#if mode === 'recursive'}
  <section class="recursive-wrap pixel-card glass-container notes-recursive-panel">
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
    <p class="notes-empty">{m.notes.empty}</p>
  {:else}
    {#each filtered as category (category.title)}
      <NoteGrid
        title={category.title}
        folders={category.folders ?? []}
        notes={category.notes}
        folderIcon={category.folderIcon}
      />
    {/each}
  {/if}
{/if}

<style>
  .notes-toolbar {
    border-width: var(--border-thin);
    padding: var(--space-4);
    margin-bottom: var(--space-5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
  }
  .notes-toolbar-title {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }
  .notes-toolbar-heading {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .notes-sync-hint {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.2;
    color: var(--text-secondary);
    font-weight: 400;
  }
  .notes-toolbar-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-button);
    background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 12%, transparent);
    color: var(--accent-out, var(--ui-accent));
  }
  .notes-toolbar-text {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
  }
  .notes-toolbar-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .notes-search {
    min-width: 210px;
    width: auto;
  }
  .notes-search:focus {
    border-color: color-mix(in srgb, var(--accent, var(--ui-accent)) 55%, var(--border, var(--border-color)));
    box-shadow:
      var(--neo-inset),
      0 0 0 3px color-mix(in srgb, var(--accent, var(--ui-accent)) 18%, transparent);
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

  /* 折叠树：随主题切换的毛玻璃面板 */
  .recursive-wrap.notes-recursive-panel {
    border-width: var(--border-thin);
    padding: 0.7rem 0.85rem;
    margin-bottom: 0.85rem;
    background: var(--tree-panel-bg) !important;
    border-color: var(--tree-panel-border) !important;
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    color: var(--text-primary);
    box-shadow: var(--shadow-normal);
  }
  .notes-recursive-panel :global(.root-title) {
    color: var(--text-primary);
  }
  .notes-recursive-panel :global(.root-meta) {
    color: var(--text-secondary);
  }
  .notes-recursive-panel :global(.empty-folder) {
    color: var(--text-secondary);
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

  @media (max-width: 768px) {
    .notes-toolbar {
      padding: 0.72rem 0.75rem;
      margin-bottom: 1rem;
      gap: 0.65rem;
    }
    .notes-toolbar-title {
      gap: 0.45rem;
    }
    .notes-toolbar-icon {
      width: 30px;
      height: 30px;
    }
    .notes-toolbar-text {
      font-size: 1.25rem;
    }
    .notes-toolbar-actions {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    .notes-search {
      width: 100%;
      min-width: 0;
      padding: 0.5rem 0.65rem;
    }
    .notes-layout-switch {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .layout-btn {
      min-width: 0;
      width: 100%;
      padding: 0.42rem 0.4rem;
    }
    .tree-actions-bar {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin: -0.35rem 0 0.75rem;
      padding: 0.46rem;
    }
    .tree-action-btn {
      min-width: 0;
      width: 100%;
      padding: 0.4rem 0.35rem;
    }
    .recursive-wrap {
      padding: 0.55rem 0.58rem;
      margin-bottom: 0.6rem;
    }
  }
</style>
