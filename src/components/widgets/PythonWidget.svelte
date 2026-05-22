<script lang="ts">
  import { onMount } from 'svelte';
  import FloatingWidgetFrame from './FloatingWidgetFrame.svelte';
  import PythonIDE from '../PythonIDE.svelte';

  interface Props { onClose?: () => void; }
  let { onClose }: Props = $props();

  let minimized = $state(false);
  let maximized = $state(false);
  const STATE_KEY = 'second-brain:python-widget-state';

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
  layoutKey="second-brain:python-layout"
  ariaLabel="Python 编译器"
  title="Python"
  icon="python"
  href="/python"
  className="python-widget"
  defaultWidth={520}
  defaultHeight={560}
  minWidth={360}
  minHeight={320}
  maxWidth={960}
  maxHeight={900}
  defaultOffsetX={40}
  defaultOffsetY={100}
  {onClose}
  {minimized}
  {maximized}
  onMinimize={() => { minimized = !minimized; if (minimized) maximized = false; persistState(); }}
  onMaximize={() => { maximized = !maximized; if (maximized) minimized = false; persistState(); }}
>
  <div class="pw-inner">
    <PythonIDE compact />
  </div>
</FloatingWidgetFrame>

<style>
  .pw-inner {
    height: 100%;
    min-height: 280px;
    padding: 6px 8px 8px;
  }
  .pw-inner :global(.python-ide.compact) {
    height: 100%;
    min-height: 260px;
  }
</style>
