<script lang="ts">
  import { untrack } from 'svelte';

  interface Props {
    onExpand: () => void;
  }

  let { onExpand }: Props = $props();

  const POS_KEY = 'second-brain:toc-orb-pos';

  let orbEl = $state<HTMLDivElement | null>(null);
  let left = $state(0);
  let top = $state(0);
  let ready = $state(false);

  let dragging = false;
  let didMove = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let suppressClick = false;

  function loadPos() {
    if (typeof localStorage === 'undefined') return { left: 0, top: 0 };
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (!raw) return { left: 0, top: 0 };
      const p = JSON.parse(raw);
      return {
        left: typeof p.x === 'number' ? p.x : 0,
        top: typeof p.y === 'number' ? p.y : 0,
      };
    } catch {
      return { left: 0, top: 0 };
    }
  }

  function savePos() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(POS_KEY, JSON.stringify({ x: left, y: top }));
  }

  function clampPos(l: number, t: number) {
    const w = orbEl?.offsetWidth ?? 40;
    const h = orbEl?.offsetHeight ?? 40;
    const margin = 8;
    return {
      left: Math.max(margin, Math.min(l, window.innerWidth - w - margin)),
      top: Math.max(margin, Math.min(t, window.innerHeight - h - margin)),
    };
  }

  function initPos() {
    const stored = untrack(() => loadPos());
    if (stored.left !== 0 || stored.top !== 0) {
      const c = clampPos(stored.left, stored.top);
      left = c.left;
      top = c.top;
    } else {
      // 默认位置：移动端右下角好按，桌面端右上角不挡正文
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      left = Math.max(8, window.innerWidth - 56);
      top = isDesktop ? 80 : Math.max(80, window.innerHeight - 96);
    }
    ready = true;
  }

  function onWindowResize() {
    if (!ready) return;
    const c = clampPos(left, top);
    if (c.left !== left || c.top !== top) {
      left = c.left;
      top = c.top;
      savePos();
    }
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', onWindowResize, { passive: true });
    return () => window.removeEventListener('resize', onWindowResize);
  });

  $effect(() => {
    if (orbEl && !ready) initPos();
  });

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 || !orbEl) return;
    dragging = true;
    didMove = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = left;
    startTop = top;
    try {
      orbEl.setPointerCapture(e.pointerId);
    } catch {
      /* 旧浏览器没有 setPointerCapture：忽略，pointermove 仍能工作 */
    }
    // 注意：不要 preventDefault，否则 Safari < 16 会吞掉随后的 click 事件
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didMove = true;
      // 第一次确认拖动后再 preventDefault，阻止误触发的滚动 / 选区
      e.preventDefault?.();
    }
    if (!didMove) return;
    const c = clampPos(startLeft + dx, startTop + dy);
    left = c.left;
    top = c.top;
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging || !orbEl) return;
    dragging = false;
    try {
      orbEl.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    savePos();
    if (didMove) suppressClick = true;
  }

  function handleClick() {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    onExpand();
  }
</script>

<div
  bind:this={orbEl}
  class="toc-orb"
  class:is-ready={ready}
  class:is-dragging={dragging}
  style:left={ready ? `${left}px` : undefined}
  style:top={ready ? `${top}px` : undefined}
  role="button"
  tabindex="0"
  title="展开目录（拖动移动）"
  aria-label="展开目录"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onclick={handleClick}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M3 6h18M3 12h18M3 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
  </svg>
</div>

<style>
  /*
   * 重要：默认 opacity 必须为 1（可见），且必须有一个 CSS-only 默认位置。
   * 否则在某些浏览器（Safari < 16.4 / 老 Edge / hydration 慢的设备）上，
   * 如果 $effect 没及时跑完 ready=true，悬浮球会永远不可见。
   * JS 加载完成后会通过 inline left/top 接管位置（参见 is-ready）。
   */
  .toc-orb {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    /* CSS-only 默认位置：移动端右下，桌面端右上 */
    right: 12px;
    bottom: 24px;
    top: auto;
    left: auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgb(229 231 235);
    background: rgb(255 255 255);
    color: rgb(55 65 81);
    cursor: grab;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
    z-index: 50;
    touch-action: none;
    user-select: none;
    transition: box-shadow 0.15s, transform 0.15s;
    /* 避免在长笔记里被某个 overflow 容器裁掉 */
    will-change: transform;
  }
  /* 一旦 JS hydrated，inline left/top 覆盖上面的 right/bottom */
  .toc-orb.is-ready {
    right: auto;
    bottom: auto;
  }
  .toc-orb:hover {
    transform: scale(1.05);
  }
  .toc-orb.is-dragging {
    cursor: grabbing;
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.25);
    transition: none;
  }
  :global(.dark) .toc-orb {
    background: rgb(17 24 39);
    border-color: rgb(55 65 81);
    color: rgb(229 231 235);
  }
  @media (min-width: 1024px) {
    .toc-orb {
      /* 桌面端默认右上 */
      top: 80px;
      bottom: auto;
      width: 40px;
      height: 40px;
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.12);
    }
  }
</style>
