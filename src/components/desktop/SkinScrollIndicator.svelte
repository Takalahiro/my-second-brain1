<script lang="ts">
  import HudScrollIndicator from './HudScrollIndicator.svelte';
  import { getSkinChrome } from '../../features/ui/skin-chrome';
  import type { UiSkinId } from '../../features/ui/types';

  interface Props {
    skin: UiSkinId;
  }

  let { skin }: Props = $props();
  const profile = $derived(getSkinChrome(skin));
</script>

<div class="skin-scroll-wrap" data-skin={skin}>
  <HudScrollIndicator
    topLabel={profile.scrollTopLabel}
    bottomLabel={profile.scrollBottomLabel}
    valuePrefix={profile.scrollValuePrefix}
  />
</div>
