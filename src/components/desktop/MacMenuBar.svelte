<script lang="ts">
  import { onMount } from 'svelte';
  import ThemeToggle from '../ThemeToggle.svelte';
  import FontSwitcher from '../FontSwitcher.svelte';
  import LocaleToggle from '../LocaleToggle.svelte';
  import MenuBarRainGlass from './MenuBarRainGlass.svelte';
  import SiteLogo from '../SiteLogo.svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import SkinMissionStatus from './SkinMissionStatus.svelte';
  import { useSkinChrome } from '../../features/ui/skin-chrome.svelte';
  import { getSiteNavLinks, getMessages, initLocale, localeState } from '../../lib/i18n/locale.svelte';

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

  const menuTime = $derived(
    now.toLocaleString(localeState.current === 'en' ? 'en-US' : 'zh-CN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
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
      if ((e.target as HTMLElement).closest('.mac-menu-apple')) return;
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
  <button
    type="button"
    class="mac-menu-backdrop"
    aria-label={m.menu.closeMenu}
    onclick={closeMenu}
  ></button>
{/if}

{#if skinChrome.immersive}
  <div class="skin-status-strip hud-status-strip" aria-hidden="false">
    <SkinMissionStatus skin={skinChrome.id} />
  </div>
{/if}

<header class="mac-menu-bar" class:has-rain-glass={rainDrops} class:has-hud-strip={skinChrome.immersive} class:has-skin-strip={skinChrome.immersive} aria-label={m.menu.systemMenu}>
  <MenuBarRainGlass active={rainDrops} />
  <div class="mac-menu-left">
    <div class="mac-menu-apple">
      <button
        type="button"
        class="mac-menu-item mac-menu-logo mac-menu-touch"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={m.menu.systemMenu}
        title={m.menu.systemMenu}
        onpointerdown={toggleMenu}
      >
        <SiteLogo size={22} />
      </button>
      {#if menuOpen}
        <ul class="mac-menu-dropdown" role="menu">
          <li role="none">
            <button type="button" role="menuitem" onclick={() => runMenuAction(onToggleManual)}>
              {m.menu.manual}
            </button>
          </li>
          <li class="mac-menu-sep" role="separator"></li>
          {#each navLinks as item (item.href)}
            <li role="none">
              <a href={item.href} role="menuitem" title={item.title} onclick={closeMenu}>{item.label}</a>
            </li>
          {/each}
          <li class="mac-menu-sep" role="separator"></li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              disabled={isCleared}
              onclick={() => { if (!isCleared) runMenuAction(onClearAll); }}
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
          <li class="mac-menu-sep" role="separator"></li>
          <li role="none">
            <button type="button" role="menuitem" onclick={() => runMenuAction(onOpenSpotlight)}>
              {m.menu.searchWidgets} {#if coarsePointer}<PixelIcon name="search" size={14} />{:else}⌘K{/if}
            </button>
          </li>
          {#if coarsePointer}
            <li class="mac-menu-sep" role="separator"></li>
            <li role="none">
              <button type="button" role="menuitem" onclick={() => runMenuAction(onToggleControlCenter)}>
                {m.menu.controlCenter}
              </button>
            </li>
          {/if}
        </ul>
      {/if}
    </div>
    <span class="mac-menu-item mac-menu-app-name">My Second Brain</span>
    <nav class="mac-menu-nav" aria-label={m.nav.siteNav}>
      {#each navLinks as item (item.href)}
        <a href={item.href} class="mac-menu-nav-link" title={item.title}>{item.label}</a>
      {/each}
    </nav>
  </div>

  <div class="mac-menu-right">
    <div class="mac-menu-util">
      <LocaleToggle />
      <FontSwitcher />
      <ThemeToggle />
    </div>
    {#if hasSnapshot}
      <button
        type="button"
        class="mac-menu-item mac-menu-icon-btn mac-menu-touch mac-menu-clear is-restore"
        aria-label={m.menu.restoreBtn}
        title={m.menu.restoreBtn}
        onclick={() => onRestore?.()}
      >
        ↩
      </button>
    {:else}
      <button
        type="button"
        class="mac-menu-item mac-menu-icon-btn mac-menu-touch mac-menu-clear"
        class:is-disabled={isCleared}
        aria-label={m.menu.clearScreenBtn}
        title={isCleared ? m.menu.clearScreenDisabled : m.menu.clearScreenBtn}
        disabled={isCleared}
        onclick={() => { if (!isCleared) onClearAll?.(); }}
      >
        <PixelIcon name="clear" size={16} />
      </button>
    {/if}
    <button
      type="button"
      class="mac-menu-item mac-menu-icon-btn mac-menu-touch mac-menu-icon-compact"
      aria-label={globalMuted ? m.menu.unmute : m.menu.mute}
      title={globalMuted ? m.menu.unmute : m.menu.mute}
      onclick={() => onToggleMute?.()}
    >
      {globalMuted ? '🔇' : '🔊'}
    </button>
    <button
      type="button"
      class="mac-menu-item mac-menu-icon-btn mac-menu-touch mac-menu-gear"
      class:is-active={controlCenterOpen}
      aria-label={controlCenterOpen ? m.menu.closeControlCenter : m.menu.openControlCenter}
      title={m.menu.controlCenter}
      aria-pressed={controlCenterOpen}
      onclick={() => onToggleControlCenter?.()}
    >
      ⚙
    </button>
    <time class="mac-menu-clock" datetime={now.toISOString()}>{menuTime}</time>
  </div>
</header>

<style>
  .mac-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 119;
    border: 0;
    padding: 0;
    margin: 0;
    background: rgb(0 0 0 / 0.12);
    cursor: default;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .mac-menu-bar {
    position: fixed;
    top: max(env(safe-area-inset-top, 0px), 8px);
    left: max(env(safe-area-inset-left, 0px), 12px);
    right: max(env(safe-area-inset-right, 0px), 12px);
    z-index: 120;
    height: 44px;
    padding: 0 10px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    overflow: hidden;
    background: linear-gradient(180deg, var(--chrome-bg-top) 0%, var(--chrome-bg-bottom) 100%);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--chrome-border);
    border-radius: 16px;
    box-shadow: var(--chrome-shadow);
    font-size: 0.84rem;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    color: var(--chrome-text);
    transition:
      background var(--motion-base) var(--motion-ease),
      border-color var(--motion-base) var(--motion-ease),
      box-shadow var(--motion-base) var(--motion-ease),
      color var(--motion-base) var(--motion-ease);
  }
  .mac-menu-bar.has-rain-glass {
    background: linear-gradient(180deg, var(--chrome-bg-top) 0%, var(--chrome-bg-bottom) 100%);
    border-color: var(--chrome-border);
  }
  .mac-menu-left,
  .mac-menu-right {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .mac-menu-right {
    gap: 6px;
    flex-shrink: 0;
  }
  .mac-menu-item {
    border: 0;
    background: transparent;
    color: var(--chrome-text);
    font: inherit;
    padding: 4px 10px;
    border-radius: 10px;
    cursor: default;
    white-space: nowrap;
  }
  .mac-menu-touch {
    cursor: pointer;
    touch-action: manipulation;
    min-width: 36px;
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 12px;
    transition: background 0.12s ease, transform 0.1s ease;
  }
  .mac-menu-touch:active:not(:disabled) {
    transform: scale(0.94);
    background: var(--chrome-active);
  }
  @media (pointer: coarse) {
    .mac-menu-touch {
      min-width: 44px;
      min-height: 44px;
    }
    .mac-menu-util {
      display: none;
    }
    .mac-menu-icon-compact {
      display: none;
    }
  }
  .mac-menu-logo {
    padding: 0 6px;
    background: var(--chrome-subtle);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.35);
  }
  .mac-menu-logo:hover {
    background: var(--chrome-hover);
  }
  .mac-menu-logo:hover,
  .mac-menu-icon-btn:hover:not(:disabled),
  .mac-menu-gear:hover {
    background: var(--chrome-hover);
  }
  .mac-menu-gear.is-active {
    background: rgb(180 140 255 / 0.28);
    box-shadow: inset 0 0 0 1px rgb(200 170 255 / 0.35);
  }
  .mac-menu-clear.is-restore {
    background: rgb(80 140 220 / 0.22);
  }
  .mac-menu-clear.is-disabled,
  .mac-menu-clear:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .mac-menu-app-name {
    font-size: 0.88rem;
    letter-spacing: 0.01em;
    color: var(--chrome-text);
    padding-left: 2px;
  }
  .mac-menu-muted {
    color: var(--chrome-text-muted);
    display: none;
  }
  @media (min-width: 640px) {
    .mac-menu-muted { display: inline; }
  }
  .mac-menu-apple {
    position: relative;
  }
  .mac-menu-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: 220px;
    margin: 0;
    padding: 8px;
    list-style: none;
    border-radius: 14px;
    background: var(--chrome-dropdown-bg);
    color: var(--chrome-text);
    border: 1px solid var(--chrome-border);
    box-shadow: var(--chrome-shadow);
    backdrop-filter: blur(20px);
    z-index: 131;
  }
  .mac-menu-dropdown button,
  .mac-menu-dropdown a {
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 12px 14px;
    border-radius: 10px;
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;
  }
  .mac-menu-dropdown button:active:not(:disabled),
  .mac-menu-dropdown a:active {
    background: rgb(180 140 255 / 0.28);
  }
  .mac-menu-dropdown button:hover:not(:disabled),
  .mac-menu-dropdown a:hover {
    background: var(--chrome-hover);
  }
  .mac-menu-dropdown button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .mac-menu-sep {
    height: 1px;
    margin: 4px 6px;
    background: var(--chrome-border);
  }
  .mac-menu-util {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .mac-menu-util :global(.font-switcher),
  .mac-menu-util :global(.theme-switch) {
    flex-shrink: 0;
  }
  .mac-menu-icon-btn {
    font-size: 0.95rem;
    line-height: 1;
  }
  .mac-menu-clock {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--chrome-text);
    font-size: 0.8rem;
    padding: 6px 8px;
    border-radius: 10px;
    background: var(--chrome-subtle);
  }
  @media (max-width: 768px) {
    .mac-menu-bar {
      top: max(env(safe-area-inset-top, 0px), 6px);
      left: max(env(safe-area-inset-left, 0px), 8px);
      right: max(env(safe-area-inset-right, 0px), 8px);
      height: 48px;
      padding: 0 6px 0 8px;
      border-radius: 14px;
      gap: 6px;
    }
    .mac-menu-left {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .mac-menu-clock {
      max-width: 7.2rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.68rem;
      padding: 4px 6px;
    }
    .mac-menu-dropdown {
      min-width: min(280px, calc(100vw - 24px));
      max-height: min(70dvh, 520px);
      overflow: auto;
    }
  }
  @media (max-width: 480px) {
    .mac-menu-app-name { display: none; }
    .mac-menu-clock { font-size: 0.72rem; padding: 4px 6px; }
    .mac-menu-clear { display: none; }
  }
</style>
