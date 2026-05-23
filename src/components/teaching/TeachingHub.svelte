<script lang="ts">
  import type { Component } from 'svelte';
  import PixelIcon from '../PixelIcon.svelte';
  import { TEACHING_SUBJECTS } from '../../lib/teaching/registry';

  const embedModules = import.meta.glob<{ default: Component }>([
    '../calculus/CalculusCourseLab.svelte',
  ]);

  const math = TEACHING_SUBJECTS[0];
  let EmbedComponent = $state<Component | null>(null);
  let embedLoading = $state(true);

  $effect(() => {
    embedLoading = true;
    embedModules['../calculus/CalculusCourseLab.svelte']()
      .then((m) => {
        EmbedComponent = m.default;
      })
      .finally(() => {
        embedLoading = false;
      });
  });
</script>

<div class="teaching-hub">
  <header class="th-head">
    <div class="th-breadcrumb">
      <span class="th-crumb"><PixelIcon name={math.icon} size={16} /> {math.title}</span>
      <span class="th-sep">/</span>
      <span class="th-crumb active">{math.modules[0]?.title ?? '微积分复习'}</span>
    </div>
    <p class="th-sub">分步讲解 · 公式推导 · 无需输入，跟着播放器走即可</p>
  </header>

  <main class="th-main">
    {#if embedLoading}
      <p class="th-loading">加载中…</p>
    {:else if EmbedComponent}
      <EmbedComponent />
    {/if}
  </main>
</div>

<style>
  .teaching-hub {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: calc(100vh - 88px);
    padding: 4px 0 16px;
  }
  .th-head {
    padding: 0 4px 4px;
  }
  .th-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 1.05rem;
    font-weight: 650;
  }
  .th-crumb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--text-secondary);
  }
  .th-crumb.active {
    color: var(--text-primary);
  }
  .th-sep {
    color: var(--text-secondary);
    opacity: 0.5;
  }
  .th-sub {
    margin: 6px 0 0;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }
  .th-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .th-loading {
    padding: 48px;
    text-align: center;
    color: var(--text-secondary);
  }
</style>
