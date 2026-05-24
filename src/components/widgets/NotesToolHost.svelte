<script lang="ts">
  import { onMount } from 'svelte';
  import PythonWidget from './PythonWidget.svelte';
  import CalculatorWidget from './CalculatorWidget.svelte';
  import WhiteboardWidget from './WhiteboardWidget.svelte';
  import NotesToolDrawer from './NotesToolDrawer.svelte';
  import { isNotesContextPath } from '../../lib/notes-context';
  import { clampDropPoint } from '../../lib/floating-widget-layout';

  const STORAGE_KEY = 'second-brain:notes-tools';

  type ToolKey = 'python' | 'matlab' | 'whiteboard';
  type Enabled = Record<ToolKey, boolean>;

  let ready = $state(false);
  let onNotesPage = $state(false);
  let enabled = $state<Enabled>({
    python: false,
    matlab: false,
    whiteboard: false,
  });

  const dropMap: Record<ToolKey, { key: string; defaultW: number; defaultH: number }> = {
    python: { key: 'second-brain:python-layout', defaultW: 520, defaultH: 560 },
    matlab: { key: 'second-brain:calc-layout', defaultW: 420, defaultH: 520 },
    whiteboard: { key: 'second-brain:whiteboard-layout', defaultW: 640, defaultH: 520 },
  };

  function checkPath() {
    onNotesPage = typeof location !== 'undefined' && isNotesContextPath(location.pathname);
  }

  onMount(() => {
    checkPath();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.enabled && typeof s.enabled === 'object') {
          enabled = {
            python: !!s.enabled.python,
            matlab: !!s.enabled.matlab,
            whiteboard: !!s.enabled.whiteboard,
          };
        }
      }
    } catch {}
    ready = true;

    window.addEventListener('popstate', checkPath);
    window.addEventListener('hashchange', checkPath);
    // Astro View Transitions / 软导航
    document.addEventListener('astro:page-load', checkPath);
    return () => {
      window.removeEventListener('popstate', checkPath);
      window.removeEventListener('hashchange', checkPath);
      document.removeEventListener('astro:page-load', checkPath);
    };
  });

  function persist() {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled }));
    } catch {}
  }

  function toggleEnabled(key: ToolKey, drop?: { x: number; y: number }) {
    const next = !enabled[key];
    enabled = { ...enabled, [key]: next };
    if (next && drop) {
      const m = dropMap[key];
      try {
        const cur = JSON.parse(localStorage.getItem(m.key) || '{}');
        const w = typeof cur.w === 'number' ? cur.w : m.defaultW;
        const h = typeof cur.h === 'number' ? cur.h : m.defaultH;
        const d = clampDropPoint(drop.x, drop.y);
        localStorage.setItem(
          m.key,
          JSON.stringify({ x: d.x, y: d.y, w, h, r: cur.r ?? 0 })
        );
      } catch {}
    }
    persist();
  }
</script>

{#if ready && onNotesPage}
  {#if enabled.python}
    <PythonWidget onClose={() => toggleEnabled('python')} />
  {/if}
  {#if enabled.matlab}
    <CalculatorWidget onClose={() => toggleEnabled('matlab')} />
  {/if}
  {#if enabled.whiteboard}
    <WhiteboardWidget onClose={() => toggleEnabled('whiteboard')} />
  {/if}

  <NotesToolDrawer {enabled} onToggle={(key, drop) => toggleEnabled(key, drop)} />
{/if}
