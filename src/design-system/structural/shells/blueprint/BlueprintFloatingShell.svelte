<script lang="ts">
  import ResizeHandles from '../../../../components/widgets/ResizeHandles.svelte';
  import RotateHandle from '../../../../components/widgets/RotateHandle.svelte';
  import { widgetTouchGestures } from '../../../../lib/widget-touch-gestures';
  import { getStructuralUi } from '../../structural-i18n';
  import { getMessages } from '../../../../lib/i18n/locale.svelte';
  import FloatingShellDragFx from '../../components/FloatingShellDragFx.svelte';
  import { useFloatingShell } from '../../lib/floating-shell.svelte';
  import type { StructuralShellProps } from '../../resolveStructuralShell';

  let {
    layoutKey,
    title,
    subtitle = '',
    defaultW = 360,
    defaultH = 420,
    minW = 240,
    minH = 180,
    maxW = 1100,
    maxH = 900,
    defaultAlpha = 0.94,
    compact = false,
    onClose,
    children,
    settings,
  }: StructuralShellProps = $props();

  const ui = $derived(getStructuralUi());
  const closeLabel = $derived(getMessages().drawer.closeBtn);
  const shell = useFloatingShell(() => ({
    layoutKey,
    defaultW,
    defaultH,
    minW,
    minH,
    maxW,
    maxH,
    defaultAlpha,
  }));

  const sheetId = $derived(layoutKey.slice(0, 3).toUpperCase() || 'DWG');
  const showPencilRing = $derived(shell.dragging || shell.showSettings);
</script>

<div
  bind:this={shell.rootEl}
  class="bp-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="bp-sheet" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="blueprint" active={shell.dragging} />
    <span class="bp-reg bp-reg--tl" aria-hidden="true"></span>
    <span class="bp-reg bp-reg--tr" aria-hidden="true"></span>
    <span class="bp-reg bp-reg--bl" aria-hidden="true"></span>
    <span class="bp-reg bp-reg--br" aria-hidden="true"></span>

    {#if showPencilRing}
      <svg class="bp-pencil-ring" viewBox="0 0 200 160" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M18 14 C 52 6, 148 8, 182 18 C 194 48, 196 112, 178 142 C 142 154, 58 152, 22 138 C 8 108, 6 44, 18 14 Z"
          fill="none"
          stroke="#f4ecd8"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.82"
        />
      </svg>
    {/if}

    <header
      class="bp-titleblock"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <div class="bp-titleblock__main">
        <span class="bp-titleblock__sheet">{sheetId}-01</span>
        <h2 class="bp-titleblock__title">{title}</h2>
        {#if subtitle}
          <p class="bp-titleblock__sub">{subtitle}</p>
        {/if}
      </div>
      <div class="bp-titleblock__meta" data-no-drag>
        <span class="bp-dim">SCALE 1:1</span>
        <span class="bp-dim">UNITS mm</span>
        <div class="bp-titleblock__acts">
          <button
            type="button"
            class="bp-btn bp-btn--note"
            class:is-active={shell.showSettings}
            aria-label={ui.settings}
            aria-expanded={shell.showSettings}
            onclick={() => shell.toggleSettings()}
          >REV</button>
          {#if onClose}
            <button type="button" class="bp-btn bp-btn--red bp-btn--close-x" aria-label={closeLabel} onclick={onClose}>×</button>
          {/if}
        </div>
      </div>
    </header>

    {#if shell.showSettings}
      <div class="bp-revision" data-no-drag>
        <span class="bp-revision__tag">REVISION NOTE</span>
        <label class="bp-revision__row">
          <span>TRACE OPACITY</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} />
          <span>{Math.round(shell.bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="bp-revision__extra">
            {@render settings()}
          </div>
        {/if}
      </div>
    {/if}

    <div class="bp-body">
      {@render children?.()}
    </div>

    <footer class="bp-footer" aria-hidden="true">
      <span>DRAWN</span>
      <span class="bp-footer__line"></span>
      <span>CHKD</span>
      <span class="bp-footer__line"></span>
      <span>DATE</span>
    </footer>
  </div>

  <ResizeHandles
    disabled={shell.showSettings}
    width={shell.width}
    height={shell.height}
    x={shell.posX}
    y={shell.posY}
    minWidth={shell.minW}
    minHeight={shell.minH}
    maxWidth={shell.maxW}
    maxHeight={shell.maxH}
    onResize={shell.onResize}
    onResizeEnd={shell.onResizeEnd}
  />
  <RotateHandle
    disabled={shell.showSettings}
    rotation={shell.rotation}
    getCenter={shell.widgetCenter}
    onRotate={shell.onRotate}
    onRotateEnd={shell.onRotateEnd}
  />
</div>
