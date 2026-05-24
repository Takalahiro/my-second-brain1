<script lang="ts">
  import { onMount } from 'svelte';
  import { createGS3Wallpaper, type GS3WallpaperStatus } from '../../features/wallpaper/render/gs3/gs3-wallpaper';
  import { isMobileUa } from '../../features/wallpaper/device/is-mobile';

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
  /** 手机/平板：只显示 poster，不跑 WebGL */
  let posterOnly = $state(
    typeof navigator !== 'undefined' ? isMobileUa() : false,
  );

  let engine: { dispose: () => void | Promise<void> } | null = null;
  let loadGen = 0;
  let abortCtrl: AbortController | null = null;
  let disposeChain: Promise<void> = Promise.resolve();

  const layerVisible = $derived(ready || failed || posterOnly || !!poster);

  function report(status: PlyLoadStatus, message?: string) {
    ready = status === 'ready';
    failed = status === 'failed';
    failMessage = message ?? '';
    onStatus?.(status, message);
  }

  onMount(() => {
    posterOnly = isMobileUa();
    if (posterOnly) {
      report('ready');
      return;
    }
    return () => {
      loadGen++;
      abortCtrl?.abort();
      void engine?.dispose();
      engine = null;
    };
  });

  $effect(() => {
    const el = host;
    const url = plyUrl;
    const spd = speed;
    if (!el || posterOnly || !url) return;

    loadGen++;
    const gen = loadGen;
    let active = true;

    abortCtrl?.abort();
    abortCtrl = new AbortController();
    ready = false;
    failed = false;
    onStatus?.('loading');

    void (async () => {
      await disposeChain;
      if (!active || gen !== loadGen || !el || posterOnly || !url) return;

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
  class:is-visible={layerVisible}
  class:is-webgl-ready={ready && !posterOnly}
  class:is-failed={failed}
  bind:this={host}
  aria-hidden="true"
>
  {#if poster}
    <img
      class="ply-poster"
      class:is-visible={!ready || posterOnly || failed}
      src={poster}
      alt=""
    />
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
  .ply-layer.is-visible {
    opacity: 1;
  }
  /* WebGL 加载完成前隐藏 canvas，避免解析中的画面漂移 */
  .ply-layer:not(.is-webgl-ready) :global(canvas) {
    visibility: hidden;
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
  .ply-layer.is-webgl-ready .ply-poster {
    opacity: 0;
  }
  .ply-layer.is-webgl-ready .ply-poster.is-visible {
    opacity: 1;
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
