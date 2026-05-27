<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelNesButton from '../components/PixelNesButton.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('pomodoro'));

  type Phase = 'focus' | 'short' | 'long';
  const STATE_KEY = 'second-brain:pomo-state';

  let phase = $state<Phase>('focus');
  let running = $state(false);
  let remainingMs = $state(25 * 60_000);
  let focusMin = $state(25);
  let shortMin = $state(5);
  let longMin = $state(15);
  let raf: number | null = null;
  let lastTick = 0;

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.focusMin === 'number') focusMin = s.focusMin;
        if (typeof s.shortMin === 'number') shortMin = s.shortMin;
        if (typeof s.longMin === 'number') longMin = s.longMin;
        if (typeof s.remainingMs === 'number') remainingMs = s.remainingMs;
        if (s.phase === 'focus' || s.phase === 'short' || s.phase === 'long') phase = s.phase;
      }
    } catch {
      /* ignore */
    }
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  });

  function phaseMs(p: Phase) {
    if (p === 'focus') return focusMin * 60_000;
    if (p === 'short') return shortMin * 60_000;
    return longMin * 60_000;
  }

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ phase, remainingMs, focusMin, shortMin, longMin, running: false }));
    } catch {
      /* ignore */
    }
  }

  function setPhase(p: Phase) {
    phase = p;
    remainingMs = phaseMs(p);
    running = false;
    if (raf != null) cancelAnimationFrame(raf);
    persist();
  }

  function loop(ts: number) {
    if (!running) return;
    if (!lastTick) lastTick = ts;
    remainingMs = Math.max(0, remainingMs - (ts - lastTick));
    lastTick = ts;
    if (remainingMs <= 0) {
      running = false;
      persist();
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  function toggleStart() {
    running = !running;
    if (running) {
      lastTick = 0;
      raf = requestAnimationFrame(loop);
    } else {
      if (raf != null) cancelAnimationFrame(raf);
      persist();
    }
  }

  const mmss = $derived.by(() => {
    const t = Math.ceil(remainingMs / 1000);
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  });
</script>

<PixelFloatingShell layoutKey="second-brain:pomo-layout" {title} defaultW={280} defaultH={260} {onClose}>
  <div class="pixel-nes-tabs">
    <button type="button" class="pixel-nes-segment" data-active={phase === 'focus'} onclick={() => setPhase('focus')}>{ui.focusPhase}</button>
    <button type="button" class="pixel-nes-segment" data-active={phase === 'short'} onclick={() => setPhase('short')}>{ui.shortBreak}</button>
    <button type="button" class="pixel-nes-segment" data-active={phase === 'long'} onclick={() => setPhase('long')}>{ui.longBreak}</button>
  </div>
  <div class="pixel-nes-pomo-icons" aria-hidden="true"></div>
  <div class="pixel-nes-led">{mmss}</div>
  <div class="pixel-nes-pomo-actions">
    <PixelNesButton label={running ? ui.pause : ui.startBtn} onclick={toggleStart} />
  </div>
</PixelFloatingShell>
