<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  type Folder = { name: string; count: number; words: number };
  type Month = { month: string; label: string; count: number };
  type Tag = { name: string; count: number };
  type Day = { date: string; count: number };
  type Stats = {
    generatedAt: string;
    totalNotes: number;
    totalWords: number;
    byFolder: Folder[];
    byMonth: Month[];
    topTags: Tag[];
    heatmap: Day[];
  };

  type StatTab = 'overview' | 'trend' | 'folders' | 'heat' | 'tags';

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('stats'));

  let stats = $state<Stats | null>(null);
  let loadErr = $state<string | null>(null);
  let tab = $state<StatTab>('overview');

  const tabs: { id: StatTab; label: string }[] = [
    { id: 'overview', label: ui.statTabOverview },
    { id: 'trend', label: ui.statTabTrend },
    { id: 'folders', label: ui.statTabFolders },
    { id: 'heat', label: ui.statTabHeat },
    { id: 'tags', label: ui.statTabTags },
  ];

  onMount(async () => {
    try {
      const mod = await import('../../../data/stats.json');
      stats = (mod.default ?? mod) as Stats;
    } catch {
      loadErr = ui.statLoadErr;
      stats = null;
    }
  });

  const maxFolder = $derived(stats ? Math.max(1, ...stats.byFolder.map((f) => f.count)) : 1);
  const maxMonth = $derived(stats ? Math.max(1, ...stats.byMonth.map((m) => m.count)) : 1);
  const maxTag = $derived(stats ? Math.max(1, ...stats.topTags.map((t) => t.count)) : 1);
  const maxDay = $derived(stats ? Math.max(1, ...stats.heatmap.map((d) => d.count)) : 1);

  const monthPath = $derived.by(() => {
    if (!stats) return '';
    const w = 100;
    const h = 100;
    return stats.byMonth
      .map((m, i) => {
        const x = (i / Math.max(1, stats.byMonth.length - 1)) * w;
        const y = h - (m.count / maxMonth) * (h - 4) - 2;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });

  const heatmapCols = $derived.by(() => {
    if (!stats) return [] as (Day | null)[][];
    const padded: (Day | null)[] = [];
    const first = stats.heatmap[0];
    const firstDow = first ? new Date(first.date).getDay() : 0;
    for (let i = 0; i < firstDow; i++) padded.push(null);
    padded.push(...stats.heatmap);
    while (padded.length % 7 !== 0) padded.push(null);
    const cols: (Day | null)[][] = [];
    for (let c = 0; c < padded.length / 7; c++) {
      cols.push(padded.slice(c * 7, c * 7 + 7));
    }
    return cols;
  });

  function dayColor(c: number) {
    if (c === 0) return '#303040';
    const t = Math.min(1, c / maxDay);
    const g = Math.round(80 + 120 * t);
    return `rgb(0 ${g} 40)`;
  }
</script>

<PixelFloatingShell layoutKey="second-brain:stats-layout" {title} defaultW={380} defaultH={460} minH={340} {onClose}>
  {#if loadErr}
    <p class="pixel-nes-status pixel-nes-status--warn">{loadErr}</p>
  {:else if !stats}
    <p class="pixel-nes-status">{ui.loading}</p>
  {:else}
    <nav class="pixel-nes-tabs" aria-label={ui.statNavLabel}>
      {#each tabs as t (t.id)}
        <button
          type="button"
          class="pixel-nes-segment"
          data-active={tab === t.id}
          onclick={() => { tab = t.id; }}
        >{t.label}</button>
      {/each}
    </nav>

    {#if tab === 'overview'}
      <div class="pixel-stat-kpis">
        <div class="pixel-stat-kpi">
          <span class="pixel-stat-kpi__num">{stats.totalNotes}</span>
          <span class="pixel-stat-kpi__label">{ui.totalNotes}</span>
        </div>
        <div class="pixel-stat-kpi">
          <span class="pixel-stat-kpi__num">{(stats.totalWords / 1000).toFixed(1)}<small>k</small></span>
          <span class="pixel-stat-kpi__label">{ui.statTotalWords}</span>
        </div>
        <div class="pixel-stat-kpi">
          <span class="pixel-stat-kpi__num">{stats.topTags.length}</span>
          <span class="pixel-stat-kpi__label">{ui.statActiveTags}</span>
        </div>
        <div class="pixel-stat-kpi">
          <span class="pixel-stat-kpi__num">{stats.byMonth.reduce((s, m) => s + m.count, 0)}</span>
          <span class="pixel-stat-kpi__label">{ui.statRecentMonths}</span>
        </div>
      </div>
      <p class="pixel-nes-footnote">{ui.statUpdated} {new Date(stats.generatedAt).toLocaleDateString()}</p>
    {:else if tab === 'trend'}
      <p class="pixel-nes-section-label">{ui.statTrendTitle}</p>
      <svg viewBox="0 0 100 110" class="pixel-stat-chart" preserveAspectRatio="none" aria-label={ui.statTrendTitle}>
        <polyline points={monthPath} fill="none" stroke="#fc9838" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" />
        {#each stats.byMonth as m, i}
          <rect
            x={(i / Math.max(1, stats.byMonth.length - 1)) * 100 - 1}
            y={100 - (m.count / maxMonth) * 96 - 2}
            width="2"
            height="2"
            fill="#00a800"
          >
            <title>{m.month} · {m.count}</title>
          </rect>
        {/each}
      </svg>
      <div class="pixel-stat-chart-x">
        {#each stats.byMonth as m}
          <span>{m.label}</span>
        {/each}
      </div>
    {:else if tab === 'folders'}
      <p class="pixel-nes-section-label">{ui.statFoldersTitle}</p>
      <div class="pixel-nes-stat-bars">
        {#each stats.byFolder as f (f.name)}
          <div class="pixel-nes-stat-row">
            <span title={f.name}>{f.name}</span>
            <div class="pixel-nes-stat-row__bar"><span style="width:{(f.count / maxFolder) * 100}%"></span></div>
            <span>{f.count}</span>
          </div>
        {/each}
      </div>
    {:else if tab === 'heat'}
      <p class="pixel-nes-section-label">{ui.statHeatTitle}</p>
      <div class="pixel-stat-heatmap">
        {#each heatmapCols as col, ci (ci)}
          <div class="pixel-stat-heatmap__col">
            {#each col as d, di (d?.date ?? `e-${ci}-${di}`)}
              {#if d == null}
                <span class="pixel-stat-heatmap__cell pixel-stat-heatmap__cell--empty"></span>
              {:else}
                <span
                  class="pixel-stat-heatmap__cell"
                  style="background:{dayColor(d.count)}"
                  title="{d.date} · {d.count}"
                ></span>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {:else if tab === 'tags'}
      <p class="pixel-nes-section-label">{ui.statTagsTitle}</p>
      {#if stats.topTags.length === 0}
        <p class="pixel-nes-status">{ui.statNoTags}</p>
      {:else}
        <div class="pixel-stat-tags">
          {#each stats.topTags as t (t.name)}
            <span
              class="pixel-stat-tag"
              style="opacity:{0.55 + (t.count / maxTag) * 0.45}"
              title="{t.count}"
            >#{t.name} <em>{t.count}</em></span>
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</PixelFloatingShell>
