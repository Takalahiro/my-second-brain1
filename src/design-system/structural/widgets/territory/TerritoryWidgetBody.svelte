<script lang="ts">
  import TerritoryMapCanvas from '../../../../components/graph/TerritoryMapCanvas.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { TerritoryBodyProps } from './territory-types';

  let { ui, data, loadErr, selectedPath, starHud, onSelectPath }: TerritoryBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-territory skin-territory--{skin}">
  <p class="skin-territory__hint">国家 · 州 · 城市 · 孤岛</p>

  <div class="skin-territory__canvas">
    <div class="skin-territory__hud" aria-hidden="true">
      <div class="skin-territory__hud-title">
        {#if skin === 'observatory' || skin === 'spacecraft'}STAR CHART
        {:else if skin === 'terminal' || skin === 'crt'}COORD_SYS
        {:else if skin === 'ink'}星图
        {:else if skin === 'rpg'}REALM MAP
        {:else}INDEX
        {/if}
      </div>
      <div>RA · {starHud.ra}</div>
      <div>DEC · {starHud.dec}</div>
      <div>SEC · {starHud.sector}</div>
      {#if selectedPath}
        <div class="skin-territory__lock">LOCK · {selectedPath}</div>
      {/if}
    </div>

    {#if loadErr}
      <p class="skin-territory__empty">{loadErr}</p>
    {:else if !data}
      <p class="skin-territory__empty">{ui.loading}</p>
    {:else}
      <TerritoryMapCanvas {data} onSelectPath={onSelectPath} />
    {/if}
  </div>
</div>
