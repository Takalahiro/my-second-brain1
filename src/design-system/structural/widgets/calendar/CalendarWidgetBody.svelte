<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { CalendarBodyProps } from './calendar-types';

  let {
    ui,
    monthLabel,
    cells,
    selectedDay,
    selectedEvents,
    weekdayNames,
    fmtEvent,
    cursorMonth,
    onPrevMonth,
    onNextMonth,
    onToday,
    onSelectDay,
  }: CalendarBodyProps = $props();

  const skin = resolveStructuralSkin();
</script>

<div class="skin-cal skin-cal--{skin}">
  <div class="skin-cal__nav">
    <button type="button" class="skin-cal__btn" onclick={onPrevMonth} aria-label="prev">◀</button>
    <span class="skin-cal__month">{monthLabel}</span>
    <button type="button" class="skin-cal__btn" onclick={onNextMonth} aria-label="next">▶</button>
    <button type="button" class="skin-cal__btn skin-cal__btn--today" onclick={onToday}>今天</button>
  </div>

  <div class="skin-cal__weekdays" aria-hidden="true">
    {#each weekdayNames as w (w)}
      <span>{w}</span>
    {/each}
  </div>

  <div class="skin-cal__grid" role="grid">
    {#each cells as cell, i (i)}
      <button
        type="button"
        class="skin-cal__cell"
        class:is-out={!cell.inMonth}
        class:is-today={cell.today}
        class:is-selected={selectedDay === cell.day && cell.inMonth}
        class:has-events={cell.events.length > 0}
        disabled={!cell.inMonth}
        onclick={() => {
          if (cell.inMonth) onSelectDay(cell.day);
        }}
      >
        {cell.day}
      </button>
    {/each}
  </div>

  <p class="skin-cal__section">
    {selectedDay != null ? `${cursorMonth + 1} 月 ${selectedDay} 日` : ui.upcoming}
  </p>
  <ul class="skin-cal__events">
    {#if selectedEvents.length}
      {#each selectedEvents as ev (ev.id)}
        <li class="skin-cal__event">
          <span class="skin-cal__event-time">{fmtEvent(ev)}</span>
          <span class="skin-cal__event-title">{ev.title}</span>
        </li>
      {/each}
    {:else}
      <li class="skin-cal__event skin-cal__event--empty">{ui.noEvents}</li>
    {/if}
  </ul>
</div>
