<script lang="ts">
  import { highlightAvr } from '../../lib/avr/highlight';

  interface Props {
    code?: string;
  }

  let { code = $bindable('') }: Props = $props();

  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let highlightEl = $state<HTMLPreElement | null>(null);
  const highlighted = $derived(highlightAvr(code));

  function syncScroll() {
    if (textareaEl && highlightEl) {
      highlightEl.scrollTop = textareaEl.scrollTop;
      highlightEl.scrollLeft = textareaEl.scrollLeft;
    }
  }
</script>

<div class="avr-editor">
  <pre class="avr-highlight" bind:this={highlightEl} aria-hidden="true"><code>{@html highlighted}</code></pre>
  <textarea
    bind:this={textareaEl}
    bind:value={code}
    spellcheck="false"
    onscroll={syncScroll}
    aria-label="AVR 汇编源码"
  ></textarea>
</div>

<style>
  .avr-editor {
    position: relative;
    flex: 1;
    min-height: 0;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: var(--text-sm);
    line-height: 1.55;
  }
  .avr-highlight,
  textarea {
    position: absolute;
    inset: 0;
    margin: 0;
    padding: var(--space-3);
    border: 0;
    white-space: pre;
    overflow: auto;
    tab-size: 2;
  }
  .avr-highlight {
    color: var(--text);
    pointer-events: none;
  }
  textarea {
    color: transparent;
    caret-color: var(--text);
    background: transparent;
    resize: none;
    outline: none;
  }
  :global(.avr-op) { color: var(--accent); font-weight: var(--weight-semibold); }
  :global(.avr-reg) { color: var(--accent-out); }
  :global(.avr-num) { color: var(--color-success); }
  :global(.avr-lbl) { color: var(--text); font-weight: var(--weight-semibold); }
  :global(.avr-cmt) { color: var(--text-muted); }
</style>
