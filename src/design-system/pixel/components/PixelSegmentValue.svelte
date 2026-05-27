<script lang="ts">
  interface Props {
    value: string | number;
    size?: 'md' | 'lg' | 'xl';
  }
  let { value, size = 'md' }: Props = $props();
  const chars = $derived(String(value).split(''));
</script>

<span class="pixel-segment-row" role="status">
  {#each chars as ch, i (i)}
    <span
      class="pixel-segment-digit"
      class:pixel-segment-digit--lg={size === 'lg'}
      class:pixel-segment-digit--xl={size === 'xl'}
    >{ch === ' ' ? '\u00a0' : ch}</span
    >
  {/each}
</span>
