<script lang="ts">
  import PixelIcon from '../PixelIcon.svelte';
  import { DEFAULT_NOTE_ICON, type PixelIconName } from '../../lib/pixel-icons';

  interface Props {
    id: string;
    title: string;
    icon?: PixelIconName;
    count?: number;
    lastUpdated?: string;
    href: string;
    viewMode?: 'grid' | 'list';
  }

  let {
    id,
    title,
    icon = DEFAULT_NOTE_ICON,
    count,
    lastUpdated,
    href,
    viewMode = 'grid',
  }: Props = $props();
</script>

<article class="pixel-card glass-container note-card" class:is-list={viewMode === 'list'}>
  <a href={href} class="note-card-link" aria-label={`打开笔记 ${title}`}>
    <div class="note-icon-wrap">
      <PixelIcon name={icon} size={viewMode === 'list' ? 18 : 22} />
    </div>
    <div class="note-body">
      <h3 class="note-title">{title}</h3>
      <div class="note-meta">
        {#if count !== undefined}
          <span class="pixel-badge note-count">{count} 篇</span>
        {/if}
        {#if lastUpdated}
          <span class="note-updated pixel-digits">{lastUpdated}</span>
        {/if}
      </div>
    </div>
  </a>
</article>

<style>
  .note-card {
    overflow: hidden;
    transition: transform var(--motion-base) var(--motion-ease), box-shadow var(--motion-base) var(--motion-ease);
  }
  .note-card-link {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    text-decoration: none;
    color: inherit;
    height: 100%;
  }
  .note-icon-wrap {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgb(180 140 255 / 0.1);
    border: 1px solid rgb(180 140 255 / 0.18);
    color: rgb(140 100 220);
    transition: transform var(--motion-fast) var(--motion-ease), background var(--motion-fast) var(--motion-ease);
  }
  .note-card:hover .note-icon-wrap {
    transform: translateY(-1px);
    background: rgb(180 140 255 / 0.16);
  }
  .note-body {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }
  .note-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-primary);
  }
  .note-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
  .note-count {
    font-size: 0.68rem;
  }
  .note-updated {
    font-size: 0.68rem;
    color: var(--text-secondary);
  }
  .note-card.is-list .note-card-link {
    flex-direction: row;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem 1rem;
  }
  .note-card.is-list .note-icon-wrap {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
  }
  .note-card.is-list .note-body {
    flex: 1;
  }
</style>
