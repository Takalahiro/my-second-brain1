<script lang="ts">
  import type { MarkdownHeading } from 'astro';
  import { untrack } from 'svelte';
  import { buildHeadingTree } from '../lib/heading-tree';
  import { draggable, type DraggableOptions } from '../lib/draggable';
  import TocNode from './TocNode.svelte';
  import TocOrb from './TocOrb.svelte';

  const PANEL_DRAG_OPTS: DraggableOptions = {
    handle: '.toc-handle',
    storageKey: 'second-brain:toc-pos',
    boundary: 'viewport',
    draggingClass: 'is-dragging',
  };

  interface Props {
    headings: MarkdownHeading[];
  }

  let { headings }: Props = $props();
  const tree = $derived(buildHeadingTree(headings, 2, 4));

  let activeSlug = $state<string | null>(null);

  // 最小化状态（持久化到 localStorage）
  const MIN_KEY = 'second-brain:toc-minimized';
  let minimized = $state(
    untrack(() => {
      if (typeof localStorage === 'undefined') return false;
      return localStorage.getItem(MIN_KEY) === '1';
    })
  );

  // 折叠状态集中管理（避免每个 TocNode 维护 $effect 导致折叠卡顿）
  let collapsedMap = $state<Record<string, boolean>>({});

  function navigate(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + slug);
  }

  function toggleNode(slug: string) {
    collapsedMap = { ...collapsedMap, [slug]: !collapsedMap[slug] };
  }

  function collapseToH2() {
    // 折叠所有有子节点的 H2 节点（即只展示一级 H2 列表）
    const next: Record<string, boolean> = {};
    for (const n of tree) {
      if (n.children.length > 0) next[n.slug] = true;
    }
    collapsedMap = next;
  }
  function expandAll() {
    collapsedMap = {};
  }
  function setMinimized(v: boolean) {
    minimized = v;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIN_KEY, v ? '1' : '0');
    }
  }

  /** 仅展开 TOC 时监听标题（最小化球模式不跑 IO，避免数百个 heading 拖慢交互） */
  $effect(() => {
    if (minimized || typeof IntersectionObserver === 'undefined') return;

    const allSlugs: string[] = [];
    (function walk(nodes: typeof tree) {
      for (const n of nodes) {
        allSlugs.push(n.slug);
        walk(n.children);
      }
    })(tree);

    const elements: HTMLElement[] = [];
    for (const slug of allSlugs) {
      const el = document.getElementById(slug);
      if (el) elements.push(el);
    }
    if (elements.length === 0) return;

    const visible = new Set<string>();
    let ioRaf = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        if (ioRaf) return;
        ioRaf = requestAnimationFrame(() => {
          ioRaf = 0;
          for (const el of elements) {
            if (visible.has(el.id)) {
              activeSlug = el.id;
              return;
            }
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (ioRaf) cancelAnimationFrame(ioRaf);
    };
  });
</script>

{#if tree.length > 0}
  {#if minimized}
    <TocOrb onExpand={() => setMinimized(false)} />
  {:else}
    <aside
      class="toc-floating"
      use:draggable={PANEL_DRAG_OPTS}
    >
      <header class="toc-handle">
        <span class="toc-handle-grip" aria-hidden="true">⋮⋮</span>
        <h2 class="toc-title">目录</h2>
        <div class="toc-actions">
          <button
            type="button"
            class="toc-action-btn"
            title="折叠到一级标题（H2）"
            aria-label="折叠到一级标题"
            onclick={collapseToH2}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
            </svg>
          </button>
          <button
            type="button"
            class="toc-action-btn"
            title="全部展开"
            aria-label="全部展开"
            onclick={expandAll}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
            </svg>
          </button>
          <button
            type="button"
            class="toc-action-btn"
            title="最小化为悬浮球"
            aria-label="最小化"
            onclick={() => setMinimized(true)}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3 13h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
            </svg>
          </button>
        </div>
      </header>

      <div class="toc-scroll">
        <ul class="toc-root">
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
    </aside>
  {/if}
{/if}

<style>
  .toc-floating {
    display: none;
  }
  @media (min-width: 1024px) {
    .toc-floating {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 5rem;
      right: max(1rem, calc((100vw - 64rem) / 2 - 240px));
      width: 240px;
      max-height: calc(100vh - 6rem);
      padding: 0;
      border-radius: 0.5rem;
      background: rgb(255 255 255);
      border: 1px solid rgb(229 231 235);
      box-shadow: 0 4px 14px -2px rgb(0 0 0 / 0.08);
      z-index: 5;
      overflow: hidden;
      contain: layout style;
      transition: box-shadow 0.15s;
    }
    .toc-floating:global(.is-dragging) {
      box-shadow: 0 12px 28px -4px rgb(0 0 0 / 0.25);
      transition: none;
    }
    :global(.dark) .toc-floating {
      background: rgb(17 24 39);
      border-color: rgb(31 41 55);
    }

  }

  .toc-handle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid rgb(229 231 235);
    cursor: grab;
    user-select: none;
    background: rgb(249 250 251);
  }
  :global(.dark) .toc-handle {
    background: rgb(17 24 39);
    border-color: rgb(31 41 55);
  }
  .toc-handle:active {
    cursor: grabbing;
  }
  .toc-handle-grip {
    font-size: 12px;
    color: rgb(156 163 175);
    letter-spacing: -2px;
  }
  .toc-title {
    flex: 1;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(107 114 128);
  }
  :global(.dark) .toc-title {
    color: rgb(156 163 175);
  }

  .toc-actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .toc-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: transparent;
    color: rgb(107 114 128);
    cursor: pointer;
    border-radius: 3px;
    transition: background 0.12s, color 0.12s;
  }
  .toc-action-btn:hover {
    background: rgb(229 231 235);
    color: rgb(37 99 235);
  }
  :global(.dark) .toc-action-btn:hover {
    background: rgb(31 41 55);
    color: rgb(96 165 250);
  }

  .toc-scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 8px 8px 6px;
  }

  .toc-root {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.875rem;
  }

  .toc-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .toc-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .toc-scroll::-webkit-scrollbar-thumb {
    background: rgb(209 213 219);
    border-radius: 3px;
  }
  .toc-scroll::-webkit-scrollbar-thumb:hover {
    background: rgb(156 163 175);
  }
  :global(.dark) .toc-scroll::-webkit-scrollbar-thumb {
    background: rgb(55 65 81);
  }
  :global(.dark) .toc-scroll::-webkit-scrollbar-thumb:hover {
    background: rgb(75 85 99);
  }
  .toc-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgb(209 213 219) transparent;
  }
  :global(.dark) .toc-scroll {
    scrollbar-color: rgb(55 65 81) transparent;
  }
</style>
