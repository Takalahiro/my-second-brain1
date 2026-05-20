<script lang="ts">
  import { onMount } from 'svelte';
  import FloatingWidgetFrame from './FloatingWidgetFrame.svelte';
  import MatlabCalculator from '../MatlabCalculator.svelte';

  interface Props { onClose?: () => void; }
  let { onClose }: Props = $props();

  let minimized = $state(false);
  let maximized = $state(false);
  const STATE_KEY = 'second-brain:calc-state';

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
      }
    } catch {}
  });

  function persistState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ minimized, maximized }));
    } catch {}
  }
</script>

<FloatingWidgetFrame
  layoutKey="second-brain:calc-layout"
  ariaLabel="MATLAB 计算器"
  title="MATLAB"
  icon="∑"
  href="/matlab"
  className="calc-widget"
  defaultWidth={420}
  defaultHeight={520}
  minWidth={320}
  minHeight={360}
  maxWidth={900}
  maxHeight={900}
  defaultOffsetX={80}
  defaultOffsetY={120}
  {onClose}
  {minimized}
  {maximized}
  onMinimize={() => { minimized = !minimized; if (minimized) maximized = false; persistState(); }}
  onMaximize={() => { maximized = !maximized; if (maximized) minimized = false; persistState(); }}
>
  <div class="cw-body">
    <MatlabCalculator compact />
  </div>
</FloatingWidgetFrame>

<style>
  .cw-body {
    padding: 8px 10px 10px;
    height: 100%;
    min-height: 300px;
  }
  .cw-body :global(.matlab-calc.compact) {
    height: 100%;
    min-height: 280px;
  }
</style>
