<script lang="ts">
  interface Props {
    label?: string;
    active?: boolean;
    disabled?: boolean;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }
  let { label = '', active = false, disabled = false, onclick, children }: Props = $props();
</script>

<button type="button" class="pixel-nes-btn" data-active={active} {disabled} {onclick}>
  {#if children}
    {@render children()}
  {:else}
    {label}
  {/if}
</button>
