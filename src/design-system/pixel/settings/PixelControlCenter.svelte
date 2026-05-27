<script lang="ts">
  import { getDrawerCatalog, type DrawerWidget } from '../../../lib/i18n/drawer-catalog';
  import { localeState } from '../../../lib/i18n/locale.svelte';
  import { UI_SKINS } from '../../../features/ui/registry';
  import { applyUiSkin, getStoredUiSkin } from '../../../features/ui/apply-ui';
  import type { UiSkinId } from '../../../features/ui/types';
  import { patchFromMode, type WallpaperMode } from '../../../features/wallpaper/state/mode';
  import vaultMeta from '../../../lib/vault-sync-meta.json';
  import PixelCloseX from '../components/PixelCloseX.svelte';
  import PixelFcSwitch from '../components/PixelFcSwitch.svelte';
  import PixelAbButton from '../components/PixelAbButton.svelte';
  import PixelSegmentValue from '../components/PixelSegmentValue.svelte';

  type WidgetKey = DrawerWidget['id'];
  type PaneId = 'home' | 'appearance' | 'widgets' | 'sync' | 'shortcuts' | 'about';

  interface Props {
    open?: boolean;
    enabled: Record<string, boolean>;
    bg: {
      sceneId: string;
      useVideo: boolean;
      usePly: boolean;
      rain: boolean;
      rainDrops: boolean;
      rainDropsLinked?: boolean;
      sakura: boolean;
      brightness: number;
      speed: number;
    };
    scenes: Array<{ id: string; label: string; poster?: string | null; hasRain?: boolean; hasPly?: boolean }>;
    hasSnapshot?: boolean;
    isCleared?: boolean;
    onToggle: (key: WidgetKey, drop?: { x: number; y: number }) => void;
    onPatchBg: (p: Partial<Props['bg']>) => void;
    onSetWallpaperMode?: (mode: WallpaperMode) => void;
    onClearAll?: () => void;
    onRestore?: () => void;
  }

  let {
    open = $bindable(false),
    enabled,
    bg,
    scenes,
    hasSnapshot = false,
    isCleared = false,
    onToggle,
    onPatchBg,
    onSetWallpaperMode,
    onClearAll,
    onRestore,
  }: Props = $props();

  let pane = $state<PaneId>('home');
  const catalog = $derived(getDrawerCatalog(localeState.locale));
  const activeSkin = $derived(getStoredUiSkin());
  const brightBlocks = $derived(Math.round(bg.brightness * 8));

  const menuItems: { id: PaneId; label: string; hint: string }[] = [
    { id: 'appearance', label: 'APPEARANCE', hint: '1' },
    { id: 'widgets', label: 'WIDGETS', hint: '2' },
    { id: 'sync', label: 'SYNC', hint: '3' },
    { id: 'shortcuts', label: 'KEYS', hint: '4' },
    { id: 'about', label: 'ABOUT', hint: '5' },
  ];

  function go(p: PaneId) {
    pane = p;
  }

  function back() {
    pane = 'home';
  }

  function pickSkin(id: UiSkinId) {
    applyUiSkin(id);
  }

  function setBright(i: number) {
    onPatchBg({ brightness: (i + 1) / 8 });
  }

  function pickMode(mode: WallpaperMode) {
    onSetWallpaperMode?.(mode);
    onPatchBg(patchFromMode(mode));
  }

  const timePreview = $derived(
    new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
  );
</script>

