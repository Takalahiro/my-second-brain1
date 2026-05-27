<script lang="ts">
  import { onMount } from 'svelte';
  import PixelFcPadButton from '../components/PixelFcPadButton.svelte';
  import PixelIcon from '../../../components/PixelIcon.svelte';
  import {
    readSlotPreview,
    SLOT_WIDGET_OPTIONS,
    type SlotPreview,
    type SlotWidgetKey,
  } from '../../../lib/control-center-slot';
  import type { DrawerCategoryId } from '../../../lib/i18n/drawer-catalog';
  import type { Messages } from '../../../lib/i18n/messages/zh';
  import type { PixelIconName } from '../../../lib/pixel-icons';

  interface Category {
    id: DrawerCategoryId;
    name: string;
    icon: PixelIconName;
    desc: string;
  }

  interface Props {
    m: Messages['drawer'];
    categories: Category[];
    slotWidget: SlotWidgetKey;
    enabled: Record<string, boolean>;
    hasSnapshot: boolean;
    isCleared: boolean;
    onGoPane: (id: DrawerCategoryId) => void;
    onSlotChange: (id: SlotWidgetKey) => void;
    onToggleSlot: () => void;
    onClearAll?: () => void;
    onRestore?: () => void;
  }

  let {
    m,
    categories,
    slotWidget,
    enabled,
    hasSnapshot,
    isCleared,
    onGoPane,
    onSlotChange,
    onToggleSlot,
    onClearAll,
    onRestore,
  }: Props = $props();

  let now = $state(new Date());
  let pickerOpen = $state(false);
  let preview = $state<SlotPreview>(readSlotPreview(slotWidget));
  let statsNotes = $state<number | null>(null);

  const slotMeta = $derived(SLOT_WIDGET_OPTIONS.find((o) => o.id === slotWidget)!);
  const timeText = $derived(
    now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  );
  const dateText = $derived(
    now.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' }),
  );

  function refreshPreview() {
    preview = readSlotPreview(slotWidget);
  }

  async function refreshStats() {
    if (slotWidget !== 'stats') return;
    try {
      const res = await fetch('/data/notes.json');
      if (!res.ok) return;
      const data = (await res.json()) as { notes?: unknown[] };
      statsNotes = Array.isArray(data.notes) ? data.notes.length : null;
    } catch {
      /* ignore */
    }
  }

  onMount(() => {
    const id = window.setInterval(() => {
      now = new Date();
    }, 1000);
    refreshPreview();
    void refreshStats();
    const poll = window.setInterval(() => {
      refreshPreview();
      void refreshStats();
    }, 5000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(poll);
    };
  });

  $effect(() => {
    slotWidget;
    refreshPreview();
    void refreshStats();
  });

  function pickSlot(id: SlotWidgetKey) {
    onSlotChange(id);
    pickerOpen = false;
    refreshPreview();
  }
</script>

<div class="pixel-drawer-pane pixel-drawer-pane--home">
  <div class="pixel-drawer-status">
    <div class="pixel-drawer-status__clock" aria-live="polite">
      <span class="pixel-drawer-status__time">{timeText}</span>
      <span class="pixel-drawer-status__date">{dateText}</span>
    </div>

    <div class="pixel-drawer-status__slot">
      <header class="pixel-drawer-status__slot-head">
        <PixelIcon name={slotMeta.icon} size={14} />
        <span>{slotMeta.name}</span>
        <button type="button" class="pixel-drawer-status__swap" onclick={() => (pickerOpen = !pickerOpen)} aria-label="切换预览组件">↻</button>
      </header>
      <button type="button" class="pixel-drawer-status__slot-body" onclick={onToggleSlot}>
        <span class="pixel-drawer-status__value">
          {#if slotWidget === 'stats' && statsNotes != null}
            {statsNotes}
          {:else}
            {preview.value}
          {/if}
        </span>
        <span class="pixel-drawer-status__sub">
          {#if slotWidget === 'stats' && statsNotes != null}
            篇笔记
          {:else}
            {preview.sub ?? '—'}
          {/if}
        </span>
        <span class="pixel-drawer-status__badge" data-on={enabled[slotWidget]}>{enabled[slotWidget] ? 'ON' : 'OFF'}</span>
      </button>

      {#if pickerOpen}
        <div class="pixel-drawer-status__picker" role="dialog" aria-label="选择预览组件">
          {#each SLOT_WIDGET_OPTIONS as opt (opt.id)}
            <button
              type="button"
              class="pixel-drawer-status__pick"
              data-active={opt.id === slotWidget}
              onclick={() => pickSlot(opt.id)}
            >
              <PixelIcon name={opt.icon} size={14} />
              <span>{opt.name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.controlCenter}</h3>
    <div class="pixel-menu-shelf">
      {#each categories as cat (cat.id)}
        <button type="button" class="pixel-menu-cart" onclick={() => onGoPane(cat.id)}>
          <div class="pixel-menu-cart__label">
            <span class="pixel-menu-cart__icon"><PixelIcon name={cat.icon} size={18} /></span>
            <span class="pixel-menu-cart__title">{cat.name}</span>
          </div>
          <p class="pixel-menu-cart__desc">{cat.desc}</p>
          <div class="pixel-menu-cart__pins" aria-hidden="true"></div>
        </button>
      {/each}
    </div>
  </section>

  <section class="pixel-drawer-section">
    <h3 class="pixel-drawer-section__label">{m.quickActions}</h3>
    <div class="pixel-fc-pad-row pixel-fc-pad-row--actions">
      <PixelFcPadButton face="a" label={m.clearScreen} disabled={isCleared} onclick={() => !isCleared && onClearAll?.()} />
      {#if hasSnapshot}
        <PixelFcPadButton face="b" label={m.restoreLayout} onclick={() => onRestore?.()} />
      {/if}
    </div>
    <p class="pixel-drawer-footnote">{isCleared ? m.cleared : m.keepWallpaper}</p>
  </section>
</div>
