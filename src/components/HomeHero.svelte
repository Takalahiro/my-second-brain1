<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from './PixelIcon.svelte';
  import { getManualContent } from '../lib/i18n/manual-content';
  import { getMessages, initLocale, localeState } from '../lib/i18n/locale.svelte';

  interface SyncInfo {
    noteCount: number;
    latestNoteUpdate: string | null;
    vaultSyncCommit: string | null;
  }

  interface Props {
    syncInfo?: SyncInfo;
    desktopMode?: boolean;
  }
  let { syncInfo, desktopMode = false }: Props = $props();

  const HERO_KEY = 'second-brain:hero-closed';
  const MANUAL_KEY = 'second-brain:manual-closed';
  const DESKTOP_MANUAL_KEY = 'second-brain:desktop-manual-v1';
  const INTRO_KEY = 'second-brain:desktop-intro-v1';

  let heroClosed = $state(false);
  let manualClosed = $state(true);
  let mounted = $state(false);
  let isFirstDesktopManual = $state(false);

  const showManual = $derived(mounted && !manualClosed);
  const showWelcome = $derived(mounted && !heroClosed && !showManual && !isFirstDesktopManual);

  const m = $derived(getMessages());
  const manual = $derived(getManualContent(localeState.current));

  onMount(() => {
    initLocale();
    try {
      heroClosed = localStorage.getItem(HERO_KEY) === '1';
      manualClosed = localStorage.getItem(MANUAL_KEY) === '1';

      if (desktopMode && localStorage.getItem(DESKTOP_MANUAL_KEY) !== '1') {
        isFirstDesktopManual = true;
        heroClosed = true;
        manualClosed = true;

        const openFirstManual = () => {
          manualClosed = false;
        };

        if (localStorage.getItem(INTRO_KEY)) {
          queueMicrotask(openFirstManual);
        } else {
          window.addEventListener('second-brain:desktop-intro-done', openFirstManual, { once: true });
        }
      }
    } catch {}

    mounted = true;

    const onToggleManual = () => toggleHome();
    window.addEventListener('second-brain:toggle-manual', onToggleManual);
    return () => window.removeEventListener('second-brain:toggle-manual', onToggleManual);
  });

  function closeHero() {
    heroClosed = true;
    try { localStorage.setItem(HERO_KEY, '1'); } catch {}
  }
  function openManual() {
    manualClosed = false;
    try { localStorage.removeItem(MANUAL_KEY); } catch {}
  }
  function closeManual() {
    manualClosed = true;
    try {
      localStorage.setItem(MANUAL_KEY, '1');
      if (desktopMode && isFirstDesktopManual) {
        localStorage.setItem(DESKTOP_MANUAL_KEY, '1');
        isFirstDesktopManual = false;
      }
    } catch {}
  }
  function reopenHero() {
    heroClosed = false;
    manualClosed = true;
    try {
      localStorage.removeItem(HERO_KEY);
      localStorage.setItem(MANUAL_KEY, '1');
    } catch {}
  }
  function toggleHome() {
    if (showManual) {
      closeManual();
    } else {
      openManual();
    }
  }
</script>

