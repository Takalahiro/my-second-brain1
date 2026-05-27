<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelSegmentValue from '../components/PixelSegmentValue.svelte';
  import PixelNesButton from '../components/PixelNesButton.svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
  import { weatherIconName, type PixelIconName } from '../../../lib/pixel-icons';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';
  import { formatWeatherAge, wmoWeatherLabel } from '../lib/weather-labels';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('weather'));

  type Daily = { date: string; tMax: number; tMin: number; code: number };
  type Forecast = {
    placeName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    fetchedAt: number;
    current: { temperature: number; windSpeed: number; weatherCode: number; isDay: 0 | 1 };
    daily: Daily[];
  };

  const STATE_KEY = 'second-brain:weather-state';

  let placeQuery = $state('');
  let placeName = $state<string | null>(null);
  let lat = $state<number | null>(null);
  let lon = $state<number | null>(null);
  let forecast = $state<Forecast | null>(null);
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
        if (s.forecast) forecast = s.forecast as Forecast;
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
        placeName = '当前位置';
        await fetchWeather();
      },
      () => {
        loading = false;
        err = '定位失败，请手动搜索城市';
      },
      { timeout: 8000, maximumAge: 600_000 },
    );
  }

  async function fetchWeather() {
    if (lat == null || lon == null) return;
    loading = true;
    err = null;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const cur = data.current_weather;
      const daily: Daily[] = (data.daily?.time || []).map((t: string, i: number) => ({
        date: t,
        tMax: data.daily.temperature_2m_max[i],
        tMin: data.daily.temperature_2m_min[i],
        code: data.daily.weather_code[i],
      }));
      forecast = {
        placeName: placeName ?? '当前位置',
        latitude: lat,
        longitude: lon,
        timezone: data.timezone,
        fetchedAt: Date.now(),
        current: {
          temperature: cur.temperature,
          windSpeed: cur.windspeed,
          weatherCode: cur.weathercode,
          isDay: cur.is_day ?? 1,
        },
        daily,
      };
      persist();
    } catch (e) {
      err = '获取天气失败：' + (e instanceof Error ? e.message : '');
    } finally {
      loading = false;
    }
  }

  function codeIcon(code: number, isDay = 1): PixelIconName {
    return weatherIconName(code, isDay);
  }

  function weekday(dateStr: string) {
    return ui.weekdayNames[new Date(dateStr).getDay()];
  }

  function shortDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
</script>

<PixelFloatingShell layoutKey="second-brain:weather-layout" {title} defaultW={320} defaultH={480} minH={320} {onClose}>
  {#snippet settings()}
    <p class="pixel-nes-section-label">{ui.searchCity}</p>
    <form class="pixel-nes-search" onsubmit={(e) => { e.preventDefault(); void searchCity(); }}>
      <input type="text" class="pixel-nes-input" placeholder={ui.searchPlaceholder} bind:value={placeQuery} />
      <PixelNesButton label={ui.searchBtn} onclick={searchCity} />
    </form>
    <div class="pixel-nes-widget-toolbar">
      <PixelNesButton label={ui.useLocation} onclick={tryGeolocate} />
      <PixelNesButton label={ui.refresh} onclick={fetchWeather} />
    </div>
    <p class="pixel-nes-footnote">{ui.dataTip}</p>
  {/snippet}

  <div class="pixel-stage-banner">
    <span>{ui.area}</span>
    <span>{forecast?.placeName ?? placeName ?? '—'}</span>
  </div>

  {#if err}
    <p class="pixel-nes-status pixel-nes-status--warn">{err}</p>
  {/if}

  {#if loading && !forecast}
    <span class="pixel-save-blink">{ui.scanning}</span>
  {:else if !forecast}
    <p class="pixel-nes-status">{ui.noDataHint}</p>
  {:else}
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <PixelSegmentValue value={Math.round(forecast.current.temperature)} size="lg" />
      <div>
        <span class="pixel-coin-badge">{ui.debuff}</span>
        <p class="pixel-nes-weather-cond">{condition}</p>
        <p class="pixel-nes-weather-wind">{ui.windSpeed} {forecast.current.windSpeed.toFixed(1)} km/h</p>
      </div>
      <span class="pixel-nes-weather-icon"><PixelIcon name={codeIcon(forecast.current.weatherCode, forecast.current.isDay)} size={24} /></span>
    </div>

    <table class="pixel-element-table">
      <thead>
        <tr>
          {#each elements as el (el.name)}
            <th>{el.name}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <tr>
          {#each elements as el (el.name)}
            <td>
              <div class="pixel-ninja-lifebar">
                {#each Array(5) as _, i (i)}
                  <span class="pixel-ninja-lifebar__seg" data-on={i / 5 < el.val / 100}></span>
                {/each}
              </div>
            </td>
          {/each}
        </tr>
      </tbody>
    </table>

    {#if forecast.daily.length}
      <p class="pixel-nes-section-label">{ui.forecast}</p>
      <ul class="pixel-nes-forecast-list">
        {#each forecast.daily as day, i (day.date)}
          <li class="pixel-nes-forecast-row">
            <span>{i === 0 ? ui.today : i === 1 ? ui.tomorrow : `周${weekday(day.date)}`}</span>
            <span class="pixel-nes-forecast-row__icon"><PixelIcon name={codeIcon(day.code, 1)} size={14} /></span>
            <span>{wmoWeatherLabel(day.code)}</span>
            <span>{shortDate(day.date)}</span>
            <span>{Math.round(day.tMax)}° / {Math.round(day.tMin)}°</span>
          </li>
        {/each}
      </ul>
    {/if}

    <p class="pixel-nes-footnote">{ui.updated} {formatWeatherAge(forecast.fetchedAt)} · {forecast.timezone}</p>
  {/if}
</PixelFloatingShell>
