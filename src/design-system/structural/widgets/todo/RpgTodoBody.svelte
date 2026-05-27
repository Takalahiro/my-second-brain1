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
  const exp = $derived(doneCount * 50);
  const expMax = $derived(Math.max(total, 1) * 50);
  let showQuestPopup = $state(false);
  let floatExp = $state<{ id: string; show: boolean } | null>(null);

  function toggleQuest(id: string, wasDone: boolean) {
    if (!wasDone) {
      floatExp = { id, show: true };
      window.setTimeout(() => (floatExp = null), 900);
    }
    onToggle(id);
  }
</script>

<div class="skin-todo skin-todo--rpg">
  {#if saveFlash}
    <div class="rpg-quest-complete" aria-live="polite">QUEST COMPLETE! 💰</div>
  {/if}
  {#if showQuestPopup}
    <div class="rpg-new-quest">NEW QUEST!</div>
  {/if}

  <div class="rpg-exp-bar">
    <span class="rpg-exp-bar__label">EXP</span>
    <div class="rpg-exp-bar__track">
      <div class="rpg-exp-bar__fill" style="width:{total ? (doneCount / total) * 100 : 0}%"></div>
      <span class="rpg-exp-bar__shine"></span>
    </div>
    <span class="rpg-exp-bar__val">{exp}/{expMax}</span>
  </div>

  <ul class="rpg-quest-list">
    {#each items as it (it.id)}
      <li
        class="rpg-quest-item"
        class:is-unlocked={it.done}
        class:is-locked={!it.done}
        class:is-abandon={deletingIds.has(it.id)}
      >
        <button type="button" class="rpg-quest-item__btn" onclick={() => toggleQuest(it.id, it.done)}>
          <span class="rpg-quest-item__icon">{it.done ? '⚔' : '🔒'}</span>
          <span class="rpg-quest-item__text">{it.text}</span>
          {#if !it.done && items.find((x) => !x.done)?.id === it.id}
            <span class="rpg-quest-item__arrow">▶</span>
          {/if}
        </button>
        <button type="button" class="rpg-quest-item__rm" onclick={() => onRemove(it.id)}>✕</button>
        {#if floatExp?.id === it.id && floatExp.show}
          <span class="rpg-exp-float">+50 EXP</span>
        {/if}
        {#if deletingIds.has(it.id)}
          <span class="rpg-abandon">QUEST ABANDONED</span>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="rpg-quest-add">
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button
      type="button"
      onclick={() => {
        showQuestPopup = true;
        onAdd();
        window.setTimeout(() => (showQuestPopup = false), 1400);
      }}
    >
      NEW QUEST
    </button>
  </div>
</div>
