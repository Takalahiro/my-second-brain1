<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { media, type SceneEntry, type MobileSceneEntry } from '../../lib/media';
  import { modeFromBg } from '../../features/wallpaper/state/mode';
  import { getMessages, initLocale, localeState } from '../../lib/i18n/locale.svelte';

  interface Props {
    sceneId: string;
    useVideo: boolean;
    usePly: boolean;
    rain: boolean;
    brightness: number;
    speed: number;
    mobileIndex: number;
    onMobileIndexChange?: (idx: number) => void;
  }

  let {
    sceneId,
    useVideo,
    usePly,
    rain,
    brightness,
    speed,
    mobileIndex,
    onMobileIndexChange,
  }: Props = $props();

  let isMobile = $state(false);
  let lowCpu = $state(false);
  let plyStatus = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  let plyMessage = $state('');

  type Layer = {
    src: string | null;
    poster: string | null;
    kind: 'video' | 'image' | 'empty';
    visible: boolean;
  };
  let layerA = $state<Layer>({ src: null, poster: null, kind: 'empty', visible: false });
  let layerB = $state<Layer>({ src: null, poster: null, kind: 'empty', visible: false });
  let activeKey = $state<'a' | 'b'>('a');

  let videoElA: HTMLVideoElement | null = null;
  let videoElB: HTMLVideoElement | null = null;

  const scene = $derived(media.scenes.find((s) => s.id === sceneId) ?? media.scenes[0]);
  const mobileScene = $derived<MobileSceneEntry | undefined>(
    media.mobile[mobileIndex % Math.max(media.mobile.length, 1)],
  );
  const wallpaperMode = $derived(modeFromBg({ useVideo, usePly }));
  const plyActive = $derived(wallpaperMode === 'ply' && !!scene?.ply);
  const plyHint = $derived.by(() => {
    if (wallpaperMode !== 'ply') return '';
    if (!scene?.ply) return m.wallpaper.noPly;
    return '';
  });

  function chooseVideoSrc(s: SceneEntry | undefined): string | null {
    if (!s) return null;
    if (rain && s.videoRain) return s.videoRain;
    return s.video;
  }

  const targetSrc = $derived.by<string | null>(() => {
    if (plyActive) return null;
    if (isMobile && mobileScene) return mobileScene.src;
    if (!isMobile && wallpaperMode === 'video' && !lowCpu) return chooseVideoSrc(scene);
    if (scene?.poster) return scene.poster;
    return null;
  });
  const targetKind = $derived.by<'video' | 'image' | 'empty'>(() => {
    if (plyActive) return 'empty';
    if (isMobile && mobileScene) return 'image';
    if (!isMobile && wallpaperMode === 'video' && !lowCpu && chooseVideoSrc(scene)) return 'video';
    if (scene?.poster) return 'image';
    return 'empty';
  });
  const targetPoster = $derived<string | null>(scene?.poster ?? null);
  const m = $derived(getMessages());

  onMount(() => {
    initLocale();
    const mql = window.matchMedia('(max-width: 768px)');
    isMobile = mql.matches;
    lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    const onChange = (e: MediaQueryListEvent) => (isMobile = e.matches);
    mql.addEventListener('change', onChange);

    document.addEventListener('touchstart', onDocTouchStart, { passive: true });
    document.addEventListener('touchend', onDocTouchEnd, { passive: true });

    const onVis = () => {
      [videoElA, videoElB].forEach((el) => {
        if (!el) return;
        if (document.hidden) el.pause();
        else void el.play().catch(() => {});
      });
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      mql.removeEventListener('change', onChange);
      document.removeEventListener('touchstart', onDocTouchStart);
      document.removeEventListener('touchend', onDocTouchEnd);
      document.removeEventListener('visibilitychange', onVis);
    };
  });

  let lastTargetSrc: string | null | undefined = undefined;
  let lastTargetKind: 'video' | 'image' | 'empty' | undefined = undefined;
  $effect(() => {
    const src = targetSrc;
    const kind = targetKind;
    if (src === lastTargetSrc && kind === lastTargetKind) return;
    lastTargetSrc = src;
    lastTargetKind = kind;
    void swapInto(src, kind, targetPoster);
  });

  $effect(() => {
    [videoElA, videoElB].forEach((el) => {
      if (!el) return;
      try {
        el.playbackRate = Math.max(0.25, Math.min(speed, 3));
      } catch {}
    });
  });

  async function swapInto(
    src: string | null,
    kind: 'video' | 'image' | 'empty',
    poster: string | null,
  ) {
    if (!src) {
      layerA = { ...layerA, visible: false };
      layerB = { ...layerB, visible: false };
      return;
    }

    const aEmpty = layerA.kind === 'empty';
    const bEmpty = layerB.kind === 'empty';
    if (aEmpty && bEmpty) {
      layerA = { src, poster, kind, visible: true };
      activeKey = 'a';
      return;
    }

    const targetKey: 'a' | 'b' = activeKey === 'a' ? 'b' : 'a';
    if (targetKey === 'a') layerA = { src, poster, kind, visible: false };
    else layerB = { src, poster, kind, visible: false };

    await tick();

    const el = targetKey === 'a' ? videoElA : videoElB;
    if (kind === 'video' && el) await waitForVideoReady(el);
    else if (kind === 'image') await waitForImage(src);

    if (targetKey === 'a') {
      layerA = { ...layerA, visible: true };
      layerB = { ...layerB, visible: false };
    } else {
      layerB = { ...layerB, visible: true };
      layerA = { ...layerA, visible: false };
    }
    activeKey = targetKey;
  }

  function waitForVideoReady(el: HTMLVideoElement) {
    return new Promise<void>((resolve) => {
      if (el.readyState >= 3) return resolve();
      const t = setTimeout(resolve, 1500);
      const done = () => {
        clearTimeout(t);
        resolve();
      };
      el.addEventListener('canplay', done, { once: true });
      el.addEventListener('loadeddata', done, { once: true });
    });
  }

  function waitForImage(src: string) {
    return new Promise<void>((resolve) => {
      const img = new Image();
      const t = setTimeout(resolve, 1500);
      img.onload = img.onerror = () => {
        clearTimeout(t);
        resolve();
      };
      img.src = src;
    });
  }

  function nextMobile() {
    const len = media.mobile.length;
    if (len === 0) return;
    onMobileIndexChange?.((mobileIndex + 1) % len);
  }
  function prevMobile() {
    const len = media.mobile.length;
    if (len === 0) return;
    onMobileIndexChange?.((mobileIndex - 1 + len) % len);
  }

  const SWIPE_MIN = 48;
  const SWIPE_SKIP =
    'button, a, input, select, textarea, label, [role="button"], header, nav, .widget-drawer, .mac-menu-bar, .mobile-home-dock, .home-fab, .wallpaper-mute-btn, .mobile-mode-toggle, .note-search, .wd-tile, .bg-mobile-controls';

  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeTracking = false;

  function onDocTouchStart(e: TouchEvent) {
    if (!isMobile || media.mobile.length <= 1) return;
    if (e.touches.length !== 1) return;
    if ((e.target as HTMLElement | null)?.closest(SWIPE_SKIP)) return;
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeTracking = true;
  }

  function onDocTouchEnd(e: TouchEvent) {
    if (!swipeTracking) return;
    swipeTracking = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - swipeStartX;
    const dy = t.clientY - swipeStartY;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) nextMobile();
    else prevMobile();
  }

  function onPlyStatus(status: 'loading' | 'ready' | 'failed', message?: string) {
    plyStatus = status;
    plyMessage = message ?? '';
  }

  $effect(() => {
    if (!plyActive) return;
    layerA = { src: null, poster: null, kind: 'empty', visible: false };
    layerB = { src: null, poster: null, kind: 'empty', visible: false };
    lastTargetSrc = undefined;
    lastTargetKind = undefined;
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('ply-wallpaper-active', plyActive);
    return () => document.body.classList.remove('ply-wallpaper-active');
  });

  function plyLoadErrorMessage(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes('fetch') || msg.includes('Importing a module')
      ? m.notes.threeModuleError
      : (localeState.current === 'en' ? `Splat module failed: ${msg}` : `点云模块加载失败：${msg}`);
  }
