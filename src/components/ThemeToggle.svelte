<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggle() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
</script>

<button
  onclick={toggle}
  aria-label="切换主题"
  class="pixel-button theme-toggle-btn"
>
  {isDark ? '☀️' : '🌙'}
</button>

<style>
  .theme-toggle-btn {
    min-width: 42px;
    height: 38px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: 1rem;
  }
</style>
