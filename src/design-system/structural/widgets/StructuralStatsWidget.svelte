<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getStatsBodyComponent, type StatTab, type StatsData, type StatsDay } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('stats'));
  const skin = resolveStructuralSkin();
  const StatsBody = getStatsBodyComponent(skin);

  let stats = $state<StatsData | null>(null);
  let loadErr = $state<string | null>(null);
  let tab = $state<StatTab>('overview');

  const tabs = $derived([
    { id: 'overview' as StatTab, label: ui.statTabOverview },
    { id: 'trend' as StatTab, label: ui.statTabTrend },
    { id: 'folders' as StatTab, label: ui.statTabFolders },
    { id: 'heat' as StatTab, label: ui.statTabHeat },
    { id: 'tags' as StatTab, label: ui.statTabTags },
  ]);

  onMount(async () => {
    try {
      const mod = await import('../../../data/stats.json');
      stats = (mod.default ?? mod) as StatsData;
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
    if (!stats) return [] as (StatsDay | null)[][];
    const padded: (StatsDay | null)[] = [];
    const first = stats.heatmap[0];
    const firstDow = first ? new Date(first.date).getDay() : 0;
    for (let i = 0; i < firstDow; i++) padded.push(null);
    padded.push(...stats.heatmap);
    while (padded.length % 7 !== 0) padded.push(null);
    const cols: (StatsDay | null)[][] = [];
    for (let c = 0; c < padded.length / 7; c++) {
      cols.push(padded.slice(c * 7, c * 7 + 7));
    }
    return cols;
  });

  function dayColor(c: number) {
    if (c === 0) return 'var(--stats-heat-empty, #303040)';
    const t = Math.min(1, c / maxDay);
    return `color-mix(in srgb, var(--stats-heat-hot, #33ff66) ${Math.round(t * 100)}%, var(--stats-heat-cold, #0a0e27))`;
  }
</script>

<SkinFloatingShell layoutKey="stats-layout" {title} defaultW={380} defaultH={460} minH={340} {onClose}>
  <StatsBody
    {ui}
    {stats}
    {loadErr}
    {tab}
    {tabs}
    {maxFolder}
    {maxMonth}
    {maxTag}
    {maxDay}
    {monthPath}
    {heatmapCols}
    {dayColor}
    onTabChange={(t) => (tab = t)}
  />
</SkinFloatingShell>
