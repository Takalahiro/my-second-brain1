<script lang="ts">
  // 全局 Mermaid 渲染器
  // markdown 阶段 remark-mermaid 会把 ```mermaid 换成 .mermaid-block 占位
  // hydrate 后扫占位、交给 mermaid 出 SVG；进视口才 parse，避免长文一次卡死
  // 还监听 html class 换明暗主题；兜底处理漏网的 pre>code.language-mermaid
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

  // 收集所有 mermaid 占位；顺便把残留的 pre>code.language-mermaid 转成占位
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

  // 不要横向滚动，移动端也要完整显示：SVG 100% 宽 + preserveAspectRatio meet
  function postProcessSvg(host: HTMLElement) {
    const svg = host.querySelector<SVGSVGElement>('svg');
    if (!svg) return;
    const vb = svg.viewBox?.baseVal;
    if (!vb || !vb.width || !vb.height) return;

    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.width = '100%';
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
    svg.style.marginInline = 'auto';
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
      postProcessSvg(el);
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

  // 主题切换时全部重渲
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
    min-height: 1rem;
    text-align: center;
    overflow: hidden;
    padding: 0.5rem 0;
  }
  /* 始终按容器宽度完整显示，不做横滚 */
  :global(.mermaid-block svg) {
    width: 100%;
    max-width: 100%;
    height: auto;
    display: block;
    margin-inline: auto;
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
