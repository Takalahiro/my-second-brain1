<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveStructuralSkin } from '../skin-context';
  import { getMessages, initLocale } from '../../../lib/i18n/locale.svelte';

  let isDark = $state(false);
  let pulsing = $state(false);
  const skin = resolveStructuralSkin();
  const m = $derived(getMessages());

  onMount(() => {
    initLocale();
    isDark = document.documentElement.classList.contains('dark');
  });

  function flashPulse() {
    pulsing = true;
    window.setTimeout(() => {
      pulsing = false;
    }, 420);
  }

  function toggle() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    flashPulse();
  }
</script>

<button
  type="button"
  class="skin-menubar-ctl skin-mb-theme skin-mb-theme--{skin}"
  class:is-dark={isDark}
  class:is-pulse={pulsing}
  onclick={toggle}
  role="switch"
  aria-checked={isDark}
  aria-label={isDark ? m.theme.toLight : m.theme.toDark}
  title={isDark ? m.theme.light : m.theme.dark}
>
  {#if skin === 'blueprint'}
    <span class="skin-mb-theme__bp" aria-hidden="true">
      <span class="skin-mb-theme__bp-lamp">{isDark ? '☾' : '☀'}</span>
      <span class="skin-mb-theme__bp-line"></span>
      <span class="skin-mb-theme__bp-tag">{isDark ? 'NIGHT' : 'DAY'}</span>
    </span>
  {:else if skin === 'scholar'}
    <span class="skin-mb-theme__scholar" aria-hidden="true">
      <span class="skin-mb-theme__flame" class:is-lit={!isDark}></span>
      <span class="skin-mb-theme__scholar-cap">{isDark ? 'nocturne' : 'daylight'}</span>
    </span>
  {:else if skin === 'terminal'}
    <span class="skin-mb-theme__term" aria-hidden="true">
      <span class="skin-mb-theme__term-prompt">DARK_MODE=</span>
      <span class="skin-mb-theme__term-val">{isDark ? '1' : '0'}</span>
    </span>
  {:else if skin === 'crt'}
    <span class="skin-mb-theme__crt" aria-hidden="true">
      <span class="skin-mb-theme__crt-ch">LUM</span>
      <span class="skin-mb-theme__crt-face">{isDark ? '▮ LO ' : '▯ HI'}</span>
    </span>
  {:else if skin === 'observatory'}
    <span class="skin-mb-theme__obs" aria-hidden="true">
      <span class="skin-mb-theme__dome" class:is-open={!isDark}></span>
      <span class="skin-mb-theme__obs-lbl">{isDark ? 'DARK SKY' : 'DAY SKY'}</span>
    </span>
  {:else if skin === 'herbarium'}
    <span class="skin-mb-theme__herb" aria-hidden="true">
      <span class="skin-mb-theme__herb-stamp">{isDark ? 'STORED' : 'EXPOSED'}</span>
    </span>
  {:else if skin === 'ink'}
    <span class="skin-mb-theme__ink" aria-hidden="true">
      <span class="skin-mb-theme__ink-seal">{isDark ? '暗' : '明'}</span>
    </span>
  {:else if skin === 'rpg'}
    <span class="skin-mb-theme__rpg" aria-hidden="true">
      <span class="skin-mb-theme__rpg-icon">{isDark ? '☾' : '☀'}</span>
      <span class="skin-mb-theme__rpg-lbl">{isDark ? 'NIGHT' : 'DAY'}</span>
    </span>
  {:else if skin === 'spacecraft'}
    <span class="skin-mb-theme__sc" aria-hidden="true">
      <span class="skin-mb-theme__sc-lamps">
        <span class="skin-mb-theme__sc-led" class:is-on={!isDark}></span>
        <span class="skin-mb-theme__sc-led" class:is-on={isDark} data-dim></span>
      </span>
      <span class="skin-mb-theme__sc-lbl">{isDark ? 'DIM' : 'BRIGHT'}</span>
    </span>
  {/if}
</button>
