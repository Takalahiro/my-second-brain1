<script lang="ts">
  import SkinCloseButton from '../components/SkinCloseButton.svelte';
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
  const stamp = $derived(getDrawerChromeStamp('scholar', pane));
</script>

<header class="folio-drawer-chrome">
  <div class="folio-drawer-chrome__bar">
    <span class="folio-drawer-chrome__ribbon" aria-hidden="true"></span>
    <div>
      <span class="folio-drawer-chrome__stamp">{stamp}</span>
      {#if showBack}
        <button type="button" class="folio-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="folio-drawer-chrome__title">{title}</h2>
    </div>
    <SkinCloseButton label={closeLabel ?? m.drawer.closeBtn} onclick={onClose} />
  </div>
</header>
