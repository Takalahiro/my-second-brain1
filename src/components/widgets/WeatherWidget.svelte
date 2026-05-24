<script lang="ts">
  import { clampPosition, spawnPosition } from '../../lib/floating-widget-layout';
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { getWidgetTier, tierClass, TIER_LABEL } from '../../lib/widget-size-tier';
  import PixelIcon from '../PixelIcon.svelte';
  import { weatherIconName, WIDGET_ICON_MAP, type PixelIconName } from '../../lib/pixel-icons';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

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

  const STATE_KEY  = 'second-brain:weather-state';
  const LAYOUT_KEY = 'second-brain:weather-layout';

  let placeQuery = $state('');
  let placeName  = $state<string | null>(null);
  let lat = $state<number | null>(null);
  let lon = $state<number | null>(null);
  let forecast = $state<Forecast | null>(null);
  let loading = $state(false);
  let err = $state<string | null>(null);
  let showSettings = $state(false);

  let minimized = $state(false);
  let maximized = $state(false);
  let bgAlpha = $state(0.7);
  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(340);
  let height = $state(380);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.placeName === 'string') placeName = s.placeName;
        if (typeof s.lat === 'number') lat = s.lat;
        if (typeof s.lon === 'number') lon = s.lon;
        if (s.forecast) forecast = s.forecast as Forecast;
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 280, 700);
        if (typeof s.h === 'number') height = clamp(s.h, 280, 800);
        rotation = layoutRotation(s);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      const sp = spawnPosition(width, height);
      posX = sp.x;
      posY = sp.y;
    }
    clampPos();

    // 自动刷新：超过 30 分钟则重新拉
    if (lat != null && lon != null && (!forecast || Date.now() - forecast.fetchedAt > 30 * 60_000)) {
      void fetchWeather();
    }
    if (!lat && !lon && !placeName) {
      // 首次：尝试浏览器定位
      void tryGeolocate();
    }

    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);

    // 听 world clock 选城市 → 天气跟着切
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

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('weather:setCity', onSet);
    };
  });

  function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
  function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }
  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ placeName, lat, lon, forecast, minimized, maximized, bgAlpha }));
    } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
      showSettings = false;
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
      () => { loading = false; err = '定位失败，请手动搜索城市'; },
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

  // WMO Weather Code → 图标 + 中文
  function codeInfo(code: number, isDay = 1): { icon: PixelIconName; label: string } {
    if (code === 0) return { icon: weatherIconName(code, isDay), label: '晴' };
    if (code === 1 || code === 2) return { icon: weatherIconName(code, isDay), label: '少云' };
    if (code === 3) return { icon: weatherIconName(code, isDay), label: '多云' };
    if (code >= 45 && code <= 48) return { icon: weatherIconName(code, isDay), label: '雾' };
    if (code >= 51 && code <= 57) return { icon: weatherIconName(code, isDay), label: '毛毛雨' };
    if (code >= 61 && code <= 67) return { icon: weatherIconName(code, isDay), label: '雨' };
    if (code >= 71 && code <= 77) return { icon: weatherIconName(code, isDay), label: '雪' };
    if (code >= 80 && code <= 82) return { icon: weatherIconName(code, isDay), label: '阵雨' };
    if (code === 85 || code === 86) return { icon: weatherIconName(code, isDay), label: '阵雪' };
    if (code === 95) return { icon: weatherIconName(code, isDay), label: '雷阵雨' };
    if (code === 96 || code === 99) return { icon: weatherIconName(code, isDay), label: '雷暴冰雹' };
    return { icon: weatherIconName(code, isDay), label: `代码 ${code}` };
  }
  function weekday(dateStr: string) {
    const d = new Date(dateStr);
    return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  }
  function shortDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  function ageStr() {
    if (!forecast) return '';
    const diff = Date.now() - forecast.fetchedAt;
    if (diff < 60_000) return '刚刚';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    return `${Math.floor(diff / 3600_000)} 小时前`;
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x; posY = y; width = w; height = h; clampPos();
  }
  function doMinimize() { minimized = !minimized; if (minimized) maximized = false; persist(); }
  function doMaximize() { maximized = !maximized; if (maximized) minimized = false; persist(); }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 280, minHeight: 280, maxWidth: 900, maxHeight: 1000 }
    )
  );

  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 300 }));
  const dailyCount = $derived(tier === 'compact' ? 0 : tier === 'medium' ? 3 : 5);
