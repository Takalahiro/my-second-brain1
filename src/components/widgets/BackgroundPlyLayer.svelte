<script lang="ts">
  import { onMount } from 'svelte';
  import { createGS3Wallpaper, type GS3WallpaperStatus } from '../../features/wallpaper/render/gs3/gs3-wallpaper';
  import { isMobileWallpaperDevice } from '../../features/wallpaper/device/is-mobile';

  type PlyLoadStatus = 'loading' | 'ready' | 'failed';

  interface Props {
    plyUrl: string;
    poster?: string | null;
    brightness?: number;
    speed?: number;
    onStatus?: (status: PlyLoadStatus, message?: string) => void;
  }

  let { plyUrl, poster = null, speed = 1, onStatus }: Props = $props();

  let host = $state<HTMLDivElement | null>(null);
  let ready = $state(false);
  let failed = $state(false);
  let failMessage = $state('');
  let mobile = $state(
    typeof window !== 'undefined' ? isMobileWallpaperDevice() : false,
  );
  let lowPower = $state(
    typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 8) <= 4 : false,
  );
  const useWebgl = $derived(!mobile || !lowPower);

  let engine: { dispose: () => void | Promise<void> } | null = null;
  let loadGen = 0;
  let abortCtrl: AbortController | null = null;
  let disposeChain: Promise<void> = Promise.resolve();

  function report(status: PlyLoadStatus, message?: string) {
    ready = status === 'ready';
    failed = status === 'failed';
    failMessage = message ?? '';
    onStatus?.(status, message);
  }

  onMount(() => {
    mobile = isMobileWallpaperDevice();
    lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => {
      mobile = isMobileWallpaperDevice();
    };
    mql.addEventListener('change', onChange);
    return () => {
      loadGen++;
      abortCtrl?.abort();
      void engine?.dispose();
      engine = null;
      mql.removeEventListener('change', onChange);
    };
  });

  $effect(() => {
    const el = host;
    const url = plyUrl;
    const spd = speed;
    if (!el || !url || !useWebgl) {
      if (!useWebgl && poster) report('ready');
      return;
    }

    loadGen++;
    const gen = loadGen;
    let active = true;

    abortCtrl?.abort();
    abortCtrl = new AbortController();
    ready = false;
    failed = false;

    void (async () => {
      await disposeChain;
      if (!active || gen !== loadGen || !el || !url) return;

      engine = createGS3Wallpaper(el, {
        url,
        speed: spd,
        signal: abortCtrl!.signal,
        onStatus: (status: GS3WallpaperStatus, msg) => {
          if (gen === loadGen && active) report(status, msg);
        },
      });
    })();

    return () => {
      active = false;
      abortCtrl?.abort();
      if (gen === loadGen) {
        const current = engine;
        engine = null;
        disposeChain = Promise.resolve(current?.dispose()).then(() => undefined);
      }
    };
  });
</script>

<div
  class="ply-layer gs-wallpaper"
  class:is-ready={ready}
  class:is-failed={failed}
  class:has-poster={!!poster}
  bind:this={host}
  aria-hidden="true"
>
  {#if poster}
    <img class="ply-poster" class:is-visible={!ready && !failed} src={poster} alt="" />
  {/if}
  {#if failed && failMessage}
    <div class="ply-error">{failMessage}</div>
  {/if}
</div>

<style>
  .ply-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.8s ease;
    pointer-events: none;
    overflow: hidden;
    background: #121212;
  }
  .ply-layer.is-ready,
  .ply-layer.is-failed,
  .ply-layer.has-poster:not(.is-ready):not(.is-failed) {
    opacity: 1;
  }
  /* 加载完成前隐藏 canvas，避免渐进解析时的画面漂移 */
  .ply-layer:not(.is-ready) :global(canvas) {
    visibility: hidden;
  }
  .ply-layer.is-failed {
    opacity: 1;
  }
  .ply-layer :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .ply-poster {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  .ply-poster.is-visible {
    opacity: 1;
  }
  .ply-layer.is-ready .ply-poster {
    opacity: 0;
    pointer-events: none;
  }
  .ply-error {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    max-width: min(90vw, 420px);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 0.78rem;
    line-height: 1.45;
    text-align: center;
    color: #fff;
    background: rgba(120, 40, 50, 0.82);
    backdrop-filter: blur(8px);
  }
</style>
