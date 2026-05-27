<script lang="ts">
  import PixelFcPadButton from '../components/PixelFcPadButton.svelte';
  import type { Messages } from '../../../lib/i18n/messages/zh';

  interface Props {
    m: Messages['drawer'];
    hasSnapshot: boolean;
    isCleared: boolean;
    onClearAll?: () => void;
    onRestore?: () => void;
  }

  let { m, hasSnapshot, isCleared, onClearAll, onRestore }: Props = $props();
</script>

<div class="pixel-drawer-pane">
  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.layout}</h3>
    <div class="pixel-fc-pad-row pixel-fc-pad-row--actions">
      <PixelFcPadButton face="a" label={m.clearScreen} disabled={isCleared} onclick={() => !isCleared && onClearAll?.()} />
      {#if hasSnapshot}
        <PixelFcPadButton face="b" label={m.restoreLast} onclick={() => onRestore?.()} />
      {/if}
    </div>
    <p class="pixel-drawer-footnote">{isCleared ? m.cleared : m.clearAllSub}</p>
  </section>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.tips}</h3>
    <ul class="pixel-drawer-tips">
      <li>{m.tipDrag}</li>
      <li>{m.tipClock}</li>
      <li>{m.tipMusic}</li>
    </ul>
  </section>
</div>
