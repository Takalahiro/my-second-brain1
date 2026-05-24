<script lang="ts">
  import { onMount } from 'svelte';
  import { media, type TrackEntry } from '../../lib/media';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { signalWaveBars } from '../../lib/hud-widget-ui';
  import { getWidgetTier, tierClass } from '../../lib/widget-size-tier';
  import { clampPosition, getWidgetSafeTop } from '../../lib/floating-widget-layout';

  interface Props {
    onClose?: () => void;
    globalMuted?: boolean;
  }
  let { onClose, globalMuted = false }: Props = $props();

  const STORAGE_KEY = 'second-brain:music';
  const LAYOUT_KEY = 'second-brain:music-layout';
  const ORB_KEY = 'second-brain:music-orb';
  type PlayMode = 'sequence' | 'shuffle' | 'one';

  let tracks = $state<TrackEntry[]>(media.tracks);
  let currentIndex = $state(0);
  let playing = $state(false);
  let progress = $state(0);
  let duration = $state(0);
  let position = $state(0);
  let volume = $state(0.6);
  let muted = $state(false);
  let mode = $state<PlayMode>('sequence');
  let showList = $state(false);
  let showSettings = $state(false);
  let bgAlpha = $state(0.7);
  let minimized = $state(false);
  let maximized = $state(false);
  let audioEl: HTMLAudioElement | null = null;

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(380);
  let height = $state(500);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  // CD 触控手势状态
  let cdGesture = false;
  let cdGestureMoved = false;
  let cdStart = { x: 0, y: 0, t: 0 };
  let cdDragX = $state(0);
  // CD 切盘动画状态：idle | flying-left | flying-right | warp-left | warp-right
  let cdAnim = $state<'idle' | 'flying-left' | 'flying-right' | 'warp-left' | 'warp-right'>('idle');
  let cdAnimating = false;

  // 悬浮球
  let orbX = $state(-1);
  let orbY = $state(-1);
  let orbEl: HTMLButtonElement | null = null;
  let orbDragging = $state(false);
  let orbMoved = false;
  let orbDragStart = { x: 0, y: 0, px: 0, py: 0 };

  const current = $derived<TrackEntry | undefined>(tracks[currentIndex]);

  onMount(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.index === 'number' && s.index >= 0 && s.index < tracks.length) currentIndex = s.index;
        if (typeof s.volume === 'number') volume = clamp(s.volume, 0, 1);
        if (typeof s.muted === 'boolean') muted = s.muted;
        if (s.mode === 'sequence' || s.mode === 'shuffle' || s.mode === 'one') mode = s.mode;
        if (typeof s.minimized === 'boolean') minimized = s.minimized;
        if (typeof s.maximized === 'boolean') maximized = s.maximized;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.width === 'number') width = clamp(s.width, 280, 900);
        if (typeof s.height === 'number') height = clamp(s.height, 380, 1100);
        if (typeof s.x === 'number') posX = s.x;
        if (typeof s.y === 'number') posY = s.y;
        rotation = layoutRotation(s);
      }
    } catch {}
    try {
      const raw = localStorage.getItem(ORB_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.x === 'number') orbX = s.x;
        if (typeof s.y === 'number') orbY = s.y;
      }
    } catch {}

    if (posX < 0 || posY < 0) {
      posX = Math.max(16, window.innerWidth - width - 220);
      posY = Math.max(16, window.innerHeight - height - 80);
    }
    if (orbX < 0 || orbY < 0) {
      orbX = window.innerWidth - 48 - 24;
      orbY = window.innerHeight - 48 - 220;
    }
    clampPos();
    clampOrb();

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowRight' && (e.shiftKey || e.metaKey || e.ctrlKey)) { e.preventDefault(); next(); }
      else if (e.code === 'ArrowLeft' && (e.shiftKey || e.metaKey || e.ctrlKey)) { e.preventDefault(); prev(); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); setVolume(volume + 0.05); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); setVolume(volume - 0.05); }
    };
    window.addEventListener('keydown', onKey);
    const onResize = () => { clampPos(); clampOrb(); };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  });

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
  function clampPos() {
    if (typeof window === 'undefined') return;
    const p = clampPosition(posX, posY, width, height);
    posX = p.x;
    posY = p.y;
  }
  function clampOrb() {
    if (typeof window === 'undefined') return;
    const minY = getWidgetSafeTop();
    orbX = clamp(orbX, 4, Math.max(4, window.innerWidth - 56));
    orbY = clamp(orbY, minY, Math.max(minY, window.innerHeight - 56));
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, width, height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function persistOrb() {
    try { localStorage.setItem(ORB_KEY, JSON.stringify({ x: orbX, y: orbY })); } catch {}
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: currentIndex, volume, muted, mode, minimized, maximized, bgAlpha })); } catch {}
  }

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, select, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (dragging) {
      posX = dragStart.px + (e.clientX - dragStart.x);
      posY = dragStart.py + (e.clientY - dragStart.y);
      clampPos();
    }
  }
  function onPointerUp(e: PointerEvent) {
    if (dragging) {
      dragging = false;
      rootEl?.releasePointerCapture?.(e.pointerId);
      persistLayout();
    }
  }

  function onOrbPointerDown(e: PointerEvent) {
    if (!orbEl) return;
    orbDragging = true;
    orbMoved = false;
    orbDragStart = { x: e.clientX, y: e.clientY, px: orbX, py: orbY };
    orbEl.setPointerCapture?.(e.pointerId);
  }
  function onOrbPointerMove(e: PointerEvent) {
    if (!orbDragging) return;
    const dx = e.clientX - orbDragStart.x;
    const dy = e.clientY - orbDragStart.y;
    if (!orbMoved && Math.hypot(dx, dy) > 4) orbMoved = true;
    orbX = orbDragStart.px + dx;
    orbY = orbDragStart.py + dy;
    clampOrb();
  }
  function onOrbPointerUp(e: PointerEvent) {
    if (!orbDragging) return;
    orbDragging = false;
    orbEl?.releasePointerCapture?.(e.pointerId);
    if (orbMoved) persistOrb();
    else { minimized = false; persist(); }
  }

  $effect(() => {
    if (!audioEl) return;
    audioEl.volume = volume;
    audioEl.muted = muted || globalMuted;
  });

  // 换 track 时主动 reload，有些浏览器会卡在旧 src 上
  let lastSrc = '';
  $effect(() => {
    const src = current?.src ?? '';
    if (audioEl && src !== lastSrc) {
      lastSrc = src;
      try { audioEl.load(); } catch {}
    }
  });

  function togglePlay() {
    if (!audioEl) return;
    if (audioEl.paused) void audioEl.play().catch(() => {});
    else audioEl.pause();
  }
  function next(manual = true) {
    if (tracks.length === 0) return;
    if (mode === 'shuffle') {
      if (tracks.length === 1) currentIndex = 0;
      else { let n = currentIndex; while (n === currentIndex) n = Math.floor(Math.random() * tracks.length); currentIndex = n; }
    } else {
      currentIndex = (currentIndex + 1) % tracks.length;
    }
    if (manual) playing = true;
    persist();
    setTimeout(() => audioEl && audioEl.play().catch(() => {}), 0);
  }
  function prev() {
    if (tracks.length === 0) return;
    currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    persist();
    setTimeout(() => audioEl && audioEl.play().catch(() => {}), 0);
  }
  function onEnded() {
    if (mode === 'one') { if (audioEl) { audioEl.currentTime = 0; void audioEl.play().catch(() => {}); } }
    else next(false);
  }
  function onTimeUpdate() {
    if (!audioEl || isNaN(audioEl.duration)) return;
    duration = audioEl.duration;
    position = audioEl.currentTime;
    progress = duration > 0 ? position / duration : 0;
  }
  function seekFraction(frac: number) {
    if (!audioEl || isNaN(audioEl.duration)) return;
    const f = clamp(frac, 0, 1);
    progress = f;
    audioEl.currentTime = f * audioEl.duration;
  }
  function seek(e: Event) {
    seekFraction(Number((e.target as HTMLInputElement).value));
  }
  function setVolume(v: number) { volume = clamp(v, 0, 1); if (volume > 0) muted = false; persist(); }
  function toggleMute() { muted = !muted; persist(); }
  function pickTrack(i: number) { currentIndex = i; persist(); setTimeout(() => audioEl && audioEl.play().catch(() => {}), 0); }
  function toggleMode() { mode = mode === 'sequence' ? 'shuffle' : mode === 'shuffle' ? 'one' : 'sequence'; persist(); }
  const modeLabel = $derived(mode === 'sequence' ? '顺序' : mode === 'shuffle' ? '随机' : '单曲');

  function toggleList() { showList = !showList; showSettings = false; }
  function toggleSettings() { showSettings = !showSettings; showList = false; }
  function doMinimize() { minimized = true; maximized = false; persist(); }
  function doMaximize() { maximized = !maximized; persist(); }

  // ============ CD 滑动手势：跟手 + 切盘动画 ============
  function onCdPointerDown(e: PointerEvent) {
    const t = e.target as HTMLElement;
    // 点中央播放区 / 外圈进度环 → 不当作切歌手势
    if (t.closest('.cd-center-btn, .cd-tonearm')) return;
    if (cdAnimating) return;
    cdGesture = true;
    cdGestureMoved = false;
    cdStart = { x: e.clientX, y: e.clientY, t: Date.now() };
    cdDragX = 0;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onCdPointerMove(e: PointerEvent) {
    if (!cdGesture) return;
    const dx = e.clientX - cdStart.x;
    const dy = e.clientY - cdStart.y;
    if (!cdGestureMoved && Math.hypot(dx, dy) > 6) cdGestureMoved = true;
    // 跟手平移（横向占优时）
    if (cdGestureMoved && Math.abs(dx) > Math.abs(dy)) {
      cdDragX = dx;
    }
  }
  async function onCdPointerUp(e: PointerEvent) {
    if (!cdGesture) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    cdGesture = false;
    const dx = e.clientX - cdStart.x;
    const dy = e.clientY - cdStart.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dt = Date.now() - cdStart.t;

    // 没有移动 → 点击 = 播放/暂停
    if (!cdGestureMoved) {
      cdDragX = 0;
      togglePlay();
      return;
    }
    // 上下滑（短时长）→ 调音量
    if (ady > 40 && ady > adx && dt < 600) {
      cdDragX = 0;
      if (dy < 0) setVolume(volume + 0.1);
      else setVolume(volume - 0.1);
      return;
    }
    // 横向滑：达到阈值 → 切盘动画切歌
    if (adx > 60 && adx > ady) {
      await runSwap(dx > 0 ? 'prev' : 'next');
      return;
    }
    // 不足阈值 → 弹回
    cdDragX = 0;
  }

  function wait(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

  async function runSwap(direction: 'prev' | 'next') {
    if (cdAnimating) return;
    cdAnimating = true;
    // 1) 飞出
    cdDragX = 0;
    cdAnim = direction === 'next' ? 'flying-left' : 'flying-right';
    await wait(280);
    // 2) 切歌（audio src 自动跟随）
    if (direction === 'next') next(true);
    else prev();
    // 3) warp 到反向起点（无过渡）
    cdAnim = direction === 'next' ? 'warp-right' : 'warp-left';
    await wait(20);
    // 4) 回到原位带过渡
    cdAnim = 'idle';
    await wait(360);
    cdAnimating = false;
  }

  // 暴露给列表选择，做切盘动画
  async function pickTrackAnimated(i: number) {
    if (i === currentIndex) return;
    const dir = i > currentIndex ? 'next' : 'prev';
    cdAnimating = true;
    cdAnim = dir === 'next' ? 'flying-left' : 'flying-right';
    await wait(280);
    currentIndex = i;
    persist();
    setTimeout(() => audioEl && audioEl.play().catch(() => {}), 0);
    cdAnim = dir === 'next' ? 'warp-right' : 'warp-left';
    await wait(20);
    cdAnim = 'idle';
    await wait(360);
    cdAnimating = false;
  }

  // ============ 竖向进度条（CD 旁边） ============
  let vprogEl: HTMLDivElement | null = null;
  let vprogDragging = false;

  function vprogPointerDown(e: PointerEvent) {
    vprogDragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    applyVprog(e.clientY);
    e.stopPropagation();
  }
  function vprogPointerMove(e: PointerEvent) {
    if (!vprogDragging) return;
    applyVprog(e.clientY);
  }
  function vprogPointerUp(e: PointerEvent) {
    if (!vprogDragging) return;
    vprogDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }
  function applyVprog(clientY: number) {
    if (!vprogEl) return;
    const box = vprogEl.getBoundingClientRect();
    // 顶部 = 0%, 底部 = 100%（音乐进度上→下增长）
    const f = clamp((clientY - box.top) / box.height, 0, 1);
    seekFraction(f);
  }

  function timeStr(t: number) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // CD 尺寸（给右侧竖向进度条留出 56px 空间）
  const cdSize = $derived(Math.min(width - 56 - 56, height - 220));
  const waveBars = $derived(signalWaveBars(currentIndex * 997 + Math.floor(progress * 100), playing ? 20 : 12));
  const tier = $derived(getWidgetTier({ width, height, minimized, maximized, compactMax: 300, expandedMin: 520 }));

  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x; posY = y; width = w; height = h; clampPos();
  }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 280, minHeight: 380, maxWidth: 900, maxHeight: 1100 }
    )
  );
