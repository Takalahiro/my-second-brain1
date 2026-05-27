<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { CalendarSettingsProps } from './calendar-types';

  let {
    ui,
    urlInput,
    loading,
    syncError,
    lastSync,
    eventCount,
    fmtSync,
    onUrlInputChange,
    onSaveUrl,
    onClearUrl,
    onSync,
    hasUrl,
  }: CalendarSettingsProps = $props();

  const skin = resolveStructuralSkin();
</script>

<div class="skin-cal-settings skin-cal-settings--{skin}">
  <p class="skin-cal-settings__label">{ui.icsLabel}</p>
  <input
    type="url"
    class="skin-cal-settings__input"
    placeholder={ui.icsPlaceholder}
    value={urlInput}
    oninput={(e) => onUrlInputChange((e.currentTarget as HTMLInputElement).value)}
  />
  <div class="skin-cal-settings__toolbar">
    <button type="button" class="skin-cal__btn" onclick={onSaveUrl}>{ui.icsSave}</button>
    {#if hasUrl}
      <button type="button" class="skin-cal__btn" onclick={onClearUrl}>{ui.icsClear}</button>
    {/if}
    <button type="button" class="skin-cal__btn" onclick={onSync}>{loading ? ui.icsSyncing : ui.icsSync}</button>
  </div>
  <p class="skin-cal-settings__hint">{ui.icsLastSync}：{fmtSync(lastSync)} · {ui.icsEventCount} {eventCount}</p>
  {#if syncError}
    <p class="skin-cal-settings__err">{syncError}</p>
  {/if}
</div>
