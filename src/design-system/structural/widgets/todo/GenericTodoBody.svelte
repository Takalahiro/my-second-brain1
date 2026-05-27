<script lang="ts">
  import PixelNesCheckbox from '../../../pixel/components/PixelNesCheckbox.svelte';
  import PixelNesProgress from '../../../pixel/components/PixelNesProgress.svelte';
  import PixelNesButton from '../../../pixel/components/PixelNesButton.svelte';
  import { getStructuralUi } from '../../structural-i18n';

  interface TodoItem {
    id: string;
    text: string;
    done: boolean;
  }

  interface Props {
    items: TodoItem[];
    draft: string;
    doneCount: number;
    total: number;
    onToggle: (id: string) => void;
    onDraftChange: (v: string) => void;
    onAdd: () => void;
  }

  let { items, draft, doneCount, total, onToggle, onDraftChange, onAdd }: Props = $props();
  const ui = $derived(getStructuralUi());
</script>

<PixelNesProgress value={doneCount} max={Math.max(total, 1)} label={ui.todoProgress} variant="todo" />
<ul class="pixel-nes-todo-list">
  {#each items as it (it.id)}
    <li>
      <PixelNesCheckbox checked={it.done} label={it.text} onchange={() => onToggle(it.id)} />
    </li>
  {/each}
</ul>
<div class="pixel-nes-todo-add">
  <input
    value={draft}
    class="pixel-nes-input"
    placeholder={ui.todoPlaceholder}
    oninput={(e) => onDraftChange((e.currentTarget as HTMLInputElement).value)}
    onkeydown={(e) => e.key === 'Enter' && onAdd()}
  />
  <PixelNesButton label={ui.add} onclick={onAdd} />
</div>
