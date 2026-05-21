<script lang="ts">
  import { onMount } from 'svelte';
  import { NEURAL_LAB, type NeuralLabDemoId } from '../../neural-lab-meta';
  import {
    disposeFormulaModel,
    scheduleFormulaModelPreload,
  } from '../../formula-recognizer/model-loader';
  import DigitRecognizer from '../DigitRecognizer/DigitRecognizer.svelte';
  import CanvasFormulaRecognizer from '../../formula-recognizer/CanvasFormulaRecognizer.svelte';

  let activeDemo = $state<NeuralLabDemoId>(NEURAL_LAB.demoMnist.id);
  /** 首次打开公式 Tab 后保持挂载，避免反复销毁 canvas / worker */
  let formulaMounted = $state(false);

  const activeMeta = $derived(
    activeDemo === NEURAL_LAB.demoFormula.id ? NEURAL_LAB.demoFormula : NEURAL_LAB.demoMnist
  );
  const isMnist = $derived(activeDemo === NEURAL_LAB.demoMnist.id);
  const isFormula = $derived(activeDemo === NEURAL_LAB.demoFormula.id);

  $effect(() => {
    if (isFormula) formulaMounted = true;
  });

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    if (demo === NEURAL_LAB.demoFormula.id || demo === NEURAL_LAB.demoMnist.id) {
      activeDemo = demo;
      if (demo === NEURAL_LAB.demoFormula.id) formulaMounted = true;
    }

    scheduleFormulaModelPreload();

    const onPageHide = () => disposeFormulaModel();
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
    <div class="nl-panel" class:is-active={isMnist}>
      <DigitRecognizer embedded paused={!isMnist} />
    </div>
    {#if formulaMounted}
      <div class="nl-panel" class:is-active={isFormula}>
        <CanvasFormulaRecognizer
          embedded
          active={isFormula}
          answerLabel={NEURAL_LAB.demoFormula.answerLabel}
        />
      </div>
    {/if}
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
    min-height: 0;
  }

  .nl-panel:not(.is-active) {
    display: none;
  }

  .nl-panel.is-active {
    display: block;
  }

  .nl-body :global(.digit-lab),
  .nl-body :global(.formula-lab) {
    min-height: auto;
    padding: 0;
  }
</style>
