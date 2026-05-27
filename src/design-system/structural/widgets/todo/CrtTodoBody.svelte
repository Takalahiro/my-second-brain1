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
  const pct = $derived(total > 0 ? Math.round((doneCount / total) * 100) : 0);
  const bar = $derived('█'.repeat(Math.round(pct / 8)) + '░'.repeat(Math.max(0, 16 - Math.round(pct / 8))));
  let flicker = $state(false);
</script>

<div class="skin-todo skin-todo--crt">
  {#if saveFlash}
    <div class="crt-marquee" aria-live="polite">*** SAVED ***</div>
  {/if}

  <pre class="crt-bar">{bar} {pct}%</pre>

  <ul class="crt-todo-list">
    {#each items as it (it.id)}
      <li
        class="crt-todo-row"
        class:is-done={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-dissolve={deletingIds.has(it.id)}
      >
        <button
          type="button"
          class="crt-todo-toggle"
          onclick={() => {
            if (!it.done) flicker = true;
            onToggle(it.id);
            window.setTimeout(() => (flicker = false), 120);
          }}
        >
          {it.done ? '◉' : '◯'} {it.text}
        </button>
        <button type="button" class="crt-todo-rm" onclick={() => onRemove(it.id)}>DEL</button>
      </li>
    {/each}
  </ul>

  <div class="crt-todo-add" class:is-flicker={flicker}>
    <span class="crt-cursor">&gt;</span>
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button type="button" onclick={onAdd}>{ui.add}</button>
  </div>
</div>
