<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import type { SkinSwitchProps } from '../primitives/controls/types';

  let { checked, disabled = false, label, onchange }: SkinSwitchProps = $props();
  const skin = resolveStructuralSkin();

  let pulsing = $state(false);
  let coverOpen = $state(false);

  function flashPulse() {
    pulsing = true;
    window.setTimeout(() => {
      pulsing = false;
    }, 420);
  }

  function toggleDefault() {
    if (disabled) return;
    onchange(!checked);
    flashPulse();
  }

  function toggleSpacecraft() {
    if (disabled) return;
    if (!coverOpen) {
      coverOpen = true;
      return;
    }
    onchange(!checked);
    flashPulse();
  }
</script>

{#if skin === 'blueprint'}
  <button
    type="button"
    class="ctl-switch ctl-switch--blueprint"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__bp" aria-hidden="true">
      <span class="ctl-switch__term">T1</span>
      <span class="ctl-switch__circuit">
        <span class="ctl-switch__wire ctl-switch__wire--l"></span>
        <span class="ctl-switch__arm"></span>
        <span class="ctl-switch__contact"></span>
        <span class="ctl-switch__wire ctl-switch__wire--r"></span>
        <span class="ctl-switch__spark"></span>
      </span>
      <span class="ctl-switch__term">T2</span>
      <span class="ctl-switch__dim">{checked ? '[ON]' : '[OFF]'}</span>
    </span>
    {#if checked}
      <span class="ctl-switch__closed-tag">CLOSED</span>
    {/if}
  </button>
{:else if skin === 'scholar'}
  <button
    type="button"
    class="ctl-switch ctl-switch--scholar"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__scholar-wrap" aria-hidden="true">
      <span
        class="ctl-switch__wax sch-wax-seal sch-wax-seal--sm"
        class:is-unsealed={!checked}
        class:is-glow={checked}
        class:is-stamp={pulsing && checked}
      >
        <span class="sch-wax-seal__letter">S</span>
        <span class="sch-wax-seal__sheen"></span>
        {#if !checked}<span class="sch-wax-seal__crack"></span>{/if}
      </span>
      <span class="ctl-switch__scholar-caption">{checked ? 'signed et sealed' : 'unsealed'}</span>
    </span>
  </button>
{:else if skin === 'terminal'}
  <button
    type="button"
    class="ctl-switch ctl-switch--terminal"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__term-line" aria-hidden="true">
      <span class="ctl-switch__prompt">$ export FEATURE=</span>
      <span class="ctl-switch__bool">{checked ? 'true' : 'false'}</span>
      {#if checked}
        <span class="ctl-switch__tick">✓</span>
      {/if}
    </span>
  </button>
{:else if skin === 'crt'}
  <button
    type="button"
    class="ctl-switch ctl-switch--crt"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__crt-wrap" aria-hidden="true">
      <span class="ctl-switch__crt-ch">CH-03</span>
      <span class="ctl-switch__crt-face">{checked ? '▮ ON ' : '▯ OFF'}</span>
      <span class="ctl-switch__crt-pwr">PWR</span>
    </span>
  </button>
{:else if skin === 'observatory'}
  <button
    type="button"
    class="ctl-switch ctl-switch--observatory"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__obs-wrap" aria-hidden="true">
      <span class="ctl-switch__dome">
        <span class="ctl-switch__dome-slit"></span>
        <span class="ctl-switch__dome-core"></span>
      </span>
      <span class="ctl-switch__obs-label">{checked ? 'TRACKING' : 'DOME CLOSED'}</span>
    </span>
  </button>
{:else if skin === 'herbarium'}
  <button
    type="button"
    class="ctl-switch ctl-switch--herbarium"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__herb-wrap" aria-hidden="true">
      <span class="ctl-switch__stamp">{checked ? '✓ COLLECTED' : 'AWAITING'}</span>
      <span class="ctl-switch__herb-date">26-V-2026</span>
    </span>
  </button>
{:else if skin === 'ink'}
  <button
    type="button"
    class="ctl-switch ctl-switch--ink"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__ink-wrap" aria-hidden="true">
      <span class="ctl-switch__ink-vol">卷一·啟閉</span>
      <span class="ctl-switch__seal">{checked ? '啟' : '閉'}</span>
    </span>
  </button>
{:else if skin === 'rpg'}
  <button
    type="button"
    class="ctl-switch ctl-switch--rpg"
    class:is-on={checked}
    class:is-pulse={pulsing}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    onclick={toggleDefault}
  >
    <span class="ctl-switch__rpg-wrap" aria-hidden="true">
      <span class="ctl-switch__gem-slot">
        {#if !checked}
          <span class="ctl-switch__lock">🔒</span>
        {/if}
        <span class="ctl-switch__gem">◆</span>
        {#if pulsing && checked}
          <span class="ctl-switch__burst"></span>
        {/if}
      </span>
      <span class="ctl-switch__rpg-label">{checked ? 'ACTIVE' : 'LOCKED'}</span>
    </span>
  </button>
{:else if skin === 'spacecraft'}
  <button
    type="button"
    class="ctl-switch ctl-switch--spacecraft"
    class:is-on={checked}
    class:is-pulse={pulsing}
    class:cover-open={coverOpen}
    aria-pressed={checked}
    {disabled}
    aria-label={label}
    title={coverOpen ? label : `${label} — 先掀保护罩`}
    onclick={toggleSpacecraft}
  >
    <span class="ctl-switch__sc-wrap" aria-hidden="true">
      <span class="ctl-switch__sc-title">MAIN PWR · S-07</span>
      <span class="ctl-switch__sc-body">
        <span class="ctl-switch__cover"></span>
        <span class="ctl-switch__hazard"></span>
        <span class="ctl-switch__lever" class:is-up={checked}></span>
        <span class="ctl-switch__led"></span>
      </span>
      <span class="ctl-switch__sc-state">{checked ? 'ARMED' : coverOpen ? 'READY' : 'SAFE'}</span>
    </span>
  </button>
{/if}
