<script lang="ts">
  import { onMount } from 'svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import {
    SLOT_WIDGET_OPTIONS,
    readSlotPreview,
    type SlotPreview,
    type SlotWidgetKey,
  } from '../../lib/control-center-slot';

  interface Props {
    widgetId: SlotWidgetKey;
    enabled: boolean;
    onChange: (id: SlotWidgetKey) => void;
    onToggle: () => void;
  }

  let { widgetId, enabled, onChange, onToggle }: Props = $props();

  let pickerOpen = $state(false);
  let preview = $state<SlotPreview>(readSlotPreview(widgetId));
  let statsNotes = $state<number | null>(null);

  const meta = $derived(SLOT_WIDGET_OPTIONS.find((o) => o.id === widgetId)!);

  function refreshPreview() {
    preview = readSlotPreview(widgetId);
  }

  async function refreshStats() {
    if (widgetId !== 'stats') return;
    try {
      const res = await fetch('/data/notes.json');
      if (!res.ok) return;
      const data = (await res.json()) as { notes?: unknown[] };
      statsNotes = Array.isArray(data.notes) ? data.notes.length : null;
    } catch {}
  }

  onMount(() => {
    refreshPreview();
    void refreshStats();
    const id = window.setInterval(() => {
      refreshPreview();
      void refreshStats();
    }, 5000);
    return () => window.clearInterval(id);
  });

  $effect(() => {
    widgetId;
    refreshPreview();
    void refreshStats();
  });

  function pick(id: SlotWidgetKey) {
    onChange(id);
    pickerOpen = false;
    refreshPreview();
  }
</script>

<div class="cc-slot">
  <header class="cc-slot-head">
    <span class="cc-slot-icon" aria-hidden="true"><PixelIcon name={meta.icon} size={16} /></span>
    <span class="cc-slot-label">{meta.name}</span>
    <button
      type="button"
      class="cc-slot-switch"
      aria-label="切换组件"
      title="切换组件"
      onclick={() => (pickerOpen = !pickerOpen)}
    >
      ↻
    </button>
  </header>

  <button type="button" class="cc-slot-body" onclick={onToggle} aria-label={`${meta.name}：${enabled ? '已启用' : '点击启用'}`}>
    <div class="cc-slot-value">
      {#if widgetId === 'stats' && statsNotes != null}
        {statsNotes}
      {:else}
        {preview.value}
      {/if}
    </div>
    <div class="cc-slot-sub">
      {#if widgetId === 'stats' && statsNotes != null}
        篇笔记
      {:else}
        {preview.sub}
      {/if}
    </div>
    <span class="cc-slot-badge" class:is-on={enabled}>{enabled ? '已启用' : '轻点启用'}</span>
  </button>

  {#if pickerOpen}
    <div class="cc-slot-picker" role="dialog" aria-label="选择组件">
      <div class="cc-slot-picker-grid">
        {#each SLOT_WIDGET_OPTIONS as opt (opt.id)}
          <button
            type="button"
            class="cc-slot-pick"
            class:is-active={opt.id === widgetId}
            onclick={() => pick(opt.id)}
          >
            <span class="cc-slot-pick-icon"><PixelIcon name={opt.icon} size={18} /></span>
            <span class="cc-slot-pick-name">{opt.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .cc-slot {
    position: relative;
    height: 100%;
    min-height: 148px;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    background: linear-gradient(145deg, rgb(180 140 255 / 0.18), rgb(255 141 232 / 0.1));
    border: 1px solid rgb(255 255 255 / 0.14);
    overflow: hidden;
  }
  .cc-slot-head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px 0;
    flex-shrink: 0;
  }
  .cc-slot-icon {
    display: inline-flex;
    align-items: center;
  }
  .cc-slot-label {
    flex: 1;
    font-size: 0.72rem;
    font-weight: 600;
    color: rgb(255 255 255 / 0.75);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .cc-slot-switch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgb(255 255 255 / 0.16);
    background: rgb(0 0 0 / 0.2);
    color: rgb(255 255 255 / 0.85);
    cursor: pointer;
    font-size: 0.85rem;
    line-height: 1;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .cc-slot-switch:hover {
    background: rgb(255 255 255 / 0.12);
    transform: rotate(90deg);
  }
  .cc-slot-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: 8px 14px 14px;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
    width: 100%;
  }
  .cc-slot-value {
    font-size: clamp(1.5rem, 4.5vw, 2rem);
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .cc-slot-sub {
    margin-top: 4px;
    font-size: 0.72rem;
    color: rgb(255 255 255 / 0.52);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
  .cc-slot-badge {
    margin-top: 10px;
    font-size: 0.62rem;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgb(0 0 0 / 0.22);
    color: rgb(255 255 255 / 0.55);
  }
  .cc-slot-badge.is-on {
    background: rgb(52 199 89 / 0.25);
    color: #9ef0b0;
  }
  .cc-slot-picker {
    position: absolute;
    inset: 0;
    z-index: 2;
    padding: 10px;
    background: rgb(28 22 40 / 0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: cc-picker-in 0.22s cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes cc-picker-in {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
  .cc-slot-picker-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    height: 100%;
    overflow-y: auto;
    align-content: start;
  }
  .cc-slot-pick {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    border-radius: 10px;
    border: 1px solid rgb(255 255 255 / 0.1);
    background: rgb(255 255 255 / 0.05);
    color: inherit;
    cursor: pointer;
    font-size: 0.62rem;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .cc-slot-pick:hover { background: rgb(255 255 255 / 0.1); }
  .cc-slot-pick.is-active {
    border-color: rgb(180 140 255 / 0.65);
    background: rgb(180 140 255 / 0.18);
  }
  .cc-slot-pick-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .cc-slot-pick-name {
    line-height: 1.2;
    text-align: center;
    color: rgb(255 255 255 / 0.75);
  }
</style>
