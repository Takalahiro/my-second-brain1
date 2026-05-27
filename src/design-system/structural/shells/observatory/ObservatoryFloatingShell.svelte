<script lang="ts">
  import ResizeHandles from '../../../../components/widgets/ResizeHandles.svelte';
  import RotateHandle from '../../../../components/widgets/RotateHandle.svelte';
  import { widgetTouchGestures } from '../../../../lib/widget-touch-gestures';
  import { getStructuralUi } from '../../structural-i18n';
  import { getMessages } from '../../../../lib/i18n/locale.svelte';
  import { getFrameHeaderMeta } from '../../lib/structural-copy';
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
  const obsLog = $derived(getFrameHeaderMeta('observatory', layoutKey));
</script>

<div
  bind:this={shell.rootEl}
  class="obs-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="obs-dome" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="observatory" active={shell.dragging} />
    <span class="obs-reticle" aria-hidden="true">+</span>

    <header
      class="obs-head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="obs-head__log">{obsLog}</span>
      <h2 class="obs-head__title">{title}</h2>
      {#if subtitle}
        <p class="obs-head__sub">{subtitle}</p>
      {/if}
      <div class="obs-head__acts" data-no-drag>
        <button
          type="button"
          class="obs-btn"
          class:is-active={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >GOTO</button>
        {#if onClose}
          <button type="button" class="obs-btn obs-btn--abort" aria-label={closeLabel} onclick={onClose}>ABORT</button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="obs-panel" data-no-drag>
        <span class="obs-panel__label">TRANSMISSION</span>
        <label class="obs-panel__row">
          <span>Gain</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} />
          <span>{Math.round(shell.bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="obs-panel__extra">{@render settings()}</div>
        {/if}
      </div>
    {/if}

    <div class="obs-body">{@render children?.()}</div>
    <footer class="obs-foot" aria-hidden="true">✦ · · · ✦ Cerro Paranal</footer>
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
  <RotateHandle rotation={shell.rotation} disabled={shell.showSettings} getCenter={shell.widgetCenter} onRotate={shell.onRotate} onRotateEnd={shell.onRotateEnd} />
</div>
