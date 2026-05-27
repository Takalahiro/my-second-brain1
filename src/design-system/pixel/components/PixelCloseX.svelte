<script lang="ts">
  import { getMessages } from '../../../lib/i18n/locale.svelte';

  interface Props {
    label?: string;
    variant?: 'titlebar' | 'red';
    onclick?: () => void;
  }
  let { label, variant = 'red', onclick }: Props = $props();
  const closeLabel = $derived(label ?? getMessages().drawer.closeBtn);
</script>

<button
  type="button"
  class="pixel-nes-close"
  class:pixel-nes-close--titlebar={variant === 'titlebar'}
  aria-label={closeLabel}
  {onclick}
>
  ×
</button>
