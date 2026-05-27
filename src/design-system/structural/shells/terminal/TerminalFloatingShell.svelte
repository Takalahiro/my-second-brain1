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
  const prompt = $derived(getFrameHeaderMeta('terminal', layoutKey));
</script>

<div
  bind:this={shell.rootEl}
  class="term-float-root"
  class:is-dragging={shell.dragging}
  class:is-compact={compact}
  class:has-settings-open={shell.showSettings}
  style="left:{shell.posX}px;top:{shell.posY}px;width:{shell.width}px;height:{shell.height}px;z-index:{shell.zIndex};{shell.frameTransform}"
  use:widgetTouchGestures={shell.touchOpts}
  onpointermove={shell.onHeaderMove}
  onpointerup={shell.onHeaderUp}
  onpointercancel={shell.onHeaderUp}
>
  <div class="term-pane" style="opacity:{shell.bgAlpha}">
    <FloatingShellDragFx skin="terminal" active={shell.dragging} />
    <header
      class="term-head"
      onpointerdown={shell.onHeaderDown}
      onpointermove={shell.onHeaderMove}
      onpointerup={shell.onHeaderUp}
      onpointercancel={shell.onHeaderUp}
    >
      <span class="term-head__box-l" aria-hidden="true">╔</span>
      <div class="term-head__main">
        <p class="term-head__prompt">{prompt}</p>
        <h2 class="term-head__title">{title}</h2>
        {#if subtitle}
          <p class="term-head__sub">{subtitle}</p>
        {/if}
      </div>
      <span class="term-head__box-r" aria-hidden="true">╗</span>
      <div class="term-head__acts" data-no-drag>
        <button
          type="button"
          class="term-cmd"
          class:is-active={shell.showSettings}
          aria-label={ui.settings}
          aria-expanded={shell.showSettings}
          onclick={() => shell.toggleSettings()}
        >[config]</button>
        {#if onClose}
          <button type="button" class="term-cmd term-cmd--exit" aria-label={closeLabel} onclick={onClose}>[exit 1]</button>
        {/if}
      </div>
    </header>

    {#if shell.showSettings}
      <div class="term-config" data-no-drag>
        <pre class="term-config__bar">[{ '#'.repeat(Math.round(shell.bgAlpha * 10)) + '░'.repeat(10 - Math.round(shell.bgAlpha * 10)) }] {Math.round(shell.bgAlpha * 100)}%</pre>
        <input type="range" min="0.05" max="0.95" step="0.05" value={shell.bgAlpha} oninput={shell.onAlphaInput} aria-label={ui.windowOpacity} />
        {#if settings}
          <div class="term-config__extra">{@render settings()}</div>
        {/if}
      </div>
    {/if}

    <div class="term-body">{@render children?.()}</div>
    <footer class="term-foot" aria-hidden="true">──── tmux ────</footer>
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
