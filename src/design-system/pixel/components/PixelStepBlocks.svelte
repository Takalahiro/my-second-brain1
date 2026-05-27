<script lang="ts">
  interface Props {
    steps?: number;
    value?: number;
    label?: string;
    ariaLabel?: string;
    onchange?: (index: number) => void;
  }
  let { steps = 8, value = 4, label = '', ariaLabel = label, onchange }: Props = $props();
</script>

<div class="pixel-step-blocks-wrap">
  {#if label}
    <span class="pixel-clock-hud__label">{label}</span>
  {/if}
  <div class="pixel-step-blocks" role="slider" aria-valuemin={1} aria-valuemax={steps} aria-valuenow={value} aria-label={ariaLabel}>
    {#each Array(steps) as _, i (i)}
      <button
        type="button"
        class="pixel-step-blocks__blk"
        data-on={i < value}
        aria-label={`${i + 1}/${steps}`}
        onclick={() => onchange?.(i + 1)}
      >
        ▮
      </button>
    {/each}
  </div>
</div>
