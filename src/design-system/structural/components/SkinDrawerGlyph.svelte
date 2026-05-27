<script lang="ts">
  /** 结构换皮抽屉内图标 — 替代 PixelIcon */
  import { resolveStructuralSkin } from '../skin-context';

  interface Props {
    name: string;
    size?: number;
  }

  let { name, size = 16 }: Props = $props();
  const skin = resolveStructuralSkin();

  const GLYPH: Record<string, string> = {
    gear: '⚙',
    search: '⌕',
    clear: '⌫',
    notes: '✎',
    book: '✎',
    todo: '☑',
    check: '☑',
    calendar: '📅',
    music: '♫',
    weather: '☁',
    cloud: '☁',
    stats: '▤',
    chart: '▤',
    clock: '◷',
    world: '⌖',
    globe: '⌖',
    graph: '◈',
    network: '⎔',
    signal: '⎔',
    pomodoro: '⏱',
    timer: '⏱',
    whitenoise: '≋',
    rain: '≋',
    background: '▣',
    landscape: '▣',
    home: '⌂',
    wallpaper: '▦',
    frame: '▦',
    widgets: '▤',
    puzzle: '▤',
    ui: '◫',
    palette: '◫',
    desktop: '▭',
    monitor: '▭',
    map: '⊞',
    calc: '∑',
    python: 'Py',
    whiteboard: '▢',
  };

  const glyph = $derived(GLYPH[name] ?? '•');
</script>

<span
  class="skin-drawer-glyph skin-drawer-glyph--{skin}"
  style:font-size="{size}px"
  aria-hidden="true"
>{glyph}</span>

<style>
  .skin-drawer-glyph {
    display: inline-grid;
    place-items: center;
    line-height: 1;
    font-family: var(--struct-font-body, monospace);
  }
</style>
