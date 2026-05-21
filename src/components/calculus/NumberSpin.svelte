<script lang="ts">
  interface Props {
    value?: number;
    step?: number;
    min?: number;
    max?: number;
    label?: string;
    onchange?: (v: number) => void;
  }
  let {
    value = $bindable(0),
    step = 0.5,
    min = -99,
    max = 99,
    label = '',
    onchange,
  }: Props = $props();

  function clamp(v: number) {
    return Math.max(min, Math.min(max, v));
  }
  function inc(d: number) {
    value = clamp(Math.round((value + d) * 1000) / 1000);
    onchange?.(value);
  }
</script>

<div class="nspin">
  {#if label}<span class="nspin-lbl">{label}</span>{/if}
  <div class="nspin-ctrl">
    <button type="button" aria-label="减" onclick={() => inc(-step)}>−</button>
    <input type="number" bind:value {step} />
    <button type="button" aria-label="加" onclick={() => inc(step)}>+</button>
  </div>
</div>

<style>
  .nspin { display: flex; flex-direction: column; gap: 4px; }
  .nspin-lbl { font-size: 0.72rem; color: var(--text-secondary); }
  .nspin-ctrl { display: flex; align-items: center; gap: 4px; }
  .nspin-ctrl button {
    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-primary); color: inherit; font-size: 1rem; cursor: pointer;
  }
  .nspin-ctrl input {
    flex: 1; min-width: 0; padding: 6px; text-align: center; border-radius: 8px;
    border: 1px solid var(--border-color); background: var(--code-bg); color: inherit;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.88rem;
  }
</style>
