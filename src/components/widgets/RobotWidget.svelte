<script lang="ts">
  import { onMount } from 'svelte';
  import FloatingWidgetFrame from './FloatingWidgetFrame.svelte';

  interface Props { onClose?: () => void; }
  let { onClose }: Props = $props();

  let minimized = $state(false);
  let maximized = $state(false);
  const STATE_KEY = 'second-brain:robot-widget-state';

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
  layoutKey="second-brain:robot-layout"
  ariaLabel="MazeCar 迷宫仿真"
  title="小车"
  icon="code"
  href="/mazecar/"
  className="robot-widget"
  defaultWidth={720}
  defaultHeight={640}
  minWidth={420}
  minHeight={400}
  maxWidth={1100}
  maxHeight={960}
  defaultOffsetX={48}
  defaultOffsetY={72}
  {onClose}
  {minimized}
  {maximized}
  onMinimize={() => { minimized = !minimized; if (minimized) maximized = false; persistState(); }}
  onMaximize={() => { maximized = !maximized; if (maximized) minimized = false; persistState(); }}
>
  <div class="rw-inner">
    <iframe class="rw-frame" src="/mazecar/?embed=1" title="MazeCar 仿真" loading="lazy"></iframe>
  </div>
</FloatingWidgetFrame>

<style>
  .rw-inner {
    height: 100%;
    min-height: 320px;
    display: flex;
    flex-direction: column;
  }
  .rw-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    border: 0;
    background: var(--bg);
  }
</style>
