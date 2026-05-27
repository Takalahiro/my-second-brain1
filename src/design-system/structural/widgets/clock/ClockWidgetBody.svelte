<script lang="ts">
  import SkinCloseButton from '../../components/SkinCloseButton.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { ClockBodyProps } from './clock-types';

  let { ui, timeStr, pinned = true, onClose }: ClockBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-clock skin-clock--{skin}" class:is-floating={!pinned} aria-live="polite">
  <div class="skin-clock__frame">
    <header class="skin-clock__header">
      <span class="skin-clock__badge" aria-hidden="true">◷</span>
      <h2 class="skin-clock__title">{ui.clockTitle}</h2>
      {#if onClose}
        <SkinCloseButton onclick={onClose} />
      {/if}
    </header>
    <div class="skin-clock__body">
      <div class="skin-clock__display">{timeStr}</div>
    </div>
  </div>
</div>
