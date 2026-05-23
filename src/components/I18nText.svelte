<script lang="ts">
  import { onMount } from 'svelte';
  import { getMessages, initLocale, localeState } from '../lib/i18n/locale.svelte';
  import { resolveMessageKey } from '../lib/i18n/resolve';

  interface Props {
    k: string;
    tag?: keyof HTMLElementTagNameMap;
  }

  let { k, tag = 'span' }: Props = $props();

  onMount(() => initLocale());

  const text = $derived(resolveMessageKey(getMessages(), k));
</script>

<svelte:element this={tag}>{text}</svelte:element>
