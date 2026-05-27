<script lang="ts">
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

<header class="rpg-drawer-chrome">
  <span class="rpg-drawer-chrome__orn" aria-hidden="true">◆</span>
  <div class="rpg-drawer-chrome__main">
    {#if showBack}
      <button type="button" class="rpg-drawer-chrome__back" onclick={onBack}>
        <span>▶</span> {backLabel}
      </button>
    {/if}
    <h2 class="rpg-drawer-chrome__title">{title}</h2>
  </div>
  <button type="button" class="rpg-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>
    ▶ CLOSE
  </button>
</header>
