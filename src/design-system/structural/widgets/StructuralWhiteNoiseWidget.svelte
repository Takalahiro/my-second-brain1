<script lang="ts">
  import { onMount } from 'svelte';
  import { VOICE_TRACKS } from '../../../lib/voice-tracks';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getWhiteNoiseBodyComponent } from '../resolveWidgetBody';
  import type { WhiteNoiseTrack } from './whitenoise/whitenoise-types';

  interface Props {
    onClose?: () => void;
    globalMuted?: boolean;
  }

  let { onClose, globalMuted = false }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('whitenoise'));
  const skin = resolveStructuralSkin();
  const WhiteNoiseBody = getWhiteNoiseBodyComponent(skin);

  const STATE_KEY = 'second-brain:whitenoise-state';

  let tracks = $state<WhiteNoiseTrack[]>(
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
            const saved = s.tracks.find((x: WhiteNoiseTrack) => x.key === t.key);
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
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ masterVol, tracks: tracks.map(({ key, enabled, volume }) => ({ key, enabled, volume })) }),
      );
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

<SkinFloatingShell layoutKey="whitenoise-layout" {title} defaultW={280} defaultH={360} {onClose}>
  <WhiteNoiseBody
    {ui}
    {tracks}
    {masterVol}
    onToggleTrack={toggleTrack}
    onSetVol={setVol}
    onMasterVol={(v) => {
      masterVol = v;
      syncAudio();
    }}
  />
</SkinFloatingShell>
