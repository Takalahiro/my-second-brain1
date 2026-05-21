<script lang="ts">
  import { renderLatexPreview } from './mathjax';

  interface Props {
    latex?: string;
  }

  let { latex = '' }: Props = $props();
  let el: HTMLDivElement | null = null;

  $effect(() => {
    if (!el) return;
    void renderLatexPreview(el, latex, { emptyText: '' });
  });
</script>

<div class="fs-step-math" bind:this={el}></div>

<style>
  .fs-step-math {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgb(0 0 0 / 0.18);
    border: 1px solid var(--border-color);
    overflow-x: auto;
  }

  .fs-step-math :global(.fr-mathjax-output) {
    color: var(--text-primary);
    font-size: 1rem;
  }
</style>
