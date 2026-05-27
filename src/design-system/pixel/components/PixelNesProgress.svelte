<script lang="ts">
  interface Props {
    value?: number;
    max?: number;
    label?: string;
    showPct?: boolean;
    variant?: 'default' | 'todo';
  }
  let { value = 0, max = 100, label = '', showPct = true, variant = 'default' }: Props = $props();
  const pct = $derived(Math.round(max > 0 ? (value / max) * 100 : 0));
</script>

<div class="pixel-nes-progress" data-variant={variant}>
  {#if label || showPct}
    <div class="pixel-nes-progress__head">
      {#if label}<span>{label}</span>{/if}
      {#if showPct}<span class="pixel-nes-progress__pct">{pct}%</span>{/if}
    </div>
  {/if}
  <div class="pixel-nes-progress__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
    <span class="pixel-nes-progress__fill" style="width:{pct}%"></span>
  </div>
</div>
