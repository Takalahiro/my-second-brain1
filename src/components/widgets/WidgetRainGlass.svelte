<script lang="ts">
  import { getContext } from 'svelte';
  import RainGlassOverlay from '../desktop/RainGlassOverlay.svelte';
  import { DESKTOP_ATMOSPHERE_KEY, type DesktopAtmosphereState } from '../../lib/desktop-atmosphere';

  interface Props {
    active?: boolean;
  }

  let { active }: Props = $props();

  const atmosphere = getContext<DesktopAtmosphereState | undefined>(DESKTOP_ATMOSPHERE_KEY);
  const showRain = $derived(active ?? atmosphere?.rainDrops ?? false);
</script>

<RainGlassOverlay active={showRain} size="widget" />
