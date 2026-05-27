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
  const stamp = $derived(getDrawerChromeStamp('terminal', pane));
</script>

<header class="term-drawer-chrome">
  <div class="term-drawer-chrome__bar">
    <p class="term-drawer-chrome__prompt">{stamp}</p>
    {#if showBack}
      <button type="button" class="term-drawer-chrome__back" onclick={onBack}>◀ {backLabel}</button>
    {/if}
    <h2 class="term-drawer-chrome__title">{title}</h2>
    <div class="term-drawer-chrome__acts">
      <span aria-hidden="true">tmux 3.3a</span>
      <button type="button" class="term-drawer-chrome__close" aria-label={closeLabel ?? m.drawer.closeBtn} onclick={onClose}>[exit 0]</button>
    </div>
  </div>
</header>
