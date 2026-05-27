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
  const stamp = $derived(getDrawerChromeStamp('ink', pane));
</script>

<header class="ink-drawer-chrome">
  <div class="ink-drawer-chrome__bar">
    <div>
      <span class="ink-drawer-chrome__spine">{stamp}</span>
      {#if showBack}
        <button type="button" class="ink-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
      {/if}
      <h2 class="ink-drawer-chrome__title">{title}</h2>
    </div>
    <button type="button" class="ink-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>閉</button>
  </div>
</header>
