<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    flat?: boolean;
    glass?: boolean;
    class?: string;
    children?: Snippet;
    [key: string]: unknown;
  }

  let { flat = false, glass = true, class: className = '', children, ...rest }: Props = $props();

  const cls = $derived(
    [
      'pixel-card',
      glass ? 'glass-container' : '',
      'ui-card',
      flat ? 'ui-card--flat' : '',
      className,
    ]
      .filter(Boolean)
      .join(' '),
  );
</script>

<div class={cls} {...rest}>{@render children?.()}</div>
