<script lang="ts">
  interface Props {
    id: string;
    title: string;
    emoji?: string;
    count?: number;
    lastUpdated?: string;
    href: string;
    viewMode?: 'grid' | 'list';
  }

  let { id, title, emoji = '📝', count, lastUpdated, href, viewMode = 'grid' }: Props = $props();
</script>

<article class="pixel-card glass-container note-card" class:is-list={viewMode === 'list'}>
  <a href={href} class="note-card-link" aria-label={`打开笔记 ${title}`}>
    <div class="note-emoji">{emoji}</div>
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
    border-width: var(--border-thin);
    overflow: hidden;
  }
  .note-card-link {
    display: block;
    text-decoration: none;
    color: inherit;
    padding: 1.1rem;
    min-height: 180px;
  }
  .note-emoji {
    font-size: 2.8rem;
    line-height: 1;
    text-align: center;
    margin-bottom: 0.75rem;
    transition: transform var(--motion-fast) var(--motion-ease);
  }
  .note-card:hover .note-emoji {
    transform: scale(1.08);
  }
  .note-title {
    margin: 0 0 0.65rem;
    text-align: center;
    font-size: 1.02rem;
    color: var(--text-primary);
  }
  .note-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
  .note-count {
    background: var(--accent-mint);
    color: var(--text-primary);
  }
  .note-updated {
    font-size: 0.72rem;
    color: var(--text-secondary);
  }

  .note-card.is-list .note-card-link {
    min-height: auto;
    padding: 0.8rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
  .note-card.is-list .note-emoji {
    margin: 0;
    font-size: 1.4rem;
    flex: 0 0 auto;
  }
  .note-card.is-list .note-body {
    flex: 1;
    min-width: 0;
  }
  .note-card.is-list .note-title {
    text-align: left;
    margin-bottom: 0.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .note-card.is-list .note-meta {
    justify-content: flex-start;
  }
</style>
