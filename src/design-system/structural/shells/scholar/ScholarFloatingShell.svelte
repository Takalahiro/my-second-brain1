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
  const chapter = $derived(getFrameHeaderMeta('scholar', layoutKey));
</script>

<div
  bind:this={shell.rootEl}
  class="folio-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="folio-page" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="scholar" active={shell.dragging} />
    <span class="folio-spine" aria-hidden="true"></span>

    <header
      class="folio-head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <div class="folio-head__main">
        <span class="folio-head__chapter">{chapter}</span>
        <h2 class="folio-head__title">{title}</h2>
        {#if subtitle}
          <p class="folio-head__sub">{subtitle}</p>
        {/if}
      </div>
      <div class="folio-head__acts" data-no-drag>
        <button
          type="button"
          class="folio-wax"
          class:is-on={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >
          <span
            class="folio-wax__seal sch-wax-seal sch-wax-seal--sm"
            class:is-glow={shell.showSettings}
            aria-hidden="true"
          >
            <span class="sch-wax-seal__letter">N</span>
            <span class="sch-wax-seal__sheen"></span>
          </span>
          Notes
        </button>
        {#if onClose}
          <button type="button" class="folio-wax folio-wax--close" aria-label={closeLabel} onclick={onClose}>
            <span class="folio-wax__seal sch-wax-seal sch-wax-seal--xs is-broken" aria-hidden="true">
              <span class="sch-wax-seal__crack"></span>
            </span>
          </button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="folio-margin" data-no-drag>
        <span class="folio-margin__tag">Marginalia</span>
        <label class="folio-margin__row">
          <span>Page opacity</span>
          <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} />
          <span>{Math.round(shell.bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="folio-margin__extra">{@render settings()}</div>
        {/if}
      </div>
    {/if}

    <div class="folio-body">{@render children?.()}</div>

    <footer class="folio-foot" aria-hidden="true">
      <span>❀</span><span>❀</span><span>❀</span>
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
  <RotateHandle rotation={shell.rotation} disabled={shell.showSettings} getCenter={shell.widgetCenter} onRotate={shell.onRotate} onRotateEnd={shell.onRotateEnd} />
</div>
