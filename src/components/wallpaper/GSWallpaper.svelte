<script lang="ts">
  /**
   * GSWallpaper — 3DGS 全屏背景壁纸
   * 基于 antimatter15/splat (MIT) WebGL2 splatting
   *
   * 用法见 BackgroundLayer 或下方示例。
   */
  import { onMount } from 'svelte';
  import { createAm15Wallpaper, type GSWallpaperStatus } from '../../features/wallpaper/legacy/am15/renderer';
  import { isMobileUa } from '../../features/wallpaper/device/is-mobile';

  interface Props {
    /** PLY 路径，如 /ply/kyoto.ply 或 manifest 里的 scene.ply（.sog 会自动换 .ply） */
    src: string;
    /** 移动端退化用的静态图 */
    poster?: string | null;
    /** 环绕速度倍率 */
    speed?: number;
    onStatus?: (status: GSWallpaperStatus, message?: string) => void;
  }

  let { src, poster = null, speed = 1, onStatus }: Props = $props();

  let host = $state<HTMLDivElement | null>(null);
  let ready = $state(false);
  let failed = $state(false);
  let failMessage = $state('');
  let mobile = $state(false);

  const maxSplats =
    typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4
      ? 80_000
      : 200_000;

  let engine: { dispose: () => void } | null = null;
  let loadGen = 0;

  function report(status: GSWallpaperStatus, message?: string) {
    ready = status === 'ready';
    failed = status === 'failed';
    failMessage = message ?? '';
    onStatus?.(status, message);
  }

  onMount(() => {
    mobile = isMobileUa();
    if (mobile) {
      report('ready');
      return;
    }
    return () => {
      loadGen++;
      engine?.dispose();
      engine = null;
    };
  });

  $effect(() => {
    const el = host;
    const url = src;
    const spd = speed;
    if (!el || mobile || !url) return;

    loadGen++;
    const gen = loadGen;
    engine?.dispose();
    engine = null;
    ready = false;
    failed = false;

    engine = createAm15Wallpaper(el, {
      plyUrl: url,
      speed: spd,
      maxSplats,
      onStatus: (status, msg) => {
        if (gen === loadGen) report(status, msg);
      },
    });

    return () => {
      if (gen === loadGen) {
        engine?.dispose();
        engine = null;
      }
    };
  });
</script>

<div
  class="gs-wallpaper"
  class:is-ready={ready || mobile}
  class:is-failed={failed}
  bind:this={host}
  aria-hidden="true"
>
  {#if mobile && poster}
    <img class="gs-poster" src={poster} alt="" />
  {/if}
  {#if failed && failMessage}
    <div class="gs-error">{failMessage}</div>
  {/if}
</div>

<style>
  .gs-wallpaper {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.8s ease;
    pointer-events: none;
    overflow: hidden;
    background: #121212;
  }
  .gs-wallpaper.is-ready {
    opacity: 1;
  }
  .gs-wallpaper.is-failed {
    opacity: 1;
  }
  .gs-poster {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .gs-error {
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
    background: rgb(120 40 50 / 0.82);
    backdrop-filter: blur(8px);
  }
</style>
