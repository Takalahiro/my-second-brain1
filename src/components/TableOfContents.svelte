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
      class="toc-floating pixel-card glass-container"
      class:is-mobile={!isDesktop}
      use:draggable={PANEL_DRAG_OPTS}
    >
      <header class="toc-handle">
        <span class="toc-handle-grip" aria-hidden="true">⋮⋮</span>
        <h2 class="toc-title">目录</h2>
        <div class="toc-actions">
          <button
            type="button"
            class="toc-action-btn pixel-button"
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
            class="toc-action-btn pixel-button"
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
            class="toc-action-btn pixel-button"
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

      <!--
        底部拖动条：与顶部 .toc-handle 用相同 class，draggable 会把每个匹配的
        元素都当作拖动入口。在桌面端可见，移动端隐藏（移动端是抽屉不需要拖）。
      -->
      <footer class="toc-handle toc-handle-bottom" aria-label="拖动目录窗口">
        <span class="toc-handle-grip-bar" aria-hidden="true"></span>
      </footer>
    </aside>
  {/if}
{/if}

<style>
  /* 默认（移动端 / 平板 < 1024px）：右侧贴边抽屉 */
  .toc-floating {
    display: flex;
    flex-direction: column;
    position: fixed;
    /*
     * iPad Safari 顶部 URL bar / 安全区会推下页面 header。
     * 用 env(safe-area-inset-top) 自适应，再加 4.5rem 给我们自己的 header（高约 3.5rem）+ 一点呼吸空间。
     */
    top: calc(env(safe-area-inset-top, 0px) + 4.5rem);
    right: 0.5rem;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
    width: min(82vw, 320px);
    border-radius: var(--radius-card);
    background: var(--glass-bg);
    border-width: var(--border-thin);
    box-shadow: var(--shadow-normal);
    z-index: 60;
    overflow: hidden;
    contain: layout style;
    transition: transform var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease),
      background-color var(--motion-fast) var(--motion-ease);
  }
  :global(.dark) .toc-floating {
    background: var(--glass-bg);
    border-color: var(--border-color);
  }

  /* 桌面端：右侧浮窗，可拖。
     iPad 横屏（>= 1024px）也走这个分支；用 safe-area-inset-top 确保不被 sticky header 遮住 */
  @media (min-width: 1024px) {
    .toc-floating {
      top: calc(env(safe-area-inset-top, 0px) + 5.5rem);
      right: max(1rem, calc((100vw - 64rem) / 2 - 240px));
      bottom: auto;
      width: 240px;
      max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 7rem);
      box-shadow: var(--shadow-normal);
      z-index: 5;
      transition: transform var(--motion-fast) var(--motion-ease),
        box-shadow var(--motion-fast) var(--motion-ease),
        border-color var(--motion-fast) var(--motion-ease),
        background-color var(--motion-fast) var(--motion-ease);
    }
    .toc-floating:global(.is-dragging) {
      box-shadow: var(--shadow-hover);
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
    border-bottom: var(--border-thin) solid var(--border-color);
    cursor: grab;
    user-select: none;
    background: var(--bg-secondary);
  }
  :global(.dark) .toc-handle {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }
  .toc-handle:active {
    cursor: grabbing;
  }
  .toc-handle-grip {
    font-size: 12px;
    color: var(--text-secondary);
    letter-spacing: -2px;
  }

  /* 底部拖动条：薄薄一条，居中显示一个小 grip bar */
  .toc-handle-bottom {
    flex: 0 0 auto;
    justify-content: center;
    padding: 6px 10px 8px;
    border-top: var(--border-thin) solid var(--border-color);
    border-bottom: none;
    background: var(--bg-secondary);
    display: flex;
  }
  :global(.dark) .toc-handle-bottom {
    background: var(--bg-secondary);
    border-top-color: var(--border-color);
  }
  /* 移动端抽屉不允许拖动，隐藏底部 handle */
  .toc-floating.is-mobile .toc-handle-bottom {
    display: none;
  }
  .toc-handle-grip-bar {
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgb(209 213 219);
    transition: background-color var(--motion-fast) var(--motion-ease);
  }
  .toc-handle-bottom:hover .toc-handle-grip-bar {
    background: rgb(156 163 175);
  }
  :global(.dark) .toc-handle-grip-bar {
    background: rgb(55 65 81);
  }
  :global(.dark) .toc-handle-bottom:hover .toc-handle-grip-bar {
    background: rgb(107 114 128);
  }
  .toc-title {
    flex: 1;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }
  :global(.dark) .toc-title {
    color: var(--text-secondary);
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
    width: 24px;
    height: 24px;
    padding: 0;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-small);
    border-width: var(--border-thin);
    transition: transform var(--motion-fast) var(--motion-ease),
      border-color var(--motion-fast) var(--motion-ease),
      box-shadow var(--motion-fast) var(--motion-ease),
      background-color var(--motion-fast) var(--motion-ease);
    box-shadow: var(--shadow-pixel);
  }
  .toc-action-btn:hover {
    color: var(--text-primary);
    border-color: var(--accent-lavender);
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }
  .toc-action-btn:active {
    box-shadow: var(--shadow-active);
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
