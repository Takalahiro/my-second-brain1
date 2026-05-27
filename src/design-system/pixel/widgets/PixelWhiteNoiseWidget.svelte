<script lang="ts">
  import { onMount } from 'svelte';
  import { VOICE_TRACKS } from '../../../lib/voice-tracks';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelNesCheckbox from '../components/PixelNesCheckbox.svelte';
  import PixelNesSlider from '../components/PixelNesSlider.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
    globalMuted?: boolean;
  }

  let { onClose, globalMuted = false }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('whitenoise'));

  type TrackState = { key: string; enabled: boolean; volume: number; src: string; label: string };
  const STATE_KEY = 'second-brain:whitenoise-state';

  let tracks = $state<TrackState[]>(
    VOICE_TRACKS.slice(0, 6).map((t) => ({ key: t.key, label: t.label, src: t.src, enabled: false, volume: 0.55 })),
  );
  let masterVol = $state(0.7);
  const audios = new Map<string, HTMLAudioElement>();

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.masterVol === 'number') masterVol = s.masterVol;
        if (Array.isArray(s.tracks)) {
          tracks = tracks.map((t) => {
            const saved = s.tracks.find((x: TrackState) => x.key === t.key);
            return saved ? { ...t, enabled: !!saved.enabled, volume: saved.volume ?? t.volume } : t;
          });
        }
      }
    } catch {
      /* ignore */
    }
    syncAudio();
    return () => {
      audios.forEach((a) => a.pause());
      audios.clear();
    };
  });

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ masterVol, tracks: tracks.map(({ key, enabled, volume }) => ({ key, enabled, volume })) }));
    } catch {
      /* ignore */
    }
  }

  function syncAudio() {
    tracks.forEach((t) => {
      let a = audios.get(t.key);
      if (t.enabled) {
        if (!a) {
          a = new Audio(t.src);
          a.loop = true;
          audios.set(t.key, a);
        }
        a.volume = t.volume * masterVol;
        a.muted = globalMuted;
        void a.play().catch(() => {});
      } else if (a) {
        a.pause();
      }
    });
    persist();
  }

  function toggleTrack(key: string, on: boolean) {
    tracks = tracks.map((t) => (t.key === key ? { ...t, enabled: on } : t));
    syncAudio();
  }

  function setVol(key: string, vol: number) {
    tracks = tracks.map((t) => (t.key === key ? { ...t, volume: vol } : t));
    const a = audios.get(key);
    if (a) a.volume = vol * masterVol;
    persist();
  }
</script>

<PixelFloatingShell layoutKey="second-brain:whitenoise-layout" {title} defaultW={280} defaultH={360} {onClose}>
  <PixelNesSlider label={ui.masterVolume} value={masterVol} min={0} max={1} step={0.05} oninput={(v) => { masterVol = v; syncAudio(); }} />
  <ul class="pixel-nes-wn-list">
    {#each tracks as t (t.key)}
      <li>
        <PixelNesCheckbox checked={t.enabled} label={t.label} onchange={(v) => toggleTrack(t.key, v)} />
        <PixelNesSlider value={t.volume} min={0} max={1} step={0.05} ariaLabel={t.label} oninput={(v) => setVol(t.key, v)} />
      </li>
    {/each}
  </ul>
</PixelFloatingShell>
