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
  const stamp = $derived(getDrawerChromeStamp('blueprint', pane));
</script>

<header class="bp-drawer-chrome">
  <div class="bp-drawer-chrome__grid">
    <span class="bp-drawer-chrome__sheet">{stamp.split(' │ ')[0]}</span>
    <div class="bp-drawer-chrome__titles">
      {#if showBack}
        <button type="button" class="bp-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="bp-drawer-chrome__title">{title}</h2>
    </div>
    <span class="bp-drawer-chrome__dim">1:1</span>
    <SkinCloseButton label={closeLabel ?? m.drawer.closeBtn} onclick={onClose} />
  </div>
</header>
