<script lang="ts">
  import { onMount } from 'svelte';

  let now = $state(new Date());

  const timeText = $derived(
    now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const secText = $derived(String(now.getSeconds()).padStart(2, '0'));
  const dateText = $derived(
    now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
  );

  onMount(() => {
    const id = window.setInterval(() => {
      now = new Date();
    }, 1000);
    return () => window.clearInterval(id);
  });
</script>

<div class="cc-clock">
  <div class="cc-clock-time">
    <span class="cc-clock-hm">{timeText}</span>
    <span class="cc-clock-sec">{secText}</span>
  </div>
  <div class="cc-clock-date">{dateText}</div>
</div>

<style>
  .cc-clock {
    height: 100%;
    min-height: 148px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.04));
    border: 1px solid rgb(255 255 255 / 0.12);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
  }
  .cc-clock-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    line-height: 1;
  }
  .cc-clock-hm {
    font-size: clamp(1.65rem, 5vw, 2.1rem);
    font-weight: 700;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }
  .cc-clock-sec {
    font-size: 0.95rem;
    font-weight: 600;
    color: rgb(255 255 255 / 0.45);
    font-variant-numeric: tabular-nums;
  }
  .cc-clock-date {
    margin-top: 8px;
    font-size: 0.78rem;
    color: rgb(255 255 255 / 0.55);
    font-weight: 500;
  }
</style>
