<script lang="ts">
  import { onMount, tick } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type NoteItem = {
    slug: string;
    title: string;
    description?: string;
    tags?: string[];
  };

  const LAYOUT_KEY = 'second-brain:notes-widget-layout';
  const STATE_KEY = 'second-brain:notes-widget-state';

  let notes = $state<NoteItem[]>([]);
  let query = $state('');
  let selectedSlug = $state<string | null>(null);
  let minimized = $state(false);
  let maximized = $state(false);
  let bgAlpha = $state(0.7);
  let showSettings = $state(false);

  // 内联正文
  let contentHtml = $state<string>('');
  let loadingContent = $state(false);
  let loadError = $state<string | null>(null);
  let articleEl: HTMLElement | null = null;
  let loadToken = 0;

  // 布局
  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(560);
  let height = $state(440);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  const filtered = $derived.by<NoteItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      if (n.title.toLowerCase().includes(q)) return true;
      if (n.description && n.description.toLowerCase().includes(q)) return true;
      if (n.tags?.some((t) => t.toLowerCase().includes(q))) return true;
      return false;
    });
  });

  const selected = $derived<NoteItem | undefined>(notes.find((n) => n.slug === selectedSlug));

  onMount(() => {
    void loadNotesIndex();
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 320, 1200);
        if (typeof s.h === 'number') height = clamp(s.h, 300, 1100);
        rotation = layoutRotation(s);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.selectedSlug === 'string') selectedSlug = s.selectedSlug;
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}

    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 80));
      posY = Math.max(24, Math.min(window.innerHeight - height - 24, 100));
    }
    clampPos();

    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // 选中变化时拉取正文
  $effect(() => {
    const slug = selectedSlug;
    if (!slug) {
      contentHtml = '';
      return;
    }
    void loadContent(slug);
  });

  async function loadNotesIndex() {
    try {
      const res = await fetch('/data/notes.json', { cache: 'force-cache' });
      if (!res.ok) return;
      const data = (await res.json()) as NoteItem[];
      notes = data;
      if (!selectedSlug && data.length > 0) selectedSlug = data[0].slug;
    } catch {
      notes = [];
    }
  }

  async function loadContent(slug: string) {
    const token = ++loadToken;
    loadingContent = true;
    loadError = null;
    contentHtml = '';
    try {
      const url = `/notes/${encodeURI(slug)}/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      if (token !== loadToken) return;
      const { html, found } = extractArticle(text);
      if (!found) {
        loadError = '未在页面中识别到正文区域';
        loadingContent = false;
        return;
      }
      // 关键：必须先把 loadingContent 翻 false，让 article 元素进入 DOM，
      // 再把 contentHtml 注入并 tick，然后绑定 articleEl 重写链接。
      contentHtml = html;
      loadingContent = false;
      await tick();
      if (articleEl) rewriteInternalLinks(articleEl);
    } catch (e) {
      if (token !== loadToken) return;
      loadError = '加载失败：' + (e instanceof Error ? e.message : String(e));
      loadingContent = false;
    }
  }

  function extractArticle(html: string): { html: string; found: boolean } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // 多个 selector 候选，按优先级匹配。
    const selectors = [
      'article.detail-article',
      'article.prose',
      '.detail-article',
      'main article',
      'main',
    ];
    let target: HTMLElement | null = null;
    for (const sel of selectors) {
      target = doc.querySelector(sel) as HTMLElement | null;
      if (target) break;
    }
    if (!target) return { html: '', found: false };
    // 去掉 script / style，避免重复执行 / 样式覆盖
    target.querySelectorAll('script, style').forEach((n) => n.remove());
    // 去掉 astro-island 包裹（hydrate 残骸）
    target.querySelectorAll('astro-island').forEach((n) => {
      // 保留岛屿内部的 SSR HTML
      const parent = n.parentNode;
      while (n.firstChild) parent?.insertBefore(n.firstChild, n);
      n.remove();
    });
    return { html: target.innerHTML, found: true };
  }

  function rewriteInternalLinks(root: HTMLElement) {
    root.querySelectorAll('a[href]').forEach((a) => {
      const el = a as HTMLAnchorElement;
      const href = el.getAttribute('href') || '';
      if (href.startsWith('#')) {
        // 内部锚点：滚动到本组件内对应元素
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const id = href.slice(1);
          const target = root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else if (href.startsWith('/notes/')) {
        // 站内笔记跳转：直接在 widget 内切换
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const m = href.match(/^\/notes\/([^?#]+?)\/?$/);
          if (m) {
            const slug = decodeURIComponent(m[1]);
            const exists = notes.find((n) => n.slug === slug);
            if (exists) {
              selectedSlug = slug;
              persistState();
              return;
            }
          }
          window.open(href, '_blank', 'noopener');
        });
      } else {
        // 外部链接新窗口
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    });
  }

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    if (typeof window === 'undefined') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    posX = clamp(posX, 4, Math.max(4, W - width - 4));
    posY = clamp(posY, 4, Math.max(4, H - 80));
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function persistState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ selectedSlug, minimized, maximized, bgAlpha })); } catch {}
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x; posY = y; width = w; height = h; clampPos();
  }

  function doMinimize() { minimized = !minimized; if (minimized) maximized = false; persistState(); }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persistState(); }
  function toggleSettings() { showSettings = !showSettings; }
  function pick(slug: string) { selectedSlug = slug; persistState(); }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 320, minHeight: 300, maxWidth: 1200, maxHeight: 1100 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="notes-widget {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="笔记小组件"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="nw-header" onpointerdown={onHeaderPointerDown} title="拖动可移动窗口">
    <WindowChrome
      onClose={() => onClose?.()}
      onMinimize={doMinimize}
      onMaximize={doMaximize}
      maximized={maximized}
    />
    <div class="nw-title">
      <span aria-hidden="true">📖</span>
      <span>笔记 {selected ? `· ${selected.title}` : ''}</span>
    </div>
    <div class="nw-tail" data-no-drag>
      <input type="search" class="nw-search" placeholder="搜索…" bind:value={query} aria-label="搜索笔记" />
      <button type="button" class="nw-cog" onclick={toggleSettings} aria-label="设置" title="设置" data-no-drag>⚙</button>
    </div>
  </header>

  {#if !minimized && showSettings}
    <div class="nw-cfg" data-no-drag>
      <label class="nw-cfg-row">
        <span>毛玻璃透明度</span>
        <input type="range" min="0.05" max="0.95" step="0.05"
               value={bgAlpha}
               oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persistState(); }} />
        <span>{Math.round(bgAlpha * 100)}%</span>
      </label>
    </div>
  {/if}

  {#if !minimized}
    <div class="nw-body">
      <ul class="nw-list" data-no-drag>
        {#each filtered as n (n.slug)}
          <li>
            <button
              type="button"
              class="nw-item {n.slug === selectedSlug ? 'is-active' : ''}"
              onclick={() => pick(n.slug)}
              title={n.title}
            >
              <span class="nw-item-title">{n.title}</span>
              {#if n.tags && n.tags.length > 0}
                <span class="nw-item-tags">
                  {#each n.tags.slice(0, 2) as t}<span class="nw-tag">#{t}</span>{/each}
                </span>
              {/if}
            </button>
          </li>
        {/each}
        {#if filtered.length === 0}
          <li class="nw-empty">没有匹配的笔记</li>
        {/if}
      </ul>

      <div class="nw-preview prose dark:prose-invert" data-no-drag>
        {#if selected}
          {#if loadingContent}
            <div class="nw-empty">载入中…</div>
          {:else if loadError}
            <div class="nw-empty">{loadError}</div>
            <a class="nw-open" href={`/notes/${selected.slug}`} target="_blank" rel="noopener">在新页打开 →</a>
          {:else}
            <article class="nw-article" bind:this={articleEl}>
              {@html contentHtml}
            </article>
          {/if}
        {:else}
          <div class="nw-empty">选择一篇笔记查看正文</div>
        {/if}
      </div>
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={320} minHeight={300}
      maxWidth={1200} maxHeight={1100}
      disabled={maximized}
      onResize={onResize}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .notes-widget {
    --w-bg-alpha: 0.7;
    position: fixed;
    z-index: 38;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.36);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow: hidden;
    touch-action: none;
    transition: box-shadow 0.2s ease;
  }
  .notes-widget.is-active-drag {
    user-select: none;
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.5);
  }
  .notes-widget.is-maximized {
    left: 24px !important;
    top: 24px !important;
    right: 24px !important;
    bottom: 24px !important;
    width: auto !important;
    height: auto !important;
    border-radius: 22px;
  }

  .nw-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
    flex: 0 0 auto;
  }
  .notes-widget.is-active-drag .nw-header { cursor: grabbing; }
  .notes-widget.is-maximized .nw-header { cursor: default; }
  .notes-widget.is-minimized .nw-header { border-bottom: 0; }

  .nw-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    letter-spacing: 1px;
    color: rgb(255 255 255 / 0.78);
    font-weight: 600;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 50%;
  }
  .nw-tail {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .nw-search {
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 10px;
    color: #f3ecff;
    padding: 4px 10px;
    font-size: 0.78rem;
    width: 140px;
    outline: none;
  }
  .nw-search:focus { background: rgb(255 255 255 / 0.16); border-color: rgb(255 255 255 / 0.3); }

  .nw-cog {
    width: 24px; height: 24px; border-radius: 7px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.78rem;
  }
  .nw-cog:hover { background: rgb(255 255 255 / 0.16); }

  .nw-cfg {
    padding: 8px 14px 10px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
  }
  .nw-cfg-row {
    display: grid;
    grid-template-columns: minmax(110px, 35%) 1fr 42px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #ddd0f1;
  }
  .nw-cfg-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .nw-cfg-row input[type='range']::-webkit-slider-thumb,
  .nw-cfg-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }

  .nw-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(140px, 32%) 1fr;
  }
  .notes-widget.is-maximized .nw-body {
    grid-template-columns: minmax(220px, 22%) 1fr;
  }

  .nw-list {
    list-style: none;
    margin: 0;
    padding: 6px;
    overflow: auto;
    border-right: 1px solid rgb(255 255 255 / 0.08);
    min-height: 0;
  }
  .nw-item {
    width: 100%;
    text-align: left;
    background: transparent;
    color: #efe6ff;
    border: 0;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.78rem;
  }
  .nw-item:hover { background: rgb(255 255 255 / 0.08); }
  .nw-item.is-active {
    background: rgb(124 92 200 / 0.32);
    color: #fff5ff;
  }
  .nw-item-title {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .nw-item-tags { display: inline-flex; gap: 4px; flex-wrap: wrap; }
  .nw-tag {
    color: #d4c6f7;
    font-size: 0.68rem;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 999px;
    padding: 0 6px;
    line-height: 1.5;
  }
  .nw-empty { color: #b6a8d3; font-size: 0.85rem; padding: 12px; list-style: none; }

  .nw-preview {
    padding: 14px 18px;
    overflow: auto;
    min-height: 0;
    color: #ecdfff;
  }
  .nw-article :global(h1),
  .nw-article :global(h2),
  .nw-article :global(h3),
  .nw-article :global(h4) {
    color: #fff5ff;
    margin-top: 1em;
    margin-bottom: 0.4em;
  }
  .nw-article :global(p),
  .nw-article :global(li) {
    color: #e2d4fb;
    line-height: 1.65;
  }
  .nw-article :global(a) {
    color: #ffd0e6;
    text-decoration: none;
    border-bottom: 1px dashed rgb(255 208 230 / 0.5);
  }
  .nw-article :global(a:hover) { color: #fff; }
  .nw-article :global(code) {
    background: rgb(255 255 255 / 0.08);
    padding: 0 4px;
    border-radius: 4px;
    font-size: 0.85em;
  }
  .nw-article :global(pre) {
    background: rgb(8 6 16 / 0.8);
    color: #d4c5f5;
    padding: 12px;
    border-radius: 10px;
    overflow: auto;
    font-size: 0.82em;
  }
  .nw-article :global(blockquote) {
    border-left: 3px solid rgb(180 140 255 / 0.5);
    padding-left: 12px;
    color: #cbb9e6;
    margin: 1em 0;
  }
  .nw-article :global(img) {
    max-width: 100%;
    border-radius: 8px;
  }
  .nw-article :global(table) {
    border-collapse: collapse;
    width: 100%;
    font-size: 0.85em;
  }
  .nw-article :global(th),
  .nw-article :global(td) {
    border: 1px solid rgb(255 255 255 / 0.14);
    padding: 6px 10px;
    text-align: left;
  }
  .nw-article :global(th) { background: rgb(255 255 255 / 0.06); }

  .nw-open {
    display: inline-block;
    margin-top: 12px;
    padding: 6px 12px;
    border-radius: 999px;
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #2a1c40;
    border: 1px solid rgb(255 255 255 / 0.4);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.8rem;
  }
  .nw-open:hover { filter: brightness(1.05); }

  @media (max-width: 768px) {
    .notes-widget:not(.is-maximized) {
      left: 10px !important;
      right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 70px) !important;
      width: auto !important;
      height: 60vh !important;
    }
    .nw-search { width: 100px; }
  }
</style>
