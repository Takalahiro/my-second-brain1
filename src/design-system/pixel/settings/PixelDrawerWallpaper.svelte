<script lang="ts">
  import PixelFcCartridgePick from '../components/PixelFcCartridgePick.svelte';
  import PixelFcPadButton from '../components/PixelFcPadButton.svelte';
  import PixelFcSwitch from '../components/PixelFcSwitch.svelte';
  import PixelStepBlocks from '../components/PixelStepBlocks.svelte';
  import { modeFromBg, type WallpaperMode } from '../../../features/wallpaper/state/mode';
  import type { Messages } from '../../../lib/i18n/messages/zh';

  interface BgState {
    sceneId: string;
    useVideo: boolean;
    usePly: boolean;
    rain: boolean;
    rainDrops: boolean;
    rainDropsLinked?: boolean;
    sakura: boolean;
    brightness: number;
    speed: number;
  }

  interface Props {
    m: Messages['drawer'];
    bg: BgState;
    scenes: Array<{ id: string; label: string; hasRain?: boolean; hasPly?: boolean; poster?: string | null; hasSakura?: boolean }>;
    onPatchBg: (p: Partial<BgState>) => void;
    onSetWallpaperMode?: (mode: WallpaperMode) => void;
  }

  let { m, bg, scenes, onPatchBg, onSetWallpaperMode }: Props = $props();

  const activeScene = $derived(scenes.find((s) => s.id === bg.sceneId));
  const rainAvailable = $derived(!!activeScene?.hasRain);
  const plyAvailable = $derived(!!activeScene?.hasPly);
  const sakuraAvailable = $derived(!!activeScene?.hasSakura);
  const wallpaperMode = $derived(modeFromBg(bg));

  const brightnessSteps = $derived(Math.round(((bg.brightness - 0.5) / 1) * 7) + 1);
  const speedSteps = $derived(Math.round(((bg.speed - 0.5) / 1.5) * 7) + 1);

  function pickWallpaperMode(mode: WallpaperMode) {
    if (mode === 'ply' && !plyAvailable) return;
    if (onSetWallpaperMode) onSetWallpaperMode(mode);
    else
      onPatchBg(
        mode === 'ply'
          ? { usePly: true, useVideo: false }
          : mode === 'video'
            ? { usePly: false, useVideo: true }
            : { usePly: false, useVideo: false },
      );
  }

  function setBrightness(steps: number) {
    onPatchBg({ brightness: 0.5 + ((steps - 1) / 7) * 1 });
  }

  function setSpeed(steps: number) {
    onPatchBg({ speed: 0.5 + ((steps - 1) / 7) * 1.5 });
  }
</script>

<div class="pixel-drawer-pane">
  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.scenes}</h3>
    <p class="pixel-drawer-section__hint">点击选择背景场景</p>
    <div class="pixel-wp-shelf">
      {#each scenes as s, i (s.id)}
        <PixelFcCartridgePick
          label={s.label}
          poster={s.poster}
          slot={i + 1}
          active={bg.sceneId === s.id}
          onclick={() => onPatchBg({ sceneId: s.id })}
        />
      {/each}
    </div>
  </section>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.ambience}</h3>
    <ul class="pixel-drawer-rows">
      <li class="pixel-drawer-row">
        <div class="pixel-drawer-row__text">
          <span class="pixel-drawer-row__title">{m.followWeather}</span>
          <span class="pixel-drawer-row__sub">{m.followWeatherSub}</span>
        </div>
        <PixelFcSwitch
          checked={bg.rainDropsLinked !== false}
          label={m.followWeather}
          onchange={(v) => onPatchBg({ rainDropsLinked: v })}
        />
      </li>
      <li class="pixel-drawer-row" class:is-disabled={bg.rainDropsLinked !== false}>
        <div class="pixel-drawer-row__text">
          <span class="pixel-drawer-row__title">{m.rainDrops}</span>
          <span class="pixel-drawer-row__sub">{bg.rainDropsLinked !== false ? m.rainLinked : m.rainManual}</span>
        </div>
        <PixelFcSwitch
          checked={bg.rainDrops}
          label={m.rainDrops}
          disabled={bg.rainDropsLinked !== false}
          onchange={(v) => onPatchBg({ rainDrops: v })}
        />
      </li>
      <li class="pixel-drawer-row" class:is-disabled={!sakuraAvailable}>
        <div class="pixel-drawer-row__text">
          <span class="pixel-drawer-row__title">{m.sakura}</span>
          <span class="pixel-drawer-row__sub">{m.sakuraSub}</span>
        </div>
        <PixelFcSwitch
          checked={bg.sakura}
          label={m.sakura}
          disabled={!sakuraAvailable}
          onchange={(v) => onPatchBg({ sakura: v })}
        />
      </li>
    </ul>
    {#if !sakuraAvailable}
      <p class="pixel-drawer-footnote">{m.sakuraFoot}</p>
    {/if}
  </section>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.playback}</h3>
    <div class="pixel-fc-pad-row" role="group" aria-label={m.playback}>
      <PixelFcPadButton
        face="select"
        label={m.modeVideo}
        active={wallpaperMode === 'video'}
        onclick={() => pickWallpaperMode('video')}
      />
      <PixelFcPadButton
        face="select"
        label={m.modePoster}
        active={wallpaperMode === 'poster'}
        onclick={() => pickWallpaperMode('poster')}
      />
      <PixelFcPadButton
        face="start"
        label={m.modePly}
        active={wallpaperMode === 'ply'}
        disabled={!plyAvailable}
        onclick={() => pickWallpaperMode('ply')}
      />
    </div>
    {#if !plyAvailable}
      <p class="pixel-drawer-footnote">{m.plyMissing}</p>
    {:else if wallpaperMode === 'ply'}
      <p class="pixel-drawer-footnote">{m.plyHint}</p>
    {/if}
    <ul class="pixel-drawer-rows">
      <li class="pixel-drawer-row" class:is-disabled={!rainAvailable || wallpaperMode !== 'video'}>
        <div class="pixel-drawer-row__text">
          <span class="pixel-drawer-row__title">{m.rainVideo}</span>
          <span class="pixel-drawer-row__sub">{m.rainVideoSub}</span>
        </div>
        <PixelFcSwitch
          checked={bg.rain}
          label={m.rainVideo}
          disabled={!rainAvailable || wallpaperMode !== 'video'}
          onchange={(v) => onPatchBg({ rain: v })}
        />
      </li>
    </ul>
    {#if !rainAvailable}
      <p class="pixel-drawer-footnote">{m.noRainVideo}</p>
    {/if}
  </section>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.display}</h3>
    <PixelStepBlocks
      label={`${m.brightness} ${Math.round(bg.brightness * 100)}%`}
      steps={8}
      value={brightnessSteps}
      ariaLabel={m.brightnessAria}
      onchange={setBrightness}
    />
    <PixelStepBlocks
      label={`${m.speed} ${bg.speed.toFixed(2)}×`}
      steps={8}
      value={speedSteps}
      ariaLabel={m.speedAria}
      onchange={setSpeed}
    />
  </section>
</div>
