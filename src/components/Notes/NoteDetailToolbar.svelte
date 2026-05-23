<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import { getMessages, initLocale } from '../../lib/i18n/locale.svelte';

  interface Props {
    title: string;
  }

  let { title }: Props = $props();

  onMount(() => initLocale());

  const m = $derived(getMessages());
</script>

<section class="detail-toolbar pixel-card glass-container">
  <div class="detail-left">
    <a href="/notes" class="pixel-button">{m.notes.back}</a>
    <h1 class="detail-title">{title}</h1>
  </div>
  <div class="detail-actions">
    <button type="button" class="pixel-button detail-action-btn" title={m.notes.bookmark}
      ><PixelIcon name="star" size={16} /></button
    >
    <button type="button" class="pixel-button detail-action-btn" title={m.notes.copyLink}
      ><PixelIcon name="link" size={16} /></button
    >
  </div>
</section>
