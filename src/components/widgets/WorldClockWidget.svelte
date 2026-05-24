<script lang="ts">
  import { clampPosition, spawnPosition } from '../../lib/floating-widget-layout';
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import PixelIcon from '../PixelIcon.svelte';
  import { WIDGET_ICON_MAP } from '../../lib/pixel-icons';
  import { getWidgetTier, tierClass } from '../../lib/widget-size-tier';

  interface Props {
    onClose?: () => void;
  }
  let { onClose }: Props = $props();

  type City = {
    id: string;
    name: string;     // 中文名
    code: string;     // 三字代码
    tz: string;       // IANA 时区
    lat: number;
    lon: number;
    x: number;        // 0..100 viewBox 经度位置
    y: number;        // 0..50  viewBox 纬度位置
  };

  // 主要城市在简化地图上的坐标 (viewBox 0 0 100 50)
  // x = (lon + 180) / 360 * 100；y 用类 Mercator 投影到 0..50，手调过避免重叠
  const cities: City[] = [
    { id: 'la',  name: '洛杉矶',    code: 'LAX', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24, x: 15, y: 22 },
    { id: 'ny',  name: '纽约',      code: 'NYC', tz: 'America/New_York',    lat: 40.71, lon: -74.00,  x: 27, y: 19 },
    { id: 'mex', name: '墨西哥城',  code: 'MEX', tz: 'America/Mexico_City', lat: 19.43, lon: -99.13,  x: 20, y: 27 },
    { id: 'sao', name: '圣保罗',    code: 'GRU', tz: 'America/Sao_Paulo',   lat: -23.55, lon: -46.63, x: 34, y: 36 },
    { id: 'ldn', name: '伦敦',      code: 'LDN', tz: 'Europe/London',       lat: 51.51, lon: -0.13,   x: 46, y: 14 },
    { id: 'par', name: '巴黎',      code: 'CDG', tz: 'Europe/Paris',        lat: 48.86, lon: 2.35,    x: 51, y: 17 },
    { id: 'mos', name: '莫斯科',    code: 'MOW', tz: 'Europe/Moscow',       lat: 55.75, lon: 37.62,   x: 60, y: 11 },
    { id: 'cai', name: '开罗',      code: 'CAI', tz: 'Africa/Cairo',        lat: 30.04, lon: 31.24,   x: 57, y: 23 },
    { id: 'jhb', name: '约翰内斯堡',code: 'JNB', tz: 'Africa/Johannesburg', lat: -26.20, lon: 28.04,  x: 56, y: 38 },
    { id: 'dxb', name: '迪拜',      code: 'DXB', tz: 'Asia/Dubai',          lat: 25.20, lon: 55.27,   x: 64, y: 24 },
    { id: 'bom', name: '孟买',      code: 'BOM', tz: 'Asia/Kolkata',        lat: 19.08, lon: 72.88,   x: 70, y: 28 },
    { id: 'bj',  name: '北京',      code: 'BJS', tz: 'Asia/Shanghai',       lat: 39.90, lon: 116.41,  x: 80, y: 18 },
    { id: 'sh',  name: '上海',      code: 'PVG', tz: 'Asia/Shanghai',       lat: 31.23, lon: 121.47,  x: 83, y: 23 },
    { id: 'tyo', name: '东京',      code: 'TYO', tz: 'Asia/Tokyo',          lat: 35.68, lon: 139.69,  x: 89, y: 20 },
    { id: 'hk',  name: '香港',      code: 'HKG', tz: 'Asia/Hong_Kong',      lat: 22.32, lon: 114.17,  x: 79, y: 27 },
    { id: 'sg',  name: '新加坡',    code: 'SGN', tz: 'Asia/Singapore',      lat: 1.35,  lon: 103.81,  x: 76, y: 32 },
    { id: 'syd', name: '悉尼',      code: 'SYD', tz: 'Australia/Sydney',    lat: -33.86, lon: 151.21, x: 90, y: 40 },
  ];

  const STATE_KEY  = 'second-brain:world-state';
  const LAYOUT_KEY = 'second-brain:world-layout';

  let selectedId = $state<string>('sh');
  let now = $state(new Date());
  let bgAlpha = $state(0.72);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(640);
  let height = $state(440);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  let minimized = $state(false);
  let maximized = $state(false);

  let tick: number | null = null;

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.selectedId === 'string' && cities.find((c) => c.id === s.selectedId)) selectedId = s.selectedId;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        if (typeof s.w === 'number') width = clamp(s.w, 380, 1100);
        if (typeof s.h === 'number') height = clamp(s.h, 320, 900);
        rotation = layoutRotation(s);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      const sp = spawnPosition(width, height);
      posX = sp.x;
      posY = sp.y;
    }
    clampPos();
    tick = window.setInterval(() => { now = new Date(); }, 1000);
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => {
      if (tick != null) clearInterval(tick);
      window.removeEventListener('resize', onResize);
    };
  });

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
  function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }
  function persist() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ selectedId, bgAlpha, minimized, maximized })); } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function formatTime(d: Date, tz: string) {
    try {
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d);
    } catch {
      return d.toLocaleTimeString('zh-CN', { hour12: false });
    }
  }
  function formatDate(d: Date, tz: string) {
    try {
      const parts = new Intl.DateTimeFormat('zh-CN', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      }).formatToParts(d);
      const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
      return `${get('year')}/${get('month')}/${get('day')} · ${get('weekday')}`;
    } catch {
      return d.toLocaleDateString('zh-CN');
    }
  }
  function tzOffset(tz: string) {
    try {
      const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' });
      const part = fmt.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value || '';
      return part.replace('GMT', 'UTC');
    } catch { return ''; }
  }

  const selectedCity = $derived<City>(cities.find((c) => c.id === selectedId) ?? cities[0]);

  function pickCity(c: City) {
    selectedId = c.id;
    persist();
    // 同步派发：主时钟跟随时区 + 天气跟随城市
    try {
      window.dispatchEvent(new CustomEvent('clock:setTimezone', {
        detail: { tz: c.tz, label: `${c.name} ${c.code}` },
      }));
      window.dispatchEvent(new CustomEvent('weather:setCity', {
        detail: { name: c.name, lat: c.lat, lon: c.lon },
      }));
    } catch {}
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
      { minWidth: 380, minHeight: 320, maxWidth: 1100, maxHeight: 900 }
    )
  );
  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 380, expandedMin: 560 }));
