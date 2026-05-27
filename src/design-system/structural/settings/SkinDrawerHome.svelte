<script lang="ts">

  import { onMount } from 'svelte';

  import SkinDrawerGlyph from '../components/SkinDrawerGlyph.svelte';

  import SkinSwitch from '../components/SkinSwitch.svelte';

  import SkinSegment from '../components/SkinSegment.svelte';

  import { resolveStructuralSkin } from '../skin-context';

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



  const skin = resolveStructuralSkin();



  let now = $state(new Date());

  let pickerOpen = $state(false);

  let preview = $state<SlotPreview>(readSlotPreview(slotWidget));

  let statsNotes = $state<number | null>(null);



  const slotMeta = $derived(SLOT_WIDGET_OPTIONS.find((o) => o.id === slotWidget)!);

  const slotOptions = $derived(SLOT_WIDGET_OPTIONS.map((o) => ({ id: o.id, label: o.name })));

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

</script>



<div class="structural-drawer-pane structural-drawer-pane--home">

  <div class="structural-drawer-status">

    <div class="structural-drawer-status__clock" aria-live="polite">

      <span class="structural-drawer-status__time">{timeText}</span>

      <span class="structural-drawer-status__date">{dateText}</span>

    </div>



    <div class="structural-drawer-status__slot">

      <header class="structural-drawer-status__slot-head">

        <SkinDrawerGlyph name={slotMeta.icon} size={14} />

        <span>{slotMeta.name}</span>

        <button type="button" class="structural-drawer-status__swap" onclick={() => (pickerOpen = !pickerOpen)} aria-label="切换预览组件">↻</button>

        <SkinSwitch

          checked={enabled[slotWidget]}

          label={`${slotMeta.name} ${m.toggleSwitch}`}

          onchange={() => onToggleSlot()}

        />

      </header>

      <div class="structural-drawer-status__slot-body">

        <span class="structural-drawer-status__value">

          {#if slotWidget === 'stats' && statsNotes != null}

            {statsNotes}

          {:else}

            {preview.value}

          {/if}

        </span>

        <span class="structural-drawer-status__sub">

          {#if slotWidget === 'stats' && statsNotes != null}

            篇笔记

          {:else}

            {preview.sub ?? '—'}

          {/if}

        </span>

      </div>



      {#if pickerOpen}

        <SkinSegment

          options={slotOptions}

          value={slotWidget}

          ariaLabel="选择预览组件"

          onchange={(id) => onSlotChange(id as SlotWidgetKey)}

        />

      {/if}

    </div>

  </div>



  <section class="structural-drawer-section">

    <h3 class="structural-drawer-section__label">{m.controlCenter}</h3>

    <div class="structural-menu-shelf">

      {#each categories as cat (cat.id)}

        <button type="button" class="structural-menu-cart" onclick={() => onGoPane(cat.id)}>

          <div class="structural-menu-cart__label">

            <span class="structural-menu-cart__icon"><SkinDrawerGlyph name={cat.icon} size={18} /></span>

            <span class="structural-menu-cart__title">{cat.name}</span>

          </div>

          <p class="structural-menu-cart__desc">{cat.desc}</p>

          <div class="structural-menu-cart__pins" aria-hidden="true"></div>

        </button>

      {/each}

    </div>

  </section>



  <section class="structural-drawer-section">

    <h3 class="structural-drawer-section__label">{m.quickActions}</h3>

    <div class="ctl-actions ctl-actions--{skin}">

      <button type="button" class="ctl-action" disabled={isCleared} onclick={() => !isCleared && onClearAll?.()}>

        {m.clearScreen}

      </button>

      {#if hasSnapshot}

        <button type="button" class="ctl-action is-accent" onclick={() => onRestore?.()}>

          {m.restoreLayout}

        </button>

      {/if}

    </div>

    <p class="structural-drawer-footnote">{isCleared ? m.cleared : m.keepWallpaper}</p>

  </section>

</div>

