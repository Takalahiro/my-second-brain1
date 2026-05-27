<script lang="ts">
  import { tick } from 'svelte';
  import { applyIndent, highlightPython } from '../../lib/python/highlight';

  interface Props {
    code?: string;
    disabled?: boolean;
    onscroll?: () => void;
  }

  let {
    code = $bindable(''),
    disabled = false,
    onscroll,
  }: Props = $props();

  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let highlightEl = $state<HTMLPreElement | null>(null);

  const highlighted = $derived(highlightPython(code));

  export function getTextarea() {
    return textareaEl;
  }

  function syncScroll() {
    if (textareaEl && highlightEl) {
      highlightEl.scrollTop = textareaEl.scrollTop;
      highlightEl.scrollLeft = textareaEl.scrollLeft;
    }
    onscroll?.();
  }

  async function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || disabled || !textareaEl) return;
    e.preventDefault();

    const { selectionStart, selectionEnd } = textareaEl;
    const result = applyIndent(code, selectionStart, selectionEnd, e.shiftKey);
    code = result.code;
    await tick();
    textareaEl.focus();
    textareaEl.selectionStart = result.selStart;
    textareaEl.selectionEnd = result.selEnd;
  }

  // 给父组件用：按行号滚 textarea，顺便同步高亮层
  export function scrollToLine(line: number, lineHeight = 21) {
    if (!textareaEl || line < 1) return;
    const target = (line - 1) * lineHeight;
    textareaEl.scrollTop = Math.max(0, target - textareaEl.clientHeight / 3);
    syncScroll();
  }
</script>

<div class="py-code-editor">
  <pre
    class="py-highlight"
    bind:this={highlightEl}
    aria-hidden="true"
  ><code class="py-highlight__code">{@html highlighted}{#if code.endsWith('\n')}<br />{/if}</code></pre>
  <textarea
    class="py-code-input"
    bind:this={textareaEl}
    bind:value={code}
    onkeydown={onKeydown}
    onscroll={syncScroll}
    spellcheck="false"
    autocapitalize="off"
    autocomplete="off"
    autocorrect="off"
    {disabled}
    aria-label="Python 代码"
  ></textarea>
</div>

<style>
  .py-code-editor {
    --py-editor-font: 'IBM Plex Mono', 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    --py-editor-size: 0.85rem;
    --py-editor-line-height: 21px;
    --py-editor-pad-x: 14px;
    --py-editor-pad-y: 12px;

    position: relative;
    display: grid;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    isolation: isolate;
    letter-spacing: 0;
    text-shadow: none;
    font-variant-ligatures: none;
    font-feature-settings: 'liga' 0, 'calt' 0;
  }

  .py-highlight,
  .py-code-input {
    grid-area: 1 / 1;
    margin: 0;
    padding: var(--py-editor-pad-y) var(--py-editor-pad-x);
    border: 0;
    width: 100%;
    min-height: 100%;
    font-family: var(--py-editor-font);
    font-size: var(--py-editor-size);
    font-weight: 400;
    font-style: normal;
    font-synthesis: none;
    line-height: var(--py-editor-line-height);
    letter-spacing: 0;
    text-shadow: none;
    text-rendering: geometricPrecision;
    tab-size: 4;
    -moz-tab-size: 4;
    white-space: pre;
    overflow: auto;
    box-sizing: border-box;
  }

  .py-highlight {
    pointer-events: none;
    color: var(--code-fg);
    background: var(--code-bg);
    overflow: auto;
    scrollbar-width: none;
    word-spacing: normal;
  }

  .py-highlight::-webkit-scrollbar {
    display: none;
  }

  .py-highlight__code,
  .py-highlight :global(code) {
    display: block;
    margin: 0;
    padding: 0;
    font: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    white-space: inherit;
    background: none;
    text-shadow: none;
  }

  .py-highlight :global(.py-hl-keyword) {
    color: #c792ea;
  }

  .py-highlight :global(.py-hl-builtin) {
    color: #82aaff;
  }

  .py-highlight :global(.py-hl-string) {
    color: #a5e844;
  }

  .py-highlight :global(.py-hl-comment) {
    color: rgb(255 255 255 / 0.38);
  }

  .py-highlight :global(.py-hl-number) {
    color: #f78c6c;
  }

  .py-highlight :global(.py-hl-decorator) {
    color: #ffd580;
  }

  :global(.dark) .py-highlight :global(.py-hl-comment) {
    color: rgb(255 255 255 / 0.38);
  }

  :global(:not(.dark)) .py-highlight :global(.py-hl-comment) {
    color: rgb(80 90 110 / 0.75);
  }

  .py-code-input {
    resize: none;
    color: transparent;
    caret-color: var(--code-fg);
    background: transparent;
    outline: none;
    overflow: auto;
    -webkit-text-fill-color: transparent;
  }

  .py-code-input::selection {
    background: rgb(127 230 196 / 0.28);
    color: transparent;
  }

  .py-code-input:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
</style>
