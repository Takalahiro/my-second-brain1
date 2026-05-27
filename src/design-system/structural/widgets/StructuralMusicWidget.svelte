<script lang="ts">
  import { onMount } from 'svelte';
  import { media, type TrackEntry } from '../../../lib/media';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getMusicBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
    globalMuted?: boolean;
  }

  const STORAGE_KEY = 'second-brain:music';

  let { onClose, globalMuted = false }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('music'));
  const skin = resolveStructuralSkin();
  const MusicBody = getMusicBodyComponent(skin);

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
    tracks = media.tracks;
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

<SkinFloatingShell layoutKey="music-layout" {title} subtitle={ui.nowPlaying} defaultW={300} defaultH={420} minH={320} {onClose}>
  <MusicBody
    {ui}
    {tracks}
    {index}
    {playing}
    {progress}
    {position}
    {duration}
    {showList}
    {current}
    {timeStr}
    onToggleList={() => (showList = !showList)}
    onPickTrack={pickTrack}
    onPrev={prev}
    onNext={next}
    onTogglePlay={togglePlay}
    onSeek={onSeek}
    onSeekEnd={onSeekEnd}
  />
</SkinFloatingShell>
