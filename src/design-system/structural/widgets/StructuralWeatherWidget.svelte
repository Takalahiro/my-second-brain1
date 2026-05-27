<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getWeatherBodyComponent } from '../resolveWidgetBody';
  import { formatWeatherAge, wmoWeatherLabel } from '../../pixel/lib/weather-labels';
  import WeatherSettingsPanel from './weather/WeatherSettingsPanel.svelte';
  import type { WeatherDaily, WeatherForecast } from './weather/weather-types';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('weather'));
  const skin = resolveStructuralSkin();
  const WeatherBody = getWeatherBodyComponent(skin);

  const STATE_KEY = 'second-brain:weather-state';

  let placeQuery = $state('');
  let placeName = $state<string | null>(null);
  let lat = $state<number | null>(null);
  let lon = $state<number | null>(null);
  let forecast = $state<WeatherForecast | null>(null);
  let loading = $state(false);
  let err = $state<string | null>(null);

  const condition = $derived(wmoWeatherLabel(forecast?.current.weatherCode ?? 0));

  const elements = $derived.by(() => {
    const code = forecast?.current.weatherCode ?? 0;
    const temp = forecast?.current.temperature ?? 0;
    return [
      { name: ui.heat, val: Math.min(100, Math.max(0, temp)) },
      { name: ui.cold, val: Math.min(100, Math.max(0, 30 - temp)) },
      { name: ui.acid, val: code % 50 },
      { name: ui.elec, val: (code * 7) % 100 },
    ];
  });

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.placeName === 'string') placeName = s.placeName;
        if (typeof s.lat === 'number') lat = s.lat;
        if (typeof s.lon === 'number') lon = s.lon;
        if (s.forecast) forecast = s.forecast as WeatherForecast;
      }
    } catch {
      /* ignore */
    }

    if (lat != null && lon != null && (!forecast || Date.now() - forecast.fetchedAt > 30 * 60_000)) {
      void fetchWeather();
    } else if (!lat && !lon && !placeName) {
      void tryGeolocate();
    }

    const onSet = (e: Event) => {
      const ev = e as CustomEvent<{ name: string; lat: number; lon: number }>;
      const d = ev.detail;
      if (!d || typeof d.lat !== 'number' || typeof d.lon !== 'number') return;
      placeName = d.name;
      lat = d.lat;
      lon = d.lon;
      void fetchWeather();
    };
    window.addEventListener('weather:setCity', onSet);
    return () => window.removeEventListener('weather:setCity', onSet);
  });

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ placeName, lat, lon, forecast }));
    } catch {
      /* ignore */
    }
  }

  async function searchCity() {
    const q = placeQuery.trim();
    if (!q) return;
    loading = true;
    err = null;
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=zh&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('搜索失败 ' + res.status);
      const data = await res.json();
      const hit = data?.results?.[0];
      if (!hit) throw new Error('未找到城市');
      placeName = `${hit.name}${hit.admin1 ? ' · ' + hit.admin1 : ''}${hit.country ? ' · ' + hit.country : ''}`;
      lat = hit.latitude;
      lon = hit.longitude;
      placeQuery = '';
      await fetchWeather();
    } catch (e) {
      err = '搜索失败：' + (e instanceof Error ? e.message : '');
      loading = false;
    }
  }

  async function tryGeolocate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    loading = true;
    err = null;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        placeName = ui.currentLocation;
        await fetchWeather();
      },
      () => {
        loading = false;
      },
      { timeout: 12_000 },
    );
  }

  async function fetchWeather() {
    if (lat == null || lon == null) return;
    loading = true;
    err = null;
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        '&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5';
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const daily: WeatherDaily[] = (data.daily?.time ?? []).map((date: string, i: number) => ({
        date,
        tMax: data.daily.temperature_2m_max[i],
        tMin: data.daily.temperature_2m_min[i],
        code: data.daily.weather_code[i],
      }));
      forecast = {
        placeName: placeName ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        latitude: lat,
        longitude: lon,
        timezone: data.timezone,
        fetchedAt: Date.now(),
        current: {
          temperature: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day,
        },
        daily,
      };
      persist();
    } catch (e) {
      err = '获取失败：' + (e instanceof Error ? e.message : '');
    } finally {
      loading = false;
    }
  }

  function weatherGlyph(code: number, isDay = 1) {
    if (code === 0) return isDay ? '☀' : '🌙';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫';
    if (code <= 67) return '🌧';
    if (code <= 77) return '❄';
    if (code <= 82) return '🌦';
    return '⛈';
  }

  function weekday(dateStr: string) {
    return ui.weekdayNames[new Date(dateStr).getDay()];
  }

  function shortDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
</script>

<SkinFloatingShell layoutKey="weather-layout" {title} defaultW={320} defaultH={480} minH={320} {onClose}>
  {#snippet settings()}
    <WeatherSettingsPanel
      {ui}
      {placeQuery}
      onPlaceQueryChange={(v) => (placeQuery = v)}
      onSearch={searchCity}
      onGeolocate={tryGeolocate}
      onRefresh={fetchWeather}
    />
  {/snippet}

  <WeatherBody
    {ui}
    {placeName}
    {forecast}
    {loading}
    {err}
    {condition}
    {elements}
    wmoLabel={wmoWeatherLabel}
    formatAge={formatWeatherAge}
    {weekday}
    {shortDate}
    {weatherGlyph}
  />
</SkinFloatingShell>
