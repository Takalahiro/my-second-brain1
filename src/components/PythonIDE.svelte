<script lang="ts">
  import { onMount, tick } from 'svelte';
  import PythonStepPanel from './python/PythonStepPanel.svelte';
  import PythonCodeEditor from './python/PythonCodeEditor.svelte';
  import PythonAnnotatedSource from './python/PythonAnnotatedSource.svelte';
  import PythonModuleFlow from './python/PythonModuleFlow.svelte';
  import { isHudSkinActive, subscribeHudMode } from '../features/ui/hud-mode.svelte';
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

  type CodeView = 'edit' | 'trace' | 'modules';

  let pyodideReady = $state(false);
  let tracerReady = $state(false);
  let loading = $state(true);
  let loadErr = $state<string | null>(null);
  let code = $state(SAMPLE_CODE);
  let stdout = $state('');
  let running = $state(false);
  let trace = $state<PythonTraceResult | null>(null);
  let activeStep = $state(0);
  let codeView = $state<CodeView>('edit');
  let hudMode = $state(false);
  let pyodide: PyodideApi | null = null;

  onMount(() => {
    hudMode = isHudSkinActive();
    const offHud = subscribeHudMode((v) => { hudMode = v; });
    void initPyodide();
    return offHud;
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
      if (parsed.steps.length > 0) {
        activeStep = 0;
        if (codeView === 'edit') codeView = 'trace';
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      stdout = msg;
      trace = { ...emptyTrace(), error: msg };
    } finally {
      running = false;
      await tick();
    }
  }

  function clearAll() {
    stdout = '';
    trace = null;
    activeStep = 0;
    codeView = 'edit';
  }

  function switchToEdit() {
    codeView = 'edit';
  }

  const PRESETS: Array<{ label: string; code: string }> = [
    { label: 'OOP', code: SAMPLE_CODE },
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

<div class="py-ide" class:compact class:is-hud-mission={hudMode}>
  {#if hudMode && !compact}
    <div class="hud-mission-bar">
      <span class="hud-mission-id">FLIGHT COMPUTER · PYTHON</span>
      <span class="hud-mission-patch" aria-hidden="true"></span>
      <span class="hud-mission-status">PYODIDE CORE · TRACE TELEMETRY</span>
    </div>
  {/if}
  <header class="py-head">
    {#if !compact}
      <div>
        <h1>Python 在线编译器</h1>
        <p class="py-sub">Pyodide 运行 · 源码追踪 / 模块分栏 / 调用栈，可切换</p>
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
        <button type="button" onclick={() => { code = p.code; trace = null; codeView = 'edit'; }}>{p.label}示例</button>
      {/each}
    </div>
  {/if}

  <div class="py-workspace">
    <section class="py-editor-pane">
      <div class="py-pane-head">
        <div class="py-pane-tabs">
          <button type="button" class:active={codeView === 'edit'} onclick={switchToEdit}>编辑</button>
          <button
            type="button"
            class:active={codeView === 'trace'}
            disabled={!trace?.steps.length}
            onclick={() => { codeView = 'trace'; }}
          >
            源码追踪
          </button>
          <button
            type="button"
            class:active={codeView === 'modules'}
            disabled={!trace?.steps.length}
            onclick={() => { codeView = 'modules'; }}
          >
            模块视图
          </button>
        </div>
        {#if codeView !== 'edit' && trace?.steps.length}
          <span class="py-line-badge">步骤 {activeStep + 1}/{trace.steps.length}</span>
        {/if}
      </div>

      <div class="py-code-body">
        {#if codeView === 'edit'}
          <PythonCodeEditor bind:code disabled={!pyodideReady} />
        {:else if trace}
          {#if codeView === 'trace'}
            <PythonAnnotatedSource
              {code}
              steps={trace.steps}
              {activeStep}
              onStepPick={(i) => { activeStep = i; }}
            />
          {:else}
            <PythonModuleFlow
              steps={trace.steps}
              {activeStep}
              onStepPick={(i) => { activeStep = i; }}
            />
          {/if}
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
    gap: var(--space-3);
    height: calc(100dvh - var(--site-nav-offset, 88px));
    padding: var(--space-3) var(--space-4) var(--space-4);
    color: var(--text, var(--text-primary));
  }
  .py-ide.compact {
    height: 100%;
    min-height: 0;
    padding: 0;
    gap: var(--space-2);
  }
  .py-compact-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--text-muted, var(--text-secondary)); }
  .py-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-3);
  }
  .py-head h1 { margin: 0; font-family: var(--font-display); font-size: var(--text-xl); font-weight: var(--weight-bold); }
  .py-sub { margin: var(--space-1) 0 0; color: var(--text-muted, var(--text-secondary)); font-size: var(--text-sm); }
  .py-actions { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
  .py-badge {
    font-size: var(--text-xs);
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
    background: var(--surface, var(--bg-secondary));
    border: 1px solid var(--border, var(--border-color));
    color: var(--text-muted, var(--text-secondary));
  }
  .py-badge.ok {
    color: var(--color-success);
    border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
  }
  .py-btn {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-button);
    border: 1px solid var(--border, var(--border-color));
    background: var(--surface, var(--bg-secondary));
    color: var(--text, var(--text-primary));
    cursor: pointer;
    font-size: var(--text-sm);
  }
  .py-btn.primary {
    background: linear-gradient(135deg, var(--color-success), var(--accent-out, var(--ui-accent)));
    color: var(--on-accent);
    border-color: transparent;
    font-weight: var(--weight-semibold);
    box-shadow: var(--shadow-sm);
  }
  .py-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .py-err {
    color: var(--color-error);
    padding: var(--space-2) var(--space-3);
    background: var(--color-error-soft);
    border-radius: var(--radius-button);
    margin: 0;
  }
  .py-presets { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .py-presets button {
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--color-success) 25%, transparent);
    background: var(--color-success-soft);
    color: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }

  .py-workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(300px, 1.1fr) minmax(280px, 0.9fr);
    gap: var(--space-3);
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
    background: var(--surface, var(--bg-secondary));
    border: 1px solid var(--border, var(--border-color));
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .py-side {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 0;
  }
  .py-steps-pane { flex: 1.25; min-height: 0; padding: var(--space-3); }
  .py-output-pane { flex: 0.75; min-height: 100px; }

  .py-pane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border, var(--border-color));
    gap: var(--space-2);
  }
  .py-pane-tabs {
    display: flex;
    gap: var(--space-1);
  }
  .py-pane-tabs button {
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted, var(--text-secondary));
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .py-pane-tabs button.active {
    background: var(--color-success-soft);
    border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
    color: var(--text, var(--text-primary));
    font-weight: var(--weight-semibold);
  }
  .py-pane-tabs button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .py-lbl {
    font-size: 0.72rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .py-line-badge {
    font-size: var(--text-xs);
    padding: 2px var(--space-2);
    border-radius: 999px;
    background: var(--color-success-soft);
    color: var(--color-success);
    font-weight: var(--weight-semibold);
    font-variant-numeric: tabular-nums;
  }

  .py-code-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    letter-spacing: 0;
    text-shadow: none;
    font-variant-ligatures: none;
  }

  .py-code-body :global(.py-code-editor) {
    flex: 1;
    min-height: 0;
  }

  .py-stdout {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 12px 14px;
    overflow: auto;
    font-family: 'IBM Plex Mono', 'JetBrains Mono', 'Consolas', monospace;
    font-size: 0.82rem;
    line-height: 1.45;
    letter-spacing: 0;
    text-shadow: none;
    font-variant-ligatures: none;
    background: var(--code-output-bg);
    color: var(--code-output-fg);
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media (max-width: 960px) {
    .py-workspace { grid-template-columns: 1fr; }
    .py-ide { height: auto; min-height: calc(100vh - 88px); }
    .py-code-body, .py-steps-pane { min-height: 260px; }
  }
</style>
