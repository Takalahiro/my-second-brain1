<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    count?: number | string;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { href, count, class: className = '', children, ...rest }: Props = $props();

  const cls = $derived(['pixel-badge', 'ui-tag', className].filter(Boolean).join(' '));
</script>

{#if href}
  <a {href} class={cls} {...rest}>
    {@render children?.()}
    {#if count != null}<span class="ui-tag-count">{count}</span>{/if}
  </a>
{:else}
  <span class={cls} {...rest}>
    {@render children?.()}
    {#if count != null}<span class="ui-tag-count">{count}</span>{/if}
  </span>
{/if}
