<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { media, type SceneEntry, type MobileSceneEntry } from '../../lib/media';

  interface Props {
    sceneId: string;
    useVideo: boolean;
    rain: boolean;
    brightness: number;
    speed: number;
    mobileIndex: number;
    onMobileIndexChange?: (idx: number) => void;
  }

  let {
    sceneId,
    useVideo,
    rain,
    brightness,
    speed,
    mobileIndex,
    onMobileIndexChange,
  }: Props = $props();

  let isMobile = $state(false);
  let lowPerf = $state(false);

  /* ---- 双层 crossfade ---- */
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

  const scene = $derived(
    media.scenes.find((s) => s.id === sceneId) ?? media.scenes[0],
  );
  const mobileScene = $derived<MobileSceneEntry | undefined>(
    media.mobile[mobileIndex % Math.max(media.mobile.length, 1)],
  );

  function chooseVideoSrc(s: SceneEntry | undefined): string | null {
    if (!s) return null;
    if (rain && s.videoRain) return s.videoRain;
    return s.video;
  }

  // 当前期望的 src（根据屏幕断点/性能/开关综合判断）
  const targetSrc = $derived.by<string | null>(() => {
    if (isMobile && mobileScene) return mobileScene.src;
    if (!isMobile && useVideo && !lowPerf) return chooseVideoSrc(scene);
    if (!isMobile && scene?.poster) return scene.poster;
    return null;
  });
  const targetKind = $derived.by<'video' | 'image' | 'empty'>(() => {
    if (isMobile && mobileScene) return 'image';
    if (!isMobile && useVideo && !lowPerf && chooseVideoSrc(scene)) return 'video';
    if (!isMobile && scene?.poster) return 'image';
    return 'empty';
  });
  const targetPoster = $derived<string | null>(scene?.poster ?? null);

  /* 响应式断点 */
  onMount(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    isMobile = mql.matches;
    const onChange = (e: MediaQueryListEvent) => (isMobile = e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if ('addListener' in mql) (mql as any).addListener(onChange);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
    lowPerf = reduced || lowCpu;

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if ('removeListener' in mql) (mql as any).removeListener(onChange);
    };
  });

  /* 当 target 变化时，把新内容载入到非 active 的层，等 canplay/load 之后再切换 */
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

  /* 视频速度跟随 */
  $effect(() => {
    [videoElA, videoElB].forEach((el) => {
      if (!el) return;
      try {
        el.playbackRate = Math.max(0.25, Math.min(speed, 3));
      } catch {}
    });
  });

  /* 标签页隐藏时暂停视频 */
  onMount(() => {
    const onVis = () => {
      [videoElA, videoElB].forEach((el) => {
        if (!el) return;
        if (document.hidden) el.pause();
        else void el.play().catch(() => {});
      });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  });

  async function swapInto(
    src: string | null,
    kind: 'video' | 'image' | 'empty',
    poster: string | null,
  ) {
    if (!src) {
      // 全清空
      if (activeKey === 'a') {
        layerB = { src: null, poster: null, kind: 'empty', visible: false };
      } else {
        layerA = { src: null, poster: null, kind: 'empty', visible: false };
      }
      return;
    }

    // 第一次初始化：直接放在 active 层，避免黑屏
    const aEmpty = layerA.kind === 'empty';
    const bEmpty = layerB.kind === 'empty';
    if (aEmpty && bEmpty) {
      layerA = { src, poster, kind, visible: true };
      activeKey = 'a';
      return;
    }

    // 选择非 active 层装新内容
    const targetKey: 'a' | 'b' = activeKey === 'a' ? 'b' : 'a';
    if (targetKey === 'a') {
      layerA = { src, poster, kind, visible: false };
    } else {
      layerB = { src, poster, kind, visible: false };
    }

    await tick();

    // 等待新内容可见再切（视频等 canplay，图片等 load）
    const el =
      targetKey === 'a'
        ? kind === 'video'
          ? videoElA
          : null
        : kind === 'video'
        ? videoElB
        : null;

    if (kind === 'video' && el) {
      await waitForVideoReady(el);
    } else if (kind === 'image') {
      await waitForImage(src);
    }

    // 切换 active；新层渐入，旧层渐出
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
      // readyState >= 3 (HAVE_FUTURE_DATA) 即可播放
      if (el.readyState >= 3) {
        resolve();
        return;
      }
      const t = setTimeout(() => {
        cleanup();
        resolve();
      }, 1500);
      const onReady = () => {
        cleanup();
        resolve();
      };
      const cleanup = () => {
        clearTimeout(t);
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('loadeddata', onReady);
      };
      el.addEventListener('canplay', onReady, { once: true });
      el.addEventListener('loadeddata', onReady, { once: true });
    });
  }
  function waitForImage(src: string) {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
      const t = setTimeout(() => resolve(), 1500);
      img.onload = () => {
        clearTimeout(t);
        resolve();
      };
    });
  }

  /* 手机端切换 */
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
</script>

<div class="bg-root" style="--bg-bright: {brightness}" aria-hidden="true">
  <!-- 双层 crossfade：分开两个块，方便 bind:this -->
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

  {#if layerA.kind === 'empty' && layerB.kind === 'empty'}
    <div class="bg-fallback"></div>
  {/if}

  <div class="bg-grad" aria-hidden="true"></div>

  {#if isMobile && media.mobile.length > 1}
    <div class="bg-mobile-controls">
      <button type="button" class="dot-prev" onclick={prevMobile} aria-label="上一张">‹</button>
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
      <button type="button" class="dot-next" onclick={nextMobile} aria-label="下一张">›</button>
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
  /* 两层叠在一起做 crossfade */
  .bg-cell {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.7s ease;
    will-change: opacity;
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
    /* 关键：不要做任何 scale 动画，避免切换时"突然缩放" */
    transform: none !important;
  }
  .bg-fallback {
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, var(--bg-primary), var(--bg-secondary));
  }
  .bg-grad {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(0 0 0 / 0.18), rgb(0 0 0 / 0) 30%, rgb(0 0 0 / 0) 70%, rgb(0 0 0 / 0.3));
    pointer-events: none;
  }
  :global(.dark) .bg-grad {
    background:
      linear-gradient(180deg, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0) 30%, rgb(0 0 0 / 0) 70%, rgb(0 0 0 / 0.5));
  }

  /* 手机端切换 */
  .bg-mobile-controls {
    position: absolute;
    left: 0;
    right: 0;
    bottom: max(env(safe-area-inset-bottom, 0px), 12px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: auto;
  }
  .dots {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 6px 10px;
    background: rgb(0 0 0 / 0.32);
    border-radius: 999px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 0;
    background: rgb(255 255 255 / 0.55);
    padding: 0;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.2s ease;
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
    line-height: 1;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
</style>
