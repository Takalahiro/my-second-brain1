<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'default' | 'primary' | 'ghost';
    class?: string;
    disabled?: boolean;
    children?: Snippet;
    [key: string]: unknown;
  }

  let {
    href,
    type = 'button',
    variant = 'default',
    class: className = '',
    disabled = false,
    children,
    ...rest
  }: Props = $props();

  const cls = $derived(
    ['pixel-button', 'ui-button', variant !== 'default' ? `ui-button--${variant}` : '', className]
      .filter(Boolean)
      .join(' '),
  );
</script>

{#if href}
  <a {href} class={cls} {...rest}>{@render children?.()}</a>
{:else}
  <button {type} class={cls} {disabled} {...rest}>{@render children?.()}</button>
{/if}
