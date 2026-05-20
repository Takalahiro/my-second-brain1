<script lang="ts">
  import { onMount } from 'svelte';
  import FloatingWidgetFrame from './FloatingWidgetFrame.svelte';

  interface Props { onClose?: () => void; }
  let { onClose }: Props = $props();

  let minimized = $state(false);
  let maximized = $state(false);
  let loaded = $state(false);
  const STATE_KEY = 'second-brain:whiteboard-widget-state';

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
  layoutKey="second-brain:whiteboard-layout"
  ariaLabel="Excalidraw 白板"
  title="白板"
  icon="✏️"
  href="/whiteboard"
  className="whiteboard-widget"
  defaultWidth={640}
  defaultHeight={520}
  minWidth={400}
  minHeight={300}
  maxWidth={1200}
  maxHeight={900}
  defaultOffsetX={120}
  defaultOffsetY={80}
  {onClose}
  {minimized}
  {maximized}
  onMinimize={() => { minimized = !minimized; if (minimized) maximized = false; persistState(); }}
  onMaximize={() => { maximized = !maximized; if (maximized) minimized = false; persistState(); }}
>
  <div class="wb-inner">
    {#if !loaded}
      <p class="wb-loading">加载 Excalidraw…</p>
    {/if}
    <iframe
      class="wb-frame"
      src="https://excalidraw.com"
      title="Excalidraw 白板"
      allow="clipboard-read; clipboard-write"
      onload={() => (loaded = true)}
    ></iframe>
  </div>
</FloatingWidgetFrame>

<style>
  .wb-inner {
    position: relative;
    height: 100%;
    min-height: 240px;
  }
  .wb-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-size: 0.8rem;
    color: #c8b9e2;
    pointer-events: none;
  }
  .wb-frame {
    width: 100%;
    height: 100%;
    min-height: 240px;
    border: 0;
    background: #fff;
  }
</style>
