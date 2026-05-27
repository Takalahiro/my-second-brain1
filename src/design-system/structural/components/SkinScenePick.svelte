<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';

  interface Props {
    label: string;
    poster?: string | null;
    active?: boolean;
    slot?: number;
    onclick?: () => void;
  }

  let { label, poster = null, active = false, slot, onclick }: Props = $props();
  const skin = resolveStructuralSkin();
</script>

<button
  type="button"
  class="skin-scene-pick skin-scene-pick--{skin}"
  class:is-active={active}
  aria-pressed={active}
  aria-label={label}
  {onclick}
>
  <div class="skin-scene-pick__frame">
    {#if poster}
      <img class="skin-scene-pick__poster" src={poster} alt="" loading="lazy" />
    {:else}
      <span class="skin-scene-pick__fallback" aria-hidden="true">▣</span>
    {/if}
  </div>
  <span class="skin-scene-pick__label">{label}</span>
  {#if slot != null}
    <span class="skin-scene-pick__slot">
      {#if skin === 'blueprint'}SHEET {slot}
      {:else if skin === 'terminal'}scene_{slot}
      {:else if skin === 'spacecraft'}PORT {slot}
      {:else}{slot}
      {/if}
    </span>
  {/if}
</button>
