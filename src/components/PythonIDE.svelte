<script lang="ts">
  import { onMount, tick } from 'svelte';
  import PythonStepPanel from './python/PythonStepPanel.svelte';
  import PythonCodeEditor from './python/PythonCodeEditor.svelte';
  import {
    PY_TRACER_SETUP,
    SAMPLE_CODE,
    emptyTrace,
    type PythonTraceResult,
  } from '../lib/python/tracer';

  interface Props {
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  type PyodideApi = {
    runPythonAsync: (c: string) => Promise<unknown>;
    setStdout: (o: { batched: (t: string) => void }) => void;
  };

  let pyodideReady = $state(false);
  let tracerReady = $state(false);
  let loading = $state(true);
  let loadErr = $state<string | null>(null);
  let code = $state(SAMPLE_CODE);
  let stdout = $state('');
  let running = $state(false);
  let trace = $state<PythonTraceResult | null>(null);
  let activeStep = $state(0);
  let pyodide: PyodideApi | null = null;

  let editorRef = $state<PythonCodeEditor | null>(null);
  let gutterEl: HTMLDivElement | null = null;

  const lines = $derived(code.split('\n'));
  const activeLine = $derived(trace?.steps[activeStep]?.line ?? 0);
  const executedLines = $derived(new Set(trace?.steps.map((s) => s.line) ?? []));

  onMount(() => {
    void initPyodide();
  });

  async function initPyodide() {
    loading = true;
    loadErr = null;
    tracerReady = false;
    try {
      // @ts-expect-error CDN global
      if (!window.loadPyodide) {
        await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
      }
      // @ts-expect-error CDN
      pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });
      await pyodide.runPythonAsync(PY_TRACER_SETUP);
      tracerReady = true;
      pyodideReady = true;
    } catch (e) {
      loadErr = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function runCode() {
    if (!pyodide || running || !tracerReady) return;
    running = true;
    stdout = '';
    trace = null;
    activeStep = 0;
    try {
      const payload = JSON.stringify(code);
      const raw = await pyodide.runPythonAsync(`
import json
json.dumps(run_traced(${payload}))
`);
      const parsed = JSON.parse(String(raw)) as PythonTraceResult;
      trace = parsed;
      stdout = parsed.stdout;
      if (parsed.error) stdout += (stdout ? '\n' : '') + parsed.error;
      if (parsed.steps.length > 0) activeStep = 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      stdout = msg;
      trace = { ...emptyTrace(), error: msg };
    } finally {
      running = false;
      await tick();
      scrollToActiveLine();
    }
  }

  function clearAll() {
    stdout = '';
    trace = null;
    activeStep = 0;
  }

  function syncGutterScroll() {
    const ta = editorRef?.getTextarea();
    if (ta && gutterEl) gutterEl.scrollTop = ta.scrollTop;
  }

  function scrollToActiveLine() {
    editorRef?.scrollToLine(activeLine);
    syncGutterScroll();
  }

  $effect(() => {
    void activeLine;
    void tick().then(scrollToActiveLine);
  });

  const PRESETS: Array<{ label: string; code: string }> = [
    { label: '入门', code: SAMPLE_CODE },
    {
      label: '循环',
      code: `total = 0
for i in range(1, 6):
    total += i
print("sum =", total)
`,
    },
    {
      label: '分支',
      code: `x = 42
if x % 2 == 0:
    print("偶数")
else:
    print("奇数")
`,
    },
  ];
</script>

<div class="py-ide" class:compact>
  <header class="py-head">
    {#if !compact}
      <div>
        <h1>Python 在线编译器</h1>
        <p class="py-sub">Pyodide 运行 · 逐步解释每一行在做什么</p>
      </div>
    {:else}
      <span class="py-compact-title">Python · 逐步追踪</span>
    {/if}
    <div class="py-actions">
      {#if loading}
        <span class="py-badge">加载 Pyodide…</span>
      {:else if loadErr}
        <button type="button" class="py-btn" onclick={() => initPyodide()}>重试</button>
      {:else}
        <span class="py-badge ok">就绪</span>
        <button type="button" class="py-btn primary" onclick={runCode} disabled={running || !pyodideReady}>
          {running ? '运行中…' : '▶ 运行并追踪'}
        </button>
        <button type="button" class="py-btn" onclick={clearAll}>清空</button>
      {/if}
    </div>
  </header>

  {#if loadErr}
    <p class="py-err">{loadErr}</p>
  {/if}

  {#if !compact}
    <div class="py-presets">
      {#each PRESETS as p}
        <button type="button" onclick={() => { code = p.code; trace = null; }}>{p.label}示例</button>
      {/each}
    </div>
  {/if}

  <div class="py-workspace">
    <section class="py-editor-pane">
      <div class="py-pane-head">
        <span class="py-lbl">代码</span>
        {#if activeLine}
          <span class="py-line-badge viz-pulse-soft">当前第 {activeLine} 行</span>
        {/if}
      </div>
      <div class="py-code-wrap">
        <div class="py-gutter" bind:this={gutterEl} aria-hidden="true">
          {#each lines as _, i}
            {@const ln = i + 1}
            <span
              class="py-gutter-line"
              class:active={ln === activeLine}
              class:hit={executedLines.has(ln)}
            >{ln}</span>
          {/each}
        </div>
        <PythonCodeEditor
          bind:this={editorRef}
          bind:code
          disabled={!pyodideReady}
          onscroll={syncGutterScroll}
        />
        {#if activeLine && lines[activeLine - 1] !== undefined}
          <div class="py-line-highlight" style="--line: {activeLine - 1}"></div>
        {/if}
      </div>
    </section>

    <aside class="py-side">
      <section class="py-steps-pane">
        <PythonStepPanel {trace} bind:activeStep {compact} />
      </section>
      <section class="py-output-pane">
        <div class="py-pane-head">
          <span class="py-lbl">终端输出</span>
        </div>
        <pre class="py-stdout">{stdout || (pyodideReady ? '（运行后显示 print 输出）' : '等待 Pyodide 加载…')}</pre>
      </section>
    </aside>
  </div>
</div>

<style>
  .py-ide {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: calc(100vh - 88px);
    padding: 12px 16px 16px;
    color: var(--text-primary);
  }
  .py-ide.compact {
    height: 100%;
    min-height: 0;
    padding: 0;
    gap: 8px;
  }
  .py-compact-title { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
  .py-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }
  .py-head h1 { margin: 0; font-size: 1.35rem; }
  .py-sub { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.84rem; }
  .py-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .py-badge {
    font-size: 0.75rem; padding: 4px 10px; border-radius: 999px;
    background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary);
  }
  .py-badge.ok { color: #7fe6c4; border-color: rgb(127 230 196 / 0.4); }
  .py-btn {
    padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border-color);
    background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; font-size: 0.84rem;
    transition: opacity var(--motion-step-fast);
  }
  .py-btn.primary {
    background: linear-gradient(135deg, #7fe6c4, #b48cff);
    color: #0a1f12; border-color: transparent; font-weight: 600;
  }
  .py-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .py-err { color: #ff9d9d; padding: 8px 12px; background: rgb(255 0 0 / 0.08); border-radius: 8px; margin: 0; }
  .py-presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .py-presets button {
    padding: 4px 10px; border-radius: 999px; border: 1px solid rgb(127 230 196 / 0.25);
    background: rgb(127 230 196 / 0.08); color: inherit; font-size: 0.72rem; cursor: pointer;
  }

  .py-workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(280px, 1fr) minmax(300px, 1fr);
    gap: 12px;
  }
  .py-ide.compact .py-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .py-editor-pane,
  .py-steps-pane,
  .py-output-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }
  .py-side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }
  .py-steps-pane { flex: 1.2; min-height: 0; padding: 12px; }
  .py-output-pane { flex: 0.8; min-height: 120px; }

  .py-pane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
  }
  .py-lbl {
    font-size: 0.72rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .py-line-badge {
    font-size: 0.68rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgb(127 230 196 / 0.15);
    color: #7fe6c4;
    font-weight: 600;
  }

  .py-code-wrap {
    position: relative;
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 42px 1fr;
    overflow: hidden;
  }
  .py-code-wrap :global(.py-code-editor) {
    min-height: 0;
  }
  .py-gutter {
    padding: 12px 0;
    overflow: hidden;
    background: rgb(0 0 0 / 0.15);
    border-right: 1px solid var(--border-color);
    user-select: none;
  }
  .py-gutter-line {
    display: block;
    height: 21px;
    line-height: 21px;
    text-align: right;
    padding-right: 8px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.25);
    transition: color var(--motion-step) var(--motion-step-ease), background var(--motion-step);
  }
  .py-gutter-line.hit { color: rgb(255 255 255 / 0.45); }
  .py-gutter-line.active {
    color: #7fe6c4;
    font-weight: 700;
    background: rgb(127 230 196 / 0.12);
    animation: viz-row-pulse 1.3s ease-in-out infinite;
  }

  .py-line-highlight {
    position: absolute;
    left: 42px;
    right: 0;
    top: calc(12px + var(--line) * 21px);
    height: 21px;
    background: rgb(127 230 196 / 0.1);
    border-left: 3px solid #7fe6c4;
    pointer-events: none;
    animation: viz-highlight-pulse-soft 1.4s ease-in-out infinite;
    transition: top var(--motion-step) var(--motion-step-ease);
  }

  .py-stdout {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 12px 14px;
    overflow: auto;
    font-family: 'IBM Plex Mono', 'Consolas', monospace;
    font-size: 0.82rem;
    line-height: 1.45;
    background: var(--code-output-bg);
    color: var(--code-output-fg);
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media (max-width: 960px) {
    .py-workspace { grid-template-columns: 1fr; }
    .py-ide { height: auto; min-height: calc(100vh - 88px); }
    .py-code-wrap, .py-steps-pane { min-height: 240px; }
  }
</style>
