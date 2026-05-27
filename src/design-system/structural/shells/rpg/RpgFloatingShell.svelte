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
    defaultAlpha = 0.96,
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
</script>

<div
  bind:this={shell.rootEl}
  class="rpg-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="rpg-window" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="rpg" active={shell.dragging} />
    <span class="rpg-orn rpg-orn--tl" aria-hidden="true">◆</span>
    <span class="rpg-orn rpg-orn--tr" aria-hidden="true">◆</span>
    <span class="rpg-orn rpg-orn--bl" aria-hidden="true">◆</span>
    <span class="rpg-orn rpg-orn--br" aria-hidden="true">◆</span>

    <header
      class="rpg-window__head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="rpg-window__cursor" aria-hidden="true">▶</span>
      <div class="rpg-window__titles">
        <h2 class="rpg-window__title">{title}</h2>
        {#if subtitle}
          <p class="rpg-window__sub">{subtitle}</p>
        {/if}
      </div>
      <div class="rpg-window__acts" data-no-drag>
        <button
          type="button"
          class="rpg-cmd"
          class:is-active={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >
          <span class="rpg-cmd__arrow">▶</span> CONFIG
        </button>
        {#if onClose}
          <button type="button" class="rpg-cmd rpg-cmd--close" aria-label={closeLabel} onclick={onClose}>
            <span class="rpg-cmd__arrow">▶</span> CLOSE
          </button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="rpg-config" data-no-drag>
        <p class="rpg-config__label">— WINDOW —</p>
        <label class="rpg-config__row">
          <span>OPACITY</span>
          <div class="rpg-xpbar">
            <div class="rpg-xpbar__fill" style="width:{Math.round(shell.bgAlpha * 100)}%"></div>
          </div>
          <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} />
        </label>
        {#if settings}
          <div class="rpg-config__extra">
            {@render settings()}
          </div>
        {/if}
      </div>
    {/if}

    <div class="rpg-window__body">
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
