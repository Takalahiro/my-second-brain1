<script lang="ts">
  interface Props {
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    onchange?: (v: boolean) => void;
  }
  let { checked = false, label = '', disabled = false, onchange }: Props = $props();

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    if (disabled) return;
    onchange?.(!checked);
  }
</script>

<button
  type="button"
  class="pixel-nes-check"
  role="checkbox"
  aria-checked={checked}
  aria-label={label}
  data-checked={checked}
  {disabled}
  onclick={toggle}
>
  <span class="pixel-nes-check__box">{checked ? '✓' : ''}</span>
  {#if label}
    <span class="pixel-nes-check__label">{label}</span>
  {/if}
</button>
