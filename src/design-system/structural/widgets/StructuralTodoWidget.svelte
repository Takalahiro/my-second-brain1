<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getTodoBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('todo'));
  const skin = resolveStructuralSkin();
  const TodoBody = getTodoBodyComponent(skin);

  type TodoItem = { id: string; text: string; done: boolean; cancelled: boolean };
  const STATE_KEY = 'second-brain:todo-state';

  let items = $state<TodoItem[]>([]);
  let draft = $state('');
  let deletingIds = $state<Set<string>>(new Set());
  let lastAddedId = $state<string | null>(null);
  let saveFlash = $state(false);

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

  function flashSave() {
    saveFlash = true;
    window.setTimeout(() => {
      saveFlash = false;
    }, 2200);
  }

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
    const id = crypto.randomUUID();
    items = [{ id, text, done: false, cancelled: false }, ...items];
    draft = '';
    lastAddedId = id;
    persist();
    flashSave();
  }

  function toggle(id: string) {
    items = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    persist();
    flashSave();
  }

  function remove(id: string) {
    deletingIds = new Set(deletingIds).add(id);
    window.setTimeout(() => {
      items = items.filter((it) => it.id !== id);
      const next = new Set(deletingIds);
      next.delete(id);
      deletingIds = next;
      persist();
    }, 650);
  }
</script>

<SkinFloatingShell layoutKey="todo-layout" title="{title} {doneCount}/{active.length}" defaultW={300} defaultH={340} {onClose}>
  <TodoBody
    items={active}
    {draft}
    {doneCount}
    total={active.length}
    {deletingIds}
    {lastAddedId}
    {saveFlash}
    onToggle={toggle}
    onRemove={remove}
    onDraftChange={(v) => (draft = v)}
    onAdd={addItem}
  />
</SkinFloatingShell>
