<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelNesCheckbox from '../components/PixelNesCheckbox.svelte';
  import PixelNesProgress from '../components/PixelNesProgress.svelte';
  import PixelNesButton from '../components/PixelNesButton.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('todo'));

  type TodoItem = { id: string; text: string; done: boolean; cancelled: boolean };
  const STATE_KEY = 'second-brain:todo-state';

  let items = $state<TodoItem[]>([]);
  let draft = $state('');

  onMount(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.items)) items = s.items;
      }
    } catch {
      /* ignore */
    }
    if (!items.length) {
      items = [
        { id: '1', text: '完成统计学作业', done: false, cancelled: false },
        { id: '2', text: '复习假设检验', done: true, cancelled: false },
        { id: '3', text: '整理笔记双链', done: false, cancelled: false },
      ];
    }
  });

  function persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ items }));
    } catch {
      /* ignore */
    }
  }

  const active = $derived(items.filter((i) => !i.cancelled));
  const doneCount = $derived(active.filter((i) => i.done).length);

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    items = [{ id: crypto.randomUUID(), text, done: false, cancelled: false }, ...items];
    draft = '';
    persist();
  }

  function toggle(id: string) {
    items = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    persist();
  }
</script>

<PixelFloatingShell layoutKey="second-brain:todo-layout" title="{title} {doneCount}/{active.length}" defaultW={300} defaultH={320} {onClose}>
  <PixelNesProgress value={doneCount} max={Math.max(active.length, 1)} label={ui.todoProgress} variant="todo" />
  <ul class="pixel-nes-todo-list">
    {#each active as it (it.id)}
      <li>
        <PixelNesCheckbox checked={it.done} label={it.text} onchange={() => toggle(it.id)} />
      </li>
    {/each}
  </ul>
  <div class="pixel-nes-todo-add">
    <input bind:value={draft} class="pixel-nes-input" placeholder={ui.todoPlaceholder} onkeydown={(e) => e.key === 'Enter' && addItem()} />
    <PixelNesButton label={ui.add} onclick={addItem} />
  </div>
</PixelFloatingShell>