</script>

{#if tracks.length > 0}
  <audio
    bind:this={audioEl}
    src={current?.src}
    preload="metadata"
    onplay={() => (playing = true)}
    onpause={() => (playing = false)}
    onended={onEnded}
    ontimeupdate={onTimeUpdate}
    onloadedmetadata={onTimeUpdate}
  ></audio>

  {#if minimized}
    <button
      type="button"
      bind:this={orbEl}
      class="music-orb {orbDragging ? 'is-dragging' : ''}"
      style="left: {orbX}px; top: {orbY}px;"
      onpointerdown={onOrbPointerDown}
      onpointermove={onOrbPointerMove}
      onpointerup={onOrbPointerUp}
      onpointercancel={onOrbPointerUp}
      aria-label="展开音乐播放器"
      title={current ? `${current.title} · ${current.artist}` : '展开音乐'}
    >
      <span class="orb-icon" class:is-playing={playing}>♪</span>
    </button>
  {:else}
    <section
      bind:this={rootEl}
      class="music-cd {tierClass(tier)} {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''}"
      style={rotationStyle(rotation, (maximized ? '' : `left: ${posX}px; top: ${posY}px; width: ${width}px; height: ${height}px;`) + ` --mp-bg-alpha: ${bgAlpha};`)}
      aria-label="CD 音乐机"
      use:widgetTouchGestures={touchOpts}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
    >
      <header class="mp-header" onpointerdown={onHeaderPointerDown}>
        <WindowChrome
          onClose={() => onClose?.()}
          onMinimize={doMinimize}
          onMaximize={doMaximize}
          maximized={maximized}
        />
        <div class="mp-title-area">
          <div class="mp-title" title={current?.title}>{current?.title || '—'}</div>
          <div class="mp-artist" title={current?.artist}>{current?.artist || '未知艺术家'}</div>
        </div>
        <div class="mp-actions" data-no-drag>
          <button type="button" class="icon-btn small" onclick={toggleSettings} aria-label="设置" title="设置">⚙</button>
          <button type="button" class="icon-btn small" onclick={toggleList} aria-label="播放列表" title="播放列表">☰</button>
        </div>
      </header>

      <div class="cd-stage">
        <div class="mp-hud-wave" aria-hidden="true">
          {#each waveBars as h}
            <span style="height:{Math.round(h * 100)}%;opacity:{playing ? 0.85 : 0.4};"></span>
          {/each}
        </div>
        <!-- 左：CD 转盘 -->
        <div
          class="cd-area"
          data-no-drag
          onpointerdown={onCdPointerDown}
          onpointermove={onCdPointerMove}
          onpointerup={onCdPointerUp}
          onpointercancel={onCdPointerUp}
        >
          <div class="cd-wrap" style="width: {cdSize}px; height: {cdSize}px;">
            <!-- 切盘平移层（动画/手势位移）-->
            <div
              class="cd-shift {cdGesture ? 'is-dragging' : ''} anim-{cdAnim}"
              style="--cd-drag-x: {cdDragX}px;"
            >
              <div class="cd-disc" class:is-spinning={playing && !cdAnimating}>
                <div class="cd-grooves"></div>
                <div class="cd-shine"></div>
                <div class="cd-label" aria-hidden="true">
                  <span>{(current?.title || '').slice(0, 1) || '♪'}</span>
                </div>
                <div class="cd-center">
                  <button type="button" class="cd-center-btn" onclick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
                    <span class="cd-play-icon">
                      <span class="cd-pi-play" class:is-on={!playing}>▶</span>
                      <span class="cd-pi-pause" class:is-on={playing}>
                        <i></i><i></i>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div class="cd-tonearm" class:is-on={playing} aria-hidden="true"></div>
          </div>
          <div class="cd-hint">滑动 CD ⇄ 切歌 · ⇅ 调音量</div>
        </div>

        <!-- 右：竖向进度条 -->
        <div class="vprog-area" data-no-drag>
          <span class="vprog-time top">{timeStr(position)}</span>
          <div
            class="vprog-track"
            bind:this={vprogEl}
            onpointerdown={vprogPointerDown}
            onpointermove={vprogPointerMove}
            onpointerup={vprogPointerUp}
            onpointercancel={vprogPointerUp}
            role="slider"
            tabindex="0"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress * 100)}
            aria-label="播放进度"
          >
            <div class="vprog-fill" style="height: {progress * 100}%;"></div>
            <div class="vprog-thumb" style="top: {progress * 100}%;"></div>
          </div>
          <span class="vprog-time bot">{timeStr(duration)}</span>
        </div>
      </div>

      <div class="cd-controls">
        <button type="button" class="icon-btn" onclick={prev} aria-label="上一首" title="上一首">⏮</button>
        <button type="button" class="icon-btn mode" onclick={toggleMode} aria-label="切换播放模式" title="播放模式">{modeLabel}</button>
        <div class="cd-vol">
          <button type="button" class="icon-btn small" onclick={toggleMute} aria-label="静音">
            {muted || volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.8 ? '🔉' : '🔊'}
          </button>
          <input
            class="cd-volbar"
            type="range"
            min="0" max="1" step="0.01"
            value={muted ? 0 : volume}
            oninput={(e) => setVolume(Number((e.currentTarget as HTMLInputElement).value))}
            aria-label="音量"
          />
        </div>
        <button type="button" class="icon-btn" onclick={() => next(true)} aria-label="下一首" title="下一首">⏭</button>
      </div>

      {#if showSettings}
        <div class="mp-panel" data-no-drag>
          <header class="mp-panel-head">
            <span>外观</span>
            <button type="button" class="icon-btn small" onclick={toggleSettings} aria-label="关闭">×</button>
          </header>
          <label class="mp-panel-row">
            <span>毛玻璃透明度</span>
            <input
              type="range" min="0.05" max="0.95" step="0.05"
              value={bgAlpha}
              oninput={(e) => { bgAlpha = Number((e.currentTarget as HTMLInputElement).value); persist(); }}
            />
            <span class="mp-panel-val">{Math.round(bgAlpha * 100)}%</span>
          </label>
          <p class="mp-panel-tip">提示：双击/单击 CD 中央 = 播放暂停；左右滑动切歌；上下滑动调音量；点击外圈环 = 跳转。</p>
        </div>
      {/if}

      {#if showList}
        <div class="mp-list" data-no-drag>
          <header class="mp-panel-head">
            <span>播放列表 ({tracks.length})</span>
            <button type="button" class="icon-btn small" onclick={toggleList} aria-label="关闭播放列表">×</button>
          </header>
          <ul>
            {#each tracks as t, i (t.id)}
              <li>
                <button type="button" class="mp-item {i === currentIndex ? 'is-active' : ''}" onclick={() => pickTrackAnimated(i)}>
                  <span class="mp-dot">{i === currentIndex && playing ? '♪' : ''}</span>
                  <span class="mp-itag">{t.title}</span>
                  <span class="mp-iart">{t.artist || ''}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <ResizeHandles
        width={width}
        height={height}
        x={posX}
        y={posY}
        minWidth={280}
        minHeight={380}
        maxWidth={900}
        maxHeight={1100}
        disabled={maximized}
        onResize={onResize}
        onResizeEnd={persistLayout}
      />
      <RotateHandle
        disabled={maximized}
        {rotation}
        getCenter={widgetCenter}
        onRotate={(deg) => { rotation = deg; }}
        onRotateEnd={persistLayout}
      />
    </section>
  {/if}
{/if}

<style>
  .music-cd {
    --mp-bg-alpha: 0.7;
    position: fixed;
    display: flex;
    flex-direction: column;
    padding: 10px 14px 14px;
    border-radius: 22px;
    background: rgb(20 16 32 / var(--mp-bg-alpha));
    color: #f3ecff;
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.4);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    z-index: 40;
    touch-action: none;
  }
  .music-cd.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .music-cd.is-active-drag { user-select: none; box-shadow: 0 20px 44px rgb(0 0 0 / 0.55); }

  .mp-header {
    display: flex; align-items: center; gap: 10px;
    cursor: grab; padding-bottom: 6px;
  }
  .music-cd.is-active-drag .mp-header { cursor: grabbing; }
  .music-cd.is-maximized .mp-header { cursor: default; }
  .mp-title-area { flex: 1; min-width: 0; padding-left: 4px; }
  .mp-title {
    font-weight: 700; font-size: 0.92rem;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mp-artist {
    margin-top: 1px; font-size: 0.7rem; color: #cbb9e6;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .mp-actions { display: inline-flex; gap: 4px; }

  /* ===== CD 主体 ===== */
  .cd-stage {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: calc(12px * var(--mp-scale));
    padding: calc(6px * var(--mp-scale)) calc(8px * var(--mp-scale)) calc(4px * var(--mp-scale));
    user-select: none;
    min-height: 0;
  }
  .cd-area {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center;
    gap: calc(6px * var(--mp-scale));
    min-width: 0;
  }
  .cd-wrap {
    position: relative;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 / 1;
    /* 单独承载 CD 视觉层 */
  }

  /* 竖向进度条 */
  .vprog-area {
    display: grid;
    grid-template-rows: auto 1fr auto;
    align-items: center;
    justify-items: center;
    gap: calc(6px * var(--mp-scale));
    width: calc(36px * var(--mp-scale));
    height: 100%;
    padding: calc(6px * var(--mp-scale)) 0;
  }
  .vprog-time {
    font-size: calc(0.66rem * var(--mp-scale));
    color: #c2b3df;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .vprog-track {
    position: relative;
    width: calc(8px * var(--mp-scale));
    height: 100%;
    min-height: calc(120px * var(--mp-scale));
    background: rgb(255 255 255 / 0.08);
    border-radius: 999px;
    cursor: pointer;
    overflow: visible;
    touch-action: none;
    border: 1px solid rgb(255 255 255 / 0.08);
  }
  .vprog-track:focus-visible { outline: 2px solid rgb(180 140 255 / 0.6); outline-offset: 4px; }
  .vprog-fill {
    position: absolute; top: 0; left: 0;
    width: 100%;
    background: linear-gradient(180deg, #ffd0e6 0%, #b48cff 100%);
    border-radius: 999px;
    box-shadow: 0 0 10px rgb(180 140 255 / 0.55);
    transition: height 0.12s linear;
  }
  .vprog-thumb {
    position: absolute;
    left: 50%;
    width: calc(16px * var(--mp-scale));
    height: calc(16px * var(--mp-scale));
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: #fff;
    border: 2px solid #b48cff;
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.45);
    pointer-events: none;
  }
  /* 平移层：处理切盘动画 + 手势跟手 */
  .cd-shift {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
    transition: transform 0.36s cubic-bezier(.2,.85,.4,1.05), opacity 0.32s ease;
    transform: translateX(var(--cd-drag-x, 0)) rotate(calc(var(--cd-drag-x, 0) * 0.02deg));
    opacity: 1;
  }
  .cd-shift.is-dragging { transition: none; }
  .cd-shift.anim-flying-left  { transform: translateX(-150%) rotate(-32deg); opacity: 0; }
  .cd-shift.anim-flying-right { transform: translateX(150%)  rotate(32deg);  opacity: 0; }
  .cd-shift.anim-warp-left    { transform: translateX(-150%) rotate(-32deg); opacity: 0; transition: none; }
  .cd-shift.anim-warp-right   { transform: translateX(150%)  rotate(32deg);  opacity: 0; transition: none; }
  .cd-shift.anim-idle         { transform: translateX(0) rotate(0); opacity: 1; }

  .cd-disc {
    position: absolute;
    inset: 4%;
    border-radius: 50%;
    background:
      /* 外缘暗反射 */
      radial-gradient(circle at 50% 50%,
        #0e0816 0% 28%,
        #2a1c44 28% 30%,
        #0c0714 30% 96%,
        #1a1224 96% 100%);
    box-shadow:
      0 14px 32px rgb(0 0 0 / 0.55),
      inset 0 0 22px rgb(0 0 0 / 0.7),
      inset 0 0 0 2px rgb(255 255 255 / 0.05),
      inset 0 0 0 4px rgb(0 0 0 / 0.6);
    display: flex; align-items: center; justify-content: center;
    transform-origin: 50% 50%;
    animation: cd-spin 8s linear infinite;
    animation-play-state: paused;
  }
  .cd-disc.is-spinning { animation-play-state: running; }
  @keyframes cd-spin { to { transform: rotate(360deg); } }

  /* CD 表面同心圆纹理（更密、更细，并加七彩反射） */
  .cd-grooves {
    position: absolute; inset: 6%;
    border-radius: 50%;
    background:
      repeating-radial-gradient(
        circle at 50% 50%,
        rgb(255 255 255 / 0.035) 0 1px,
        transparent 1px 3px
      ),
      conic-gradient(
        from 0deg,
        rgb(255 220 180 / 0.18),
        rgb(180 140 255 / 0.22),
        rgb(120 200 255 / 0.2),
        rgb(180 255 200 / 0.18),
        rgb(255 200 220 / 0.22),
        rgb(255 220 180 / 0.18)
      );
    mix-blend-mode: screen;
    opacity: 0.55;
    pointer-events: none;
  }
  /* 高光反射 */
  .cd-shine {
    position: absolute; inset: 4%;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      rgb(255 200 240 / 0) 0%,
      rgb(255 200 240 / 0.12) 10%,
      rgb(180 140 255 / 0.18) 22%,
      rgb(255 200 240 / 0.06) 35%,
      transparent 50%,
      rgb(255 200 240 / 0.1) 65%,
      rgb(180 140 255 / 0.18) 78%,
      rgb(255 200 240 / 0.04) 90%,
      transparent 100%
    );
    mix-blend-mode: screen;
    pointer-events: none;
  }
  /* 中心标签 */
  /* 专辑标签：CD 中间圆形彩色贴纸 */
  .cd-label {
    position: absolute;
    inset: 28%;
    border-radius: 50%;
    background:
      radial-gradient(circle at 35% 30%, #ffe6f5 0%, #ffa6dd 35%, #ff80c2 65%, #b048a4 100%);
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 0.6),
      inset 0 -10px 18px rgb(0 0 0 / 0.18);
    display: flex; align-items: center; justify-content: center;
    color: rgb(80 12 60 / 0.85);
    font-weight: 800;
    font-size: 28%;
    line-height: 1;
    text-transform: uppercase;
    overflow: hidden;
  }
  .cd-label::before {
    content: '';
    position: absolute;
    inset: 4%;
    border-radius: 50%;
    border: 1px dashed rgb(0 0 0 / 0.18);
    pointer-events: none;
  }
  .cd-label span { transform: translateY(-6%); }

  .cd-center {
    position: relative;
    width: 22%; height: 22%;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ffffff 0%, #c79bff 60%, #6e3cff 100%);
    box-shadow:
      0 6px 18px rgb(0 0 0 / 0.45),
      inset 0 0 12px rgb(255 255 255 / 0.3),
      inset 0 0 0 2px rgb(255 255 255 / 0.55);
    display: flex; align-items: center; justify-content: center;
    z-index: 2;
  }
  .cd-center::after {
    content: '';
    width: 14%; height: 14%;
    border-radius: 50%;
    background: #1a1126;
    box-shadow: inset 0 0 4px rgb(0 0 0 / 0.6);
    position: absolute;
  }
  .cd-center-btn {
    position: absolute;
    inset: 0;
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    color: #1c0f30;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .cd-play-icon {
    position: relative;
    width: 30px; height: 30px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.85);
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.35);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .cd-pi-play,
  .cd-pi-pause {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: #1c0f30;
    font-weight: 700;
    font-size: 0.86rem;
    opacity: 0; transform: scale(0.55) rotate(-90deg);
    transition: opacity 0.24s ease, transform 0.32s cubic-bezier(.3,1.5,.5,1);
    pointer-events: none;
  }
  .cd-pi-play.is-on,
  .cd-pi-pause.is-on { opacity: 1; transform: scale(1) rotate(0); }
  .cd-pi-pause i {
    display: block;
    width: 3px; height: 12px;
    background: #1c0f30;
    border-radius: 1.5px;
    margin: 0 2px;
  }
  /* 唱针 */
  .cd-tonearm {
    position: absolute;
    top: -2%;
    right: 8%;
    width: 4px;
    height: 38%;
    border-radius: 4px;
    background: linear-gradient(180deg, #a89ec2, #6c5d8d);
    box-shadow: 0 4px 10px rgb(0 0 0 / 0.5);
    transform-origin: 50% 0%;
    transform: rotate(-22deg);
    transition: transform 0.4s ease;
    z-index: 4;
  }
  .cd-tonearm.is-on { transform: rotate(-8deg); }
  .cd-tonearm::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: -4px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #ffe6a8, #b58b3d);
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.5);
  }

  .cd-hint {
    color: #8c7bb0;
    font-size: calc(0.66rem * var(--mp-scale));
    letter-spacing: 0.5px;
    text-align: center;
  }

  .cd-controls {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
  }
  .cd-vol {
    flex: 1;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 0 6px;
  }
  .icon-btn {
    width: 34px; height: 34px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    border: 1px solid rgb(255 255 255 / 0.14);
    color: #f5edff; cursor: pointer; font-size: 0.92rem;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .icon-btn.small { width: 26px; height: 26px; font-size: 0.78rem; }
  .icon-btn.mode { width: auto; padding: 0 12px; font-size: 0.72rem; min-width: 54px; }
  .icon-btn:hover { background: rgb(255 255 255 / 0.16); }

  .cd-volbar {
    flex: 1; appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .cd-volbar::-webkit-slider-thumb,
  .cd-volbar::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }

  /* 设置 / 列表面板 */
  .mp-panel, .mp-list {
    margin-top: 10px;
    padding: 8px 10px 10px;
    border-radius: 14px;
    background: rgb(12 10 22 / 0.7);
    border: 1px solid rgb(255 255 255 / 0.12);
    max-height: 40%;
    overflow: auto;
  }
  .mp-panel-head {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.74rem; color: #cbb9e6; padding-bottom: 6px;
  }
  .mp-panel-row {
    display: grid;
    grid-template-columns: minmax(90px, 35%) 1fr 48px;
    align-items: center;
    gap: 8px;
    font-size: 0.74rem;
    color: #ddd0f1;
    margin: 6px 0;
  }
  .mp-panel-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .mp-panel-row input[type='range']::-webkit-slider-thumb,
  .mp-panel-row input[type='range']::-moz-range-thumb {
    appearance: none; -webkit-appearance: none;
    width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; border: 1px solid rgb(255 255 255 / 0.6); cursor: pointer;
  }
  .mp-panel-val { text-align: right; font-variant-numeric: tabular-nums; }
  .mp-panel-tip { margin: 4px 0 0; font-size: 0.66rem; color: #9e8fc0; }

  .mp-list ul { list-style: none; margin: 0; padding: 0; }
  .mp-item {
    width: 100%; text-align: left; background: transparent; border: 0; color: #efe6ff;
    padding: 5px 8px; border-radius: 8px; cursor: pointer;
    display: grid; grid-template-columns: 16px 1fr auto;
    gap: 6px; align-items: center; font-size: 0.78rem;
  }
  .mp-item:hover { background: rgb(255 255 255 / 0.08); }
  .mp-item.is-active { background: rgb(124 92 200 / 0.32); }
  .mp-itag { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mp-iart {
    color: #b9a7dd; font-size: 0.7rem; max-width: 110px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* 悬浮球 */
  .music-orb {
    position: fixed;
    width: 48px; height: 48px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffd0e6, #b48cff);
    color: #2a1c40;
    border: 1px solid rgb(255 255 255 / 0.55);
    box-shadow: 0 12px 28px rgb(0 0 0 / 0.32);
    font-size: 1.2rem;
    cursor: grab;
    z-index: 40;
    touch-action: none;
    user-select: none;
  }
  .music-orb.is-dragging { cursor: grabbing; box-shadow: 0 16px 36px rgb(0 0 0 / 0.45); }
  .orb-icon.is-playing { animation: orb-spin 2.4s linear infinite; display: inline-block; }
  @keyframes orb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .music-cd:not(.is-maximized) {
      left: 10px !important; right: 10px !important;
      top: auto !important;
      bottom: max(env(safe-area-inset-bottom, 0px), 12px);
      width: auto !important;
    }
    .cd-hint { display: none; }
    .vprog-area { width: calc(28px * var(--mp-scale)); }
  }
</style>
