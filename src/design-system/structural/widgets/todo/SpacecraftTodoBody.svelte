<script lang="ts">
  import { getStructuralUi } from '../../structural-i18n';
  import type { TodoBodyProps } from './todo-types';

  let {
    items,
    draft,
    doneCount,
    total,
    deletingIds,
    lastAddedId,
    saveFlash,
    onToggle,
    onRemove,
    onDraftChange,
    onAdd,
  }: TodoBodyProps = $props();

  const ui = $derived(getStructuralUi());
  const fuelPct = $derived(total > 0 ? Math.round((doneCount / total) * 100) : 0);
  const missionTime = $derived(`T+00:${String(doneCount).padStart(2, '0')}:${String(total).padStart(2, '0')}`);
</script>

<div class="skin-todo skin-todo--spacecraft">
  {#if saveFlash}
    <p class="sc-telemetry" aria-live="polite">TELEMETRY LOGGED — MET 02:14:08</p>
  {/if}

  <div class="sc-fuel-gauge">
    <span class="sc-fuel-gauge__label">FUEL</span>
    <div class="sc-fuel-gauge__bars">
      {#each Array(8) as _, i}
        <span class="sc-fuel-gauge__seg" class:is-on={i < Math.round(fuelPct / 12.5)}></span>
      {/each}
    </div>
    <span class="sc-fuel-gauge__pct">{fuelPct}%</span>
  </div>

  <ul class="sc-todo-list">
    {#each items as it (it.id)}
      <li
        class="sc-task-row"
        class:is-check={it.done}
        class:is-pending={!it.done}
        class:is-jettison={deletingIds.has(it.id)}
      >
        <button type="button" class="sc-lever" onclick={() => onToggle(it.id)}>
          <span class="sc-lever__track">
            <span class="sc-lever__knob" class:is-on={it.done}></span>
          </span>
          <span class="sc-lever__light" class:is-green={it.done} class:is-red={!it.done}></span>
          <span class="sc-lever__text">{it.text}</span>
          {#if it.done}<span class="sc-lever__check">CHECK ✓</span>{/if}
          {#if !it.done}<span class="sc-lever__warn">PENDING</span>{/if}
        </button>
        <button type="button" class="sc-jettison-btn" onclick={() => onRemove(it.id)}>JETTISON</button>
      </li>
    {/each}
  </ul>

  <div class="sc-todo-add">
    <span class="sc-todo-add__ts">{missionTime}</span>
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button type="button" class="sc-log-btn" onclick={onAdd}>LOG TASK</button>
  </div>
</div>
