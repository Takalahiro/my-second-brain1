<script lang="ts">
  interface Props {
    accent: string;
  }

  let { accent }: Props = $props();

  const complexities = [
    { id: 'n', label: 'O(n)', fn: (n: number) => n, color: '#34d399' },
    { id: 'nlogn', label: 'O(n log n)', fn: (n: number) => n * Math.log2(Math.max(n, 1)), color: '#60a5fa' },
    { id: 'n2', label: 'O(n²)', fn: (n: number) => n * n, color: '#f472b6' },
  ] as const;

  let n = $state(64);

  const rows = $derived(
    complexities.map((c) => ({
      ...c,
      value: c.fn(n),
    })),
  );

  const maxValue = $derived(Math.max(...rows.map((r) => r.value), 1));

  function formatN(v: number) {
    if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
    return String(Math.round(v));
  }
</script>

<div class="big-o-demo">
  <label class="big-o-demo__control">
    <span>输入规模 n = <strong>{n}</strong></span>
    <input type="range" min="8" max="512" step="8" bind:value={n} />
  </label>

  <div class="big-o-demo__chart" role="img" aria-label="复杂度增长对比柱状图">
    {#each rows as row (row.id)}
      <div class="big-o-demo__bar-wrap">
        <div
          class="big-o-demo__bar"
          style={`height: ${Math.max(4, (row.value / maxValue) * 100)}%; background: ${row.color}; box-shadow: 0 0 24px color-mix(in srgb, ${row.color} 40%, transparent);`}
        ></div>
        <span class="big-o-demo__value">{formatN(row.value)}</span>
        <span class="big-o-demo__label">{row.label}</span>
      </div>
    {/each}
  </div>

  <p class="big-o-demo__hint">
    当 n 增大时，<strong style={`color: ${accent}`}>O(n²)</strong> 增长远快于
    <strong>O(n log n)</strong> — 选型算法时先估规模再定范式。
  </p>
</div>

<style>
  .big-o-demo {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .big-o-demo__control {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: var(--text-sm);
    color: rgb(200 210 230 / 0.85);
  }

  .big-o-demo__control input[type='range'] {
    width: 100%;
    accent-color: var(--island-accent, #8b5cf6);
  }

  .big-o-demo__chart {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    align-items: end;
    min-height: 200px;
    padding: var(--space-4);
    border-radius: 16px;
    background: rgb(0 0 0 / 0.22);
    border: 1px solid rgb(255 255 255 / 0.06);
  }

  .big-o-demo__bar-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    height: 180px;
    justify-content: flex-end;
  }

  .big-o-demo__bar {
    width: min(100%, 72px);
    border-radius: 8px 8px 4px 4px;
    transition: height 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .big-o-demo__value {
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: rgb(230 236 250 / 0.9);
  }

  .big-o-demo__label {
    font-size: 0.6875rem;
    color: rgb(180 192 218 / 0.72);
  }

  .big-o-demo__hint {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.55;
    color: rgb(180 192 218 / 0.78);
  }
</style>
