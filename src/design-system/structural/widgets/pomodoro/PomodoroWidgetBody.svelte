<script lang="ts">
  import SkinSegment from '../../components/SkinSegment.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { PomodoroBodyProps, PomodoroPhase } from './pomodoro-types';

  let { ui, phase, running, mmss, onSetPhase, onToggleStart }: PomodoroBodyProps = $props();
  const skin = resolveStructuralSkin();

  const phaseOptions = $derived([
    { id: 'focus' as PomodoroPhase, label: ui.focusPhase },
    { id: 'short' as PomodoroPhase, label: ui.shortBreak },
    { id: 'long' as PomodoroPhase, label: ui.longBreak },
  ]);
</script>

<div class="skin-pomo skin-pomo--{skin}">
  <SkinSegment
    options={phaseOptions}
    value={phase}
    ariaLabel={ui.focusPhase}
    onchange={(id) => onSetPhase(id as PomodoroPhase)}
  />
  <div class="skin-pomo__display" aria-live="polite">{mmss}</div>
  <div class="skin-pomo__ring" aria-hidden="true">
    {#each Array(12) as _, i (i)}
      <span class:lit={running && i % 3 === 0}></span>
    {/each}
  </div>
  <button type="button" class="skin-pomo__start" onclick={onToggleStart}>
    {running ? ui.pause : ui.startBtn}
  </button>
</div>
