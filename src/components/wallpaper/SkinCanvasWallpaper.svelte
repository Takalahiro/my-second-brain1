<script lang="ts">
  import { onMount } from 'svelte';
  import HudWallpaper from './HudWallpaper.svelte';
  import { useSkinChrome } from '../../features/ui/skin-chrome.svelte';
  import { startSkinWallpaperEngine } from '../../lib/skin-wallpaper/engines';
  import { UI_SKIN_CHANGE_EVENT } from '../../features/ui/hud-mode.svelte';

  const skinChrome = useSkinChrome();
  let canvas: HTMLCanvasElement | null = $state(null);
  let activeSkin = $state(skinChrome.id);

  onMount(() => {
    document.documentElement.dataset.skinWallpaper = '1';
    const sync = () => {
      activeSkin = document.documentElement.dataset.ui ?? 'mac';
    };
    window.addEventListener(UI_SKIN_CHANGE_EVENT, sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui'] });
    return () => {
      delete document.documentElement.dataset.skinWallpaper;
      window.removeEventListener(UI_SKIN_CHANGE_EVENT, sync);
      obs.disconnect();
    };
  });

  $effect(() => {
    const skin = activeSkin;
    const el = canvas;
    if (skin === 'hud' || !el) return;

    const engine = startSkinWallpaperEngine(skin, el);
    if (!engine) return;

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.stop();
    };
  });
</script>

<div
  class="skin-canvas-wallpaper"
  data-skin={activeSkin}
  aria-hidden="true"
>
  {#if activeSkin === 'hud'}
    <HudWallpaper />
  {:else}
    <canvas bind:this={canvas} class="skin-canvas-wallpaper__canvas"></canvas>
  {/if}
</div>
