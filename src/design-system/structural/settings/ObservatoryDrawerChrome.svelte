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
  const stamp = $derived(getDrawerChromeStamp('observatory', pane));
</script>

<header class="obs-drawer-chrome">
  <div class="obs-drawer-chrome__bar">
    <div>
      <span class="obs-drawer-chrome__log">{stamp}</span>
      {#if showBack}
        <button type="button" class="obs-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="obs-drawer-chrome__title">{title}</h2>
    </div>
    <button type="button" class="obs-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>ABORT</button>
  </div>
</header>
