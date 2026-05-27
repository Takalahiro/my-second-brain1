<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getPomodoroBodyComponent } from '../resolveWidgetBody';
  import type { PomodoroPhase } from './pomodoro/pomodoro-types';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('pomodoro'));
  const skin = resolveStructuralSkin();
  const PomodoroBody = getPomodoroBodyComponent(skin);

  const STATE_KEY = 'second-brain:pomo-state';

  let phase = $state<PomodoroPhase>('focus');
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

  function phaseMs(p: PomodoroPhase) {
    if (p === 'focus') return focusMin * 60_000;
    if (p === 'short') return shortMin * 60_000;
    return longMin * 60_000;
  }

  function persist() {
    try {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ phase, remainingMs, focusMin, shortMin, longMin, running: false }),
      );
    } catch {
      /* ignore */
    }
  }

  function setPhase(p: PomodoroPhase) {
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

<SkinFloatingShell layoutKey="pomo-layout" {title} defaultW={280} defaultH={260} {onClose}>
  <PomodoroBody {ui} {phase} {running} {mmss} onSetPhase={setPhase} onToggleStart={toggleStart} />
</SkinFloatingShell>
