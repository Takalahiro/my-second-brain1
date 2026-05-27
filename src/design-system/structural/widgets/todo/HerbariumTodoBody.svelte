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
  const specNo = $derived(String(doneCount).padStart(4, '0'));
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<div class="skin-todo skin-todo--herbarium">
  {#if saveFlash}
    <p class="herb-saved" aria-live="polite">No.{specNo} / {today}</p>
  {/if}

  <div class="herb-ruler-progress">
    <span class="herb-ruler__l">├</span>
    <span class="herb-ruler__fill" style="width:{total ? (doneCount / total) * 100 : 0}%"></span>
    <span class="herb-ruler__needle">▼</span>
    <span class="herb-ruler__r">┤</span>
    <span class="herb-ruler__no">No.{specNo}</span>
  </div>

  <ul class="herb-todo-list">
    {#each items as it (it.id)}
      <li
        class="herb-specimen"
        class:is-collected={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-archived={deletingIds.has(it.id)}
      >
        <button type="button" class="herb-specimen__frame" onclick={() => onToggle(it.id)}>
          <span class="herb-specimen__dash">{it.done ? '' : '┄┄'}</span>
          <span class="herb-specimen__text">{it.text}</span>
          {#if it.done}<span class="herb-specimen__stamp">✓ COLLECTED</span>{/if}
        </button>
        <button type="button" class="herb-specimen__rm" onclick={() => onRemove(it.id)}>✕</button>
        {#if deletingIds.has(it.id)}<span class="herb-archived-stamp">ARCHIVED</span>{/if}
      </li>
    {/each}
  </ul>

  <div class="herb-todo-add">
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button type="button" onclick={onAdd}>{ui.add}</button>
  </div>
</div>
