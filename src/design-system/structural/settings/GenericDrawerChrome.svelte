<script lang="ts">
  import SkinCloseButton from '../components/SkinCloseButton.svelte';
  import { getMessages } from '../../../lib/i18n/locale.svelte';
  import { resolveStructuralSkin } from '../skin-context';
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
  const skin = resolveStructuralSkin();
  const stamp = $derived(getDrawerChromeStamp(skin, pane));
</script>

<header class="structural-drawer-chrome structural-drawer-chrome--{skin}">
  <div class="structural-drawer-chrome__bar">
    <span class="structural-drawer-chrome__icon" aria-hidden="true"></span>
    <div class="structural-drawer-chrome__titles">
      <span class="structural-drawer-chrome__stamp">{stamp}</span>
      {#if showBack}
        <button type="button" class="structural-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="structural-drawer-chrome__title">{title}</h2>
    </div>
    <SkinCloseButton label={closeLabel ?? m.drawer.closeBtn} onclick={onClose} />
  </div>
</header>
