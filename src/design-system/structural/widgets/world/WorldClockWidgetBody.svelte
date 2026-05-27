<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { WorldClockBodyProps } from './world-types';

  let { ui, slots, active, formatTime, formatDate, tzOffset, onPick }: WorldClockBodyProps = $props();
  const skin = resolveStructuralSkin();
  const activeCity = $derived(slots[active]);
</script>

<div class="skin-world skin-world--{skin}">
  <p class="skin-world__label">{ui.selectCity}</p>
  <div class="skin-world__grid">
    {#each slots as s, i (s.id)}
      <button type="button" class="skin-world__slot" class:is-ready={s.ready} onclick={() => onPick(i)}>
        <span class="skin-world__name">{s.name}</span>
        <span class="skin-world__flag">{s.flag}</span>
        <span class="skin-world__time">{formatTime(s.tz)}</span>
        <span class="skin-world__state">{s.ready ? ui.readyState : ui.waiting}</span>
        <span class="skin-world__meta">{s.code} · {tzOffset(s.tz)}</span>
      </button>
    {/each}
  </div>

  {#if activeCity}
    <div class="skin-world__detail">
      <p class="skin-world__detail-label">{ui.localTime}</p>
      <p class="skin-world__detail-time">{formatTime(activeCity.tz)}</p>
      <p class="skin-world__detail-date">{formatDate(activeCity.tz)} · {activeCity.name}</p>
    </div>
  {/if}
</div>
