<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFloatingShell from '../components/PixelFloatingShell.svelte';
  import PixelNesButton from '../components/PixelNesButton.svelte';
  import { getPixelUi, pixelWidgetTitle } from '../pixel-i18n';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getPixelUi());
  const title = $derived(pixelWidgetTitle('notes'));

  type NoteItem = { slug: string; title: string; description?: string };
  const STATE_KEY = 'second-brain:notes-widget-state';

  let notes = $state<NoteItem[]>([]);
  let index = $state(0);
  let contentText = $state('');

  const current = $derived(notes[index]);

  onMount(async () => {
    try {
      const res = await fetch('/data/notes.json', { cache: 'force-cache' });
      if (res.ok) notes = ((await res.json()) as NoteItem[]).slice(0, 40);
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.selectedSlug === 'string') {
          const i = notes.findIndex((n) => n.slug === s.selectedSlug);
          if (i >= 0) index = i;
        }
      }
    } catch {
      notes = [{ slug: 'demo', title: '示例', description: '笔记加载失败' }];
    }
    await loadContent();
  });

  async function loadContent() {
    const n = notes[index];
    if (!n) return;
    try {
      const res = await fetch(`/notes/${n.slug}/index.html`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      contentText = (doc.querySelector('.prose')?.textContent ?? n.description ?? n.title).slice(0, 1200);
    } catch {
      contentText = n.description ?? n.title;
    }
  }

  function pick(i: number) {
    index = i;
    void loadContent();
  }

  function next() {
    pick((index + 1) % Math.max(notes.length, 1));
  }

  function prev() {
    pick((index - 1 + notes.length) % Math.max(notes.length, 1));
  }
</script>

<PixelFloatingShell layoutKey="second-brain:notes-widget-layout" title="{title} - {current?.title ?? ''}" defaultW={420} defaultH={320} {onClose}>
  <div class="pixel-nes-notes-layout">
    <nav class="pixel-nes-notes-sidebar" aria-label={ui.notes}>
      {#each notes.slice(0, 12) as n, i (n.slug)}
        <button type="button" data-active={i === index} onclick={() => pick(i)}>{n.title.slice(0, 8)}</button>
      {/each}
    </nav>
    <article class="pixel-nes-notes-body">{contentText}</article>
  </div>
  <div class="pixel-nes-notes-nav">
    <PixelNesButton label={ui.prevNote} onclick={prev} />
    <PixelNesButton label={ui.nextNote} onclick={next} />
  </div>
</PixelFloatingShell>
