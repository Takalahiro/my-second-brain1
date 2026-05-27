<script lang="ts">
  interface Props {
    hint?: string;
    disabled?: boolean;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }
  let { hint = 'A', disabled = false, onclick, children }: Props = $props();
</script>

<button type="button" class="pixel-ab-btn" {disabled} {onclick}>
  {#if hint}
    <kbd class="pixel-ab-btn__hint">{hint}</kbd>
  {/if}
  <span class="pixel-ab-btn__face">{@render children?.()}</span>
</button>
