<script lang="ts">
  import { onMount } from 'svelte';
  import { NEURAL_LAB, type NeuralLabDemoId } from '../../neural-lab-meta';
  import {
    disposeFormulaModel,
    scheduleFormulaModelPreload,
  } from '../../formula-recognizer/model-loader';
  import { disposeFormulaSolver } from '../../formula-recognizer/pyodide-solver';
  import { getFormulaDeviceProfile } from '../../formula-recognizer/mobile-profile';
  import DigitRecognizer from '../DigitRecognizer/DigitRecognizer.svelte';
  import CanvasFormulaRecognizer from '../../formula-recognizer/CanvasFormulaRecognizer.svelte';

  const deviceProfile = getFormulaDeviceProfile();

  function readInitialDemo(): NeuralLabDemoId {
    if (typeof window === 'undefined') return NEURAL_LAB.demoMnist.id;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (demo === NEURAL_LAB.demoFormula.id || demo === NEURAL_LAB.demoMnist.id) {
      return demo;
    }
    return NEURAL_LAB.demoMnist.id;
  }

  let activeDemo = $state<NeuralLabDemoId>(readInitialDemo());
  const isMnist = $derived(activeDemo === NEURAL_LAB.demoMnist.id);
  const isFormula = $derived(activeDemo === NEURAL_LAB.demoFormula.id);

  const activeMeta = $derived(
    activeDemo === NEURAL_LAB.demoFormula.id ? NEURAL_LAB.demoFormula : NEURAL_LAB.demoMnist
  );

  // 移动端切回 MNIST Tab 时，把公式 OCR / SymPy 占的内存清掉
  $effect(() => {
    if (isFormula || !deviceProfile.disposeOnInactive) return;
    disposeFormulaModel();
    disposeFormulaSolver();
  });

  onMount(() => {
    if (deviceProfile.preloadModel && !isFormula) {
      scheduleFormulaModelPreload();
    }

    const onPageHide = () => {
      disposeFormulaModel();
      disposeFormulaSolver();
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  });

  function selectDemo(id: NeuralLabDemoId) {
    activeDemo = id;
    const url = new URL(window.location.href);
    if (id === NEURAL_LAB.demoMnist.id) {
      url.searchParams.delete('demo');
    } else {
      url.searchParams.set('demo', id);
    }
    history.replaceState(null, '', url);
  }
</script>

<div class="neural-lab">
  <header class="nl-head">
    <div>
      <h1>{NEURAL_LAB.title}</h1>
      <p class="nl-sub">
        <span class="nl-demo-tag">演示</span>
        {activeMeta.title}
        <span class="nl-demo-desc">{activeMeta.subtitle}</span>
      </p>
    </div>

    <nav class="nl-tabs" aria-label="实验室演示模块">
      <button
        type="button"
        class="nl-tab"
        class:active={activeDemo === NEURAL_LAB.demoMnist.id}
        onclick={() => selectDemo(NEURAL_LAB.demoMnist.id)}
      >
        {NEURAL_LAB.demoMnist.tabLabel}
      </button>
      <button
        type="button"
        class="nl-tab"
        class:active={activeDemo === NEURAL_LAB.demoFormula.id}
        onclick={() => selectDemo(NEURAL_LAB.demoFormula.id)}
      >
        {NEURAL_LAB.demoFormula.tabLabel}
      </button>
    </nav>
  </header>

  <div class="nl-body">
    <div class="nl-panel" class:is-active={isMnist} aria-hidden={!isMnist}>
      <DigitRecognizer embedded paused={!isMnist} />
    </div>
    <div class="nl-panel" class:is-active={isFormula} aria-hidden={!isFormula}>
      <CanvasFormulaRecognizer
        embedded
        active={isFormula}
        answerLabel={NEURAL_LAB.demoFormula.answerLabel}
      />
    </div>
  </div>
</div>

<style>
  .neural-lab {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: calc(100dvh - var(--site-nav-offset, 88px));
    padding: var(--space-3) var(--space-4) var(--space-5);
    color: var(--text, var(--text-primary));
  }

  .nl-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--space-3);
  }

  .nl-head h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }

  .nl-sub {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    color: var(--text-muted, var(--text-secondary));
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .nl-demo-tag {
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    padding: 2px var(--space-2);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-out, var(--ui-accent)) 18%, transparent);
    color: var(--accent-out, var(--ui-accent));
    border: 1px solid color-mix(in srgb, var(--accent-out, var(--ui-accent)) 28%, transparent);
  }

  .nl-demo-desc {
    opacity: 0.92;
  }

  .nl-tabs {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-1);
    border-radius: var(--radius-button);
    border: 1px solid var(--border, var(--border-color));
    background: var(--overlay-subtle, var(--chrome-subtle));
  }

  .nl-tab {
    padding: var(--space-2) var(--space-3);
    border: 0;
    border-radius: calc(var(--radius-button) - 2px);
    background: transparent;
    color: var(--text-muted, var(--text-secondary));
    font-size: var(--text-sm);
    cursor: pointer;
    transition: background var(--motion-fast), color var(--motion-fast);
  }

  .nl-tab:hover {
    color: var(--text, var(--text-primary));
    background: var(--overlay-medium, var(--chrome-hover));
  }

  .nl-tab.active {
    color: var(--on-accent);
    font-weight: var(--weight-semibold);
    background: linear-gradient(135deg, var(--accent-out, var(--ui-accent)), color-mix(in srgb, var(--accent-out) 70%, var(--accent-in, var(--accent))));
    box-shadow: var(--shadow-sm);
  }

  .nl-body {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .nl-panel {
    width: 100%;
    min-height: 0;
  }

  /* 用 visibility 替代 display:none，避免首次切换时 canvas 布局为 0 */
  .nl-panel:not(.is-active) {
    visibility: hidden;
    position: absolute;
    inset: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .nl-panel.is-active {
    visibility: visible;
    position: relative;
    height: auto;
    overflow: visible;
    pointer-events: auto;
  }

  .nl-body :global(.digit-lab),
  .nl-body :global(.formula-lab) {
    min-height: auto;
    padding: 0;
  }
</style>
