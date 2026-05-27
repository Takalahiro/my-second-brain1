<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { NetworkBodyProps } from './network-types';

  let { ui, snap, loadPct, formatBytes, formatBitrate }: NetworkBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-network skin-network--{skin}">
  <div class="skin-network__banner">
    <span>{ui.saveStationTitle}</span>
    <span>{snap ? ui.monitoring : ui.init}</span>
  </div>

  <div class="skin-network__tanks" aria-hidden="true">
    {#each Array(5) as _, i (i)}
      <span class="skin-network__tank" class:is-full={i / 5 < loadPct}>E</span>
    {/each}
  </div>

  <div class="skin-network__hero">{formatBytes(snap?.sessionBytes ?? 0)}</div>

  <div class="skin-network__row">
    <span class="skin-network__label">{ui.sessionTotal}</span>
    <span class="skin-network__value">{formatBytes(snap?.sessionBytes ?? 0)}</span>
  </div>

  <div class="skin-network__badge">{ui.currentRate} {formatBitrate(snap?.bytesPerSecond ?? 0)}</div>
</div>
