<script lang="ts">
  import NoteCard from './NoteCard.svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import { DEFAULT_FOLDER_ICON, type PixelIconName } from '../../lib/pixel-icons';

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

  interface Props {
    title: string;
    folders?: FolderCard[];
    notes: Note[];
    folderIcon?: PixelIconName;
    viewMode?: 'grid' | 'list';
  }

  let {
    title,
    folders = [],
    notes,
    folderIcon = DEFAULT_FOLDER_ICON,
    viewMode = 'grid',
  }: Props = $props();
</script>

<section class="mb-10">
  {#if title}
    <div class="grid-title-wrap">
      <span class="grid-title-icon"><PixelIcon name={folderIcon} size={22} /></span>
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
            icon={folder.icon ?? DEFAULT_FOLDER_ICON}
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
          icon={note.icon}
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
  .grid-title-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgb(180 140 255 / 0.1);
    color: rgb(140 100 220);
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
    margin: 0 0 0.75rem;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .folders-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .folder-item {
    padding-left: calc(var(--depth, 0) * 1rem);
  }
  .notes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.85rem;
  }
  .notes-grid.is-list {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
</style>
