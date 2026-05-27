<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import type { Messages } from '../../../lib/i18n/messages/zh';

  interface Props {
    m: Messages['drawer'];
    hasSnapshot: boolean;
    isCleared: boolean;
    onClearAll?: () => void;
    onRestore?: () => void;
  }

  let { m, hasSnapshot, isCleared, onClearAll, onRestore }: Props = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="structural-drawer-pane">
  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.layout}</h3>
    <div class="ctl-actions ctl-actions--{skin}">
      <button type="button" class="ctl-action" disabled={isCleared} onclick={() => !isCleared && onClearAll?.()}>
        {m.clearScreen}
      </button>
      {#if hasSnapshot}
        <button type="button" class="ctl-action is-accent" onclick={() => onRestore?.()}>
          {m.restoreLast}
        </button>
      {/if}
    </div>
    <p class="structural-drawer-footnote">{isCleared ? m.cleared : m.clearAllSub}</p>
  </section>

  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.tips}</h3>
    <ul class="structural-drawer-tips">
      <li>{m.tipDrag}</li>
      <li>{m.tipClock}</li>
      <li>{m.tipMusic}</li>
    </ul>
  </section>
</div>
