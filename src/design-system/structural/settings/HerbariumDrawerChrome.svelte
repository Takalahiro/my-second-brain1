<script lang="ts">
  import { getMessages } from '../../../lib/i18n/locale.svelte';
  import { getDrawerChromeStamp } from '../lib/structural-copy';
  import type { DrawerChromeProps } from '../resolveDrawerChrome';

  let {
    title,
    pane = 'home',
    showBack = false,
    backLabel = '返回',
    closeLabel,
    onBack,
    onClose,
  }: DrawerChromeProps = $props();
  const m = $derived(getMessages());
  const stamp = $derived(getDrawerChromeStamp('herbarium', pane));
</script>

<header class="herb-drawer-chrome">
  <div class="herb-drawer-chrome__bar">
    <div>
      <span class="herb-drawer-chrome__cat">{stamp}</span>
      {#if showBack}
        <button type="button" class="herb-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="herb-drawer-chrome__title">{title}</h2>
    </div>
    <button type="button" class="herb-drawer-chrome__stamp" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>✓ FILED</button>
  </div>
</header>
