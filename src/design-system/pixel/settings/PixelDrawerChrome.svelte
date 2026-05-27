<script lang="ts">
  import PixelCloseX from '../components/PixelCloseX.svelte';
  import { getMessages } from '../../../lib/i18n/locale.svelte';

  interface Props {
    title: string;
    showBack?: boolean;
    backLabel?: string;
    closeLabel?: string;
    onBack?: () => void;
    onClose?: () => void;
  }
  let { title, showBack = false, backLabel = '返回', closeLabel, onBack, onClose }: Props = $props();
  const m = $derived(getMessages());
</script>

<header class="pixel-nes-drawer-chrome">
  <div class="pixel-nes-window__titlebar">
    <span class="pixel-nes-window__icon" aria-hidden="true"></span>
    <div class="pixel-nes-window__titles">
      {#if showBack}
        <button type="button" class="pixel-nes-drawer-back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="pixel-nes-window__title">{title}</h2>
    </div>
    <PixelCloseX variant="titlebar" label={closeLabel ?? m.drawer.closeBtn} onclick={onClose} />
  </div>
</header>
