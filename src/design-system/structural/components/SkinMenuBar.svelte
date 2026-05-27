<script lang="ts">
  import { onMount } from 'svelte';
  import SkinThemeToggle from './SkinThemeToggle.svelte';
  import SkinLocaleToggle from './SkinLocaleToggle.svelte';
  import SkinFontSwitcher from './SkinFontSwitcher.svelte';
  import MenuBarRainGlass from '../../../components/desktop/MenuBarRainGlass.svelte';
  import SiteLogo from '../../../components/SiteLogo.svelte';
  import SkinMissionStatus from '../../../components/desktop/SkinMissionStatus.svelte';
  import { useSkinChrome } from '../../../features/ui/skin-chrome.svelte';
  import { isStructuralSkinId } from '../registry';
  import { getMenuBarBrand } from '../lib/structural-copy';
  import { getSiteNavLinks, getMessages, initLocale, localeState } from '../../../lib/i18n/locale.svelte';

  interface Props {
    controlCenterOpen?: boolean;
    globalMuted?: boolean;
    hasSnapshot?: boolean;
    isCleared?: boolean;
    rainDrops?: boolean;
    onToggleControlCenter?: () => void;
    onToggleMute?: () => void;
    onClearAll?: () => void;
    onRestore?: () => void;
    onToggleManual?: () => void;
    onOpenSpotlight?: () => void;
  }

  let {
    controlCenterOpen = false,
    globalMuted = false,
    hasSnapshot = false,
    isCleared = false,
    rainDrops = false,
    onToggleControlCenter,
    onToggleMute,
    onClearAll,
    onRestore,
    onToggleManual,
    onOpenSpotlight,
  }: Props = $props();

  let menuOpen = $state(false);
  let now = $state(new Date());
  let coarsePointer = $state(false);
  const skinChrome = useSkinChrome();
  const skin = $derived(isStructuralSkinId(skinChrome.id) ? skinChrome.id : 'blueprint');
  const brand = $derived(getMenuBarBrand(skin));

  const menuTime = $derived(
    now.toLocaleString(localeState.current === 'en' ? 'en-US' : 'zh-CN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  );
  const navLinks = $derived(getSiteNavLinks());
  const m = $derived(getMessages());

  function closeMenu() {
    menuOpen = false;
  }

  function toggleMenu(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    menuOpen = !menuOpen;
  }

  function runMenuAction(fn?: () => void) {
    fn?.();
    closeMenu();
  }

  onMount(() => {
    initLocale();
    coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const id = window.setInterval(() => {
      now = new Date();
    }, 30_000);

    const onDocPointerDown = (e: PointerEvent) => {
      if (!menuOpen) return;
      if ((e.target as HTMLElement).closest('.skin-menu-bar__brand-btn')) return;
      closeMenu();
    };

    window.addEventListener('pointerdown', onDocPointerDown, { capture: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pointerdown', onDocPointerDown, { capture: true });
    };
  });
</script>

{#if menuOpen && coarsePointer}
  <button type="button" class="skin-menu-bar__backdrop" aria-label={m.menu.closeMenu} onclick={closeMenu}></button>
{/if}

{#if skinChrome.immersive}
  <div class="skin-status-strip hud-status-strip" aria-hidden="false">
    <SkinMissionStatus skin={skinChrome.id} />
  </div>
{/if}

<header
  class="skin-menu-bar skin-menu-bar--{skin}"
  class:has-rain-glass={rainDrops}
  class:has-hud-strip={skinChrome.immersive}
  aria-label={m.menu.systemMenu}
>
  <MenuBarRainGlass active={rainDrops} />
  <div class="skin-menu-bar__left">
    <span class="skin-menu-bar__stamp" aria-hidden="true">{brand.tag}</span>
    <div class="skin-menu-bar__brand">
      <button
        type="button"
        class="skin-menu-bar__brand-btn skin-menu-bar__touch"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={m.menu.systemMenu}
        title={m.menu.systemMenu}
        onpointerdown={toggleMenu}
      >
        <SiteLogo size={22} />
      </button>
      {#if menuOpen}
        <ul class="skin-menu-bar__dropdown" role="menu">
          <li role="none">
            <button type="button" role="menuitem" onclick={() => runMenuAction(onToggleManual)}>
              {m.menu.manual}
            </button>
          </li>
          <li class="skin-menu-bar__sep" role="separator"></li>
          {#each navLinks as item (item.href)}
            <li role="none">
              <a href={item.href} role="menuitem" title={item.title} onclick={closeMenu}>{item.label}</a>
            </li>
          {/each}
          <li class="skin-menu-bar__sep" role="separator"></li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              disabled={isCleared}
              onclick={() => {
                if (!isCleared) runMenuAction(onClearAll);
              }}
            >
              {m.menu.clearScreen}
            </button>
          </li>
          {#if hasSnapshot}
            <li role="none">
              <button type="button" role="menuitem" onclick={() => runMenuAction(onRestore)}>
                {m.menu.restoreLayout}
              </button>
            </li>
          {/if}
          <li class="skin-menu-bar__sep" role="separator"></li>
          <li role="none">
            <button type="button" role="menuitem" onclick={() => runMenuAction(onOpenSpotlight)}>
              {m.menu.searchWidgets}
              {#if coarsePointer}
                <span class="skin-menu-bar__kbd" aria-hidden="true">⌕</span>
              {:else}
                <span class="skin-menu-bar__kbd">⌘K</span>
              {/if}
            </button>
          </li>
          {#if coarsePointer}
            <li class="skin-menu-bar__sep" role="separator"></li>
            <li role="none">
              <button type="button" role="menuitem" onclick={() => runMenuAction(onToggleControlCenter)}>
                {m.menu.controlCenter}
              </button>
            </li>
          {/if}
        </ul>
      {/if}
    </div>
    <span class="skin-menu-bar__app">{brand.app}</span>
    <nav class="skin-menu-bar__nav" aria-label={m.nav.siteNav}>
      {#each navLinks as item (item.href)}
        <a href={item.href} class="skin-menu-bar__nav-link" title={item.title}>{item.label}</a>
      {/each}
    </nav>
  </div>

  <div class="skin-menu-bar__right">
    <div class="skin-menu-bar__util">
      <SkinLocaleToggle />
      <SkinFontSwitcher />
      <SkinThemeToggle />
    </div>
    {#if hasSnapshot}
      <button
        type="button"
        class="skin-menu-bar__icon skin-menu-bar__touch skin-menu-bar__clear is-restore"
        aria-label={m.menu.restoreBtn}
        title={m.menu.restoreBtn}
        onclick={() => onRestore?.()}
      >
        ↩
      </button>
    {:else}
      <button
        type="button"
        class="skin-menu-bar__icon skin-menu-bar__touch skin-menu-bar__clear"
        class:is-disabled={isCleared}
        aria-label={m.menu.clearScreenBtn}
        title={isCleared ? m.menu.clearScreenDisabled : m.menu.clearScreenBtn}
        disabled={isCleared}
        onclick={() => {
          if (!isCleared) onClearAll?.();
        }}
      >
        ⌫
      </button>
    {/if}
    <button
      type="button"
      class="skin-menu-bar__icon skin-menu-bar__touch skin-menu-bar__mute"
      aria-label={globalMuted ? m.menu.unmute : m.menu.mute}
      title={globalMuted ? m.menu.unmute : m.menu.mute}
      onclick={() => onToggleMute?.()}
    >
      {globalMuted ? '🔇' : '🔊'}
    </button>
    <button
      type="button"
      class="skin-menu-bar__icon skin-menu-bar__touch skin-menu-bar__gear"
      class:is-active={controlCenterOpen}
      aria-label={controlCenterOpen ? m.menu.closeControlCenter : m.menu.openControlCenter}
      title={m.menu.controlCenter}
      aria-pressed={controlCenterOpen}
      onclick={() => onToggleControlCenter?.()}
    >
      ⚙
    </button>
    <time class="skin-menu-bar__clock" datetime={now.toISOString()}>{menuTime}</time>
  </div>
</header>
