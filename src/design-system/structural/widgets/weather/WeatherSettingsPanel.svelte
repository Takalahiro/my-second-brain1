<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { WeatherSettingsProps } from './weather-types';

  let { ui, placeQuery, onPlaceQueryChange, onSearch, onGeolocate, onRefresh }: WeatherSettingsProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-weather-settings skin-weather-settings--{skin}">
  <p class="skin-weather-settings__label">{ui.searchCity}</p>
  <form class="skin-weather-settings__form" onsubmit={(e) => { e.preventDefault(); onSearch(); }}>
    <input
      type="text"
      class="skin-weather-settings__input"
      placeholder={ui.searchPlaceholder}
      value={placeQuery}
      oninput={(e) => onPlaceQueryChange((e.currentTarget as HTMLInputElement).value)}
    />
    <button type="submit" class="skin-weather-settings__btn">{ui.searchBtn}</button>
  </form>
  <div class="skin-weather-settings__toolbar">
    <button type="button" class="skin-weather-settings__btn" onclick={onGeolocate}>{ui.useLocation}</button>
    <button type="button" class="skin-weather-settings__btn" onclick={onRefresh}>{ui.refresh}</button>
  </div>
  <p class="skin-weather-settings__hint">{ui.dataTip}</p>
</div>
