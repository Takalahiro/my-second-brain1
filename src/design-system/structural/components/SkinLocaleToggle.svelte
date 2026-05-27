<script lang="ts">
  import { onMount } from 'svelte';
  import { resolveStructuralSkin } from '../skin-context';
  import { getMessages, initLocale, localeState, toggleLocale } from '../../../lib/i18n/locale.svelte';

  let pulsing = $state(false);
  const skin = resolveStructuralSkin();
  const isEn = $derived(localeState.current === 'en');

  onMount(() => {
    initLocale();
  });

  const label = $derived(
    localeState.current === 'zh' ? getMessages().locale.switchToEn : getMessages().locale.switchToZh,
  );

  function flashPulse() {
    pulsing = true;
    window.setTimeout(() => {
      pulsing = false;
    }, 420);
  }

  function toggle() {
    toggleLocale();
    flashPulse();
  }
</script>

<button
  type="button"
  class="skin-menubar-ctl skin-mb-locale skin-mb-locale--{skin}"
  class:is-en={isEn}
  class:is-pulse={pulsing}
  onclick={toggle}
  aria-label={getMessages().locale.aria}
  title={label}
>
  {#if skin === 'blueprint'}
    <span class="skin-mb-locale__bp" aria-hidden="true">
      <span class="skin-mb-locale__term">T1</span>
      <span class="skin-mb-locale__circuit">
        <span class:lit={!isEn}>中</span>
        <span class="skin-mb-locale__gap"></span>
        <span class:lit={isEn}>EN</span>
      </span>
      <span class="skin-mb-locale__term">T2</span>
    </span>
  {:else if skin === 'scholar'}
    <span class="skin-mb-locale__scholar" aria-hidden="true">
      <span class:lit={!isEn}>漢</span>
      <span class="skin-mb-locale__sep">·</span>
      <span class:lit={isEn}>Lat</span>
    </span>
  {:else if skin === 'terminal'}
    <span class="skin-mb-locale__term-line" aria-hidden="true">
      <span class="skin-mb-locale__prompt">LANG=</span>
      <span class="skin-mb-locale__val">{isEn ? 'en_US' : 'zh_CN'}</span>
    </span>
  {:else if skin === 'crt'}
    <span class="skin-mb-locale__crt" aria-hidden="true">
      <span class="skin-mb-locale__crt-ch">SUB</span>
      <span class="skin-mb-locale__crt-face">{isEn ? '▮ EN' : '▯ 中'}</span>
    </span>
  {:else if skin === 'observatory'}
    <span class="skin-mb-locale__obs" aria-hidden="true">
      <span class="skin-mb-locale__hemi" class:lit={!isEn}>E</span>
      <span class="skin-mb-locale__hemi" class:lit={isEn}>W</span>
    </span>
  {:else if skin === 'herbarium'}
    <span class="skin-mb-locale__herb-stamp" aria-hidden="true">{isEn ? 'EN CAT' : '中文目'}</span>
  {:else if skin === 'ink'}
    <span class="skin-mb-locale__ink" aria-hidden="true">
      <span class="skin-mb-locale__seal" class:lit={!isEn}>中</span>
      <span class="skin-mb-locale__seal" class:lit={isEn}>EN</span>
    </span>
  {:else if skin === 'rpg'}
    <span class="skin-mb-locale__rpg" aria-hidden="true">
      <span class="skin-mb-locale__rpg-tab" class:lit={!isEn}>[CN]</span>
      <span class="skin-mb-locale__rpg-tab" class:lit={isEn}>[EN]</span>
    </span>
  {:else if skin === 'spacecraft'}
    <span class="skin-mb-locale__sc" aria-hidden="true">
      <span class="skin-mb-locale__sc-ch" class:lit={!isEn}>A</span>
      <span class="skin-mb-locale__sc-ch" class:lit={isEn}>B</span>
      <span class="skin-mb-locale__sc-lbl">{isEn ? 'COMM-B' : 'COMM-A'}</span>
    </span>
  {/if}
</button>