<div class="pixel-pause-overlay" data-open={open} role="dialog" aria-modal="true" aria-label="Pause menu">
  <div class="pixel-pause-menu">
    <article class="pixel-cartridge pixel-hard-shadow">
      <header class="pixel-cartridge__label">
        <span class="pixel-cartridge__corner"></span>
        <span class="pixel-cartridge__corner"></span>
        <h2 class="pixel-cartridge__title">
          {#if pane === 'home'}PAUSE MENU{:else if pane === 'appearance'}WORLD SKIN{:else if pane === 'widgets'}LOADOUT{:else if pane === 'sync'}SAVE DATA{:else if pane === 'shortcuts'}CONTROLS{:else}CREDITS{/if}
        </h2>
        <span class="pixel-cartridge__world">W-00</span>
        <PixelCloseX label="Close" onclick={() => (open = false)} />
      </header>

      <div class="pixel-cartridge__screen">
        {#if pane === 'home'}
          <div class="pixel-section-banner">
            <span class="pixel-section-banner__num">00</span>
            <span></span>
            <span class="pixel-section-banner__label">STATUS</span>
            <span></span>
          </div>
          <div class="pixel-cc-hud-preview">
            <div class="pixel-zelda-hearts">
              {#each Array(3) as _, i (i)}
                <span class="pixel-heart" class:pixel-heart--empty={i >= 2}></span>
              {/each}
            </div>
            <div class="pixel-mario-time">
              <span class="pixel-clock-hud__label">TIME</span>
              <PixelSegmentValue value={timePreview.replace(':', '')} size="lg" />
            </div>
          </div>
          <div class="pixel-brick-row" aria-hidden="true">
            {#each Array(12) as _, i (i)}<span class="pixel-brick"></span>{/each}
          </div>
          <div class="pixel-menu-grid">
            {#each menuItems as item (item.id)}
              <PixelAbButton hint={item.hint} onclick={() => go(item.id)}>{item.label}</PixelAbButton>
            {/each}
          </div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            {#if hasSnapshot || isCleared}
              <PixelAbButton hint="Y" onclick={() => onRestore?.()}>RESTORE</PixelAbButton>
            {/if}
            <PixelAbButton hint="X" onclick={() => onClearAll?.()}>CLEAR</PixelAbButton>
          </div>
          <div class="pixel-zelda-dialog" style="margin-top:8px">
            <span class="pixel-zelda-dialog__speaker">TIP</span>
            <p class="pixel-zelda-dialog__box">PRESS A TO SELECT · B BACK</p>
          </div>

        {:else if pane === 'appearance'}
          <div class="pixel-section-banner">
            <span class="pixel-section-banner__num">01</span>
            <span></span>
            <span class="pixel-section-banner__label">SKIN</span>
            <span></span>
          </div>
          <div class="pixel-skin-row">
            {#each UI_SKINS as skin (skin.id)}
              <button
                type="button"
                class="pixel-skin-slot"
                data-active={activeSkin === skin.id}
                onclick={() => pickSkin(skin.id)}
              >
                {skin.id.toUpperCase()}
              </button>
            {/each}
          </div>
          <div class="pixel-brick-row"></div>
          <div class="pixel-section-banner">
            <span class="pixel-section-banner__num">02</span>
            <span></span>
            <span class="pixel-section-banner__label">WORLD</span>
            <span></span>
          </div>
          <div class="pixel-bg-world-strip" style="position:relative;left:0;transform:none;bottom:0;margin:8px 0">
            {#each scenes.slice(0, 4) as s, i (s.id)}
              <button
                type="button"
                class="pixel-world-tile"
                data-active={bg.sceneId === s.id}
                onclick={() => onPatchBg({ sceneId: s.id })}
              >
                <span>W-{i + 1}</span>
                {#if s.poster}<img src={s.poster} alt="" />{/if}
              </button>
            {/each}
          </div>
          <div class="pixel-clock-hud__label">BRIGHT</div>
          <div class="pixel-step-blocks">
            {#each Array(8) as _, i (i)}
              <button type="button" class="pixel-step-blocks__blk" data-on={i < brightBlocks} onclick={() => setBright(i)}>▮</button>
            {/each}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            <PixelAbButton hint="1" onclick={() => pickMode('video')}>VIDEO</PixelAbButton>
            <PixelAbButton hint="2" onclick={() => pickMode('poster')}>POST</PixelAbButton>
            <PixelAbButton hint="3" onclick={() => pickMode('ply')}>PLY</PixelAbButton>
          </div>
          <PixelAbButton hint="B" onclick={back}>BACK</PixelAbButton>

        {:else if pane === 'widgets'}
          {#each catalog.widgetGroups as group (group.title)}
            <div class="pixel-zelda-dialog">
              <span class="pixel-zelda-dialog__speaker">{group.title}</span>
            </div>
            {#each group.ids as wid (wid)}
              {@const w = catalog.items.find((x) => x.id === wid)}
              {#if w}
                <div class="pixel-menu-row" data-selected={enabled[w.id]}>
                  <span class="pixel-menu-row__cur">{enabled[w.id] ? '▶' : ' '}</span>
                  <span></span>
                  <div>
                    <div>{w.name}</div>
                    <div class="pixel-clock-hud__label" style="text-align:left">{w.desc}</div>
                  </div>
                  <PixelFcSwitch
                    checked={!!enabled[w.id]}
                    label={w.name}
                    onchange={(v) => onToggle(w.id, v ? { x: 120, y: 160 } : undefined)}
                  />
                </div>
              {/if}
            {/each}
            <div class="pixel-brick-row"></div>
          {/each}
          <PixelAbButton hint="B" onclick={back}>BACK</PixelAbButton>

        {:else if pane === 'sync'}
          <div class="pixel-save-blink">LOADING...</div>
          <div class="pixel-ninja-lifebar" style="margin:12px 0">
            {#each Array(8) as _, i (i)}
              <span class="pixel-ninja-lifebar__seg" data-on={i < 6}></span>
            {/each}
          </div>
          <PixelSegmentValue value={vaultMeta.vaultCommit?.slice(0, 7) ?? '0000000'} />
          <div class="pixel-zelda-dialog" style="margin-top:8px">
            <span class="pixel-zelda-dialog__speaker">SYS</span>
            <p class="pixel-zelda-dialog__box">LAST SAVE: {vaultMeta.lastSyncedAt ?? '—'}</p>
          </div>
          <PixelAbButton hint="A" onclick={() => window.location.reload()}>SYNC NOW</PixelAbButton>
          <PixelAbButton hint="B" onclick={back}>BACK</PixelAbButton>

        {:else if pane === 'shortcuts'}
          {#each [
            ['↑↓←→', 'MOVE CURSOR'],
            ['A', 'CONFIRM / DROP'],
            ['B', 'BACK / CLOSE'],
            ['SELECT', 'PAUSE MENU'],
            ['START', 'SEARCH ⌘K'],
          ] as row, i (i)}
            <div class="pixel-menu-row" data-selected={i === 0}>
              <span class="pixel-menu-row__cur">{i === 0 ? '▶' : ' '}</span>
              <span></span>
              <span>{row[0]}</span>
              <span class="pixel-coin-badge">{row[1]}</span>
            </div>
          {/each}
          <PixelAbButton hint="B" onclick={back}>BACK</PixelAbButton>

        {:else}
          <div style="font-family:var(--pixel-font-display);font-size:0.55rem;margin-bottom:8px">SECOND BRAIN</div>
          <PixelSegmentValue value="1.4.1" />
          <div class="pixel-brick-row"></div>
          <div class="pixel-zelda-dialog">
            <span class="pixel-zelda-dialog__speaker">DEV</span>
            <p class="pixel-zelda-dialog__box">FC / SFC ERA · MARIO · ZELDA · METROID · NINJA</p>
          </div>
          <PixelAbButton hint="B" onclick={back}>BACK</PixelAbButton>
        {/if}
      </div>
      <footer class="pixel-cartridge__steps" aria-hidden="true">
        {#each Array(8) as _, i (i)}<span class="pixel-cartridge__step"></span>{/each}
      </footer>
      <div class="pixel-cartridge__pins" aria-hidden="true"></div>
    </article>
    <footer class="pixel-pause-menu__hints">
      <span>↑↓ MOVE</span>
      <span>A SELECT</span>
      <span>B BACK</span>
    </footer>
  </div>
</div>
