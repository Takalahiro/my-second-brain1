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
  let waxSeal = $state(false);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
</script>

<div class="skin-todo skin-todo--scholar">
  {#if saveFlash}
    <p class="sch-margin-note" aria-live="polite">✓ recorded — {today}</p>
  {/if}

  <div class="sch-ribbon-progress">
    <span class="sch-ribbon" style="left:{pct}%"></span>
    <span class="sch-page-num">p.{doneCount}/{total}</span>
  </div>

  <ul class="sch-todo-list">
    {#each items as it (it.id)}
      <li
        class="sch-todo-row"
        class:is-done={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-deleted={deletingIds.has(it.id)}
      >
        {#if it.id === lastAddedId}<span class="sch-ink-dot" aria-hidden="true">·</span>{/if}
        <button type="button" class="sch-todo-mark" aria-pressed={it.done} onclick={() => onToggle(it.id)}>
          {it.done ? '✓' : '○'}
        </button>
        <span class="sch-todo-text">{it.text}</span>
        <button type="button" class="sch-todo-rm" onclick={() => onRemove(it.id)}>✕</button>
        {#if deletingIds.has(it.id)}
          <span class="sch-deleted-note">deleted</span>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="sch-todo-add">
    <span class="sch-ink-dot">·</span>
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button
      type="button"
      onclick={() => {
        waxSeal = true;
        onAdd();
        window.setTimeout(() => (waxSeal = false), 1200);
      }}
    >
      {ui.add}
    </button>
    {#if waxSeal}
      <span class="sch-wax-seal sch-wax-seal--sm is-glow" aria-hidden="true">
        <span class="sch-wax-seal__letter">✓</span>
        <span class="sch-wax-seal__sheen"></span>
      </span>
    {/if}
  </div>
</div>
