<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import {
    createNetworkTrafficMonitor,
    formatBytes,
    formatBitrate,
    type NetworkTrafficMonitor,
    type NetworkTrafficSnapshot,
  } from '../../../lib/network-traffic';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getNetworkBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('network'));
  const skin = resolveStructuralSkin();
  const NetworkBody = getNetworkBodyComponent(skin);

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

<SkinFloatingShell layoutKey="network-layout" {title} defaultW={300} defaultH={300} {onClose}>
  <NetworkBody {ui} {snap} {loadPct} {formatBytes} {formatBitrate} />
</SkinFloatingShell>
