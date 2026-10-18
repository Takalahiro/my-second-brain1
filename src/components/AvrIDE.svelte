<script lang="ts">
  import AvrCodeEditor from './avr/AvrCodeEditor.svelte';
  import AvrAnnotatedSource from './avr/AvrAnnotatedSource.svelte';
  import AvrStepPanel from './avr/AvrStepPanel.svelte';
  import AvrDatapath from './avr/AvrDatapath.svelte';
  import { SAMPLE_ALU, SAMPLE_BLINK, SAMPLE_COUNT, SAMPLE_STRINGS, emptyTrace, runAvr, type AvrTraceResult } from '../lib/avr/engine';

  type CodeView = 'edit' | 'trace';

  let code = $state(SAMPLE_STRINGS);
  let trace = $state<AvrTraceResult | null>(null);
  let activeStep = $state(0);
  let codeView = $state<CodeView>('edit');

  const steps = $derived(trace?.steps ?? []);

  const presets = [
    { label: '字符串', code: SAMPLE_STRINGS },
    { label: '走灯', code: SAMPLE_BLINK },
    { label: '计数', code: SAMPLE_COUNT },
    { label: '运算', code: SAMPLE_ALU },
  ];

  function runCode() {
    trace = runAvr(code);
    activeStep = 0;
    if (trace.steps.length) codeView = 'trace';
  }

  function clearAll() {
    code = '';
    trace = emptyTrace();
    codeView = 'edit';
  }
</script>

<div class="avr-ide">
  <header class="avr-head">
    <div>
      <h1>AVR 汇编 Tutor</h1>
      <p class="avr-sub">源码在左，时间线与数据通路在右</p>
    </div>
    <div class="avr-actions">
      <span class="avr-badge ok">就绪</span>
      <button type="button" class="avr-btn primary" onclick={runCode}>▶ 运行并追踪</button>
      <button type="button" class="avr-btn" onclick={clearAll}>清空</button>
    </div>
  </header>

  {#if trace?.error}
    <p class="avr-err">{trace.error}</p>
  {/if}

  <div class="avr-presets">
    {#each presets as p}
      <button type="button" onclick={() => { code = p.code; trace = null; codeView = 'edit'; }}>{p.label}示例</button>
    {/each}
  </div>

  <div class="avr-workspace">
    <section class="avr-pane">
      <div class="avr-pane-head">
        <div class="avr-tabs">
          <button type="button" class:active={codeView === 'edit'} onclick={() => (codeView = 'edit')}>编辑</button>
          <button type="button" class:active={codeView === 'trace'} disabled={!steps.length} onclick={() => (codeView = 'trace')}>源码追踪</button>
        </div>
        {#if codeView === 'trace' && steps.length}
          <span class="avr-step-badge">步骤 {activeStep + 1}/{steps.length}</span>
        {/if}
      </div>
      <div class="avr-code-body">
        {#if codeView === 'edit'}
          <AvrCodeEditor bind:code />
        {:else if trace}
          <AvrAnnotatedSource {code} {steps} {activeStep} onStepPick={(i) => (activeStep = i)} />
        {/if}
      </div>
    </section>

    <aside class="avr-side">
      <section class="avr-pane avr-steps">
        <AvrStepPanel {trace} bind:activeStep />
      </section>
      <section class="avr-pane avr-path">
        <AvrDatapath {steps} bind:activeStep />
      </section>
    </aside>
  </div>
</div>

<style>
  .avr-ide {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: calc(100dvh - var(--site-nav-offset, 88px));
    padding: var(--space-3) var(--space-4) var(--space-4);
    color: var(--text);
  }
  .avr-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--space-3); }
  .avr-head h1 { margin: 0; font-family: var(--font-display); font-size: var(--text-xl); }
  .avr-sub { margin: var(--space-1) 0 0; color: var(--text-muted); font-size: var(--text-sm); }
  .avr-actions, .avr-presets, .avr-tabs { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
  .avr-badge, .avr-btn, .avr-presets button, .avr-tabs button {
    font-size: var(--text-sm);
    border-radius: var(--radius-button);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
  }
  .avr-badge { border-radius: 999px; font-size: var(--text-xs); cursor: default; }
  .avr-badge.ok { color: var(--color-success); }
  .avr-btn.primary { background: var(--accent); color: var(--on-accent); border-color: transparent; font-weight: var(--weight-semibold); }
  .avr-presets button { border-radius: 999px; font-size: var(--text-xs); background: var(--overlay-subtle); }
  .avr-err { margin: 0; color: var(--color-error); background: var(--color-error-soft); padding: var(--space-2) var(--space-3); border-radius: var(--radius-button); }
  .avr-workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(300px, 1.1fr) minmax(280px, 0.9fr);
    gap: var(--space-3);
  }
  .avr-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .avr-side { display: flex; flex-direction: column; gap: var(--space-3); min-height: 0; }
  .avr-steps { flex: 0.9; padding: var(--space-3); }
  .avr-path { flex: 1.15; }
  .avr-pane-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
  }
  .avr-tabs button { border-radius: 999px; font-size: var(--text-xs); background: transparent; color: var(--text-muted); }
  .avr-tabs button.active { background: var(--overlay-subtle); color: var(--text); border-color: var(--border); }
  .avr-tabs button:disabled { opacity: 0.4; cursor: not-allowed; }
  .avr-step-badge { font-size: var(--text-xs); color: var(--color-success); font-variant-numeric: tabular-nums; }
  .avr-code-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
  @media (max-width: 900px) {
    .avr-workspace { grid-template-columns: 1fr; overflow: auto; }
    .avr-ide { height: auto; min-height: calc(100dvh - var(--site-nav-offset, 88px)); }
  }
</style>
