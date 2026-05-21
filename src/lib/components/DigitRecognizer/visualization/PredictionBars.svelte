<script lang="ts">
  import AnimatedNumber from '../../../../components/shared/AnimatedNumber.svelte';

  interface Props {
    probabilities?: number[];
    predicted?: number;
    confidence?: number;
  }
  let {
    probabilities = Array(10).fill(0),
    predicted = 0,
    confidence = 0,
  }: Props = $props();

  const confPct = $derived(Math.round(confidence * 1000) / 10);
  const hasResult = $derived(confidence > 0);
</script>

<section class="pred-bars">
  <div class="pb-result">
    <span class="pb-label">预测</span>
    <span class="pb-digit" class:win={hasResult}>{predicted}</span>
    <span class="pb-conf">置信度 <AnimatedNumber value={confPct} decimals={1} duration={400} />%</span>
  </div>
  <div class="pb-grid">
    {#each probabilities as p, d}
      <div class="pb-col" class:win={d === predicted && hasResult}>
        <div class="pb-bar-wrap">
          <div class="pb-bar" style="height: {Math.max(0, p) * 100}%"></div>
        </div>
        <span class="pb-num">{d}</span>
        <span class="pb-pct">{Math.round(p * 1000) / 10}%</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .pred-bars {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: linear-gradient(145deg, rgb(180 140 255 / 0.06), rgb(0 0 0 / 0.15));
  }
  .pb-result {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .pb-label { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; }
  .pb-digit {
    font-size: 3rem;
    font-weight: 800;
    font-family: 'IBM Plex Mono', monospace;
    color: #b48cff;
    line-height: 1;
    transition: color var(--motion-step), transform var(--motion-step);
  }
  .pb-digit.win { color: #00ff9d; text-shadow: 0 0 24px rgb(0 255 157 / 0.4); }
  .pb-conf { font-size: 0.82rem; color: var(--text-secondary); }
  .pb-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 6px;
    align-items: end;
    height: 100px;
  }
  .pb-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: transform var(--motion-step-fast);
  }
  .pb-col.win { transform: scale(1.05); }
  .pb-bar-wrap {
    width: 100%;
    height: 72px;
    display: flex;
    align-items: flex-end;
    background: rgb(255 255 255 / 0.04);
    border-radius: 6px 6px 4px 4px;
    overflow: hidden;
  }
  .pb-bar {
    width: 100%;
    background: linear-gradient(180deg, #b48cff, #7ec8ff);
    border-radius: 4px 4px 0 0;
    transition: height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 2px;
  }
  .pb-col.win .pb-bar { background: linear-gradient(180deg, #00ff9d, #7ec8ff); }
  .pb-num { font-size: 0.72rem; font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
  .pb-pct { font-size: 0.58rem; color: var(--text-secondary); }
  @media (max-width: 640px) {
    .pb-grid { grid-template-columns: repeat(5, 1fr); height: auto; }
    .pb-bar-wrap { height: 56px; }
  }
</style>
