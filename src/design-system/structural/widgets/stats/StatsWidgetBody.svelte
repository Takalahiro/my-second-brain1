<script lang="ts">
  import SkinSegment from '../../components/SkinSegment.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import { STRUCTURAL_EMPTY_STATE } from '../../lib/structural-copy';
  import type { StatsBodyProps } from './stats-types';

  let {
    ui,
    stats,
    loadErr,
    tab,
    tabs,
    maxFolder,
    maxMonth,
    maxTag,
    monthPath,
    heatmapCols,
    dayColor,
    onTabChange,
  }: StatsBodyProps = $props();

  const skin = resolveStructuralSkin();
  const empty = $derived(STRUCTURAL_EMPTY_STATE[skin]);

  const segmentTabs = $derived(tabs.map((t) => ({ id: t.id, label: t.label })));

  function asciiTrend(months: NonNullable<StatsBodyProps['stats']>['byMonth'], max: number) {
    return months
      .map((m) => {
        const n = Math.round((m.count / max) * 8);
        return `${m.label.padEnd(4)} ${'▇'.repeat(n)}${'▁'.repeat(8 - n)} ${m.count}`;
      })
      .join('\n');
  }
</script>

<div class="skin-stats skin-stats--{skin}">
  {#if loadErr}
    <p class="skin-stats__err">{loadErr}</p>
  {:else if !stats}
    <p class="skin-stats__loading">{ui.loading}</p>
  {:else}
    <SkinSegment
      options={segmentTabs}
      value={tab}
      ariaLabel={ui.statNavLabel}
      onchange={(id) => onTabChange(id as typeof tab)}
    />

    {#if tab === 'overview'}
      <div class="skin-stats__kpis">
        <div class="skin-stats__kpi">
          <span class="skin-stats__kpi-num">{stats.totalNotes}</span>
          <span class="skin-stats__kpi-label">{ui.totalNotes}</span>
        </div>
        <div class="skin-stats__kpi">
          <span class="skin-stats__kpi-num">{(stats.totalWords / 1000).toFixed(1)}<small>k</small></span>
          <span class="skin-stats__kpi-label">{ui.statTotalWords}</span>
        </div>
        <div class="skin-stats__kpi">
          <span class="skin-stats__kpi-num">{stats.topTags.length}</span>
          <span class="skin-stats__kpi-label">{ui.statActiveTags}</span>
        </div>
        <div class="skin-stats__kpi">
          <span class="skin-stats__kpi-num">{stats.byMonth.reduce((s, m) => s + m.count, 0)}</span>
          <span class="skin-stats__kpi-label">{ui.statRecentMonths}</span>
        </div>
      </div>
      <p class="skin-stats__foot">{ui.statUpdated} {new Date(stats.generatedAt).toLocaleDateString()}</p>
    {:else if tab === 'trend'}
      <p class="skin-stats__section">{ui.statTrendTitle}</p>
      {#if skin === 'terminal' || skin === 'crt'}
        <pre class="skin-stats__ascii" aria-label={ui.statTrendTitle}>{asciiTrend(stats.byMonth, maxMonth)}</pre>
      {:else}
        <svg viewBox="0 0 100 110" class="skin-stats__chart" preserveAspectRatio="none" aria-label={ui.statTrendTitle}>
          <polyline points={monthPath} fill="none" class="skin-stats__chart-line" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" />
          {#each stats.byMonth as m, i}
            <rect
              x={(i / Math.max(1, stats.byMonth.length - 1)) * 100 - 1}
              y={100 - (m.count / maxMonth) * 96 - 2}
              width="2"
              height="2"
              class="skin-stats__chart-dot"
            >
              <title>{m.month} · {m.count}</title>
            </rect>
          {/each}
        </svg>
        <div class="skin-stats__chart-x">
          {#each stats.byMonth as m}
            <span>{m.label}</span>
          {/each}
        </div>
      {/if}
    {:else if tab === 'folders'}
      <p class="skin-stats__section">{ui.statFoldersTitle}</p>
      <div class="skin-stats__bars">
        {#each stats.byFolder as f (f.name)}
          <div class="skin-stats__bar-row">
            <span class="skin-stats__bar-label" title={f.name}>{f.name}</span>
            <div class="skin-stats__bar-track"><span style="width:{(f.count / maxFolder) * 100}%"></span></div>
            <span class="skin-stats__bar-val">{skin === 'blueprint' ? `${f.count} mm` : f.count}</span>
          </div>
        {/each}
      </div>
    {:else if tab === 'heat'}
      <p class="skin-stats__section">{ui.statHeatTitle}</p>
      <div class="skin-stats__heat">
        {#each heatmapCols as col, ci (ci)}
          <div class="skin-stats__heat-col">
            {#each col as d, di (d?.date ?? `e-${ci}-${di}`)}
              {#if d == null}
                <span class="skin-stats__heat-cell skin-stats__heat-cell--empty"></span>
              {:else}
                <span class="skin-stats__heat-cell" style="background:{dayColor(d.count)}" title="{d.date} · {d.count}"></span>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {:else if tab === 'tags'}
      <p class="skin-stats__section">{ui.statTagsTitle}</p>
      {#if stats.topTags.length === 0}
        <p class="skin-stats__empty">{empty}</p>
      {:else}
        <div class="skin-stats__tags">
          {#each stats.topTags as t (t.name)}
            <span class="skin-stats__tag" style="opacity:{0.55 + (t.count / maxTag) * 0.45}" title="{t.count}">
              #{t.name} <em>{t.count}</em>
            </span>
          {/each}
        </div>
      {/if}
    {/if}
  {/if}
</div>
