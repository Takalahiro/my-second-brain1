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
  class="pixel-fc-switch"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  aria-disabled={disabled}
  data-on={checked}
  {disabled}
  onclick={toggle}
>
  <span class="pixel-fc-switch__track">
    <span class="pixel-fc-switch__slot">关</span>
    <span class="pixel-fc-switch__slot">开</span>
  </span>
  <span class="pixel-fc-switch__paddle"></span>
</button>
