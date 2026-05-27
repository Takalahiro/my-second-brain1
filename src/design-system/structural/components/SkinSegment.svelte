<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import type { SkinSegmentProps } from '../primitives/controls/types';

  let { options, value, ariaLabel, onchange }: SkinSegmentProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="ctl-segment ctl-segment--{skin}" role="tablist" aria-label={ariaLabel}>
  {#each options as opt (opt.id)}
    <button
      type="button"
      role="tab"
      class="ctl-segment__item"
      class:is-active={value === opt.id}
      aria-selected={value === opt.id}
      disabled={opt.disabled}
      onclick={() => !opt.disabled && onchange(opt.id)}
    >
      {#if skin === 'blueprint' && value === opt.id}
        <span class="ctl-segment__fold" aria-hidden="true"></span>
      {/if}
      {#if skin === 'rpg' && value === opt.id}
        <span class="ctl-segment__arrow" aria-hidden="true">▶</span>
      {/if}
      {opt.label}
    </button>
  {/each}
</div>
