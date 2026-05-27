<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveStructuralSkin } from '../skin-context';
  import { getMessages, initLocale } from '../../../lib/i18n/locale.svelte';

  const KEY = 'second-brain:font-family';
  const OPTIONS = ['wenkai', 'inter', 'serif', 'plex', 'jp-pixel'] as const;
  type FontKey = (typeof OPTIONS)[number];

  let font = $state<FontKey>('wenkai');
  const skin = resolveStructuralSkin();
  const m = $derived(getMessages());

  function apply(next: FontKey) {
    font = next;
    document.documentElement.setAttribute('data-font', next);
    localStorage.setItem(KEY, next);
  }

  onMount(() => {
    initLocale();
    const current = document.documentElement.getAttribute('data-font');
    const saved = localStorage.getItem(KEY);
    const next = ([saved, current].find((v) => OPTIONS.includes(v as FontKey)) ?? 'wenkai') as FontKey;
    apply(next);
  });
</script>

<label class="skin-menubar-ctl skin-menubar-ctl--font skin-menubar-ctl--{skin}" aria-label={m.font.label}>
  <span class="skin-menubar-ctl__glyph" aria-hidden="true">Aa</span>
  <select
    class="skin-menubar-ctl__select"
    bind:value={font}
    onchange={(e) => apply((e.currentTarget as HTMLSelectElement).value as FontKey)}
  >
    <option value="wenkai">{m.font.wenkai}</option>
    <option value="inter">{m.font.inter}</option>
    <option value="serif">{m.font.serif}</option>
    <option value="plex">{m.font.plex}</option>
    <option value="jp-pixel">{m.font.jpPixel}</option>
  </select>
</label>
