<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getWorldClockBodyComponent } from '../resolveWidgetBody';
  import type { WorldCity, WorldSlot } from './world/world-types';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('world'));
  const skin = resolveStructuralSkin();
  const WorldBody = getWorldClockBodyComponent(skin);

  const CITIES: WorldCity[] = [
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
  let slots = $state<WorldSlot[]>(CITIES.map((c, i) => ({ ...c, ready: i === 0 })));

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
      const part =
        new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'shortOffset' })
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
      window.dispatchEvent(
        new CustomEvent('clock:setTimezone', { detail: { tz: c.tz, label: `${c.name} ${c.code}` } }),
      );
      window.dispatchEvent(
        new CustomEvent('weather:setCity', { detail: { name: c.name, lat: c.lat, lon: c.lon } }),
      );
    } catch {
      /* ignore */
    }
  }
</script>

<SkinFloatingShell layoutKey="world-layout" {title} defaultW={340} defaultH={400} {onClose}>
  <WorldBody {ui} {slots} {active} {formatTime} {formatDate} {tzOffset} onPick={pick} />
</SkinFloatingShell>
