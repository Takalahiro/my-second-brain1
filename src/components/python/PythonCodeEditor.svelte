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
  ><code>{@html highlighted}</code></pre>
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
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .py-highlight,
  .py-code-input {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: 12px 14px;
    border: 0;
    font-family: 'IBM Plex Mono', 'Consolas', monospace;
    font-size: 0.85rem;
    line-height: 21px;
    tab-size: 4;
    -moz-tab-size: 4;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
    box-sizing: border-box;
  }

  .py-highlight {
    pointer-events: none;
    color: var(--code-fg);
    background: var(--code-bg);
  }

  .py-highlight :global(code) {
    font: inherit;
    background: none;
  }

  .py-highlight :global(.py-hl-keyword) {
    color: #c792ea;
    font-weight: 600;
  }

  .py-highlight :global(.py-hl-builtin) {
    color: #82aaff;
  }

  .py-highlight :global(.py-hl-string) {
    color: #a5e844;
  }

  .py-highlight :global(.py-hl-comment) {
    color: rgb(255 255 255 / 0.38);
    font-style: italic;
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
