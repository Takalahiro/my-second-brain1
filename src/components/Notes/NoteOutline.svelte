<script lang="ts">
  import type { MarkdownHeading } from 'astro';
  import { buildHeadingTree } from '../../lib/heading-tree';
  import TocNode from '../TocNode.svelte';

  interface Props {
    headings: MarkdownHeading[];
    // 手机端点标题跳走后回调（用来关抽屉）
    onAfterNavigate?: () => void;
  }

  let { headings, onAfterNavigate }: Props = $props();

  const tree = $derived(buildHeadingTree(headings, 2, 4));

  let collapsedMap = $state<Record<string, boolean>>({});
  let activeSlug = $state<string | null>(null);

  function navigate(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + slug);
    onAfterNavigate?.();
  }

  function toggleNode(slug: string) {
    collapsedMap = { ...collapsedMap, [slug]: !collapsedMap[slug] };
  }

  // 只展开到 H2：一级标题可见，下面全折叠
  function collapseToH2() {
    const next: Record<string, boolean> = {};
    for (const n of tree) {
      if (n.children.length > 0) next[n.slug] = true;
    }
    collapsedMap = next;
  }

  function expandAll() {
    collapsedMap = {};
  }

  $effect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const article = document.querySelector('.detail-article');
    if (!article) return;

    const elements = Array.from(
      article.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]'),
    );
    if (elements.length === 0) return;

    const visible = new Set<string>();
    let raf = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          for (const el of elements) {
            if (visible.has(el.id)) {
              activeSlug = el.id;
              return;
            }
          }
        });
      },
      { rootMargin: '-88px 0px -55% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  });
</script>

{#if tree.length > 0}
  <div class="note-outline">
    <div class="note-outline-actions">
      <button type="button" class="note-outline-btn" title="折叠到 H2" onclick={collapseToH2}>
        折叠
      </button>
      <button type="button" class="note-outline-btn" title="全部展开" onclick={expandAll}>
        展开
      </button>
    </div>
    <ul class="note-outline-root">
      {#each tree as node (node.slug)}
        <TocNode
          {node}
          {activeSlug}
          onNavigate={navigate}
          {collapsedMap}
          onToggle={toggleNode}
        />
      {/each}
    </ul>
  </div>
{/if}

<style>
  .note-outline {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-height: 0;
  }
  .note-outline-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .note-outline-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 0.35rem 0.65rem;
    font-size: 0.75rem;
    border-radius: var(--radius-small);
    border: var(--border-thin) solid var(--border-color);
    background: var(--glass-bg);
    color: var(--text-secondary);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: color var(--motion-fast) var(--motion-ease),
      background-color var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease);
  }
  .note-outline-btn:hover,
  .note-outline-btn:active {
    color: var(--text-primary);
    border-color: var(--accent-lavender);
    background: var(--glass-bg-hover);
  }
  .note-outline-root {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.875rem;
  }
  .note-outline :global(.toc-link) {
    color: var(--text-secondary);
    font-size: 0.88rem;
  }
  .note-outline :global(.toc-link:hover) {
    color: var(--text-primary);
    background: var(--glass-bg-hover);
  }
  .note-outline :global(.toc-row.is-active .toc-link) {
    color: var(--accent-pink);
    background: rgb(255 158 212 / 0.12);
    font-weight: 600;
  }
  :global(.dark) .note-outline :global(.toc-row.is-active .toc-link) {
    color: #ffd0e6;
    background: rgb(180 140 255 / 0.18);
  }
  .note-outline :global(.toc-children) {
    border-left-color: rgb(255 255 255 / 0.12);
  }
  :global(.dark) .note-outline :global(.toc-children) {
    border-left-color: rgb(255 255 255 / 0.1);
  }
</style>
