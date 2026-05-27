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
  const blocks = $derived(Math.round(shell.bgAlpha * 16));
</script>

<div
  bind:this={shell.rootEl}
  class="crt-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="crt-screen" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="crt" active={shell.dragging} />
    <header
      class="crt-head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="crt-head__marquee">*** SYSTEM READY ***</span>
      <h2 class="crt-head__title">{title}</h2>
      {#if subtitle}
        <p class="crt-head__sub">{subtitle}</p>
      {/if}
      <div class="crt-head__acts" data-no-drag>
        <button
          type="button"
          class="crt-key"
          class:is-active={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >F10 SETUP</button>
        {#if onClose}
          <button type="button" class="crt-key crt-key--abort" aria-label={closeLabel} onclick={onClose}>ESC ABORT</button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="crt-setup" data-no-drag>
        <p class="crt-setup__label">BRIGHTNESS</p>
        <pre class="crt-setup__bar">{ '█'.repeat(blocks) + '░'.repeat(16 - blocks) }</pre>
        <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} aria-label={ui.windowOpacity} />
        {#if settings}
          <div class="crt-setup__extra">{@render settings()}</div>
        {/if}
      </div>
    {/if}

    <div class="crt-body">{@render children?.()}</div>
    <footer class="crt-foot" aria-hidden="true">CHANNEL 03</footer>
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
