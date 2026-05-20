<script lang="ts">
  /**
   * macOS 风格三点：×（关闭）/ −（最小化）/ +（最大化）
   *
   * 任意一个回调缺省则隐藏对应点。
   */
  interface Props {
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    /** 当前是否最大化（决定 + 是否变为 还原 ↘） */
    maximized?: boolean;
  }
  let { onClose, onMinimize, onMaximize, maximized = false }: Props = $props();
</script>

<div class="mac-chrome" role="toolbar" aria-label="窗口控制" data-no-drag>
  {#if onClose}
    <button
      type="button"
      class="dot close"
      aria-label="关闭"
      title="关闭"
      onclick={(e) => { e.stopPropagation(); onClose?.(); }}
    ><span class="glyph">×</span></button>
  {/if}
  {#if onMinimize}
    <button
      type="button"
      class="dot min"
      aria-label="最小化"
      title="最小化"
      onclick={(e) => { e.stopPropagation(); onMinimize?.(); }}
    ><span class="glyph">−</span></button>
  {/if}
  {#if onMaximize}
    <button
      type="button"
      class="dot max"
      aria-label={maximized ? '还原' : '最大化'}
      title={maximized ? '还原' : '最大化'}
      onclick={(e) => { e.stopPropagation(); onMaximize?.(); }}
    ><span class="glyph">{maximized ? '↙' : '+'}</span></button>
  {/if}
</div>

<style>
  .mac-chrome {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    flex: 0 0 auto;
    user-select: none;
  }
  .dot {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 0;
    padding: 0;
    cursor: pointer;
    position: relative;
    box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease, filter 0.15s ease;
  }
  .dot:hover { transform: scale(1.05); filter: brightness(1.08); }
  .dot:active { transform: scale(0.96); }

  .close { background: #ff5f57; }
  .min   { background: #febc2e; }
  .max   { background: #28c840; }

  .glyph {
    font-size: 9px;
    line-height: 1;
    color: rgb(0 0 0 / 0);
    font-weight: 700;
    pointer-events: none;
    transition: color 0.15s ease;
  }
  .mac-chrome:hover .glyph { color: rgb(0 0 0 / 0.55); }
</style>