</script>

<section
  bind:this={rootEl}
  class="world-widget {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''} {minimized ? 'is-minimized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha: ${bgAlpha};`)}
  aria-label="世界时钟"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="ww-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome onClose={() => onClose?.()} onMinimize={doMinimize} onMaximize={doMaximize} maximized={maximized} />
    <div class="ww-title">
      <span aria-hidden="true"><PixelIcon name={WIDGET_ICON_MAP.world} size={14} /></span>
      <span>世界时钟</span>
    </div>
    <span class="ww-sub" data-no-drag>{cities.length} 个时区 · 点击地图切换</span>
  </header>

  {#if !minimized}
    <div class="ww-body" data-no-drag>
      <!-- 主城市大显 -->
      <section class="ww-main">
        <div class="ww-main-left">
          <div class="ww-place">{selectedCity.name} <span class="ww-place-code">{selectedCity.code}</span></div>
          <div class="ww-main-time">{formatTime(now, selectedCity.tz)}</div>
          <div class="ww-main-date">{formatDate(now, selectedCity.tz)}</div>
          <div class="ww-main-offset">{tzOffset(selectedCity.tz)} · {selectedCity.tz}</div>
        </div>
        <div class="ww-main-right">
          <div class="ww-coord">
            <span class="ww-coord-lbl">经度</span>
            <span class="ww-coord-val">{selectedCity.lon >= 0 ? '+' : ''}{selectedCity.lon.toFixed(2)}°</span>
          </div>
          <div class="ww-coord">
            <span class="ww-coord-lbl">纬度</span>
            <span class="ww-coord-val">{selectedCity.lat >= 0 ? '+' : ''}{selectedCity.lat.toFixed(2)}°</span>
          </div>
        </div>
      </section>

      <!-- 世界地图 -->
      <section class="ww-map-card">
        <svg class="ww-map" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" role="img" aria-label="世界地图">
          <defs>
            <radialGradient id="ww-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffd0e6" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#ffd0e6" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="ww-glow-sel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff8ff" stop-opacity="1" />
              <stop offset="100%" stop-color="#b48cff" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="ww-land-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgb(180 140 255 / 0.28)" />
              <stop offset="100%" stop-color="rgb(124 92 200 / 0.18)" />
            </linearGradient>
          </defs>

          <!-- 经纬线（赤道 + 主要经度/纬度） -->
          <g class="ww-graticule" fill="none" stroke="rgb(255 255 255 / 0.06)" stroke-width="0.12">
            <!-- 纬度线：-60, -30, 0(赤道), 30, 60 -->
            <line x1="0" y1="8.33"  x2="100" y2="8.33"  />
            <line x1="0" y1="16.67" x2="100" y2="16.67" />
            <line x1="0" y1="25"    x2="100" y2="25"    stroke="rgb(255 200 240 / 0.15)" stroke-dasharray="0.6 0.6" />
            <line x1="0" y1="33.33" x2="100" y2="33.33" />
            <line x1="0" y1="41.67" x2="100" y2="41.67" />
            <!-- 经度线：每 30° -->
            <line x1="8.33"  y1="0" x2="8.33"  y2="50" />
            <line x1="16.67" y1="0" x2="16.67" y2="50" />
            <line x1="25"    y1="0" x2="25"    y2="50" />
            <line x1="33.33" y1="0" x2="33.33" y2="50" />
            <line x1="41.67" y1="0" x2="41.67" y2="50" />
            <line x1="50"    y1="0" x2="50"    y2="50" stroke="rgb(255 200 240 / 0.15)" stroke-dasharray="0.6 0.6" />
            <line x1="58.33" y1="0" x2="58.33" y2="50" />
            <line x1="66.67" y1="0" x2="66.67" y2="50" />
            <line x1="75"    y1="0" x2="75"    y2="50" />
            <line x1="83.33" y1="0" x2="83.33" y2="50" />
            <line x1="91.67" y1="0" x2="91.67" y2="50" />
          </g>

          <!-- 大陆轮廓（精细化低多边形） -->
          <g class="ww-land" fill="url(#ww-land-grad)" stroke="rgb(200 170 255 / 0.55)" stroke-width="0.16" stroke-linejoin="round">
            <!-- 阿拉斯加 -->
            <path d="M3,11 L6,9 L9,9 L11,11 L10,13 L7,13 L4,12 Z" />
            <!-- 北美主体（含五大湖凹缺） -->
            <path d="M5,14 L9,12 L13,11 L17,10 L21,10 L25,11 L27,13 L28,16 L26,17 L24,16 L23,18 L25,19 L27,20 L28,22 L27,24 L25,25 L23,25 L21,27 L19,28 L17,28 L15,27 L13,25 L11,23 L9,21 L7,18 L5,16 Z" />
            <!-- 格陵兰 -->
            <path d="M30,5 L34,4 L37,5 L38,8 L36,10 L33,10 L31,8 Z" />
            <!-- 中美洲细颈 -->
            <path d="M17,28 L19,29 L20,31 L22,32 L21,33 L19,32 L17,30 Z" />
            <!-- 加勒比群岛 -->
            <path d="M24,25 L26,25 L26,26 L25,26 Z" />
            <path d="M27,26 L28,26 L28,27 L27,27 Z" />
            <!-- 南美 -->
            <path d="M22,28 L25,27 L28,28 L30,30 L32,32 L33,35 L32,38 L30,41 L27,43 L25,43 L23,41 L22,38 L21,34 L20,30 Z" />
            <!-- 冰岛 -->
            <path d="M41,8 L43,7 L44,9 L42,10 Z" />
            <!-- 不列颠群岛 -->
            <path d="M44,12 L45,11 L46,12 L47,14 L45,15 L44,13 Z" />
            <path d="M46,13 L47,13 L47,14 L46,14 Z" />
            <!-- 斯堪的纳维亚 -->
            <path d="M50,7 L53,5 L55,7 L56,9 L54,11 L52,11 L51,9 Z" />
            <!-- 欧洲主体 -->
            <path d="M44,15 L47,14 L50,14 L53,14 L55,15 L56,17 L55,19 L53,20 L50,20 L47,20 L45,19 L44,17 Z" />
            <!-- 伊比利亚 -->
            <path d="M44,18 L46,19 L46,21 L44,21 L43,19 Z" />
            <!-- 意大利 -->
            <path d="M50,18 L51,19 L52,21 L51,22 L50,20 Z" />
            <!-- 巴尔干 -->
            <path d="M52,18 L54,18 L54,20 L52,20 Z" />
            <!-- 非洲主体 -->
            <path d="M46,20 L50,20 L53,21 L56,22 L59,24 L60,27 L60,30 L59,33 L57,36 L54,39 L51,41 L48,40 L46,37 L45,33 L45,28 L46,24 Z" />
            <!-- 索马里之角 -->
            <path d="M60,26 L62,26 L63,28 L62,29 L60,28 Z" />
            <!-- 马达加斯加 -->
            <path d="M62,34 L63,34 L64,37 L63,40 L62,38 Z" />
            <!-- 阿拉伯半岛 -->
            <path d="M58,21 L62,21 L64,23 L65,25 L64,27 L62,28 L60,27 L58,25 L57,23 Z" />
            <!-- 亚洲主体（俄罗斯+中国+蒙古） -->
            <path d="M55,8 L60,7 L66,6 L72,6 L78,7 L84,8 L89,10 L91,12 L92,15 L91,17 L88,19 L84,19 L81,20 L78,21 L75,21 L72,20 L69,19 L66,18 L63,17 L60,15 L57,13 L55,11 Z" />
            <!-- 中国南/中南半岛 -->
            <path d="M73,21 L76,22 L78,24 L79,26 L78,28 L75,28 L73,26 L72,23 Z" />
            <!-- 印度半岛 -->
            <path d="M65,21 L68,21 L70,22 L70,25 L69,27 L67,28 L65,26 L64,23 Z" />
            <!-- 朝鲜半岛 -->
            <path d="M84,17 L85,17 L86,19 L86,20 L85,21 L84,19 Z" />
            <!-- 日本本州+北海道 -->
            <path d="M86,15 L88,14 L90,15 L91,17 L89,18 L87,17 Z" />
            <path d="M89,18 L91,18 L92,20 L90,21 L88,20 Z" />
            <!-- 台湾 -->
            <path d="M83,22 L84,22 L84,23 L83,23 Z" />
            <!-- 菲律宾 -->
            <path d="M83,24 L85,24 L86,27 L84,28 L82,26 Z" />
            <!-- 苏门答腊 -->
            <path d="M74,28 L76,28 L78,31 L76,32 L73,30 Z" />
            <!-- 婆罗洲 -->
            <path d="M78,29 L81,29 L82,31 L80,32 L78,31 Z" />
            <!-- 爪哇 -->
            <path d="M77,32 L82,32 L82,33 L77,33 Z" />
            <!-- 苏拉威西 -->
            <path d="M82,30 L83,30 L84,32 L83,33 L82,32 Z" />
            <!-- 新几内亚 -->
            <path d="M85,32 L89,32 L91,34 L88,35 L85,34 Z" />
            <!-- 澳洲大陆 -->
            <path d="M80,36 L83,35 L86,35 L89,35 L92,36 L93,38 L92,40 L89,41 L86,41 L83,41 L80,40 L79,38 Z" />
            <!-- 塔斯马尼亚 -->
            <path d="M86,43 L88,43 L87,45 Z" />
            <!-- 新西兰北岛 -->
            <path d="M93,41 L94,41 L95,43 L93,43 Z" />
            <!-- 新西兰南岛 -->
            <path d="M94,44 L95,44 L96,46 L94,46 Z" />
          </g>

          <!-- 南极洲薄条 -->
          <path d="M0,47 L6,46 L14,47 L22,46 L30,47 L40,46 L50,47 L60,46 L70,47 L80,46 L90,47 L100,47 L100,50 L0,50 Z"
                fill="rgb(180 140 255 / 0.1)" stroke="rgb(200 170 255 / 0.25)" stroke-width="0.12" />

          <!-- 装饰星点 -->
          <g class="ww-grid">
            {#each Array.from({ length: 9 }, (_, i) => i) as i}
              {#each Array.from({ length: 18 }, (_, j) => j) as j}
                <circle cx={2 + j * 5.6} cy={3 + i * 5.2} r="0.13" fill="rgb(255 255 255 / 0.05)" />
              {/each}
            {/each}
          </g>

          <!-- 城市点（不再有黄白 focus 框） -->
          {#each cities as c (c.id)}
            {@const isSel = c.id === selectedId}
            <g class="ww-pin {isSel ? 'is-sel' : ''}" tabindex="0" role="button" aria-label={c.name}
               onclick={() => pickCity(c)}
               onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCity(c); } }}
            >
              {#if isSel}
                <circle cx={c.x} cy={c.y} r="4.2" fill="url(#ww-glow-sel)" class="ww-pin-halo" />
              {/if}
              <circle cx={c.x} cy={c.y} r={isSel ? 1.4 : 0.85}
                      fill={isSel ? '#fff8ff' : '#ffd0e6'} />
              {#if isSel}
                <text x={c.x} y={c.y - 3.6} text-anchor="middle" class="ww-pin-label" fill="#fff8ff" font-size="2.2">{c.name}</text>
              {/if}
            </g>
          {/each}
        </svg>
      </section>

      <!-- 城市列表 -->
      <section class="ww-list">
        <header class="ww-list-head">
          <span>城市时区</span>
          <label class="ww-alpha" data-no-drag>
            <span>透明</span>
            <input type="range" min="0.05" max="0.95" step="0.05"
                   value={bgAlpha}
                   oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }} />
            <span class="ww-alpha-val">{Math.round(bgAlpha * 100)}%</span>
          </label>
        </header>
        <ul>
          {#each cities as c}
            <li>
              <button type="button" class="ww-item {c.id === selectedId ? 'is-active' : ''}" onclick={() => pickCity(c)}>
                <span class="ww-it-code">{c.code}</span>
                <span class="ww-it-name">{c.name}</span>
                <span class="ww-it-time">{formatTime(now, c.tz)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={380} minHeight={320}
      maxWidth={1100} maxHeight={900}
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
  .world-widget {
    --w-bg-alpha: 0.72;
    position: fixed;
    z-index: 39;
    display: flex;
    flex-direction: column;
    border-radius: 18px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.42);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    overflow: hidden;
    touch-action: none;
  }
  .world-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .world-widget.is-active-drag { user-select: none; box-shadow: 0 24px 48px rgb(0 0 0 / 0.55); }

  .ww-header {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    background: rgb(0 0 0 / 0.18);
    cursor: grab;
  }
  .world-widget.is-active-drag .ww-header { cursor: grabbing; }
  .world-widget.is-maximized .ww-header { cursor: default; }
  .ww-title {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; letter-spacing: 1px; font-weight: 600;
    color: rgb(255 255 255 / 0.78);
  }
  .ww-sub { margin-left: auto; font-size: 0.7rem; color: #b6a8d3; }

  .ww-body {
    flex: 1; min-height: 0; overflow: auto;
    padding: 12px 14px 14px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .ww-body {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      grid-template-areas:
        'main main'
        'map  list';
    }
    .ww-main { grid-area: main; }
    .ww-map-card { grid-area: map; }
    .ww-list { grid-area: list; }
  }

  /* main 显示 */
  .ww-main {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 14px;
    align-items: center;
    padding: 12px 16px;
    border-radius: 14px;
    background: linear-gradient(135deg, rgb(255 208 230 / 0.16), rgb(180 140 255 / 0.16));
    border: 1px solid rgb(255 255 255 / 0.14);
  }
  .ww-place { font-size: 0.82rem; color: #d6c7ee; letter-spacing: 0.5px; }
  .ww-place-code {
    background: rgb(255 255 255 / 0.14);
    border: 1px solid rgb(255 255 255 / 0.2);
    border-radius: 6px;
    padding: 1px 7px;
    margin-left: 6px;
    font-size: 0.7rem;
    color: #fff;
  }
  .ww-main-time {
    font-size: clamp(1.8rem, 5vw, 3.4rem);
    font-weight: 700;
    color: #fff8ff;
    text-shadow: 0 0 12px rgb(255 200 240 / 0.4);
    font-variant-numeric: tabular-nums;
    line-height: 1.02;
    margin-top: 2px;
  }
  .ww-main-date { color: #d6c7ee; font-size: 0.78rem; margin-top: 6px; }
  .ww-main-offset { color: #b6a8d3; font-size: 0.7rem; margin-top: 2px; letter-spacing: 0.5px; }
  .ww-main-right {
    display: flex; flex-direction: column; gap: 6px;
    background: rgb(255 255 255 / 0.06);
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 12px;
    padding: 8px 12px;
  }
  .ww-coord { display: flex; justify-content: space-between; gap: 12px; font-size: 0.74rem; }
  .ww-coord-lbl { color: #c2b3df; }
  .ww-coord-val { color: #fff; font-variant-numeric: tabular-nums; }

  /* 地图 */
  .ww-map-card {
    background: linear-gradient(180deg, rgb(40 28 64 / 0.5), rgb(20 14 36 / 0.5));
    border: 1px solid rgb(255 255 255 / 0.08);
    border-radius: 14px;
    padding: 10px;
  }
  .ww-map { width: 100%; height: 100%; display: block; }
  .ww-pin { cursor: pointer; outline: none; }
  /* 去掉所有黄/白/蓝默认 focus 框；改用点本身的描边作为 focus 提示 */
  .ww-pin:focus,
  .ww-pin:focus-visible,
  .ww-pin:active { outline: none; }
  .ww-pin:focus-visible circle:last-of-type {
    stroke: rgb(255 255 255 / 0.85);
    stroke-width: 0.35;
    paint-order: stroke;
  }
  .ww-pin circle { transition: r 0.2s ease, fill 0.2s ease; }
  .ww-pin:hover circle:last-of-type { r: 1.4; fill: #ffffff; }
  /* 只让选中点的光晕缓慢呼吸，其它点保持静止 */
  .ww-pin-halo {
    transform-origin: center;
    transform-box: fill-box;
    animation: pin-halo 3s ease-in-out infinite;
  }
  @keyframes pin-halo {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50%      { opacity: 1;    transform: scale(1.18); }
  }
  .ww-pin-label {
    paint-order: stroke;
    stroke: rgb(20 12 32 / 0.85);
    stroke-width: 0.6;
    font-weight: 600;
    pointer-events: none;
  }

  /* 列表 */
  .ww-list {
    background: rgb(0 0 0 / 0.22);
    border: 1px solid rgb(255 255 255 / 0.08);
    border-radius: 14px;
    padding: 8px 8px 4px;
    display: flex; flex-direction: column;
    min-height: 0;
  }
  .ww-list-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 4px 8px 6px;
    font-size: 0.72rem; color: #c2b3df;
  }
  .ww-alpha {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.66rem; color: #b6a8d3;
  }
  .ww-alpha input { width: 80px; appearance: none; -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgb(255 255 255 / 0.16); outline: none; }
  .ww-alpha input::-webkit-slider-thumb,
  .ww-alpha input::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 10px; height: 10px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }
  .ww-alpha-val { font-variant-numeric: tabular-nums; }

  .ww-list ul {
    list-style: none; margin: 0; padding: 0;
    overflow-y: auto;
    flex: 1;
  }
  .ww-item {
    width: 100%; background: transparent; border: 0; color: #efe6ff;
    padding: 5px 8px; border-radius: 8px; cursor: pointer;
    display: grid; grid-template-columns: 36px 1fr auto;
    gap: 8px; align-items: center; font-size: 0.78rem;
    text-align: left;
  }
  .ww-item:hover { background: rgb(255 255 255 / 0.08); }
  .ww-item.is-active { background: rgb(124 92 200 / 0.32); color: #fff; }
  .ww-it-code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.7rem; color: #b6a8d3; }
  .ww-item.is-active .ww-it-code { color: #fff; }
  .ww-it-time { font-variant-numeric: tabular-nums; color: #fff; }

  @media (max-width: 768px) {
    .world-widget:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: max(env(safe-area-inset-top, 0px), 70px) !important;
      width: auto !important; height: 70vh !important;
    }
    .ww-main { grid-template-columns: 1fr; }
    .ww-main-right { flex-direction: row; }
  }
</style>
