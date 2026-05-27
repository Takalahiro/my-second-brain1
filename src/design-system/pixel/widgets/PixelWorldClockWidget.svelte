<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelSegmentValue from '../components/PixelSegmentValue.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('world'));

  type City = {
    id: string;
    name: string;
    code: string;
    tz: string;
    lat: number;
    lon: number;
    flag: string;
  };

  const CITIES: City[] = [
    { id: 'sh', name: '上海', code: 'PVG', tz: 'Asia/Shanghai', lat: 31.23, lon: 121.47, flag: '沪' },
    { id: 'tyo', name: '东京', code: 'TYO', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69, flag: '東' },
    { id: 'syd', name: '悉尼', code: 'SYD', tz: 'Australia/Sydney', lat: -33.86, lon: 151.21, flag: 'SY' },
    { id: 'ldn', name: '伦敦', code: 'LDN', tz: 'Europe/London', lat: 51.51, lon: -0.13, flag: 'UK' },
    { id: 'ny', name: '纽约', code: 'NYC', tz: 'America/New_York', lat: 40.71, lon: -74.0, flag: 'NY' },
    { id: 'la', name: '洛杉矶', code: 'LAX', tz: 'America/Los_Angeles', lat: 34.05, lon: -118.24, flag: 'LA' },
  ];

  const STATE_KEY = 'second-brain:world-state';
  let active = $state(0);
  let now = $state(new Date());
  let slots = $state(CITIES.map((c, i) => ({ ...c, ready: i === 0 })));

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.selectedId === 'string') {
          const i = CITIES.findIndex((x) => x.id === s.selectedId);
          if (i >= 0) active = i;
        }
      }
    } catch {
      /* ignore */
    }
    slots = CITIES.map((c, i) => ({ ...c, ready: i === active }));
    const id = window.setInterval(() => {
      now = new Date();
    }, 1000);
    return () => window.clearInterval(id);
  });

  function formatTime(tz: string) {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: tz,
    }).format(now);
  }

  function formatDate(tz: string) {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      timeZone: tz,
    }).format(now);
  }

  function tzOffset(tz: string) {
    try {
      const part = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(now)
        .find((p) => p.type === 'timeZoneName')?.value ?? '';
      return part.replace('GMT', 'UTC');
    } catch {
      return '';
    }
  }

  function pick(i: number) {
    active = i;
    slots = CITIES.map((c, j) => ({ ...c, ready: j === i }));
    const c = CITIES[i];
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ selectedId: c.id }));
      window.dispatchEvent(new CustomEvent('clock:setTimezone', { detail: { tz: c.tz, label: `${c.name} ${c.code}` } }));
      window.dispatchEvent(new CustomEvent('weather:setCity', { detail: { name: c.name, lat: c.lat, lon: c.lon } }));
    } catch {
      /* ignore */
    }
  }
</script>

<PixelFloatingShell layoutKey="second-brain:world-layout" title={title} defaultW={340} defaultH={400} {onClose}>
  <p class="pixel-nes-section-label">{ui.selectCity}</p>
  <div class="pixel-lobby-grid">
    {#each slots as s, i (s.id)}
      <button type="button" class="pixel-lobby-slot" data-ready={s.ready} onclick={() => pick(i)}>
        <div class="pixel-clock-hud__label">{s.name}</div>
        <div class="pixel-lobby-slot__flag">{s.flag}</div>
        <PixelSegmentValue value={formatTime(s.tz)} />
        <div>{s.ready ? ui.readyState : ui.waiting}</div>
        <div class="pixel-clock-hud__label">{s.code} · {tzOffset(s.tz)}</div>
      </button>
    {/each}
  </div>

  <div class="pixel-nes-world-detail">
    <p class="pixel-nes-world-detail__label">{ui.localTime}</p>
    <p class="pixel-nes-world-detail__time">{formatTime(CITIES[active].tz)}</p>
    <p class="pixel-nes-world-detail__date">{formatDate(CITIES[active].tz)} · {CITIES[active].name}</p>
  </div>
</PixelFloatingShell>
