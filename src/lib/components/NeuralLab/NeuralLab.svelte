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

  /** 移动端切回 MNIST Tab 时释放公式 OCR / SymPy 占用的内存 */
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
    gap: 16px;
    min-height: calc(100vh - 88px);
    padding: 12px 16px 20px;
    color: var(--text-primary);
  }

  .nl-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }

  .nl-head h1 {
    margin: 0;
    font-size: 1.35rem;
  }

  .nl-sub {
    margin: 6px 0 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .nl-demo-tag {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgb(180 140 255 / 0.18);
    color: #c4a8ff;
    border: 1px solid rgb(180 140 255 / 0.28);
  }

  .nl-demo-desc {
    opacity: 0.92;
  }

  .nl-tabs {
    display: flex;
    gap: 6px;
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgb(180 140 255 / 0.2);
    background: rgb(180 140 255 / 0.06);
  }

  .nl-tab {
    padding: 8px 14px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.82rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .nl-tab:hover {
    color: var(--text-primary);
    background: rgb(180 140 255 / 0.1);
  }

  .nl-tab.active {
    color: #1c0f30;
    font-weight: 650;
    background: linear-gradient(135deg, #b48cff, #7ec8ff);
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