{#if showWelcome}
  <section class="home-hero" class:desktop-overlay={desktopMode} aria-label={m.hero.welcome}>
    <div class="hero-card pixel-card glass-container">
      <button
        type="button"
        class="card-close"
        aria-label={m.hero.closeWelcome}
        title={m.hero.closeWelcome}
        onclick={closeHero}
      >×</button>
      <h1 class="hero-title">{m.hero.title}</h1>
      <p class="hero-sub">{m.hero.subtitle}</p>
      <div class="hero-actions">
        <a class="pixel-button hero-btn" href="/notes">{m.hero.enterNotes}</a>
        <a class="pixel-button hero-btn ghost" href="/tags">{m.hero.browseTags}</a>
        <button type="button" class="pixel-button hero-btn ghost" onclick={openManual}>{m.hero.manual}</button>
      </div>
    </div>
  </section>
{/if}

{#if showManual}
  {#if desktopMode}
    <button
      type="button"
      class="desktop-manual-backdrop"
      class:is-first={isFirstDesktopManual}
      aria-label={m.hero.closeManual}
      onclick={closeManual}
    ></button>
  {/if}
  <section class="home-hero" class:desktop-overlay={desktopMode} class:is-first-manual={isFirstDesktopManual} aria-label={m.hero.manualTitle}>
    <div class="manual-card pixel-card glass-container" class:is-first-manual={isFirstDesktopManual}>
      <button
        type="button"
        class="card-close"
        aria-label={m.hero.closeManual}
        title={m.hero.closeManual}
        onclick={closeManual}
      >×</button>
      <header class="manual-card-head">
        <span class="manual-emoji" aria-hidden="true"><PixelIcon name="book" size={24} /></span>
        <h1 class="manual-title">{m.hero.manualTitle}</h1>
        <p class="manual-sub">{m.hero.manualSub}</p>
      </header>

      <div class="manual-body">
        {#each manual.sections as section}
          <section>
            <h3>{section.title}</h3>
            {#each section.paragraphs ?? [] as p}
              <p>{@html p}</p>
            {/each}
            {#if section.items}
              <ul>
                {#each section.items as item}
                  <li>{@html item}</li>
                {/each}
              </ul>
            {/if}
            {#if section.ordered}
              <ol>
                {#each section.ordered as item}
                  <li>{@html item}</li>
                {/each}
              </ol>
            {/if}
            {#if section === manual.sections[2] && syncInfo}
              <dl class="sync-status">
                <div><dt>{manual.syncLabels.noteCount}</dt><dd>{syncInfo.noteCount} {manual.syncLabels.noteUnit}</dd></div>
                {#if syncInfo.latestNoteUpdate}
                  <div><dt>{manual.syncLabels.latestUpdate}</dt><dd class="pixel-digits">{syncInfo.latestNoteUpdate}</dd></div>
                {/if}
                {#if syncInfo.vaultSyncCommit}
                  <div><dt>{manual.syncLabels.lastSync}</dt><dd class="pixel-digits">{syncInfo.vaultSyncCommit}</dd></div>
                {/if}
              </dl>
            {/if}
            {#if section.note}
              <p class="manual-note">{@html section.note}</p>
            {/if}
          </section>
        {/each}
      </div>

      <footer class="manual-card-foot">
        {#if heroClosed && !isFirstDesktopManual}
          <button type="button" class="pixel-button hero-btn ghost" onclick={reopenHero}>{manual.showWelcome}</button>
        {/if}
        {#if isFirstDesktopManual}
          <button type="button" class="pixel-button hero-btn" onclick={closeManual}>{manual.getStarted}</button>
        {:else}
          <a class="pixel-button hero-btn" href="/notes">{m.hero.enterNotes}</a>
        {/if}
      </footer>
    </div>
  </section>
{/if}

{#if mounted && !desktopMode}
  <button
    type="button"
    class="home-fab"
    class:is-active={showManual}
    onclick={toggleHome}
    aria-label={showManual ? manual.homeFabClose : manual.homeFabOpen}
    title={showManual ? manual.homeFabClose : manual.homeFabOpen}
  >{manual.homeFab}</button>
{/if}

<style>
  .home-hero {
    min-height: calc(100vh - 200px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 12px;
    pointer-events: none;
  }
  :global(.mac-os-body) .home-hero.desktop-overlay {
    position: fixed;
    inset: calc(max(env(safe-area-inset-top, 0px), 8px) + 52px) 0
      calc(max(env(safe-area-inset-bottom, 0px), 10px) + 78px) 0;
    z-index: 118;
    min-height: 0;
    padding: 16px 12px;
    align-items: flex-end;
  }
  :global(.mac-os-body) .home-hero.desktop-overlay.is-first-manual {
    z-index: 125;
    animation: manual-rise-in 0.55s cubic-bezier(0.34, 1.1, 0.64, 1) both;
  }

  @keyframes manual-rise-in {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .desktop-manual-backdrop {
    position: fixed;
    inset: 0;
    z-index: 117;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: default;
    background: rgb(8 6 14 / 0.22);
    backdrop-filter: blur(6px) saturate(120%);
    -webkit-backdrop-filter: blur(6px) saturate(120%);
    animation: backdrop-in 0.45s ease both;
  }
  .desktop-manual-backdrop.is-first {
    z-index: 124;
    background: rgb(8 6 14 / 0.28);
    backdrop-filter: blur(10px) saturate(130%);
    -webkit-backdrop-filter: blur(10px) saturate(130%);
  }
  :global(:not(.dark)) .desktop-manual-backdrop {
    background: rgb(244 245 247 / 0.35);
  }
  :global(:not(.dark)) .desktop-manual-backdrop.is-first {
    background: rgb(244 245 247 / 0.42);
  }

  @keyframes backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .home-hero > * {
    pointer-events: auto;
  }

  /* 欢迎卡片 */
  .hero-card {
    position: relative;
    padding: 28px 32px;
    border-radius: 20px;
    text-align: center;
    color: var(--text-primary);
    max-width: 520px;
    width: 100%;
    background: rgb(255 255 255 / 0.45);
  }
  :global(.dark) .hero-card {
    background: rgb(18 14 30 / 0.55);
    color: #f4ecff;
    border-color: rgb(255 255 255 / 0.14);
  }

  /* 使用说明卡片：毛玻璃文档 */
  .manual-card {
    position: relative;
    width: 100%;
    max-width: 560px;
    max-height: min(calc(100vh - 220px), 720px);
    display: flex;
    flex-direction: column;
    padding: 0;
    border-radius: 22px;
    text-align: left;
    color: var(--text-primary);
    background: var(--glass-bg-strong);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
      var(--shadow-normal),
      inset 0 1px 0 rgb(255 255 255 / 0.45);
  }
  .manual-card.is-first-manual {
    max-width: min(580px, calc(100vw - 32px));
    border-color: rgb(180 140 255 / 0.28);
    box-shadow:
      0 24px 56px rgb(0 0 0 / 0.18),
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      0 0 0 1px rgb(180 140 255 / 0.12);
  }
  :global(.dark) .manual-card {
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    border-color: var(--glass-border);
    box-shadow:
      var(--shadow-normal),
      inset 0 1px 0 rgb(255 255 255 / 0.08);
  }
  :global(.dark) .manual-card.is-first-manual {
    border-color: rgb(180 140 255 / 0.22);
    box-shadow:
      0 24px 56px rgb(0 0 0 / 0.42),
      inset 0 1px 0 rgb(255 255 255 / 0.1),
      0 0 48px rgb(180 140 255 / 0.08);
  }

  .card-close {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgb(0 0 0 / 0.08);
    background: rgb(0 0 0 / 0.05);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 1.05rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .card-close:hover {
    transform: scale(1.06);
  }
  :global(.dark) .card-close {
    background: rgb(255 255 255 / 0.08);
    border-color: rgb(255 255 255 / 0.14);
    color: #f4ecff;
  }

  .hero-title {
    margin: 0 0 6px;
    font-size: clamp(1.6rem, 1.4vw + 1.1rem, 2.4rem);
    letter-spacing: 1px;
  }
  .hero-sub {
    margin: 0 0 18px;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
  .hero-actions,
  .manual-card-foot {
    display: inline-flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .hero-btn.ghost {
    background: transparent;
  }

  .manual-card-head {
    padding: 24px 28px 12px;
    text-align: center;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-color);
    background: rgb(255 255 255 / 0.12);
  }
  :global(.dark) .manual-card-head {
    border-bottom-color: var(--border-color);
    background: rgb(255 255 255 / 0.04);
  }
  .manual-emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }
  .manual-title {
    margin: 0 0 4px;
    font-size: clamp(1.25rem, 1vw + 1rem, 1.75rem);
    letter-spacing: 0.5px;
  }
  .manual-sub {
    margin: 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
    opacity: 0.85;
  }

  .manual-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 24px 8px;
    font-size: 0.8rem;
    line-height: 1.55;
  }
  .manual-body section {
    margin-bottom: 14px;
  }
  .manual-body h3 {
    margin: 0 0 6px;
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  :global(.dark) .manual-body h3 {
    color: #c8b9e2;
  }
  .manual-body p {
    margin: 0 0 8px;
  }
  .manual-body ul,
  .manual-body ol {
    margin: 0;
    padding-left: 1.15rem;
  }
  .manual-body li {
    margin-bottom: 4px;
  }
  .manual-body a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .manual-body code {
    font-size: 0.76rem;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgb(0 0 0 / 0.06);
  }
  :global(.dark) .manual-body code {
    background: rgb(255 255 255 / 0.08);
  }

  .sync-status {
    margin: 10px 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--chrome-subtle);
    border: 1px solid var(--border-color);
    display: grid;
    gap: 6px;
  }
  .sync-status div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .sync-status dt {
    margin: 0;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .sync-status dd {
    margin: 0;
    text-align: right;
  }
  .manual-note {
    font-size: 0.74rem;
    color: var(--text-secondary);
    opacity: 0.88;
  }

  .manual-card-foot {
    flex-shrink: 0;
    padding: 12px 24px 20px;
    border-top: 1px solid var(--border-color);
    background: rgb(255 255 255 / 0.08);
  }
  :global(.dark) .manual-card-foot {
    border-top-color: var(--border-color);
    background: rgb(255 255 255 / 0.03);
  }

  .home-fab {
    position: fixed;
    left: max(env(safe-area-inset-left, 0px), 16px);
    bottom: max(env(safe-area-inset-bottom, 0px), 16px);
    z-index: 34;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--chrome-border);
    background: var(--glass-bg-strong);
    color: var(--text-primary);
    backdrop-filter: blur(16px) saturate(120%);
    -webkit-backdrop-filter: blur(16px) saturate(120%);
    box-shadow: var(--shadow-normal);
    cursor: pointer;
    font-size: 0.82rem;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .home-fab:hover,
  .home-fab.is-active {
    background: var(--glass-bg-hover);
    border-color: rgb(180 140 255 / 0.45);
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .home-hero {
      min-height: 0;
      padding: 12px 10px;
      align-items: flex-end;
    }
    :global(.mac-os-body) .home-hero.desktop-overlay {
      padding: 12px 10px 8px;
    }
    .hero-card {
      padding: 22px 18px;
      border-radius: 18px;
      max-width: none;
    }
    .hero-title {
      font-size: 1.45rem;
    }
    .hero-sub {
      font-size: 0.86rem;
      margin-bottom: 14px;
    }
    .hero-actions,
    .manual-card-foot {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
    .hero-actions :global(.hero-btn),
    .manual-card-foot :global(.hero-btn) {
      width: 100%;
      min-height: 44px;
      justify-content: center;
    }
    .manual-card {
      max-height: min(78dvh, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 140px));
      border-radius: 18px;
    }
    .manual-card-head {
      padding: 18px 16px 10px;
    }
    .manual-body {
      padding: 12px 16px 8px;
      font-size: 0.78rem;
    }
    .manual-card-foot {
      padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    }
    .sync-status div {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .sync-status dd {
      text-align: left;
    }
  }

  @media (max-width: 640px) {
    .manual-card {
      max-height: min(calc(100vh - 180px), 85vh);
    }
    .manual-card-head {
      padding: 20px 18px 10px;
    }
    .manual-body {
      padding: 12px 18px 8px;
    }
    .manual-card-foot {
      padding: 10px 18px 16px;
    }
  }
</style>
