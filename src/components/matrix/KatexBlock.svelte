<script lang="ts">
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  interface Props {
    tex: string;
    display?: boolean;
  }
  let { tex, display = false }: Props = $props();

  let html = $state('');

  $effect(() => {
    try {
      html = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        trust: true,
        macros: {
          '\\R': '\\mathbb{R}',
        },
      });
    } catch {
      html = tex;
    }
  });
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<span class="katex-block" class:display>{@html html}</span>

<style>
  .katex-block {
    color: inherit;
    font-size: 1.02em;
    overflow-x: auto;
    line-height: 1.6;
  }
  .katex-block.display {
    display: block;
    text-align: center;
    padding: 4px 8px;
  }
  .katex-block :global(.katex) {
    color: inherit;
    font-size: 1.05em;
  }
  .katex-block :global(.katex-display) {
    margin: 0;
  }
</style>
