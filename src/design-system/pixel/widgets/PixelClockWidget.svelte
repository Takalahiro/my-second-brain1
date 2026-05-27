<script lang="ts">
  import { onMount } from 'svelte';
  import PixelCloseX from '../components/PixelCloseX.svelte';
  import { getPixelUi } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
    pinned?: boolean;
  }

  let { onClose, pinned = true }: Props = $props();
  const ui = $derived(getPixelUi());

  let now = $state(new Date());

  onMount(() => {
    const id = window.setInterval(() => {
      now = new Date();
    }, 1000);
    return () => window.clearInterval(id);
  });

  const timeStr = $derived(
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
  );
</script>

<div class="pixel-nes-clock-dock" class:is-floating={!pinned} aria-live="polite">
  <div class="pixel-nes-window pixel-nes-window--clock">
    <header class="pixel-nes-window__titlebar">
      <span class="pixel-nes-window__icon" aria-hidden="true"></span>
      <h2 class="pixel-nes-window__title">{ui.clockTitle}</h2>
      {#if onClose}
        <PixelCloseX variant="titlebar" onclick={onClose} />
      {/if}
    </header>
    <div class="pixel-nes-window__body">
      <div class="pixel-nes-led pixel-nes-led--clock">{timeStr}</div>
    </div>
  </div>
</div>
