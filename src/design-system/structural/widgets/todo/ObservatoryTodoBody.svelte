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
  const jd = $derived((2460000 + doneCount * 0.001).toFixed(4));
</script>

<div class="skin-todo skin-todo--observatory">
  {#if saveFlash}
    <p class="obs-log" aria-live="polite">Logged — JD {jd}</p>
  {/if}

  <div class="obs-arc-progress">
    <svg viewBox="0 0 100 24" class="obs-arc-progress__svg" aria-hidden="true">
      <path d="M4 20 A 46 46 0 0 1 96 20" fill="none" stroke="rgb(232 196 71 / 0.25)" stroke-width="2" />
      <path
        d="M4 20 A 46 46 0 0 1 96 20"
        fill="none"
        stroke="#e8c547"
        stroke-width="2"
        stroke-dasharray="144"
        stroke-dashoffset={144 - (144 * pct) / 100}
      />
    </svg>
    <span class="obs-arc-progress__ra">RA {Math.floor(pct * 0.24)}ʰ{Math.floor((pct % 10) * 6)}ᵐ</span>
  </div>

  <ul class="obs-todo-list">
    {#each items as it, i (it.id)}
      <li
        class="obs-todo-row"
        class:is-done={it.done}
        class:is-new={it.id === lastAddedId}
        class:is-meteor={deletingIds.has(it.id)}
      >
        <button type="button" class="obs-star" onclick={() => onToggle(it.id)}>
          <span class="obs-star__glyph">{it.done ? '✦' : '✧'}</span>
          <span class="obs-star__text">{it.text}</span>
          {#if it.done}<span class="obs-star__jd">JD {jd}</span>{/if}
          {#if it.id === lastAddedId}<span class="obs-star__coord">α {i + 1}ʰ δ +{i * 4}°</span>{/if}
        </button>
        <button type="button" class="obs-todo-rm" onclick={() => onRemove(it.id)}>☄</button>
      </li>
    {/each}
  </ul>

  <div class="obs-todo-add">
    <input
      value={draft}
      placeholder={ui.todoPlaceholder}
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button type="button" onclick={onAdd}>{ui.add}</button>
  </div>
</div>