</script>

<div
  class="bg-root"
  class:ply-active={plyActive}
  style="--bg-bright: {brightness}"
  aria-hidden="true"
>
  {#if !plyActive}
    <div class="bg-cell {layerA.visible ? 'is-show' : ''}">
      {#if layerA.kind === 'video' && layerA.src}
        <video
          bind:this={videoElA}
          class="bg-media"
          src={layerA.src}
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          poster={layerA.poster ?? ''}
        ></video>
      {:else if layerA.kind === 'image' && layerA.src}
        <img class="bg-media" src={layerA.src} alt="" loading="eager" />
      {/if}
    </div>
    <div class="bg-cell {layerB.visible ? 'is-show' : ''}">
      {#if layerB.kind === 'video' && layerB.src}
        <video
          bind:this={videoElB}
          class="bg-media"
          src={layerB.src}
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          poster={layerB.poster ?? ''}
        ></video>
      {:else if layerB.kind === 'image' && layerB.src}
        <img class="bg-media" src={layerB.src} alt="" loading="eager" />
      {/if}
    </div>
  {/if}

  {#if plyActive && scene?.ply}
    {#key scene.ply}
      {#await import('./BackgroundPlyLayer.svelte')}
        <!-- loading banner handled below -->
      {:then { default: PlyLayer }}
        <PlyLayer plyUrl={scene.ply} poster={scene.poster} {brightness} {speed} onStatus={onPlyStatus} />
      {:catch err}
        <div class="bg-ply-banner is-error">{plyLoadErrorMessage(err)}</div>
      {/await}
    {/key}
  {/if}

  {#if plyActive && plyStatus === 'loading'}
    <div class="bg-ply-banner">{m.wallpaper.loading}</div>
  {:else if plyActive && plyStatus === 'failed'}
    <div class="bg-ply-banner is-error">{plyMessage || m.wallpaper.loadFailed}</div>
  {:else if plyHint}
    <div class="bg-ply-banner is-warn">{plyHint}</div>
  {/if}

  {#if !plyActive && layerA.kind === 'empty' && layerB.kind === 'empty'}
    <div class="bg-fallback"></div>
  {/if}

  <div class="bg-grad"></div>

  {#if isMobile && media.mobile.length > 1}
    <div class="bg-mobile-controls">
      <button type="button" class="dot-prev" onclick={prevMobile} aria-label={m.wallpaper.prevSlide}>‹</button>
      <ul class="dots">
        {#each media.mobile as m, i (m.id)}
          <li>
            <button
              type="button"
              class="dot {i === mobileIndex ? 'is-active' : ''}"
              aria-label={m.label}
              onclick={() => onMobileIndexChange?.(i)}
            ></button>
          </li>
        {/each}
      </ul>
      <button type="button" class="dot-next" onclick={nextMobile} aria-label={m.wallpaper.nextSlide}>›</button>
    </div>
  {/if}
</div>

<style>
  .bg-root {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    background: var(--bg-primary);
  }
  .bg-root.ply-active {
    background: #05070d;
  }
  .bg-cell {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.7s ease;
  }
  .bg-cell.is-show {
    opacity: 1;
  }
  .bg-media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(var(--bg-bright, 1));
  }
  .bg-fallback {
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, var(--bg-primary), var(--bg-secondary));
  }
  .bg-ply-banner {
    position: absolute;
    left: 50%;
    bottom: 18%;
    transform: translateX(-50%);
    z-index: 4;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.92);
    background: rgb(0 0 0 / 0.5);
    backdrop-filter: blur(8px);
    white-space: nowrap;
  }
  .bg-ply-banner.is-error { background: rgb(120 40 50 / 0.6); }
  .bg-ply-banner.is-warn { background: rgb(110 80 20 / 0.6); }
  .bg-grad {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.2),
      rgb(0 0 0 / 0) 35%,
      rgb(0 0 0 / 0) 75%,
      rgb(0 0 0 / 0.28)
    );
  }
  .bg-root.ply-active .bg-grad {
    background: linear-gradient(
      180deg,
      rgb(0 0 0 / 0.15),
      rgb(0 0 0 / 0) 40%,
      rgb(0 0 0 / 0) 80%,
      rgb(0 0 0 / 0.2)
    );
  }
  .bg-mobile-controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(max(env(safe-area-inset-bottom, 0px), 10px) + 72px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: auto;
    z-index: 4;
  }
  .dots {
    display: inline-flex;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 6px 10px;
    background: rgb(0 0 0 / 0.32);
    border-radius: 999px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 0;
    background: rgb(255 255 255 / 0.55);
    padding: 0;
    cursor: pointer;
  }
  .dot.is-active {
    background: rgb(255 255 255 / 0.95);
    transform: scale(1.25);
  }
  .dot-prev,
  .dot-next {
    border: 0;
    background: rgb(0 0 0 / 0.32);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.1rem;
  }
</style>
