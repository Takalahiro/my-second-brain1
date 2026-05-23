<script lang="ts">
  import { onMount } from 'svelte';
  import { formatLastUpdatedLine } from '../../lib/i18n/format';
  import { initLocale, localeState } from '../../lib/i18n/locale.svelte';

  interface Props {
    formatted: string;
  }

  let { formatted }: Props = $props();

  onMount(() => initLocale());

  const line = $derived(formatLastUpdatedLine(localeState.current, formatted));
</script>

<p class="not-prose detail-updated pixel-digits">{line}</p>

<style>
  .detail-updated {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
</style>
