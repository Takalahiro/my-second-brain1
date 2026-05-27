<script lang="ts">
  import { onMount } from 'svelte';
  import { media, type TrackEntry } from '../../../lib/media';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelNesSlider from '../components/PixelNesSlider.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
    globalMuted?: boolean;
  }

  const STORAGE_KEY = 'second-brain:music';

  let { onClose, globalMuted = false }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('music'));

  let tracks = $state<TrackEntry[]>([]);
  let index = $state(0);
  let playing = $state(false);
  let progress = $state(0);
  let duration = $state(0);
  let position = $state(0);
  let showList = $state(false);
  let scrubbing = $state(false);
  let audioEl: HTMLAudioElement | null = null;

  const current = $derived(tracks[index]);

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ index }));
    } catch {
      /* ignore */
    }
  }

  function timeStr(t: number) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  onMount(() => {
    tracks = media.tracks ?? [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.index === 'number' && s.index >= 0 && s.index < tracks.length) index = s.index;
      }
    } catch {
      /* ignore */
    }
  });

  $effect(() => {
    if (!audioEl) return;
    audioEl.muted = globalMuted;
  });

  function onTimeUpdate() {
    if (!audioEl || isNaN(audioEl.duration)) return;
    duration = audioEl.duration;
    if (!scrubbing) {
      position = audioEl.currentTime;
      progress = duration > 0 ? position / duration : 0;
    }
  }

  function pickTrack(i: number) {
    if (i < 0 || i >= tracks.length) return;
    index = i;
    persist();
    showList = false;
    queueMicrotask(() => {
      if (audioEl) void audioEl.play().catch(() => {});
    });
  }

  function togglePlay() {
    if (!audioEl) return;
    if (audioEl.paused) void audioEl.play().catch(() => {});
    else audioEl.pause();
  }

  function prev() {
    pickTrack((index - 1 + tracks.length) % Math.max(tracks.length, 1));
  }

  function next() {
    pickTrack((index + 1) % Math.max(tracks.length, 1));
  }

  function onEnded() {
    next();
  }

  function onSeek(v: number) {
    scrubbing = true;
    const f = clamp(v, 0, 1);
    progress = f;
    if (audioEl && isFinite(audioEl.duration)) {
      audioEl.currentTime = f * audioEl.duration;
      position = audioEl.currentTime;
    }
  }

  function onSeekEnd() {
    scrubbing = false;
  }

  function toggleList() {
    showList = !showList;
  }
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
{/if}

<PixelFloatingShell layoutKey="second-brain:music-layout" {title} subtitle={ui.nowPlaying} defaultW={300} defaultH={420} minH={320} {onClose}>
  <div class="pixel-music-top">
    <div class="pixel-music-cart" class:is-playing={playing} aria-hidden="true">
      <div class="pixel-music-cart__shell">
        <span class="pixel-music-cart__corner"></span>
        <span class="pixel-music-cart__corner"></span>
        <span class="pixel-music-cart__tag">FC</span>
        <div class="pixel-music-cart__label">
          <span class="pixel-music-cart__title">{(current?.title ?? '—').slice(0, 12)}</span>
          <span class="pixel-music-cart__artist">{(current?.artist ?? '—').slice(0, 10)}</span>
        </div>
        <div class="pixel-music-cart__screen">
          <span class="pixel-music-cart__note">{playing ? '▶' : '♪'}</span>
        </div>
      </div>
      <div class="pixel-music-cart__pins"></div>
    </div>

    <button
      type="button"
      class="pixel-music-menu-btn"
      class:is-active={showList}
      onclick={toggleList}
      aria-label={ui.playlist}
      aria-expanded={showList}
      title={ui.playlist}
    >
      ☰
    </button>
  </div>

  <p class="pixel-nes-track" title={current?.title}>{current?.title ?? '—'}</p>
  {#if current?.artist}
    <p class="pixel-music-artist">{current.artist}</p>
  {/if}

  {#if showList}
    <div class="pixel-music-playlist" data-no-drag>
      <p class="pixel-nes-section-label">{ui.playlist} ({tracks.length})</p>
      <ul class="pixel-music-playlist__list">
        {#each tracks as t, i (t.id)}
          <li>
            <button
              type="button"
              class="pixel-music-playlist__item"
              class:is-active={i === index}
              onclick={() => pickTrack(i)}
            >
              <span class="pixel-music-playlist__idx">{String(i + 1).padStart(2, '0')}</span>
              <span class="pixel-music-playlist__meta">
                <span class="pixel-music-playlist__name">{t.title}</span>
                {#if t.artist}
                  <span class="pixel-music-playlist__artist">{t.artist}</span>
                {/if}
              </span>
              {#if i === index && playing}
                <span class="pixel-music-playlist__now" aria-hidden="true">▶</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <div class="pixel-nes-transport">
      <button type="button" aria-label={ui.prevTrack} onclick={prev}>|◀</button>
      <button type="button" aria-label={playing ? ui.pause : ui.play} onclick={togglePlay}>{playing ? '‖' : '▶'}</button>
      <button type="button" aria-label={ui.nextTrack} onclick={next}>▶|</button>
    </div>

    <div
      class="pixel-music-seek"
      onpointerup={onSeekEnd}
      onpointercancel={onSeekEnd}
    >
      <span class="pixel-music-seek__time">{timeStr(position)}</span>
      <PixelNesSlider
        value={progress}
        min={0}
        max={1}
        step={0.001}
        ariaLabel={ui.progress}
        oninput={onSeek}
      />
      <span class="pixel-music-seek__time">{timeStr(duration)}</span>
    </div>
  {/if}
</PixelFloatingShell>
