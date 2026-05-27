<script lang="ts">
  interface Props {
    label: string;
    poster?: string | null;
    active?: boolean;
    slot?: number;
    onclick?: () => void;
  }
  let { label, poster = null, active = false, slot, onclick }: Props = $props();
</script>

<button
  type="button"
  class="pixel-wp-cart"
  data-active={active}
  aria-pressed={active}
  aria-label={label}
  {onclick}
>
  <div class="pixel-wp-cart__body">
    <div class="pixel-wp-cart__notch" aria-hidden="true"></div>
    <header class="pixel-wp-cart__label">
      <span class="pixel-wp-cart__corner"></span>
      <span class="pixel-wp-cart__corner"></span>
      <span class="pixel-wp-cart__title">{label}</span>
      {#if slot != null}
        <span class="pixel-wp-cart__slot">场景 {slot}</span>
      {/if}
    </header>
    <div class="pixel-wp-cart__screen">
      {#if poster}
        <img class="pixel-wp-cart__poster" src={poster} alt="" loading="lazy" />
      {:else}
        <span class="pixel-wp-cart__fallback" aria-hidden="true">▣</span>
      {/if}
    </div>
    <div class="pixel-wp-cart__steps" aria-hidden="true">
      {#each Array(6) as _, i (i)}
        <span></span>
      {/each}
    </div>
    <div class="pixel-wp-cart__pins" aria-hidden="true"></div>
  </div>
  <div class="pixel-wp-cart__teeth" aria-hidden="true"></div>
</button>
