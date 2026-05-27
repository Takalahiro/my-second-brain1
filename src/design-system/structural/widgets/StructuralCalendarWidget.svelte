<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getCalendarBodyComponent } from '../resolveWidgetBody';
  import CalendarSettingsPanel from './calendar/CalendarSettingsPanel.svelte';
  import type { CalEvent, CalCell } from './calendar/calendar-types';

  const STATE_KEY = 'second-brain:cal-state';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('calendar'));
  const skin = resolveStructuralSkin();
  const CalendarBody = getCalendarBodyComponent(skin);

  let cursorYM = $state({ y: new Date().getFullYear(), m: new Date().getMonth() });
  let icsUrl = $state('');
  let urlInput = $state('');
  let events = $state<CalEvent[]>([]);
  let lastSync = $state<number | null>(null);
  let loading = $state(false);
  let syncError = $state<string | null>(null);
  let selectedDay = $state<number | null>(null);

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.icsUrl === 'string') icsUrl = s.icsUrl;
        if (Array.isArray(s.events)) events = s.events;
        if (typeof s.lastSync === 'number') lastSync = s.lastSync;
      }
    } catch {
      /* ignore */
    }
    urlInput = icsUrl;
    if (icsUrl && (!lastSync || Date.now() - lastSync > 30 * 60 * 1000)) {
      void syncIcs();
    }
  });

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ icsUrl, events, lastSync }));
    } catch {
      /* ignore */
    }
  }

  async function syncIcs() {
    if (!icsUrl) return;
    loading = true;
    syncError = null;
    try {
      const res = await fetch(icsUrl, { credentials: 'omit' });
      if (!res.ok) throw new Error('http_' + res.status);
      events = parseIcs(await res.text());
      lastSync = Date.now();
      persist();
    } catch {
      syncError = ui.icsSyncFail;
    } finally {
      loading = false;
    }
  }

  function saveUrl() {
    icsUrl = urlInput.trim();
    persist();
    if (icsUrl) void syncIcs();
    else {
      events = [];
      lastSync = null;
      persist();
    }
  }

  function clearUrl() {
    icsUrl = '';
    urlInput = '';
    events = [];
    lastSync = null;
    persist();
  }

  function parseIcs(text: string): CalEvent[] {
    const unfolded = text.replace(/\r?\n[ \t]/g, '');
    const lines = unfolded.split(/\r?\n/);
    const out: CalEvent[] = [];
    let cur: Partial<CalEvent> & { _start?: string; _end?: string; _allDay?: boolean } | null = null;
    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        cur = {};
        continue;
      }
      if (line === 'END:VEVENT') {
        if (cur && cur._start) {
          const start = parseIcsDate(cur._start);
          const end = cur._end ? parseIcsDate(cur._end) : start + (cur._allDay ? 86400000 : 3600000);
          out.push({
            id: (cur as CalEvent).id || `${start}-${cur.title || ''}`,
            title: cur.title || '(无标题)',
            start,
            end,
            allDay: !!cur._allDay,
          });
        }
        cur = null;
        continue;
      }
      if (!cur) continue;
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const keyRaw = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const key = keyRaw.split(';')[0].toUpperCase();
      const allDay = /VALUE=DATE/i.test(keyRaw);
      if (key === 'SUMMARY') cur.title = unescapeIcs(value);
      else if (key === 'DTSTART') {
        cur._start = value;
        if (allDay) cur._allDay = true;
      } else if (key === 'DTEND') cur._end = value;
      else if (key === 'UID') (cur as CalEvent).id = value;
    }
    return out.sort((a, b) => a.start - b.start);
  }

  function unescapeIcs(s: string) {
    return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }

  function parseIcsDate(v: string): number {
    if (/^\d{8}$/.test(v)) {
      const y = +v.slice(0, 4),
        m = +v.slice(4, 6),
        d = +v.slice(6, 8);
      return new Date(y, m - 1, d).getTime();
    }
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
    if (m) {
      const [, Y, M, D, h, mi, s, z] = m;
      if (z === 'Z') return Date.UTC(+Y, +M - 1, +D, +h, +mi, +s);
      return new Date(+Y, +M - 1, +D, +h, +mi, +s).getTime();
    }
    return Date.now();
  }

  const cells = $derived.by<CalCell[]>(() => {
    const { y, m } = cursorYM;
    const firstWeekday = new Date(y, m, 1).getDay();
    const today = new Date();
    const grid: CalCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(y, m, i - firstWeekday + 1);
      const inMonth = d.getMonth() === m;
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      grid.push({
        date: d,
        inMonth,
        events: events.filter((e) => e.start < dayEnd && e.end > dayStart),
        today:
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate(),
        day: d.getDate(),
      });
    }
    return grid;
  });

  const monthLabel = $derived(`${cursorYM.y} 年 ${cursorYM.m + 1} 月`);

  const upcoming = $derived.by(() =>
    events
      .filter((e) => e.end >= Date.now())
      .sort((a, b) => a.start - b.start)
      .slice(0, 5),
  );

  const selectedEvents = $derived.by(() => {
    if (selectedDay == null) return upcoming;
    const { y, m } = cursorYM;
    const dayStart = new Date(y, m, selectedDay).getTime();
    const dayEnd = dayStart + 86400000;
    return events.filter((e) => e.start < dayEnd && e.end > dayStart).sort((a, b) => a.start - b.start);
  });

  function prevMonth() {
    let { y, m } = cursorYM;
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    cursorYM = { y, m };
    selectedDay = null;
  }

  function nextMonth() {
    let { y, m } = cursorYM;
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    cursorYM = { y, m };
    selectedDay = null;
  }

  function today() {
    const d = new Date();
    cursorYM = { y: d.getFullYear(), m: d.getMonth() };
    selectedDay = d.getDate();
  }

  function fmtEvent(e: CalEvent) {
    const s = new Date(e.start);
    const en = new Date(e.end);
    if (e.allDay) return `${s.getMonth() + 1}/${s.getDate()} ${ui.allDay}`;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${s.getMonth() + 1}/${s.getDate()} ${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(en.getHours())}:${pad(en.getMinutes())}`;
  }

  function fmtSync(ts: number | null) {
    if (!ts) return '尚未同步';
    const diff = Date.now() - ts;
    if (diff < 60_000) return '刚刚';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
    return `${Math.floor(diff / 3600_000)} 小时前`;
  }
</script>

<SkinFloatingShell layoutKey="cal-layout" {title} defaultW={360} defaultH={460} minH={340} {onClose}>
  {#snippet settings()}
    <CalendarSettingsPanel
      {ui}
      {urlInput}
      {loading}
      {syncError}
      {lastSync}
      eventCount={events.length}
      {fmtSync}
      hasUrl={!!icsUrl}
      onUrlInputChange={(v) => (urlInput = v)}
      onSaveUrl={saveUrl}
      onClearUrl={clearUrl}
      onSync={syncIcs}
    />
  {/snippet}

  <CalendarBody
    {ui}
    {monthLabel}
    {cells}
    {selectedDay}
    {selectedEvents}
    weekdayNames={ui.weekdayNames}
    {fmtEvent}
    cursorMonth={cursorYM.m}
    onPrevMonth={prevMonth}
    onNextMonth={nextMonth}
    onToday={today}
    onSelectDay={(d) => (selectedDay = d)}
  />
</SkinFloatingShell>
