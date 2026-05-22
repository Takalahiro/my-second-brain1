<script lang="ts">
  import { onMount } from 'svelte';
  import WindowChrome from './WindowChrome.svelte';
  import ResizeHandles from './ResizeHandles.svelte';
  import RotateHandle from './RotateHandle.svelte';
  import { layoutRotation, rotationStyle } from '../../lib/widget-rotation';
  import { widgetTouchGestures } from '../../lib/widget-touch-gestures';
  import { makeWidgetTouchBindings } from '../../lib/widget-touch-bindings';
  import { VOICE_TRACKS, type VoiceTrack } from '../../lib/voice-tracks';
  import PixelIcon from '../PixelIcon.svelte';
  import { WIDGET_ICON_MAP } from '../../lib/pixel-icons';

  interface Props { onClose?: () => void; globalMuted?: boolean; }
  let { onClose, globalMuted = false }: Props = $props();

  const STATE_KEY = 'second-brain:whitenoise-state';
  const LAYOUT_KEY = 'second-brain:whitenoise-layout';

  type TrackState = { key: string; volume: number; enabled: boolean };

  const DEFAULT_TRACK_VOL = 0.55;

  let tracks = $state<TrackState[]>(
    VOICE_TRACKS.map((t) => ({ key: t.key, volume: 0, enabled: false }))
  );
  let masterVol = $state(0.7);
  let reverbMix = $state(0.35);
  let reverbSize = $state(0.6);
  let playing = $state(false);
  let bgAlpha = $state(0.78);

  let posX = $state(-1);
  let posY = $state(-1);
  let width = $state(380);
  let height = $state(480);
  let rootEl: HTMLElement | null = null;
  let rotation = $state(0);
  let dragging = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let minimized = $state(false);
  let maximized = $state(false);

  let audioCtx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let dryGain: GainNode | null = null;
  let wetGain: GainNode | null = null;
  let convolver: ConvolverNode | null = null;
  // 每条音轨对应 Web Audio 节点 + HTMLAudio（移动端更稳）
  const nodes = new Map<string, { gain: GainNode; audio: HTMLAudioElement }>();

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.masterVol === 'number') masterVol = s.masterVol;
        if (typeof s.reverbMix === 'number') reverbMix = s.reverbMix;
        if (typeof s.reverbSize === 'number') reverbSize = s.reverbSize;
        if (typeof s.bgAlpha === 'number') bgAlpha = clamp(s.bgAlpha, 0.05, 0.95);
        if (Array.isArray(s.tracks)) {
          tracks = VOICE_TRACKS.map((vt) => {
            const saved = s.tracks.find((x: TrackState) => x.key === vt.key);
            return saved
              ? { key: vt.key, volume: saved.volume ?? 0, enabled: !!saved.enabled }
              : { key: vt.key, volume: 0, enabled: false };
          });
        }
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LAYOUT_KEY);
      if (raw) {
        const st = JSON.parse(raw);
        if (typeof st.x === 'number') posX = st.x;
        if (typeof st.y === 'number') posY = st.y;
        if (typeof st.w === 'number') width = clamp(st.w, 300, 720);
        if (typeof st.h === 'number') height = clamp(st.h, 320, 800);
        rotation = layoutRotation(st);
      }
    } catch {}
    if (posX < 0 || posY < 0) {
      posX = Math.max(24, Math.min(window.innerWidth - width - 24, 60));
      posY = Math.max(24, Math.min(window.innerHeight - height - 24, 160));
    }
    clampPos();
    const onResize = () => clampPos();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      stopAll();
      audioCtx?.close();
    };
  });

  function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
  function clampPos() {
    if (typeof window === 'undefined') return;
    posX = clamp(posX, 4, Math.max(4, window.innerWidth - width - 4));
    posY = clamp(posY, 4, Math.max(4, window.innerHeight - 80));
  }
  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ masterVol, reverbMix, reverbSize, bgAlpha, tracks, minimized, maximized }));
    } catch {}
  }
  function persistLayout() {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify({ x: posX, y: posY, w: width, h: height, r: rotation })); } catch {}
  }
  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function makeImpulse(ctx: AudioContext, duration: number, decay: number) {
    const rate = ctx.sampleRate;
    const len = rate * duration;
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return impulse;
  }

  function trackSrc(src: string) {
    return encodeURI(src);
  }

  function waitAudioReady(audio: HTMLAudioElement) {
    return new Promise<void>((resolve, reject) => {
      if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        resolve();
        return;
      }
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onErr = () => {
        cleanup();
        reject(new Error('audio load failed'));
      };
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onErr);
      };
      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('error', onErr, { once: true });
      audio.load();
    });
  }

  async function ensureAudio() {
    if (audioCtx) return;
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    dryGain = audioCtx.createGain();
    wetGain = audioCtx.createGain();
    convolver = audioCtx.createConvolver();
    convolver.buffer = makeImpulse(audioCtx, 2.5 + reverbSize * 2, 2.5);

    dryGain.connect(masterGain);
    wetGain.connect(convolver);
    convolver.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    for (const vt of VOICE_TRACKS) {
      try {
        const audio = document.createElement('audio');
        audio.src = trackSrc(vt.src);
        audio.loop = true;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        await waitAudioReady(audio);

        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        gain.connect(dryGain!);
        gain.connect(wetGain!);

        const source = audioCtx.createMediaElementSource(audio);
        source.connect(gain);
        nodes.set(vt.key, { gain, audio });
      } catch (e) {
        console.warn('Failed to load', vt.src, e);
      }
    }
    updateMix();
  }

  function updateMix() {
    if (!masterGain || !dryGain || !wetGain) return;
    masterGain.gain.value = globalMuted ? 0 : masterVol;
    const wet = reverbMix;
    const dry = 1 - wet * 0.85;
    dryGain.gain.value = dry;
    wetGain.gain.value = wet;
    if (convolver && audioCtx) {
      convolver.buffer = makeImpulse(audioCtx, 2.5 + reverbSize * 2, 2.5);
    }
    for (const t of tracks) {
      const n = nodes.get(t.key);
      if (n) n.gain.gain.value = t.enabled ? t.volume : 0;
    }
  }

  function startTrack(key: string) {
    const n = nodes.get(key);
    if (!n) return;
    void n.audio.play().catch((e) => console.warn('play failed', key, e));
  }

  function stopTrack(key: string) {
    const n = nodes.get(key);
    if (!n) return;
    n.audio.pause();
    try { n.audio.currentTime = 0; } catch {}
  }

  function stopAll() {
    for (const key of nodes.keys()) stopTrack(key);
    playing = false;
  }

  async function togglePlay() {
    await ensureAudio();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    if (playing) {
      stopAll();
    } else {
      const active = tracks.filter((t) => t.enabled && t.volume > 0);
      if (active.length === 0) {
        const first = tracks[0];
        if (first) {
          tracks = tracks.map((t, i) =>
            i === 0 ? { ...t, enabled: true, volume: DEFAULT_TRACK_VOL } : t
          );
        }
      }
      playing = true;
      for (const t of tracks) {
        if (t.enabled && t.volume > 0) startTrack(t.key);
      }
      updateMix();
      persist();
    }
  }

  function setTrack(key: string, patch: Partial<TrackState>) {
    const cur = tracks.find((t) => t.key === key);
    if (patch.enabled && cur && (patch.volume === undefined ? cur.volume <= 0 : patch.volume <= 0)) {
      patch = { ...patch, volume: DEFAULT_TRACK_VOL };
    }
    tracks = tracks.map((t) => (t.key === key ? { ...t, ...patch } : t));
    const tr = tracks.find((t) => t.key === key)!;
    if (playing) {
      if (tr.enabled && tr.volume > 0) {
        void ensureAudio().then(() => startTrack(key));
      } else stopTrack(key);
    }
    updateMix();
    persist();
  }

  function trackMeta(key: string): VoiceTrack {
    return VOICE_TRACKS.find((t) => t.key === key)!;
  }

  $effect(() => {
    void masterVol;
    void reverbMix;
    void reverbSize;
    void globalMuted;
    updateMix();
    persist();
  });

  function onHeaderPointerDown(e: PointerEvent) {
    if (maximized) return;
    const t = e.target as HTMLElement;
    if (t.closest('button, input, [data-no-drag]')) return;
    if (!rootEl) return;
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    rootEl.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }
  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    rootEl?.releasePointerCapture?.(e.pointerId);
    persistLayout();
  }
  function onResize({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    posX = x; posY = y; width = w; height = h; clampPos();
  }

  const touchOpts = $derived(
    makeWidgetTouchBindings(
      () => ({ posX, posY, width, height, rotation, maximized, minimized }),
      {
        setPosX: (v) => { posX = v; },
        setPosY: (v) => { posY = v; },
        setWidth: (v) => { width = v; },
        setHeight: (v) => { height = v; },
        setRotation: (v) => { rotation = v; },
        clampPos,
        persistLayout,
      },
      { minWidth: 300, minHeight: 320, maxWidth: 720, maxHeight: 800 }
    )
  );
</script>

<section
  bind:this={rootEl}
  class="wn-widget {dragging ? 'is-active-drag' : ''} {maximized ? 'is-maximized' : ''}"
  style={rotationStyle(rotation, (maximized ? '' : `left:${posX}px;top:${posY}px;width:${width}px;height:${minimized ? 'auto' : height + 'px'};`) + ` --w-bg-alpha:${bgAlpha};`)}
  aria-label="白噪音"
  use:widgetTouchGestures={touchOpts}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
>
  <header class="wn-header" onpointerdown={onHeaderPointerDown}>
    <WindowChrome
      onClose={() => onClose?.()}
      onMinimize={() => { minimized = !minimized; persist(); }}
      onMaximize={() => { maximized = !maximized; persist(); }}
      maximized={maximized}
    />
    <span class="wn-title"><PixelIcon name={WIDGET_ICON_MAP.whitenoise} size={14} /> 白噪音</span>
    <button type="button" class="wn-play" data-no-drag onclick={() => togglePlay()}>
      {playing ? '⏸' : '▶'}
    </button>
  </header>

  {#if !minimized}
    <div class="wn-body" data-no-drag>
      <div class="wn-mixers">
        <label class="wn-row">
          <span>主音量</span>
          <input type="range" min="0" max="1" step="0.02" bind:value={masterVol} />
          <span class="wn-val">{Math.round(masterVol * 100)}%</span>
        </label>
        <label class="wn-row">
          <span>混响量</span>
          <input type="range" min="0" max="1" step="0.02" bind:value={reverbMix} />
          <span class="wn-val">{Math.round(reverbMix * 100)}%</span>
        </label>
        <label class="wn-row">
          <span>空间感</span>
          <input type="range" min="0" max="1" step="0.02" bind:value={reverbSize} />
          <span class="wn-val">{Math.round(reverbSize * 100)}%</span>
        </label>
      </div>

      <ul class="wn-tracks">
        {#each tracks as t (t.key)}
          {@const meta = trackMeta(t.key)}
          <li class="wn-track {t.enabled ? 'is-on' : ''}">
            <label class="wn-chk">
              <input
                type="checkbox"
                checked={t.enabled}
                onchange={(e) => setTrack(t.key, { enabled: (e.currentTarget as HTMLInputElement).checked })}
              />
              <span class="wn-name" title={meta.src}>{meta.label}</span>
              <span class="wn-tag">{meta.tag}</span>
            </label>
            <input
              type="range" min="0" max="1" step="0.02"
              value={t.volume}
              disabled={!t.enabled}
              oninput={(e) => setTrack(t.key, { volume: Number((e.currentTarget as HTMLInputElement).value) })}
            />
          </li>
        {/each}
      </ul>
    </div>

    <ResizeHandles
      width={width} height={height} x={posX} y={posY}
      minWidth={300} minHeight={320} maxWidth={720} maxHeight={800}
      disabled={maximized}
      onResize={onResize}
      onResizeEnd={persistLayout}
    />
    <RotateHandle
      disabled={maximized}
      {rotation}
      getCenter={widgetCenter}
      onRotate={(deg) => { rotation = deg; }}
      onRotateEnd={persistLayout}
    />
  {/if}
</section>

<style>
  .wn-widget {
    --w-bg-alpha: 0.78;
    position: fixed; z-index: 38;
    display: flex; flex-direction: column;
    border-radius: 18px;
    background: rgb(20 16 32 / var(--w-bg-alpha));
    border: 1px solid rgb(255 255 255 / 0.16);
    box-shadow: 0 20px 44px rgb(0 0 0 / 0.42);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    overflow: hidden;
    color: #f3ecff;
  }
  .wn-widget.is-maximized {
    left: 24px !important; top: 24px !important; right: 24px !important; bottom: 24px !important;
    width: auto !important; height: auto !important;
  }
  .wn-header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgb(255 255 255 / 0.08);
    cursor: grab;
    background: rgb(0 0 0 / 0.18);
  }
  .wn-title {
    font-size: 0.78rem;
    font-weight: 600;
    flex: 1;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .wn-play {
    width: 32px; height: 28px;
    border-radius: 8px;
    border: 1px solid rgb(255 255 255 / 0.2);
    background: linear-gradient(135deg, #7dd0ff, #b48cff);
    color: #1c0f30;
    font-weight: 700;
    cursor: pointer;
  }
  .wn-body {
    flex: 1; min-height: 0; overflow: auto;
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .wn-mixers {
    display: flex; flex-direction: column; gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1px dashed rgb(255 255 255 / 0.1);
  }
  .wn-row {
    display: grid;
    grid-template-columns: 56px 1fr 40px;
    gap: 8px; align-items: center;
    font-size: 0.74rem; color: #d6cae6;
  }
  .wn-row input[type='range'] {
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.16); outline: none;
  }
  .wn-row input[type='range']::-webkit-slider-thumb {
    appearance: none; width: 12px; height: 12px; border-radius: 50%;
    background: #f0e8ff; cursor: pointer;
  }
  .wn-val { text-align: right; font-variant-numeric: tabular-nums; color: #fff; }

  .wn-tracks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .wn-track {
    display: grid;
    grid-template-columns: 1fr 100px;
    gap: 8px; align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgb(255 255 255 / 0.04);
    border: 1px solid transparent;
  }
  .wn-track.is-on { border-color: rgb(125 208 255 / 0.35); background: rgb(125 208 255 / 0.08); }
  .wn-chk {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer; font-size: 0.78rem;
    min-width: 0;
  }
  .wn-chk input { accent-color: #b48cff; flex-shrink: 0; }
  .wn-name {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-weight: 600;
  }
  .wn-tag {
    font-size: 0.62rem;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    color: #b6a8d3;
    flex-shrink: 0;
  }
  .wn-track input[type='range'] {
    width: 100%;
    appearance: none; -webkit-appearance: none;
    height: 4px; border-radius: 999px;
    background: rgb(255 255 255 / 0.12);
  }
  .wn-track input:disabled { opacity: 0.35; }
  .wn-track input[type='range']::-webkit-slider-thumb {
    appearance: none; width: 10px; height: 10px; border-radius: 50%;
    background: #ffd0e6; cursor: pointer;
  }
</style>
