<script lang="ts">
  /**
   * 公共八向缩放手柄：N / S / E / W + 4 个角。
   * 父组件维护 width / height / posX / posY 四个 $state，把当前值传进来。
   * 缩放过程中通过 onResize({ x, y, w, h }) 回写。
   * 结束时调用 onResizeEnd() 用于持久化。
   */
  interface Props {
    width: number;
    height: number;
    x: number;
    y: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    disabled?: boolean;
    /** 等比缩放：x/y/wh 联动，按当前比例锁定 */
    aspectLock?: boolean;
    onResize: (next: { x: number; y: number; w: number; h: number }) => void;
    onResizeEnd?: () => void;
  }

  let {
    width,
    height,
    x,
    y,
    minWidth = 200,
    minHeight = 160,
    maxWidth = 2000,
    maxHeight = 1600,
    disabled = false,
    aspectLock = false,
    onResize,
    onResizeEnd,
  }: Props = $props();

  type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  let active: Edge | null = null;
  let start = { mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0, ratio: 1 };

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

  function down(e: PointerEvent, edge: Edge) {
    if (disabled) return;
    active = edge;
    start = {
      mx: e.clientX, my: e.clientY,
      x, y, w: width, h: height,
      ratio: height > 0 ? width / height : 1,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }
  function move(e: PointerEvent) {
    if (!active) return;
    const dx = e.clientX - start.mx;
    const dy = e.clientY - start.my;
    let nx = start.x, ny = start.y, nw = start.w, nh = start.h;
    if (active.includes('e')) nw = clamp(start.w + dx, minWidth, maxWidth);
    if (active.includes('w')) {
      const wn = clamp(start.w - dx, minWidth, maxWidth);
      nx = start.x + (start.w - wn);
      nw = wn;
    }
    if (active.includes('s')) nh = clamp(start.h + dy, minHeight, maxHeight);
    if (active.includes('n')) {
      const hn = clamp(start.h - dy, minHeight, maxHeight);
      ny = start.y + (start.h - hn);
      nh = hn;
    }
    if (aspectLock) {
      const r = start.ratio;
      // 以驱动方向为主，另一边按比例联动
      const widthDriven = Math.abs(dx) >= Math.abs(dy);
      if (widthDriven) {
        nh = clamp(nw / r, minHeight, maxHeight);
        if (active.includes('n')) ny = start.y + (start.h - nh);
      } else {
        nw = clamp(nh * r, minWidth, maxWidth);
        if (active.includes('w')) nx = start.x + (start.w - nw);
      }
    }
    onResize({ x: nx, y: ny, w: nw, h: nh });
  }
  function up(e: PointerEvent) {
    if (!active) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    active = null;
    onResizeEnd?.();
  }
</script>

{#if !disabled}
  <div class="rh rh-n"  aria-label="拉伸上边" onpointerdown={(e) => down(e, 'n')}  onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-s"  aria-label="拉伸下边" onpointerdown={(e) => down(e, 's')}  onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-e"  aria-label="拉伸右边" onpointerdown={(e) => down(e, 'e')}  onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-w"  aria-label="拉伸左边" onpointerdown={(e) => down(e, 'w')}  onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-ne" aria-label="拉伸右上角" onpointerdown={(e) => down(e, 'ne')} onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-nw" aria-label="拉伸左上角" onpointerdown={(e) => down(e, 'nw')} onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-se" aria-label="拉伸右下角" onpointerdown={(e) => down(e, 'se')} onpointermove={move} onpointerup={up} onpointercancel={up}></div>
  <div class="rh rh-sw" aria-label="拉伸左下角" onpointerdown={(e) => down(e, 'sw')} onpointermove={move} onpointerup={up} onpointercancel={up}></div>
{/if}

<style>
  .rh { position: absolute; z-index: 6; touch-action: none; }
  .rh-n, .rh-s { left: 14px; right: 14px; height: 8px; cursor: ns-resize; }
  .rh-e, .rh-w { top: 14px; bottom: 14px; width: 8px; cursor: ew-resize; }
  .rh-n { top: -4px; } .rh-s { bottom: -4px; }
  .rh-e { right: -4px; } .rh-w { left: -4px; }
  .rh-ne, .rh-nw, .rh-se, .rh-sw { width: 16px; height: 16px; border-radius: 6px; }
  .rh-ne { top: -4px; right: -4px; cursor: nesw-resize; }
  .rh-nw { top: -4px; left: -4px;  cursor: nwse-resize; }
  .rh-se { bottom: -4px; right: -4px; cursor: nwse-resize; }
  .rh-sw { bottom: -4px; left: -4px;  cursor: nesw-resize; }
  .rh:hover {
    background: rgb(255 255 255 / 0.12);
  }
  @media (max-width: 768px) {
    .rh-n, .rh-s, .rh-e, .rh-w { display: none; }
    .rh-ne, .rh-nw, .rh-se, .rh-sw { width: 22px; height: 22px; }
  }
</style>