</script>

<section
  bind:this={rootEl}
  class="weather-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="天气"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="ww-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="ww-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.weather} size={14} /></span>
      <span>天气</span>
      <span class="ww-tier">{TIER_LABEL[tier]}</span>
    </div>
    <button
      type="button"
      class="ww-settings-btn"
      onclick={() => (showSettings = !showSettings)}
      aria-label="天气设置"
      title="天气设置"
      data-no-drag
    >⚙</button>
  </header>

  {#if !minimized}
    <div class="ww-body" data-no-drag>
      {#if showSettings}
        <div class="ww-cfg">
          <label class="ww-cfg-label">搜索城市</label>
          <form class="ww-search" onsubmit={(e) => { e.preventDefault(); void searchCity(); }}>
            <input
              type="text"
              placeholder="例如：Shanghai / 悉尼 / Tokyo"
              bind:value={placeQuery}
            />
            <button type="submit" class="ww-search-btn" disabled={loading || !placeQuery.trim()}>搜索</button>
          </form>
          <div class="ww-cfg-row">
            <button type="button" class="ww-secondary" onclick={tryGeolocate} disabled={loading}>使用我的位置</button>
            <button type="button" class="ww-secondary" onclick={fetchWeather} disabled={loading || lat == null}>立即刷新</button>
          </div>
          <label class="ww-alpha-row">
            <span>毛玻璃透明度</span>
            <input type="range" min="0.05" max="0.95" step="0.05"
                   value={bgAlpha}
                   oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
            <span class="ww-alpha-val">{Math.round(bgAlpha * 100)}%</span>
          </label>
          <p class="ww-tip">数据由 Open-Meteo 提供，无需 API Key</p>
        </div>
      {/if}

      {#if err}
        <div class="ww-empty ww-err">{err}</div>
      {/if}

      {#if loading && !forecast}
        <div class="ww-empty">加载中…</div>
      {:else if !forecast}
        <div class="ww-empty">
          点击右上角 ⚙ 设置城市，或允许浏览器定位
        </div>
      {:else}
        {@const ci = codeInfo(forecast.current.weatherCode, forecast.current.isDay)}
        <div class="ww-current">
          <div class="ww-cur-left">
            <div class="ww-place">{forecast.placeName}</div>
            <div class="ww-cur-temp">{forecast.current.temperature.toFixed(1)}<span class="deg">°</span></div>
            <div class="ww-cur-meta">
              <span class="ww-cur-label">{ci.label}</span>
              <span class="ww-cur-wind">风 {forecast.current.windSpeed.toFixed(1)} km/h</span>
            </div>
          </div>
          <div class="ww-cur-icon"><PixelIcon name={ci.icon} size={28} /></div>
        </div>

        <ul class="ww-daily">
          {#each forecast.daily.slice(0, dailyCount) as d, i}
            {@const di = codeInfo(d.code, 1)}
            <li>
              <span class="ww-day-name">{i === 0 ? '今天' : `周${weekday(d.date)}`}</span>
              <span class="ww-day-date">{shortDate(d.date)}</span>
              <span class="ww-day-icon"><PixelIcon name={di.icon} size={18} /></span>
              <span class="ww-day-temp"><strong>{d.tMax.toFixed(0)}°</strong> / {d.tMin.toFixed(0)}°</span>
            </li>
          {/each}
        </ul>

        {#if tier !== 'compact'}
          <footer class="ww-foot">{ageStr()} · {forecast.timezone}</footer>
        {/if}
      {/if}
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={280} minHeight={280}
      maxWidth={900} maxHeight={1000}
      disabled={maximized}
      onResize={onResize}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .weather-widget {
    --w-bg-alpha: 0.7;
    position: fixed;
    z-index: 38;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.36);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow: hidden;
    touch-action: none;
  }
  .weather-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .weather-widget.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.5); }

  .ww-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .weather-widget.is-active-drag .ww-header { cursor: grabbing; }
  .weather-widget.is-maximized .ww-header { cursor: default; }
  .ww-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .ww-settings-btn {
    margin-left: auto;
    width: 26px; height: 26px; border-radius: 8px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f3ecff; cursor: pointer; font-size: 0.85rem;
  }
  .ww-settings-btn:hover { background: rgb(255 255 255 / 0.14); }

  .ww-body {
    flex: 1; min-height: 0; overflow: auto;
    padding: 12px 14px 14px;
    display: flex; flex-direction: column; gap: 12px;
  }

  .ww-cfg {
    display: flex; flex-direction: column; gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.12);
  }
  .ww-cfg-label { color: #c8b9e2; font-size: 0.72rem; }
  .ww-search { display: flex; gap: 6px; }
  .ww-search input {
    flex: 1;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.16);
    border-radius: 8px;
    color: #f3ecff;
    padding: 5px 10px;
    font-size: 0.82rem;
    outline: none;
  }
  .ww-search-btn,
  .ww-secondary {
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #1c0f30;
    border: 1px solid rgb(255 255 255 / 0.4);
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 0.78rem;
  }
  .ww-secondary {
    background: rgb(255 255 255 / 0.08);
    color: #f3ecff;
    border-color: rgb(255 255 255 / 0.14);
  }
  .ww-search-btn:disabled,
  .ww-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
  .ww-cfg-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .ww-alpha-row {
    display: grid;
    grid-template-columns: minmax(80px, 35%) 1fr 42px;
    gap: 8px; align-items: center;
    font-size: 0.72rem; color: #c8b9e2;
  }
  .ww-alpha-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .ww-alpha-row input[type='range']::-webkit-slider-thumb,
  .ww-alpha-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }
  .ww-alpha-val { text-align: right; color: #d6c7ee; font-variant-numeric: tabular-nums; }
  .ww-tip { margin: 0; color: #b6a8d3; font-size: 0.7rem; }

  .ww-empty { color: #b6a8d3; font-size: 0.86rem; padding: 16px; text-align: center; }
  .ww-err { color: #ffb3b3; }

  .ww-current {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 14px;
    align-items: center;
    background: linear-gradient(135deg, rgb(255 208 230 / 0.16), rgb(180 140 255 / 0.16));
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 14px;
    padding: 14px 16px;
  }
  .ww-place { font-size: 0.78rem; color: #d6c7ee; letter-spacing: 0.5px; }
  .ww-cur-temp {
    font-size: 3.2rem;
    line-height: 1;
    font-weight: 700;
    color: #fff8ff;
    text-shadow: 0 0 12px rgb(255 200 240 / 0.4);
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }
  .ww-cur-temp .deg { font-size: 0.6em; vertical-align: top; color: #ffd0e6; }
  .ww-cur-meta {
    display: flex; gap: 10px;
    margin-top: 8px;
    font-size: 0.74rem;
    color: #d6c7ee;
  }
  .ww-cur-label {
    background: rgb(255 255 255 / 0.12);
    border: 1px solid rgb(255 255 255 / 0.14);
    border-radius: 999px;
    padding: 2px 10px;
    color: #fff;
  }
  .ww-cur-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 6px 18px rgb(255 200 240 / 0.4));
  }

  .ww-daily {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: 4px;
  }
  .ww-daily li {
    display: grid;
    grid-template-columns: 52px 50px 36px 1fr;
    gap: 10px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(255 255 255 / 0.06);
    font-size: 0.82rem;
  }
  .ww-day-name { color: #ece4ff; font-weight: 600; }
  .ww-day-date { color: #b6a8d3; font-size: 0.74rem; }
  .ww-day-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .ww-day-temp { text-align: right; color: #d6c7ee; font-variant-numeric: tabular-nums; }
  .ww-day-temp strong { color: #fff5ff; font-weight: 700; margin-right: 4px; }

  .ww-foot {
    margin-top: auto;
    text-align: center;
    color: #aa97cf;
    font-size: 0.7rem;
    padding-top: 6px;
  }

  @media (max-width: 768px) {
    .weather-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 90px) !important;
      width: auto !important; height: 70vh !important;
    }
  }
</style>
