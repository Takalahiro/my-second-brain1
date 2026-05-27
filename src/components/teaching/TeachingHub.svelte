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
    gap: var(--space-3);
    min-height: 0;
    padding: 0;
  }
  .th-head {
    padding: 0 var(--space-1) var(--space-1);
  }
  .th-breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    font-family: var(--font-display);
  }
  .th-crumb {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-muted, var(--text-secondary));
  }
  .th-crumb.active {
    color: var(--text, var(--text-primary));
  }
  .th-sep {
    color: var(--text-muted, var(--text-secondary));
    opacity: 0.5;
  }
  .th-sub {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    color: var(--text-muted, var(--text-secondary));
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
