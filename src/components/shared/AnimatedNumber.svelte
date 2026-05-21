<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  interface Props {
    value?: number;
    duration?: number;
    decimals?: number;
    class?: string;
  }
  let {
    value = 0,
    duration = 400,
    decimals = 0,
    class: className = '',
  }: Props = $props();

  const tween = tweened(value, { duration, easing: cubicOut });

  $effect(() => {
    void tween.set(value);
  });

  const shown = $derived(
    decimals > 0 ? $tween.toFixed(decimals) : String(Math.round($tween))
  );
</script>

<span class="anim-num {className}">{shown}</span>

<style>
  .anim-num {
    display: inline-block;
    font-variant-numeric: tabular-nums;
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>
