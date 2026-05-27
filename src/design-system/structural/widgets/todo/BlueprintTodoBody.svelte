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
  const dimVal = $derived((pct * 1.2).toFixed(1));
  let stampBtn = $state(false);
</script>

<div class="skin-todo skin-todo--blueprint">
  {#if saveFlash}
    <div class="bp-filed-stamp" aria-live="polite">DWG-001 ✓ FILED</div>
  {/if}

  <div class="bp-dim-progress">
    <span class="bp-dim-progress__label">DIM</span>
    <div class="bp-dim-progress__line">
      <span class="bp-dim-progress__tick bp-dim-progress__tick--l"></span>
      <span class="bp-dim-progress__fill" style="width:{pct}%"></span>
      <span class="bp-dim-progress__cursor" style="left:{pct}%"></span>
      <span class="bp-dim-progress__tick bp-dim-progress__tick--r"></span>
    </div>
    <span class="bp-dim-progress__val">{dimVal} mm ({pct}%)</span>
  </div>

  <ul class="bp-todo-list">
    {#each items as it, i (it.id)}
      <li
        class="bp-todo-row"
        class:is-done={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-erasing={deletingIds.has(it.id)}
      >
        {#if it.id === lastAddedId}
          <span class="bp-todo-annot" aria-hidden="true">· ├──</span>
        {/if}
        <button type="button" class="bp-todo-check" aria-pressed={it.done} onclick={() => onToggle(it.id)}>
          {it.done ? '' : '□'}
          {#if it.done}
            <svg class="bp-pencil-mark" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 18 L8 14 L20 4" fill="none" stroke="#f4ecd8" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          {/if}
        </button>
        <span class="bp-todo-text">{it.text}</span>
        <button type="button" class="bp-todo-erase" aria-label="erase" onclick={() => onRemove(it.id)}>⌫</button>
        {#if deletingIds.has(it.id)}
          <span class="bp-eraser-smudge" aria-hidden="true"></span>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="bp-todo-add">
    <span class="bp-todo-add__dot" aria-hidden="true">·</span>
    <span class="bp-todo-add__line" aria-hidden="true">├──</span>
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button
      type="button"
      class="bp-todo-add__btn"
      onclick={() => {
        stampBtn = true;
        onAdd();
        window.setTimeout(() => (stampBtn = false), 1400);
      }}
    >
      {ui.add}
    </button>
    {#if stampBtn}
      <span class="bp-approved-stamp">APPROVED</span>
    {/if}
  </div>
</div>
