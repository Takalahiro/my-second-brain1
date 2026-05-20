<script lang="ts">
  import type { MarkdownHeading } from 'astro';
  import { buildHeadingTree } from '../lib/heading-tree';
  import { draggable, type DraggableOptions } from '../lib/draggable';
  import TocNode from './TocNode.svelte';
  import TocOrb from './TocOrb.svelte';

  interface Props {
    headings: MarkdownHeading[];
  }

  let { headings }: Props = $props();
  const tree = $derived(buildHeadingTree(headings, 2, 4));

  let activeSlug = $state<string | null>(null);
  let collapsedMap = $state<Record<string, boolean>>({});

  const MIN_KEY = 'second-brain:toc-minimized';

  // SSR 默认 minimized=true（直出小悬浮球，避免 hydration 期间 panel 跳动）
  // 客户端 mount 后再根据 localStorage / 屏宽决定。
  let minimized = $state(true);
  let isDesktop = $state(false);
  let hydrated = $state(false);

  // 桌面端 panel 可拖；移动端抽屉不可拖
  const PANEL_DRAG_OPTS = $derived<DraggableOptions>({
    enabled: isDesktop,
    handle: '.toc-handle',
    storageKey: 'second-brain:toc-pos',
    boundary: 'viewport',
    draggingClass: 'is-dragging',
  });

  function navigate(slug: string) {
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + slug);
    // 移动端：点了之后自动收起 panel，避免挡正文
    if (!isDesktop) setMinimized(true);
  }

  function toggleNode(slug: string) {
    collapsedMap = { ...collapsedMap, [slug]: !collapsedMap[slug] };
  }

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
  function setMinimized(v: boolean) {
    minimized = v;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIN_KEY, v ? '1' : '0');
    }
  }

  /** 一次性 hydration：读偏好 + 监听断点切换 */
  $effect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    isDesktop = mql.matches;

    // 默认所有设备都是 orb 状态。用户点开后会通过 localStorage 记住偏好。
    // 之前根据屏宽自动展开 panel，配合 visibility 控制会在桌面 Chrome/Edge
    // 上出现「orb 被卸载但 panel 还没 visible」的窗口，导致看上去什么都没有。
    const stored = localStorage.getItem(MIN_KEY);
    if (stored === '1') minimized = true;
    else if (stored === '0') minimized = false;
    // 没有偏好 → 保持 minimized=true（构造函数默认值，所有设备都先看到 orb）
    hydrated = true;

    const onChange = (e: MediaQueryListEvent) => {
      isDesktop = e.matches;
    };
    // Safari < 14 没有 addEventListener('change')，回退到旧的 addListener
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    // @ts-expect-error: legacy MediaQueryList API
    mql.addListener(onChange);
    return () => {
      // @ts-expect-error: legacy MediaQueryList API
      mql.removeListener(onChange);
    };
  });

  /** 仅 panel 展开 + 桌面端 跑 IO（移动端抽屉用完即收，无需高亮当前章节） */
  $effect(() => {
    if (!hydrated || minimized || !isDesktop) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // 直接从 DOM 取真实存在的 heading，不依赖 tree 数据
    const article = document.querySelector('article');
    if (!article) return;
    const elements = Array.from(
      article.querySelectorAll<HTMLElement>('h2[id], h3[id], h4[id]')
    );
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
    {#if !isDesktop && hydrated}
      <button
        type="button"
        class="toc-backdrop"
        aria-label="关闭目录"
        onclick={() => setMinimized(true)}
      ></button>
    {/if}
    <aside
      class="toc-floating"
      class:is-mobile={!isDesktop}
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
  /* 默认（移动端 / 平板 < 1024px）：右侧贴边抽屉 */
  .toc-floating {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 4rem;
    right: 0.5rem;
    bottom: 1rem;
    width: min(82vw, 320px);
    border-radius: 0.5rem;
    background: rgb(255 255 255);
    border: 1px solid rgb(229 231 235);
    box-shadow: 0 10px 30px -4px rgb(0 0 0 / 0.25);
    z-index: 60;
    overflow: hidden;
    contain: layout style;
    /*
     * 不设 visibility:hidden！panel 是 hydration 后才 mount 的
     * （SSR 只直出 orb），没有 SSR-vs-hydration 位置跳动问题。
     * 之前用 visibility 等 [data-drag-ready=1] 反而在桌面 Chrome/Edge 上
     * 制造了「panel mount 但 visibility 永远 hidden」的 bug。
     */
  }
  :global(.dark) .toc-floating {
    background: rgb(17 24 39);
    border-color: rgb(31 41 55);
  }

  /* 桌面端：右侧浮窗，可拖 */
  @media (min-width: 1024px) {
    .toc-floating {
      top: 5rem;
      right: max(1rem, calc((100vw - 64rem) / 2 - 240px));
      bottom: auto;
      width: 240px;
      max-height: calc(100vh - 6rem);
      box-shadow: 0 4px 14px -2px rgb(0 0 0 / 0.08);
      z-index: 5;
      transition: box-shadow 0.15s;
    }
    .toc-floating:global(.is-dragging) {
      box-shadow: 0 12px 28px -4px rgb(0 0 0 / 0.25);
      transition: none;
    }
  }

  /* 移动端遮罩：点击关闭，且阻挡正文滚动穿透 */
  .toc-backdrop {
    position: fixed;
    inset: 0;
    border: none;
    padding: 0;
    background: rgb(0 0 0 / 0.35);
    z-index: 55;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  @media (min-width: 1024px) {
    .toc-backdrop {
      display: none;
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
