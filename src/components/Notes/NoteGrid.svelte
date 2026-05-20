<script lang="ts">
  import NoteCard from './NoteCard.svelte';

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

  interface Props {
    title: string;
    folders?: FolderCard[];
    notes: Note[];
    folderEmoji?: string;
    viewMode?: 'grid' | 'list';
  }

  let { title, folders = [], notes, folderEmoji = '📁', viewMode = 'grid' }: Props = $props();
</script>

<section class="mb-10">
  {#if title}
    <div class="grid-title-wrap">
      <span class="grid-title-emoji">{folderEmoji}</span>
      <h2 class="grid-title">{title}</h2>
      <div class="grid-divider"></div>
    </div>
  {/if}

  {#if folders.length > 0}
    <h3 class="sub-title">目录</h3>
    <div class="folders-stack">
      {#each folders as folder (folder.id)}
        <div class="folder-item" style={`--depth:${folder.depth ?? 0}`}>
          <NoteCard
            id={folder.id}
            title={folder.title}
            emoji={folder.emoji ?? '📁'}
            count={folder.count}
            lastUpdated={folder.lastUpdated}
            href={folder.href}
            viewMode="list"
          />
        </div>
      {/each}
    </div>
  {/if}

  {#if notes.length > 0}
    <h3 class="sub-title">笔记</h3>
    <div class="notes-grid" class:is-list={viewMode === 'list'}>
      {#each notes as note (note.id)}
        <NoteCard
          id={note.id}
          title={note.title}
          emoji={note.emoji}
          count={note.count}
          lastUpdated={note.lastUpdated}
          href={`/notes/${note.slug}`}
          {viewMode}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .grid-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }
  .grid-title-emoji {
    font-size: 1.8rem;
    line-height: 1;
  }
  .grid-title {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-primary);
  }
  .grid-divider {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, rgb(255 214 224 / 0.7), transparent);
  }
  .sub-title {
    margin: 0.5rem 0 0.7rem;
    font-size: 0.95rem;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .folders-stack {
    display: grid;
    gap: 0.55rem;
  }
  .folder-item {
    padding-left: calc(var(--depth) * 14px);
  }

  .notes-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
  }
  @media (min-width: 640px) {
    .notes-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .notes-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 1280px) {
    .notes-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  .notes-grid.is-list {
    grid-template-columns: 1fr;
  }
</style>
