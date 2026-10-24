<script lang="ts">
  import { onMount } from 'svelte';
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
  let codeRatio = $state(0.54);
  let stepsRatio = $state(0.24);
  let stacked = $state(false);
  let dragging = $state<'code' | 'steps' | null>(null);
  let workspaceEl = $state<HTMLDivElement | null>(null);
  let sideEl = $state<HTMLElement | null>(null);

  const LAYOUT_KEY = 'second-brain:avr-split';

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

  function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v));
  }

  function persistSplit() {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ codeRatio, stepsRatio }));
    } catch { /* ignore */ }
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { codeRatio?: number; stepsRatio?: number };
        if (typeof saved.codeRatio === 'number') codeRatio = clamp(saved.codeRatio, 0.22, 0.78);
        if (typeof saved.stepsRatio === 'number') stepsRatio = clamp(saved.stepsRatio, 0.16, 0.72);
      }
    } catch { /* ignore */ }
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => { stacked = mq.matches; };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  function dragSplit(which: 'code' | 'steps', e: PointerEvent) {
    const handle = e.currentTarget;
    if (!(handle instanceof HTMLElement)) return;
    const host = which === 'code' ? workspaceEl : sideEl;
    if (!host) return;
    dragging = which;
    e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const axis: 'x' | 'y' = which === 'steps' || stacked ? 'y' : 'x';
    const move = (ev: PointerEvent) => {
      const box = host.getBoundingClientRect();
      const span = axis === 'x' ? box.width : box.height;
      const offset = axis === 'x' ? ev.clientX - box.left : ev.clientY - box.top;
      if (span <= 0) return;
      const next = offset / span;
      if (which === 'code') codeRatio = clamp(next, 0.22, 0.78);
      else stepsRatio = clamp(next, 0.16, 0.72);
    };
    const end = () => {
      dragging = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      persistSplit();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function nudge(which: 'code' | 'steps', dir: number) {
    if (which === 'code') codeRatio = clamp(codeRatio + dir * 0.02, 0.22, 0.78);
    else stepsRatio = clamp(stepsRatio + dir * 0.02, 0.16, 0.72);
    persistSplit();
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

  <div class="avr-workspace" class:stacked class:is-dragging={dragging} bind:this={workspaceEl}>
    <section class="avr-pane avr-code" style="flex-basis: {codeRatio * 100}%">
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

    <button
      type="button"
      class="avr-split"
      role="separator"
      class:row={stacked}
      aria-label="调整代码框宽度"
      aria-orientation={stacked ? 'horizontal' : 'vertical'}
      aria-valuemin={22}
      aria-valuemax={78}
      aria-valuenow={Math.round(codeRatio * 100)}
      onpointerdown={(e) => dragSplit('code', e)}
      onkeydown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nudge('code', -1);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nudge('code', 1);
      }}
    ></button>

    <aside class="avr-side" bind:this={sideEl}>
      <section class="avr-pane avr-steps" style="flex-basis: {stepsRatio * 100}%">
        <AvrStepPanel {trace} bind:activeStep />
      </section>
      <button
        type="button"
        class="avr-split row"
        role="separator"
        aria-label="调整取指结果高度"
        aria-orientation="horizontal"
        aria-valuemin={16}
        aria-valuemax={72}
        aria-valuenow={Math.round(stepsRatio * 100)}
        onpointerdown={(e) => dragSplit('steps', e)}
        onkeydown={(e) => {
          if (e.key === 'ArrowUp') nudge('steps', -1);
          if (e.key === 'ArrowDown') nudge('steps', 1);
        }}
      ></button>
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
    height: 100%;
    min-height: 0;
    overflow: hidden;
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
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }
  .avr-workspace.stacked { flex-direction: column; }
  .avr-workspace.is-dragging { user-select: none; }
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
  .avr-code { flex: 0 0 auto; min-width: 0; min-height: 0; }
  .avr-side { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
  .avr-steps { flex: 0 0 auto; min-height: 0; padding: var(--space-3); }
  .avr-path {
    flex: 1 1 auto;
    min-height: min(48vh, 20rem);
    overflow: hidden;
  }
  .avr-split {
    flex: 0 0 10px;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: col-resize;
    position: relative;
  }
  .avr-split.row { cursor: row-resize; }
  .avr-split::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    background: var(--border);
  }
  .avr-split:not(.row)::after { top: 12px; bottom: 12px; left: 4px; width: 2px; }
  .avr-split.row::after { left: 12px; right: 12px; top: 4px; height: 2px; }
  .avr-split:hover::after, .avr-split:focus-visible::after { background: var(--accent); }
  .avr-split:focus-visible { outline: none; }
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
    .avr-split:not(.row)::after { left: 12px; right: 12px; top: 4px; bottom: auto; width: auto; height: 2px; }
  }
</style>
