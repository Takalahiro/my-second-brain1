<script lang="ts">
  import SkinCloseButton from '../components/SkinCloseButton.svelte';
  import ResizeHandles from '../../../components/widgets/ResizeHandles.svelte';
  import RotateHandle from '../../../components/widgets/RotateHandle.svelte';
  import { widgetTouchGestures } from '../../../lib/widget-touch-gestures';
  import { getStructuralUi } from '../structural-i18n';
  import { getStructuralTheme } from '../registry';
  import { getFrameHeaderMeta } from '../lib/structural-copy';
  import FloatingShellDragFx from '../components/FloatingShellDragFx.svelte';
  import { useFloatingShell } from '../lib/floating-shell.svelte';
  import type { StructuralShellProps } from '../resolveStructuralShell';

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
    defaultAlpha = 0.88,
    compact = false,
    onClose,
    children,
    settings,
  }: StructuralShellProps = $props();

  const ui = $derived(getStructuralUi());
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
  const theme = $derived(getStructuralTheme(shell.skin));
  const headerMeta = $derived(getFrameHeaderMeta(shell.skin, layoutKey));
</script>

<div
  bind:this={shell.rootEl}
  class="structural-floating-root"
  data-skin={shell.skin}
  data-variant={theme.variant}
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="structural-frame structural-frame--{theme.variant}" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin={shell.skin} active={shell.dragging} />
    <header
      class="structural-frame__header"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="structural-frame__meta">{headerMeta}</span>
      <span class="structural-frame__badge">{theme.badge}</span>
      <div class="structural-frame__titles">
        <h2 class="structural-frame__title">{title}</h2>
        {#if subtitle}
          <span class="structural-frame__subtitle">{subtitle}</span>
        {/if}
      </div>
      <div class="structural-frame__actions" data-no-drag>
        <button
          type="button"
          class="structural-chrome-btn"
          class:is-active={shell.showSettings}
          title={ui.settings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >⚙</button>
        {#if onClose}
          <SkinCloseButton onclick={onClose} />
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="structural-frame__settings" data-no-drag>
        <label class="structural-setting-row">
          <span class="structural-setting-row__label">{ui.windowOpacity}</span>
          <input
            type="range"
            class="structural-setting-row__range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={shell.bgAlpha}
            oninput={shell.onAlphaInput}
          />
          <span class="structural-setting-row__val">{Math.round(shell.bgAlpha * 100)}%</span>
        </label>
        {#if settings}
          <div class="structural-settings-extra">
            {@render settings()}
          </div>
        {/if}
      </div>
    {/if}

    <div class="structural-frame__body">
      {@render children?.()}
    </div>
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
