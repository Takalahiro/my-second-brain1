<script lang="ts">
  import { onMount, tick } from 'svelte';
  import {
    formulaModelLoader,
    scheduleFormulaModelPreload,
    disposeFormulaModel,
  } from './model-loader';
  import { disposeFormulaSolver } from './pyodide-solver';
  import { copyText, renderLatexPreview } from './mathjax';
  import { getFormulaDeviceProfile } from './mobile-profile';
  import { FORMULA_DRAW_SIZE } from './types';
  import FormulaSolverPanel from './FormulaSolverPanel.svelte';

  const deviceProfile = getFormulaDeviceProfile();

  interface Props {
    width?: number;
    height?: number;
    embedded?: boolean;
    answerLabel?: string;
    /** 嵌入 Tab 切换时为 false；重新显示时会重置画布 */
    active?: boolean;
  }

  let {
    width = FORMULA_DRAW_SIZE,
    height = FORMULA_DRAW_SIZE,
    embedded = false,
    answerLabel = '识别答案',
    active = true,
  }: Props = $props();

  let canvas: HTMLCanvasElement | null = null;
  let answerEl: HTMLDivElement | null = null;
  let fileInput: HTMLInputElement | null = null;

  let drawing = false;
  let last: { x: number; y: number } | null = null;
  let hasInk = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let recognizeSeq = 0;

  let latex = $state('');
  let statusMessage = $state('');
  let errorMessage = $state<string | null>(null);
  let isRecognizing = $state(false);
  let copyOk = $state(false);
  let showLatex = $state(false);
  let highAccuracy = $state(deviceProfile.highAccuracyDefault);
  let autoSolve = $state(deviceProfile.autoSolveDefault);
  let modelPhase = $state(formulaModelLoader.state);
  let accelerator = $state(formulaModelLoader.accelerator);

  let canvasReady = false;
  let initSeq = 0;

  onMount(() => {
    const unsub = formulaModelLoader.subscribe((phase) => {
      modelPhase = phase;
      accelerator = formulaModelLoader.accelerator;
    });
    if (deviceProfile.preloadModel) scheduleFormulaModelPreload();
    return () => {
      unsub();
      clearDebounce();
      canvasReady = false;
      initSeq += 1;
    };
  });

  /** 移动端离开公式 Tab 时释放 OCR Worker + Pyodide，避免 Safari OOM */
  $effect(() => {
    if (active || !deviceProfile.disposeOnInactive) return;
    clearDebounce();
    recognizeSeq += 1;
    isRecognizing = false;
    disposeFormulaModel();
    disposeFormulaSolver();
  });

  $effect(() => {
    if (!active || !canvas) return;
    const seq = ++initSeq;
    canvasReady = false;
    void (async () => {
      await tick();
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (seq !== initSeq || !canvas || !active) return;
      initCanvas();
      canvasReady = true;
    })();
  });

  $effect(() => {
    if (!answerEl) return;
    void renderLatexPreview(answerEl, latex, {
      emptyText: '写完抬笔，答案会显示在这里',
    }).catch(() => {
      if (answerEl) answerEl.textContent = latex || '';
    });
  });

  function clearDebounce() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  function scheduleRecognize() {
    clearDebounce();
    debounceTimer = setTimeout(() => {
      void handleRecognize();
    }, 550);
  }

  function initCanvas() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setupStroke(ctx);
    hasInk = false;
  }

  function setupStroke(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = width >= 512 ? 4 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function getPos(e: PointerEvent) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: PointerEvent) {
    if (!canvas) return;
    e.preventDefault();
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    last = getPos(e);
    if (last) {
      const ctx = canvas.getContext('2d')!;
      setupStroke(ctx);
      ctx.beginPath();
      ctx.arc(last.x, last.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      hasInk = true;
    }
  }

  function moveDraw(e: PointerEvent) {
    if (!drawing || !canvas || !last) return;
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    const ctx = canvas.getContext('2d')!;
    setupStroke(ctx);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    hasInk = true;
  }

  function endDraw(e: PointerEvent) {
    if (!canvas) return;
    drawing = false;
    last = null;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (hasInk) scheduleRecognize();
  }

  function clearCanvas() {
    clearDebounce();
    recognizeSeq += 1;
    isRecognizing = false;
    initCanvas();
    latex = '';
    errorMessage = null;
    statusMessage = '';
    showLatex = false;
  }

  async function canvasToBlob(): Promise<Blob> {
    if (!canvas) throw new Error('画布未就绪');
    const scale = deviceProfile.exportScale;
    const exportCanvas = new OffscreenCanvas(canvas.width * scale, canvas.height * scale);
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('无法创建导出画布');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    return new Promise((resolve, reject) => {
      exportCanvas.convertToBlob({ type: 'image/png' }).then((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('无法导出画布'));
      }, reject);
    });
  }

  async function recognizeFromBlob(blob: Blob) {
    const seq = ++recognizeSeq;
    isRecognizing = true;
    errorMessage = null;
    statusMessage = '识别中…';

    try {
      const result = await formulaModelLoader.recognize(
        blob,
        (p) => {
          if (seq !== recognizeSeq) return;
          statusMessage = p.message;
        },
        { highAccuracy }
      );
      if (seq !== recognizeSeq) return;
      latex = result;
      if (!result.trim()) {
        errorMessage = '未识别到有效公式，请写大一些或重试';
      } else {
        statusMessage = '';
      }
    } catch (err) {
      if (seq !== recognizeSeq) return;
      errorMessage = err instanceof Error ? err.message : '识别失败，请稍后重试';
      statusMessage = '';
    } finally {
      if (seq === recognizeSeq) isRecognizing = false;
    }
  }

  async function handleRecognize() {
    if (!hasInk || isRecognizing) return;
    try {
      const blob = await canvasToBlob();
      await recognizeFromBlob(blob);
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : '识别失败';
      isRecognizing = false;
    }
  }

  function handleUploadClick() {
    fileInput?.click();
  }

  async function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      errorMessage = '请上传图片文件（PNG、JPG 等）';
      return;
    }

    if (canvas) {
      const bitmap = await createImageBitmap(file);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
      const w = bitmap.width * scale;
      const h = bitmap.height * scale;
      ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      bitmap.close();
      hasInk = true;
    }

    await recognizeFromBlob(file);
  }

  async function handleCopy() {
    if (!latex) return;
    copyOk = await copyText(latex);
    if (copyOk) setTimeout(() => (copyOk = false), 1800);
  }
