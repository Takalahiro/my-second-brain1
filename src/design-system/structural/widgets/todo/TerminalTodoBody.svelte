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
  const bar = $derived('█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10)));
  let cmdEcho = $state('');
  const spinFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let spinIdx = $state(0);

  $effect(() => {
    if (!deletingIds.size) return;
    const t = window.setInterval(() => {
      spinIdx = (spinIdx + 1) % spinFrames.length;
    }, 80);
    return () => window.clearInterval(t);
  });

  function runRm(id: string, label: string) {
    cmdEcho = `rm task_${id.slice(0, 4)}  # "${label.slice(0, 20)}"`;
    onRemove(id);
    window.setTimeout(() => (cmdEcho = ''), 900);
  }
</script>

<div class="skin-todo skin-todo--terminal">
  {#if saveFlash}
    <p class="term-ok" aria-live="polite">[OK] saved to ~/.todo</p>
  {/if}
  {#if cmdEcho}
    <p class="term-echo">{cmdEcho}</p>
  {/if}

  <pre class="term-bar">[{bar}] {pct}%</pre>

  <ul class="term-todo-list">
    {#each items as it (it.id)}
      <li class="term-todo-row" class:is-done={it.done} class:is-vanish={deletingIds.has(it.id)}>
        <button type="button" class="term-todo-toggle" onclick={() => onToggle(it.id)}>
          [{it.done ? 'x' : ' '}] {it.text}{it.done ? '  # done' : ''}
        </button>
        <button type="button" class="term-todo-rm" onclick={() => runRm(it.id, it.text)}>rm</button>
        {#if deletingIds.has(it.id)}<span class="term-spin">{spinFrames[spinIdx]}</span>{/if}
      </li>
    {/each}
  </ul>

  <div class="term-todo-add">
    <span class="term-prompt">$ todo add</span>
    <input
      value={draft}
      placeholder='"..."'
      oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
      onkeydown={(e) => e.key === 'Enter' && onAdd()}
    />
    <button type="button" onclick={onAdd}>{ui.add}</button>
  </div>
</div>
