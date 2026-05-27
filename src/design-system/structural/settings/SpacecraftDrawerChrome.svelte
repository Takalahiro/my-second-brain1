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
  const stamp = $derived(getDrawerChromeStamp('spacecraft', pane));
</script>

<header class="sc-drawer-chrome">
  <div class="sc-drawer-chrome__bar">
    <div>
      <span class="sc-drawer-chrome__id">{stamp}</span>
      {#if showBack}
        <button type="button" class="sc-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="sc-drawer-chrome__title">{title}</h2>
    </div>
    <button type="button" class="sc-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>⚠ OFF</button>
  </div>
</header>
