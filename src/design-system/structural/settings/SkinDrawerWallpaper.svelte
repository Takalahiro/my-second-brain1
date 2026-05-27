<script lang="ts">
  import SkinScenePick from '../components/SkinScenePick.svelte';
  import SkinSwitch from '../components/SkinSwitch.svelte';
  import SkinSlider from '../components/SkinSlider.svelte';
  import SkinSegment from '../components/SkinSegment.svelte';
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

  const playbackOptions = $derived([
    { id: 'video', label: m.modeVideo },
    { id: 'poster', label: m.modePoster },
    { id: 'ply', label: m.modePly, disabled: !plyAvailable },
  ]);

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

</script>

<div class="structural-drawer-pane">
  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.scenes}</h3>
    <p class="structural-drawer-section__hint">点击选择背景场景</p>
    <div class="structural-wp-shelf">
      {#each scenes as s, i (s.id)}
        <SkinScenePick
          label={s.label}
          poster={s.poster}
          slot={i + 1}
          active={bg.sceneId === s.id}
          onclick={() => onPatchBg({ sceneId: s.id })}
        />
      {/each}
    </div>
  </section>

  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.ambience}</h3>
    <ul class="structural-drawer-rows">
      <li class="structural-drawer-row">
        <div class="structural-drawer-row__text">
          <span class="structural-drawer-row__title">{m.followWeather}</span>
          <span class="structural-drawer-row__sub">{m.followWeatherSub}</span>
        </div>
        <SkinSwitch
          checked={bg.rainDropsLinked !== false}
          label={m.followWeather}
          onchange={(v) => onPatchBg({ rainDropsLinked: v })}
        />
      </li>
      <li class="structural-drawer-row" class:is-disabled={bg.rainDropsLinked !== false}>
        <div class="structural-drawer-row__text">
          <span class="structural-drawer-row__title">{m.rainDrops}</span>
          <span class="structural-drawer-row__sub">{bg.rainDropsLinked !== false ? m.rainLinked : m.rainManual}</span>
        </div>
        <SkinSwitch
          checked={bg.rainDrops}
          label={m.rainDrops}
          disabled={bg.rainDropsLinked !== false}
          onchange={(v) => onPatchBg({ rainDrops: v })}
        />
      </li>
      <li class="structural-drawer-row" class:is-disabled={!sakuraAvailable}>
        <div class="structural-drawer-row__text">
          <span class="structural-drawer-row__title">{m.sakura}</span>
          <span class="structural-drawer-row__sub">{m.sakuraSub}</span>
        </div>
        <SkinSwitch
          checked={bg.sakura}
          label={m.sakura}
          disabled={!sakuraAvailable}
          onchange={(v) => onPatchBg({ sakura: v })}
        />
      </li>
    </ul>
    {#if !sakuraAvailable}
      <p class="structural-drawer-footnote">{m.sakuraFoot}</p>
    {/if}
  </section>

  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.playback}</h3>
    <SkinSegment
      options={playbackOptions}
      value={wallpaperMode}
      ariaLabel={m.playback}
      onchange={(id) => pickWallpaperMode(id as WallpaperMode)}
    />
    {#if !plyAvailable}
      <p class="structural-drawer-footnote">{m.plyMissing}</p>
    {:else if wallpaperMode === 'ply'}
      <p class="structural-drawer-footnote">{m.plyHint}</p>
    {/if}
    <ul class="structural-drawer-rows">
      <li class="structural-drawer-row" class:is-disabled={!rainAvailable || wallpaperMode !== 'video'}>
        <div class="structural-drawer-row__text">
          <span class="structural-drawer-row__title">{m.rainVideo}</span>
          <span class="structural-drawer-row__sub">{m.rainVideoSub}</span>
        </div>
        <SkinSwitch
          checked={bg.rain}
          label={m.rainVideo}
          disabled={!rainAvailable || wallpaperMode !== 'video'}
          onchange={(v) => onPatchBg({ rain: v })}
        />
      </li>
    </ul>
    {#if !rainAvailable}
      <p class="structural-drawer-footnote">{m.noRainVideo}</p>
    {/if}
  </section>

  <section class="structural-drawer-section">
    <h3 class="structural-drawer-section__label">{m.display}</h3>
    <SkinSlider
      label={m.brightness}
      value={bg.brightness}
      min={0.5}
      max={1.5}
      step={0.05}
      unit=" mm"
      formatValue={(v) => `${(v * 42).toFixed(1)} mm`}
      ariaLabel={m.brightnessAria}
      oninput={(v) => onPatchBg({ brightness: v })}
    />
    <SkinSlider
      label={m.speed}
      value={bg.speed}
      min={0.5}
      max={2}
      step={0.05}
      formatValue={(v) => `${v.toFixed(2)}×`}
      ariaLabel={m.speedAria}
      oninput={(v) => onPatchBg({ speed: v })}
    />
  </section>
</div>
