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
  const stamp = $derived(getDrawerChromeStamp('crt', pane));
</script>

<header class="crt-drawer-chrome">
  <div class="crt-drawer-chrome__bar">
    <span class="crt-drawer-chrome__marquee">*** SYSTEM READY ***</span>
    <span class="crt-drawer-chrome__marquee" style="opacity:0.55;font-size:0.72rem">{stamp}</span>
    {#if showBack}
      <button type="button" class="crt-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
    {/if}
    <h2 class="crt-drawer-chrome__title">{title}</h2>
    <button type="button" class="crt-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>ESC</button>
  </div>
</header>
