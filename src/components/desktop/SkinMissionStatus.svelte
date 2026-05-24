<script lang="ts">
  import { onMount } from 'svelte';
  import { buildSkinStatusLine } from '../../lib/skin-status-ui';
  import { jitterSignalBars } from '../../lib/hud-mission-ui';
  import type { UiSkinId } from '../../features/ui/types';

  interface Props {
    skin: UiSkinId;
  }

  let { skin }: Props = $props();

  let missionStart = $state(0);
  let statusLine = $state('');
  let signalBars = $state<boolean[]>([true, true, true, false, false]);

  onMount(() => {
    missionStart = performance.now();

    const sync = () => {
      signalBars = jitterSignalBars();
      statusLine = buildSkinStatusLine(skin, performance.now(), missionStart);
    };

    sync();
    const id = window.setInterval(sync, 1000);
    return () => clearInterval(id);
  });

  $effect(() => {
    skin;
    if (missionStart) {
      statusLine = buildSkinStatusLine(skin, performance.now(), missionStart);
    }
  });
</script>

<div class="skin-mission-status hud-mission-status" data-skin={skin} aria-live="polite">
  <span class="hud-mission-status__signal skin-mission-status__signal" aria-hidden="true">
    {#each signalBars as on, i}
      <span class="hud-mission-status__bar" class:is-on={on} style:--i={i}></span>
    {/each}
  </span>
  <span class="hud-mission-status__text skin-mission-status__text">{statusLine}</span>
</div>
