<script lang="ts">
  import RainGlassOverlay from './RainGlassOverlay.svelte';

  interface Props {
    active?: boolean;
  }

  let { active = true }: Props = $props();
</script>

<RainGlassOverlay {active} size="bar" />
