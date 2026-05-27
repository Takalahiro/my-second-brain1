<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import { STRUCTURAL_EMPTY_STATE } from '../../lib/structural-copy';
  import type { WeatherBodyProps } from './weather-types';

  let {
    ui,
    placeName,
    forecast,
    loading,
    err,
    condition,
    elements,
    wmoLabel,
    formatAge,
    weekday,
    shortDate,
    weatherGlyph,
  }: WeatherBodyProps = $props();

  const skin = resolveStructuralSkin();
  const empty = $derived(STRUCTURAL_EMPTY_STATE[skin]);
</script>

<div class="skin-weather skin-weather--{skin}">
  <header class="skin-weather__banner">
    <span>{ui.area}</span>
    <span>{forecast?.placeName ?? placeName ?? '—'}</span>
  </header>

  {#if err}
    <p class="skin-weather__err">{err}</p>
  {/if}

  {#if loading && !forecast}
    <p class="skin-weather__scan">{ui.scanning}</p>
  {:else if !forecast}
    <p class="skin-weather__empty">{empty || ui.noDataHint}</p>
  {:else}
    <div class="skin-weather__now">
      <span class="skin-weather__temp">{Math.round(forecast.current.temperature)}°</span>
      <div class="skin-weather__cond">
        <span class="skin-weather__badge">{ui.debuff}</span>
        <p>{condition}</p>
        <p class="skin-weather__wind">{ui.windSpeed} {forecast.current.windSpeed.toFixed(1)} km/h</p>
      </div>
      <span class="skin-weather__glyph" aria-hidden="true">{weatherGlyph(forecast.current.weatherCode, forecast.current.isDay)}</span>
    </div>

    <div class="skin-weather__elements" role="table" aria-label="elements">
      <div class="skin-weather__elements-head" role="row">
        {#each elements as el (el.name)}
          <span role="columnheader">{el.name}</span>
        {/each}
      </div>
      <div class="skin-weather__elements-row" role="row">
        {#each elements as el (el.name)}
          <div class="skin-weather__gauge" role="cell">
            {#each Array(8) as _, i}
              <span class="skin-weather__gauge-seg" class:is-on={i / 8 < el.val / 100}></span>
            {/each}
            {#if skin === 'spacecraft'}
              <span class="skin-weather__gauge-readout">{Math.round(el.val)}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    {#if forecast.daily.length}
      <p class="skin-weather__section">{ui.forecast}</p>
      <ul class="skin-weather__forecast">
        {#each forecast.daily as day, i (day.date)}
          <li>
            <span>{i === 0 ? ui.today : i === 1 ? ui.tomorrow : weekday(day.date)}</span>
            <span class="skin-weather__glyph-sm">{weatherGlyph(day.code, 1)}</span>
            <span>{wmoLabel(day.code)}</span>
            <span>{shortDate(day.date)}</span>
            <span>{Math.round(day.tMax)}° / {Math.round(day.tMin)}°</span>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="skin-weather__foot">{ui.updated} {formatAge(forecast.fetchedAt)} · {forecast.timezone}</p>
  {/if}
</div>
