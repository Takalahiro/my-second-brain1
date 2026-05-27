<script lang="ts">
  import { getMessages } from '../../../lib/i18n/locale.svelte';

  interface Props {
    label?: string;
    onclick?: () => void;
  }
  let { label, onclick }: Props = $props();
  const closeLabel = $derived(label ?? getMessages().drawer.closeBtn);
</script>

<button type="button" class="structural-close" aria-label={closeLabel} {onclick}>×</button>
