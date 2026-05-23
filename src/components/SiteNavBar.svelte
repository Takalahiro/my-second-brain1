<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import FontSwitcher from './FontSwitcher.svelte';
  import LocaleToggle from './LocaleToggle.svelte';
  import NoteSearch from './NoteSearch.svelte';
  import PixelIcon from './PixelIcon.svelte';
  import { getSiteNavLinks, initLocale, getMessages } from '../lib/i18n/locale.svelte';
  import { onMount } from 'svelte';

  interface Props {
    variant?: 'site' | 'tool';
    currentPath?: string;
  }

  let { variant = 'site', currentPath = '/' }: Props = $props();

  onMount(() => initLocale());

  const navLinks = $derived(getSiteNavLinks());
  const toolLinks = $derived(variant === 'tool' ? navLinks : navLinks);
  const m = $derived(getMessages());
  const siteNavLabel = $derived(m.nav.siteNav);
  const toolsLabel = $derived(m.nav.tools);
  const homeLabel = $derived(m.nav.home);

  function isActive(href: string) {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }
</script>

<header class="site-header">
  <nav
    class="site-nav-shell pixel-card glass-container"
    class:site-nav-shell-tool={variant === 'tool'}
    aria-label={siteNavLabel}
  >
    <div class="site-nav-top">
      <a href="/" class="site-nav-brand" aria-label={homeLabel}>
        <img src="/logo.png" alt="" class="site-nav-logo" width="28" height="28" />
        <span class="site-nav-brand-text">My Second Brain</span>
      </a>

      {#if variant === 'site'}
        <div class="site-nav-search">
          <NoteSearch />
        </div>
      {/if}

      <div class="site-nav-actions">
        <LocaleToggle />
        <FontSwitcher />
        <ThemeToggle />
      </div>
    </div>

    <div class="site-nav-links-row" aria-label={toolsLabel}>
      {#each toolLinks as item (item.href)}
        <a
          href={item.href}
          class="site-nav-link"
          class:is-active={isActive(item.href)}
          title={item.title}
        >
          {#if item.icon}
            <span class="site-nav-link-icon" aria-hidden="true">
              <PixelIcon name={item.icon} size={14} />
            </span>
          {/if}
          <span class="site-nav-link-text">{item.label}</span>
        </a>
      {/each}
    </div>
  </nav>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 40;
    padding: 0.55rem 0 0.3rem;
  }
  .site-nav-shell {
    padding: 0.5rem 0.65rem 0.55rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .site-nav-top {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
  }
  .site-nav-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    text-decoration: none;
    color: inherit;
    font-weight: 600;
    min-width: 0;
  }
  .site-nav-logo {
    border-radius: 6px;
    flex-shrink: 0;
  }
  .site-nav-brand-text {
    font-size: 0.88rem;
    white-space: nowrap;
  }
  .site-nav-search {
    min-width: 0;
    width: 100%;
  }
  .site-nav-search :global(.note-search) {
    max-width: none;
  }
  .site-nav-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
  }
  .site-nav-links-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.2rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    padding-bottom: 1px;
    -webkit-overflow-scrolling: touch;
  }
  .site-nav-links-row::-webkit-scrollbar {
    display: none;
  }
  .site-nav-link {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    padding: 0.28rem 0.55rem;
    border-radius: 999px;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 0.76rem;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.18s ease, color 0.18s ease;
  }
  .site-nav-link-icon {
    display: inline-flex;
    opacity: 0.85;
  }
  .site-nav-link:hover,
  .site-nav-link.is-active {
    color: var(--text-primary);
    background: var(--chrome-hover);
  }
  .site-nav-link.is-active {
    font-weight: 600;
  }
  .site-nav-shell-tool .site-nav-top {
    grid-template-columns: auto 1fr auto;
  }
  .site-nav-shell-tool .site-nav-links-row {
    flex-wrap: wrap;
    overflow: visible;
  }
  @media (max-width: 720px) {
    .site-nav-brand-text {
      display: none;
    }
    .site-nav-top {
      gap: 0.35rem;
    }
  }
  @media (max-width: 480px) {
    .site-nav-link-text {
      display: none;
    }
    .site-nav-link {
      padding: 0.32rem 0.42rem;
    }
  }
  @media (min-width: 900px) {
    .site-nav-shell:not(.site-nav-shell-tool) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto auto;
      align-items: center;
      column-gap: 0.75rem;
    }
    .site-nav-shell:not(.site-nav-shell-tool) .site-nav-top {
      grid-column: 1;
      grid-row: 1;
    }
    .site-nav-shell:not(.site-nav-shell-tool) .site-nav-links-row {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
</style>
