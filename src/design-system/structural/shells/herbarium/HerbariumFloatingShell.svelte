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
  const catalog = $derived(getFrameHeaderMeta('herbarium', layoutKey));
</script>

<div
  bind:this={shell.rootEl}
  class="herb-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="herb-mount" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="herbarium" active={shell.dragging} />
    <span class="herb-corner herb-corner--tl" aria-hidden="true"></span>
    <span class="herb-corner herb-corner--tr" aria-hidden="true"></span>
    <span class="herb-corner herb-corner--bl" aria-hidden="true"></span>
    <span class="herb-corner herb-corner--br" aria-hidden="true"></span>

    <header
      class="herb-head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="herb-head__cat">{catalog}</span>
      <h2 class="herb-head__title">{title}</h2>
      {#if subtitle}
        <p class="herb-head__sub"><em>{subtitle}</em></p>
      {/if}
      <div class="herb-head__acts" data-no-drag>
        <button
          type="button"
          class="herb-stamp"
          class:is-on={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >FILE</button>
        {#if onClose}
          <button type="button" class="herb-stamp herb-stamp--reject" aria-label={closeLabel} onclick={onClose}>CLOSE</button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="herb-label" data-no-drag>
        <span class="herb-label__tag">Preservation</span>
        <label class="herb-label__row">
          <span>Mount opacity</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} />
          <span>{Math.round(shell.bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="herb-label__extra">{@render settings()}</div>
        {/if}
      </div>
    {/if}

    <div class="herb-body">{@render children?.()}</div>
    <footer class="herb-foot" aria-hidden="true">┄┄┄ HERBARIUM CANTABRIGIENSE ┄┄┄</footer>
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
