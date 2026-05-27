<script lang="ts">
  import type { StructuralSkinId } from '../registry';

  interface Props {
    skin: StructuralSkinId;
    active: boolean;
  }

  let { skin, active }: Props = $props();
</script>

{#if active}
  <div class="shell-drag-fx shell-drag-fx--{skin}" aria-hidden="true">
    {#if skin === 'blueprint'}
      <span class="shell-drag-fx__bp-stamp">RELOCATING</span>
      <span class="shell-drag-fx__bp-dim"></span>
      <span class="shell-drag-fx__bp-cross shell-drag-fx__bp-cross--tl"></span>
      <span class="shell-drag-fx__bp-cross shell-drag-fx__bp-cross--br"></span>
    {:else if skin === 'scholar'}
      <span class="shell-drag-fx__folio-curl"></span>
      <span class="shell-drag-fx__wax-trail"></span>
    {:else if skin === 'terminal'}
      <span class="shell-drag-fx__term-echo"></span>
      <span class="shell-drag-fx__term-cursor">DRAG &gt;&gt;</span>
    {:else if skin === 'crt'}
      <span class="shell-drag-fx__crt-scan"></span>
      <span class="shell-drag-fx__crt-phosphor"></span>
    {:else if skin === 'observatory'}
      <span class="shell-drag-fx__obs-stars"></span>
      <span class="shell-drag-fx__obs-track">TRACKING</span>
    {:else if skin === 'herbarium'}
      <span class="shell-drag-fx__herb-tape shell-drag-fx__herb-tape--tl"></span>
      <span class="shell-drag-fx__herb-tape shell-drag-fx__herb-tape--br"></span>
    {:else if skin === 'ink'}
      <span class="shell-drag-fx__ink-smudge"></span>
      <span class="shell-drag-fx__ink-brush"></span>
      <span class="shell-drag-fx__ink-chop">移卷</span>
    {:else if skin === 'rpg'}
      <span class="shell-drag-fx__rpg-banner">▶ PICK UP! ▶</span>
      <span class="shell-drag-fx__rpg-cursor">▶ ▶ ▶</span>
      <span class="shell-drag-fx__rpg-spark"></span>
    {:else if skin === 'spacecraft'}
      <span class="shell-drag-fx__sc-warn">▲ CAUTION — REPOSITION</span>
      <span class="shell-drag-fx__sc-gforce"></span>
    {/if}
  </div>
{/if}
