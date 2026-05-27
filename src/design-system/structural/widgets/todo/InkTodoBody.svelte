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
  const scrollPct = $derived(total > 0 ? Math.round((doneCount / total) * 100) : 0);
  let sealFlash = $state(false);
</script>

<div class="skin-todo skin-todo--ink">
  {#if saveFlash}
    <div class="ink-todo-seal ink-todo-seal--record" aria-live="polite">錄</div>
  {/if}

  <div class="ink-scroll-progress">
    <div class="ink-scroll-progress__roll ink-scroll-progress__roll--l"></div>
    <div class="ink-scroll-progress__paper" style="width:{scrollPct}%"></div>
    <div class="ink-scroll-progress__roll ink-scroll-progress__roll--r"></div>
  </div>

  <ul class="ink-todo-list">
    {#each items as it (it.id)}
      <li
        class="ink-todo-row"
        class:is-done={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-struck={deletingIds.has(it.id)}
      >
        <button type="button" class="ink-todo-main" onclick={() => onToggle(it.id)}>
          {#if it.done}<span class="ink-circle-mark">⊙</span>{/if}
          <span class="ink-todo-text">{it.text}</span>
        </button>
        <button type="button" class="ink-todo-rm" onclick={() => onRemove(it.id)}>誤</button>
        {#if deletingIds.has(it.id)}<span class="ink-strike-bar" aria-hidden="true">‖</span>{/if}
      </li>
    {/each}
  </ul>

  <div class="ink-todo-add">
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button
      type="button"
      onclick={() => {
        sealFlash = true;
        onAdd();
        window.setTimeout(() => (sealFlash = false), 1000);
      }}
    >
      {ui.add}
    </button>
    {#if sealFlash}<span class="ink-todo-seal ink-todo-seal--add">啟</span>{/if}
  </div>
</div>
