<script lang="ts">
  import { onMount } from 'svelte';
  import { computeTelemetry } from '../../lib/hud-wallpaper-engine';
  import {
    buildMissionStatusLine,
    formatMissionElapsed,
    jitterSignalBars,
    signalBarsText,
  } from '../../lib/hud-mission-ui';

  let missionStart = $state(0);
  let statusLine = $state('');
  let signalBars = $state<boolean[]>([true, true, true, false, false]);

  onMount(() => {
    missionStart = performance.now();

    const sync = () => {
      const tel = computeTelemetry(new Date(), missionStart);
      signalBars = jitterSignalBars();
      statusLine = buildMissionStatusLine(
        formatMissionElapsed(performance.now() - missionStart),
        signalBarsText(signalBars),
        tel.raLabel,
        tel.decLabel,
      );
    };

    sync();
    const id = window.setInterval(sync, 1000);
    return () => clearInterval(id);
  });
</script>

<div class="hud-mission-status" aria-live="polite">
  <span class="hud-mission-status__signal" aria-hidden="true">
    {#each signalBars as on, i}
      <span class="hud-mission-status__bar" class:is-on={on} style:--i={i}></span>
    {/each}
  </span>
  <span class="hud-mission-status__text">{statusLine}</span>
</div>