</script>

<div class="formula-lab" class:embedded>
  {#if !embedded}
    <header class="fr-head">
      <div>
        <h1>数学公式识别</h1>
        <p class="fr-sub">Texo · FormulaNet · 纯前端 LaTeX OCR</p>
      </div>
      <div class="fr-badges">
        {#if modelPhase === 'loading'}
          <span class="badge run">{statusMessage || '加载模型…'}</span>
        {:else if modelPhase === 'ready'}
          <span class="badge ok">Texo 就绪{accelerator ? ` · ${accelerator.toUpperCase()}` : ''}</span>
        {:else if modelPhase === 'error'}
          <span class="badge err" title={formulaModelLoader.error ?? ''}>模型未就绪</span>
        {:else}
          <span class="badge">按需加载</span>
        {/if}
        {#if isRecognizing}
          <span class="badge run">{statusMessage || '识别中…'}</span>
        {/if}
      </div>
    </header>
  {:else}
    <div class="fr-badges fr-badges--embedded">
      {#if modelPhase === 'loading'}
        <span class="badge run">{statusMessage || '加载模型…'}</span>
      {:else if modelPhase === 'ready'}
        <span class="badge ok">Texo 就绪{accelerator ? ` · ${accelerator.toUpperCase()}` : ''}</span>
      {:else if modelPhase === 'error'}
        <span class="badge err" title={formulaModelLoader.error ?? ''}>模型未就绪</span>
      {:else}
        <span class="badge">按需加载</span>
      {/if}
      {#if isRecognizing}
        <span class="badge run">{statusMessage || '识别中…'}</span>
      {/if}
    </div>
  {/if}

  <div class="fr-grid">
    <section class="fr-panel">
      <div class="fr-panel-head">
        <h2>手写 / 上传</h2>
        <span class="fr-hint">{width}×{height}px 方屏 · 抬笔自动识别</span>
      </div>

      {#if deviceProfile.constrained}
        <p class="fr-mobile-note">
          移动端已启用省内存模式：单路推理、按需加载模型；SymPy 求解请点「重新求解」。
        </p>
      {/if}

      <div class="fr-canvas-wrap">
        <canvas
          bind:this={canvas}
          class="fr-canvas"
          {width}
          {height}
          onpointerdown={startDraw}
          onpointermove={moveDraw}
          onpointerup={endDraw}
          onpointercancel={endDraw}
          onpointerleave={endDraw}
          aria-label="手写公式画板"
        ></canvas>
      </div>

      <div class="fr-actions">
        <button type="button" class="fr-btn" onclick={clearCanvas}>清空</button>
        <button type="button" class="fr-btn" onclick={handleRecognize} disabled={isRecognizing || !hasInk}>
          重新识别
        </button>
        <button type="button" class="fr-btn" onclick={handleUploadClick}>上传图片</button>
        <label class="fr-toggle">
          <input type="checkbox" bind:checked={highAccuracy} />
          高精度（双路推理）
        </label>
        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          class="fr-file"
          onchange={handleFileChange}
        />
      </div>

      {#if errorMessage}
        <p class="fr-error" role="alert">{errorMessage}</p>
      {/if}
    </section>

    <section class="fr-panel fr-answer">
      <div class="fr-panel-head">
        <h2>{answerLabel}</h2>
        {#if latex}
          <button type="button" class="fr-copy" onclick={handleCopy}>
            {copyOk ? '已复制 LaTeX' : '复制 LaTeX'}
          </button>
        {/if}
      </div>

      <div class="fr-answer-box" class:busy={isRecognizing} aria-live="polite">
        {#if isRecognizing}
          <div class="fr-answer-loading">
            <span class="fr-spinner"></span>
            <span>{statusMessage || '正在识别…'}</span>
          </div>
        {/if}
        <div class="fr-answer-content" bind:this={answerEl}></div>
      </div>

      {#if latex}
        <details class="fr-latex-details" bind:open={showLatex}>
          <summary>查看 LaTeX 源码</summary>
          <pre class="fr-code" aria-label="LaTeX 源码">{latex}</pre>
        </details>
      {/if}
    </section>
  </div>

  {#if latex}
    <FormulaSolverPanel {latex} {autoSolve} />
  {:else if active}
    <FormulaSolverPanel latex="" {autoSolve} />
  {/if}
</div>

<style>
  .formula-lab {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: calc(100vh - 88px);
    padding: 12px 16px 24px;
    color: var(--text-primary);
    position: relative;
    z-index: 0;
  }

  .formula-lab.embedded {
    min-height: auto;
    padding: 0;
  }

  .fr-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }

  .fr-head h1 {
    margin: 0;
    font-size: 1.35rem;
  }

  .fr-sub {
    margin: 4px 0 0;
    font-size: 0.84rem;
    color: var(--text-secondary);
  }

  .fr-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .fr-badges--embedded {
    justify-content: flex-end;
  }

  .badge {
    font-size: 0.72rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .badge.ok {
    color: #9dffd0;
    border-color: rgb(0 255 157 / 0.35);
  }

  .badge.err {
    color: #ff9d9d;
    border-color: rgb(255 120 120 / 0.35);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge.run {
    color: #d4c0ff;
    border-color: rgb(180 140 255 / 0.35);
  }

  .fr-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .fr-grid {
      grid-template-columns: 1fr;
    }
  }

  .fr-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgb(180 140 255 / 0.25);
    background: linear-gradient(145deg, rgb(180 140 255 / 0.08), rgb(0 0 0 / 0.12));
    backdrop-filter: blur(12px);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 8px 32px rgb(0 0 0 / 0.15);
    position: relative;
    z-index: 1;
  }

  .fr-panel-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .fr-panel-head h2 {
    margin: 0;
    font-size: 0.95rem;
    color: #d4c0ff;
  }

  .fr-hint {
    font-size: 0.68rem;
    color: var(--text-secondary);
  }

  .fr-canvas-wrap {
    width: 100%;
    max-width: 512px;
    margin-inline: auto;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgb(180 140 255 / 0.35);
    box-shadow: 0 4px 20px rgb(0 0 0 / 0.12);
    background: #fff;
    position: relative;
    z-index: 2;
  }

  @media (max-width: 768px) {
    .fr-canvas-wrap {
      max-width: 100%;
    }
  }

  .fr-mobile-note {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.45;
    color: var(--text-secondary);
    padding: 8px 10px;
    border-radius: 8px;
    background: rgb(180 140 255 / 0.08);
    border: 1px solid rgb(180 140 255 / 0.18);
  }

  .fr-canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
    background: #fff;
  }

  .fr-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .fr-btn {
    flex: 1;
    min-width: 88px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgb(180 140 255 / 0.3);
    background: rgb(255 255 255 / 0.04);
    color: inherit;
    cursor: pointer;
    font-size: 0.82rem;
    transition: background 0.15s, opacity 0.15s;
  }

  .fr-btn:hover:not(:disabled) {
    background: rgb(180 140 255 / 0.12);
  }

  .fr-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .fr-file {
    display: none;
  }

  .fr-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid rgb(180 140 255 / 0.2);
    cursor: pointer;
    user-select: none;
  }

  .fr-toggle input {
    accent-color: #b48cff;
  }

  .fr-error {
    margin: 0;
    font-size: 0.82rem;
    color: #ff9d9d;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgb(255 100 100 / 0.08);
    border: 1px solid rgb(255 120 120 / 0.2);
  }

  .fr-answer {
    min-height: 280px;
  }

  .fr-copy {
    font-size: 0.72rem;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgb(180 140 255 / 0.35);
    background: rgb(180 140 255 / 0.1);
    color: inherit;
    cursor: pointer;
  }

  .fr-answer-box {
    position: relative;
    min-height: 180px;
    padding: 20px 16px;
    border-radius: 14px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid rgb(180 140 255 / 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-x: auto;
  }

  .fr-answer-box.busy .fr-answer-content {
    opacity: 0.35;
  }

  .fr-answer-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 0.85rem;
    color: var(--text-secondary);
    z-index: 1;
    pointer-events: none;
  }

  .fr-answer-content {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    transition: opacity 0.2s;
  }

  .fr-answer-content :global(.fr-mathjax-output) {
    color: var(--text-primary);
    font-size: clamp(1.2rem, 2.5vw, 1.75rem);
  }

  .fr-answer-content :global(.fr-preview-empty) {
    color: var(--text-secondary);
    font-size: 0.9rem;
    text-align: center;
  }

  .fr-latex-details {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .fr-latex-details summary {
    cursor: pointer;
    user-select: none;
    padding: 4px 0;
  }

  .fr-code {
    margin: 8px 0 0;
    padding: 12px;
    border-radius: 10px;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.78rem;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    background: rgb(0 0 0 / 0.2);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    max-height: 140px;
    overflow: auto;
  }

  .fr-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgb(180 140 255 / 0.25);
    border-top-color: #b48cff;
    border-radius: 50%;
    animation: fr-spin 0.7s linear infinite;
  }

  @keyframes fr-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
