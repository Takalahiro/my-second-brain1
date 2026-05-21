<script lang="ts">
  import { ROTATION_LOCKS, normalizeRotation, snapRotation } from '../../lib/widget-rotation';

  /**
   * 右下角旋转手柄：绕窗口中心旋转，松手吸附 0/90/180/270°。
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
  let showLocks = $state(false);
  let startAngle = 0;
  let startRot = 0;

  const lockLabels: Record<number, string> = {
    0: '0°',
    90: '90°',
    180: '180°',
    270: '360°',
  };

  function pointerAngle(cx: number, cy: number, px: number, py: number) {
    return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
  }

  function applyRotation(deg: number, snap = false) {
    const next = snap ? snapRotation(deg) : normalizeRotation(deg);
    onRotate(next);
  }

  function down(e: PointerEvent) {
    if (disabled) return;
    const c = getCenter();
    active = true;
    showLocks = true;
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
    // 拖动过程中若接近锁定角则弱吸附（8° 内）
    const normalized = normalizeRotation(next);
    for (const lock of ROTATION_LOCKS) {
      const dist = Math.min(Math.abs(normalized - lock), 360 - Math.abs(normalized - lock));
      if (dist <= 8) {
        next = lock;
        break;
      }
    }
    applyRotation(next, false);
  }

  function up(e: PointerEvent) {
    if (!active) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    active = false;
    applyRotation(rotation, true);
    onRotateEnd?.();
    window.setTimeout(() => {
      if (!active) showLocks = false;
    }, 1200);
  }

  function lockTo(deg: number) {
    applyRotation(deg, true);
    onRotateEnd?.();
  }
</script>

<div class="rotate-wrap" class:is-active={active} data-no-drag>
  {#if showLocks && !disabled}
    <div class="rotate-locks" role="group" aria-label="旋转锁定">
      {#each ROTATION_LOCKS as lock}
        <button
          type="button"
          class="rotate-lock"
          class:is-current={rotation === lock}
          title={`锁定 ${lockLabels[lock]}`}
          onclick={() => lockTo(lock)}
        >
          {lockLabels[lock]}
        </button>
      {/each}
    </div>
  {/if}
  <div
    class="rotate-handle"
    class:is-active={active}
    aria-label="旋转窗口"
    title="拖动旋转，松手吸附 90°"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onmouseenter={() => (showLocks = true)}
    onmouseleave={() => {
      if (!active) showLocks = false;
    }}
  >
    <span aria-hidden="true">↻</span>
  </div>
</div>

<style>
  .rotate-wrap {
    position: absolute;
    right: 4px;
    bottom: 4px;
    z-index: 8;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .rotate-locks {
    display: flex;
    gap: 3px;
    padding: 3px 4px;
    border-radius: 8px;
    background: rgb(20 14 32 / 0.88);
    border: 1px solid rgb(255 255 255 / 0.14);
    box-shadow: 0 4px 14px rgb(0 0 0 / 0.35);
  }
  .rotate-lock {
    min-width: 28px;
    height: 20px;
    padding: 0 4px;
    border-radius: 5px;
    border: 1px solid rgb(255 255 255 / 0.12);
    background: rgb(255 255 255 / 0.06);
    color: #d8ccf0;
    font-size: 0.58rem;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    line-height: 1;
  }
  .rotate-lock:hover {
    background: rgb(180 140 255 / 0.22);
  }
  .rotate-lock.is-current {
    background: rgb(180 140 255 / 0.38);
    border-color: rgb(180 140 255 / 0.55);
    color: #fff;
  }
  .rotate-handle {
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
