<script lang="ts">
  /**
   * 全局 Mermaid 渲染器组件。
   *
   * - 在客户端启动后扫描页面里 `<pre><code class="language-mermaid">…</code></pre>`，
   *   Shiki 已经把代码做了语法高亮，需要把原始文本还原后交给 mermaid 渲染。
   * - 监听 <html class> 变化以适配明暗主题切换。
   * - 用 IntersectionObserver 懒渲染：图表滚动进可视区域才解析，避免长文档一次 parse 几十个图表卡死主线程。
   */
  import { onMount } from 'svelte';

  let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

  function loadMermaid() {
    if (!mermaidPromise) {
      mermaidPromise = import('mermaid').then((m) => {
        const inst = m.default;
        inst.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        });
        return inst;
      });
    }
    return mermaidPromise;
  }

  /** 把 Shiki 高亮过的 mermaid 代码块替换为占位 `<div class="mermaid-block">` */
  function prepareBlocks(): HTMLElement[] {
    const blocks = document.querySelectorAll('pre code.language-mermaid, code.language-mermaid');
    const result: HTMLElement[] = [];
    blocks.forEach((codeEl) => {
      const pre = codeEl.closest('pre');
      const raw = (codeEl as HTMLElement).textContent ?? '';
      if (!raw.trim()) return;
      const div = document.createElement('div');
      div.className = 'mermaid-block';
      div.dataset.source = raw;
      div.dataset.state = 'pending';
      (pre ?? codeEl).replaceWith(div);
      result.push(div);
    });
    return result;
  }

  async function renderOne(el: HTMLElement) {
    if (el.dataset.state === 'done') return;
    const source = el.dataset.source;
    if (!source) return;
    el.dataset.state = 'rendering';
    const mermaid = await loadMermaid();
    try {
      const id = 'mermaid-' + Math.random().toString(36).slice(2, 10);
      const { svg, bindFunctions } = await mermaid.render(id, source);
      el.innerHTML = svg;
      bindFunctions?.(el);
      el.dataset.state = 'done';
    } catch (err) {
      el.innerHTML = `<pre class="mermaid-error">Mermaid 渲染失败：${(err as Error).message}\n\n${escapeHTML(source)}</pre>`;
      el.dataset.state = 'error';
    }
  }

  function escapeHTML(s: string) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  }

  /** 重新渲染所有 mermaid 块（主题切换用） */
  async function reRenderAll() {
    const all = document.querySelectorAll<HTMLElement>('.mermaid-block');
    all.forEach((el) => {
      const src = el.dataset.source;
      if (!src) return;
      el.innerHTML = '';
      el.dataset.state = 'pending';
    });
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
    });
    for (const el of all) await renderOne(el);
  }

  onMount(() => {
    const blocks = prepareBlocks();
    if (blocks.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      blocks.forEach((b) => void renderOne(b));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              io.unobserve(entry.target);
              void renderOne(entry.target as HTMLElement);
            }
          }
        },
        { rootMargin: '200px 0px' }
      );
      blocks.forEach((b) => io.observe(b));
    }

    const themeObserver = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.attributeName === 'class') {
          void reRenderAll();
          break;
        }
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true });

    return () => {
      themeObserver.disconnect();
    };
  });
</script>

<style>
  :global(.mermaid-block) {
    margin: 1.25rem 0;
    text-align: center;
    min-height: 1rem;
  }
  :global(.mermaid-block svg) {
    max-width: 100%;
    height: auto;
  }
  :global(.mermaid-error) {
    color: rgb(220 38 38);
    background: rgb(254 242 242);
    padding: 0.75rem;
    border-radius: 0.375rem;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
  }
  :global(.dark .mermaid-error) {
    color: rgb(252 165 165);
    background: rgb(127 29 29 / 0.3);
  }
</style>
