<script lang="ts">
  interface Props {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    ariaLabel?: string;
    oninput?: (v: number) => void;
  }
  let { value = 0.5, min = 0, max = 1, step = 0.05, label = '', ariaLabel = label, oninput }: Props = $props();
</script>

<label class="pixel-nes-slider">
  {#if label}
    <span class="pixel-nes-slider__label">{label}</span>
  {/if}
  <span class="pixel-nes-slider__track">
    <input
      type="range"
      class="pixel-nes-slider__input"
      {min}
      {max}
      {step}
      {value}
      aria-label={ariaLabel}
      oninput={(e) => oninput?.(Number((e.currentTarget as HTMLInputElement).value))}
    />
  </span>
</label>
