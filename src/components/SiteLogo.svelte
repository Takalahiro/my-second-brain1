<script lang="ts">
  interface Props {
    // 显示高度（CSS px）
    size?: number;
    class?: string;
    alt?: string;
  }

  let { size = 22, class: className = '', alt = 'My Second Brain' }: Props = $props();
</script>

<img
  src="/logo.png"
  {alt}
  class="site-logo {className}"
  style="--logo-h: {size}px;"
  width={size}
  height={size}
  decoding="async"
  draggable="false"
/>

<style>
  .site-logo {
    display: block;
    width: auto;
    height: var(--logo-h, 22px);
    max-width: calc(var(--logo-h, 22px) * 1.35);
    object-fit: contain;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
    transition: transform 0.22s ease, opacity 0.22s ease;
  }
</style>
