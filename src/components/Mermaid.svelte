<script lang="ts">
  /**
   * 全局 Mermaid 渲染器组件。
   *
   * - 在 markdown → HTML 阶段，`src/lib/remark-mermaid.mjs` 已经把每一个 ```mermaid 代码块
   *   替换为 `<div class="mermaid-block" data-source="…" data-state="pending"></div>` 占位。
   *   此组件在客户端 hydrate 后，扫描这些占位并把 `data-source` 交给 mermaid 渲染成 SVG。
   * - 用 IntersectionObserver 懒渲染：图表滚动进可视区域才解析，避免长文档一次 parse 几十个图表卡死主线程。
   * - 监听 `<html class>` 变化以适配明暗主题切换。
   *
   * 同时兼容回退情形：如果将来某条 markdown 还是被走了 Shiki（出现了 `<pre><code class="language-mermaid">`），
   * 这里也会把它转成 mermaid-block 再渲染。
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

  /** 收集页面上所有 mermaid 占位 div；同时把残留的 `<pre><code class="language-mermaid">` 兜底转成占位 */
  function collectBlocks(): HTMLElement[] {
    document.querySelectorAll('pre code.language-mermaid, code.language-mermaid').forEach((codeEl) => {
      const pre = codeEl.closest('pre');
      const raw = (codeEl as HTMLElement).textContent ?? '';
      if (!raw.trim()) return;
      const div = document.createElement('div');
      div.className = 'mermaid-block';
      div.dataset.state = 'pending';
      div.dataset.srcEncoded = encodeURIComponent(raw);
      (pre ?? codeEl).replaceWith(div);
    });
    return Array.from(document.querySelectorAll<HTMLElement>('.mermaid-block'));
  }

  function readSource(el: HTMLElement): string {
    if (el.dataset.srcEncoded) {
      try {
        return decodeURIComponent(el.dataset.srcEncoded);
      } catch {
        /* fall through */
      }
    }
    return el.dataset.source ?? '';
  }

  async function renderOne(el: HTMLElement) {
    if (el.dataset.state === 'done') return;
    const source = readSource(el);
    if (!source.trim()) return;
    el.dataset.state = 'rendering';
    const mermaid = await loadMermaid();
    try {
      const id = 'mermaid-' + Math.random().toString(36).slice(2, 10);
      const { svg, bindFunctions } = await mermaid.render(id, source);
      el.innerHTML = svg;
      bindFunctions?.(el);
      el.dataset.state = 'done';
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      el.innerHTML = `<pre class="mermaid-error">Mermaid 渲染失败：${escapeHTML(msg)}\n\n${escapeHTML(source)}</pre>`;
      el.dataset.state = 'error';
    }
  }

  function escapeHTML(s: string) {
    return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  }

  /** 重新渲染所有 mermaid 块（主题切换用） */
  async function reRenderAll() {
    const all = document.querySelectorAll<HTMLElement>('.mermaid-block');
    const sources: Array<{ el: HTMLElement; src: string }> = [];
    all.forEach((el) => {
      const src = readSource(el);
      if (!src.trim()) return;
      // 清空已渲染的 SVG，重新置 pending；source 仍保留在 data-src-encoded 上
      el.innerHTML = '';
      el.dataset.state = 'pending';
      sources.push({ el, src });
    });
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
    });
    for (const { el } of sources) await renderOne(el);
  }

  onMount(() => {
    const blocks = collectBlocks();
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
