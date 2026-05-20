<script lang="ts">
  /**
   * 右下角旋转手柄：绕窗口中心旋转。
   */
  interface Props {
    disabled?: boolean;
    getCenter: () => { x: number; y: number };
    rotation: number;
    onRotate: (deg: number) => void;
    onRotateEnd?: () => void;
  }
  let { disabled = false, getCenter, rotation, onRotate, onRotateEnd }: Props = $props();

  let active = false;
  let startAngle = 0;
  let startRot = 0;

  function pointerAngle(cx: number, cy: number, px: number, py: number) {
    return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
  }

  function down(e: PointerEvent) {
    if (disabled) return;
    const c = getCenter();
    active = true;
    startRot = rotation;
    startAngle = pointerAngle(c.x, c.y, e.clientX, e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  }
  function move(e: PointerEvent) {
    if (!active) return;
    const c = getCenter();
    const cur = pointerAngle(c.x, c.y, e.clientX, e.clientY);
    let next = startRot + (cur - startAngle);
    while (next > 180) next -= 360;
    while (next < -180) next += 360;
    onRotate(Math.round(next * 10) / 10);
  }
  function up(e: PointerEvent) {
    if (!active) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    active = false;
    onRotateEnd?.();
  }
</script>

<div
  class="rotate-handle"
  class:is-active={active}
  aria-label="旋转窗口"
  title="拖动旋转"
  data-no-drag
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  <span aria-hidden="true">↻</span>
</div>

<style>
  .rotate-handle {
    position: absolute;
    right: 6px;
    bottom: 6px;
    z-index: 8;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgb(255 255 255 / 0.28);
    background: rgb(40 28 60 / 0.75);
    color: #e8dcff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    cursor: grab;
    touch-action: none;
    user-select: none;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.35);
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .rotate-handle:hover {
    background: rgb(80 60 120 / 0.85);
    transform: scale(1.08);
  }
  .rotate-handle.is-active {
    cursor: grabbing;
    background: rgb(120 90 180 / 0.9);
  }
</style>
