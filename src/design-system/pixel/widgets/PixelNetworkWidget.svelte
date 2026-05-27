<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelSegmentValue from '../components/PixelSegmentValue.svelte';
  import {
    createNetworkTrafficMonitor,
    formatBytes,
    formatBitrate,
    type NetworkTrafficMonitor,
    type NetworkTrafficSnapshot,
  } from '../../../lib/network-traffic';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('network'));

  let monitor: NetworkTrafficMonitor | null = null;
  let snap = $state<NetworkTrafficSnapshot | null>(null);

  onMount(() => {
    monitor = createNetworkTrafficMonitor();
    snap = monitor.getSnapshot();
    const id = window.setInterval(() => {
      snap = monitor?.getSnapshot() ?? null;
    }, 1000);
    return () => {
      window.clearInterval(id);
      monitor?.destroy();
    };
  });

  const loadPct = $derived.by(() => {
    if (!snap) return 0;
    const peak = Math.max(snap.peakBytesPerSecond, 1);
    return Math.min(1, snap.bytesPerSecond / peak);
  });
</script>

<PixelFloatingShell layoutKey="second-brain:network-layout" title={title} defaultW={300} defaultH={300} {onClose}>
  <div class="pixel-stage-banner">
    <span>{ui.saveStationTitle}</span>
    <span>{snap ? ui.monitoring : ui.init}</span>
  </div>

  <div style="display:flex;gap:6px;margin:12px 0">
    {#each Array(5) as _, i (i)}
      <span class="pixel-metroid-etank" data-full={i / 5 < loadPct}>E</span>
    {/each}
  </div>

  <PixelSegmentValue value={formatBytes(snap?.sessionBytes ?? 0)} />
  <div class="pixel-nes-info-row">
    <span class="pixel-nes-info-row__label">{ui.sessionTotal}</span>
    <span class="pixel-nes-info-row__value">{formatBytes(snap?.sessionBytes ?? 0)}</span>
  </div>
  <div class="pixel-coin-badge" style="margin-top:8px">{ui.currentRate} {formatBitrate(snap?.bytesPerSecond ?? 0)}</div>
</PixelFloatingShell>
