<script lang="ts">
  import SkinSlider from '../../components/SkinSlider.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { MusicBodyProps } from './music-types';

  let {
    ui,
    tracks,
    index,
    playing,
    progress,
    position,
    duration,
    showList,
    current,
    timeStr,
    onToggleList,
    onPickTrack,
    onPrev,
    onNext,
    onTogglePlay,
    onSeek,
    onSeekEnd,
  }: MusicBodyProps = $props();

  const skin = resolveStructuralSkin();
</script>

<div class="skin-music skin-music--{skin}">
  <div class="skin-music__top">
    <div class="skin-music__deck" class:is-playing={playing} aria-hidden="true">
      <span class="skin-music__deck-tag">{skin === 'terminal' ? 'MPV' : skin === 'rpg' ? '♪' : '♫'}</span>
      <div class="skin-music__deck-meta">
        <span class="skin-music__deck-title">{(current?.title ?? '—').slice(0, 18)}</span>
        <span class="skin-music__deck-artist">{(current?.artist ?? '—').slice(0, 14)}</span>
      </div>
      <span class="skin-music__deck-icon">{playing ? '▶' : '♪'}</span>
    </div>
    <button
      type="button"
      class="skin-music__list-btn"
      class:is-active={showList}
      onclick={onToggleList}
      aria-label={ui.playlist}
      aria-expanded={showList}
    >☰</button>
  </div>

  <p class="skin-music__track" title={current?.title}>{current?.title ?? '—'}</p>
  {#if current?.artist}
    <p class="skin-music__artist">{current.artist}</p>
  {/if}

  {#if showList}
    <div class="skin-music__playlist" data-no-drag>
      <p class="skin-music__section">{ui.playlist} ({tracks.length})</p>
      <ul>
        {#each tracks as t, i (t.id)}
          <li>
            <button type="button" class="skin-music__pick" class:is-active={i === index} onclick={() => onPickTrack(i)}>
              <span class="skin-music__idx">{String(i + 1).padStart(2, '0')}</span>
              <span class="skin-music__pick-meta">
                <span>{t.title}</span>
                {#if t.artist}<span>{t.artist}</span>{/if}
              </span>
              {#if i === index && playing}<span aria-hidden="true">▶</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <div class="skin-music__transport">
      <button type="button" aria-label={ui.prevTrack} onclick={onPrev}>|◀</button>
      <button type="button" aria-label={playing ? ui.pause : ui.play} onclick={onTogglePlay}>{playing ? '‖' : '▶'}</button>
      <button type="button" aria-label={ui.nextTrack} onclick={onNext}>▶|</button>
    </div>
    <div class="skin-music__seek" onpointerup={onSeekEnd} onpointercancel={onSeekEnd}>
      <span>{timeStr(position)}</span>
      <SkinSlider
        label=""
        value={progress}
        min={0}
        max={1}
        step={0.001}
        formatValue={() => ''}
        ariaLabel={ui.progress}
        oninput={onSeek}
      />
      <span>{timeStr(duration)}</span>
    </div>
  {/if}
</div>
