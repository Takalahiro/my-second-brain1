<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    type?: string;
    class?: string;
    [key: string]: unknown;
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<input
  {type}
  class={['ui-input', className].filter(Boolean).join(' ')}
  bind:value
  {placeholder}
  {...rest}
/>
