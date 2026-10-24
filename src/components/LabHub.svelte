<script lang="ts">
  import TeachingHub from './teaching/TeachingHub.svelte';
  import CompilerLab from './CompilerLab.svelte';

  type Tab = 'teaching' | 'compilers' | 'robot';

  function initialTab(): Tab {
    const q = new URLSearchParams(window.location.search).get('tab');
    if (q === 'compilers' || q === 'robot' || q === 'teaching') return q;
    return 'teaching';
  }

  let tab = $state<Tab>(initialTab());
  let opened = $state<Record<Tab, boolean>>({
    teaching: initialTab() === 'teaching',
    compilers: initialTab() === 'compilers',
    robot: initialTab() === 'robot',
  });

  const tabs: { id: Tab; label: string; hint: string }[] = [
    { id: 'teaching', label: '教学', hint: '知识之海 · 学科岛屿' },
    { id: 'compilers', label: '编译器', hint: 'Python / AVR' },
    { id: 'robot', label: '迷宫小车', hint: 'MazeCar · 纯前端仿真' },
  ];

  function select(next: Tab) {
    tab = next;
    opened[next] = true;
    const url = new URL(window.location.href);
    url.pathname = '/lab/';
    url.searchParams.set('tab', next);
    if (next !== 'compilers') url.searchParams.delete('lang');
    history.replaceState({}, '', url);
  }
</script>

<div class="lab-hub">
  <div class="lab-tabs" role="tablist" aria-label="学堂">
    {#each tabs as t}
      <button
        type="button"
        role="tab"
        class:active={tab === t.id}
        aria-selected={tab === t.id}
        onclick={() => select(t.id)}
      >
        <span class="lab-tab-label">{t.label}</span>
        <span class="lab-tab-hint">{t.hint}</span>
      </button>
    {/each}
  </div>

  <div class="lab-stage">
    {#if opened.teaching}
      <div class="lab-pane" role="tabpanel" hidden={tab !== 'teaching'}>
        <TeachingHub />
      </div>
    {/if}
    {#if opened.compilers}
      <div class="lab-pane" role="tabpanel" hidden={tab !== 'compilers'}>
        <CompilerLab embedded />
      </div>
    {/if}
    {#if opened.robot}
      <div class="lab-pane lab-pane-sim" role="tabpanel" hidden={tab !== 'robot'}>
        <iframe
          class="mazecar-frame"
          src="/mazecar/"
          title="MazeCar 迷宫小车仿真"
          loading="lazy"
        ></iframe>
      </div>
    {/if}
  </div>
</div>

<style>
  .lab-hub {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--site-nav-offset, 88px));
    min-height: 0;
    overflow: hidden;
  }
  .lab-tabs {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4) 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }
  .lab-tabs button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid transparent;
    border-bottom: 0;
    border-radius: var(--radius-button) var(--radius-button) 0 0;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .lab-tabs button.active {
    color: var(--text);
    background: var(--bg);
    border-color: var(--border);
  }
  .lab-tab-label { font-size: var(--text-sm); font-weight: var(--weight-semibold); }
  .lab-tab-hint { font-size: var(--text-xs); }
  .lab-stage { flex: 1; min-height: 0; position: relative; overflow: hidden; }
  .lab-pane { height: 100%; min-height: 0; overflow: auto; }
  .lab-pane[hidden] { display: none; }
  .lab-pane :global(.knowledge-sea),
  .lab-pane :global(.compiler-lab),
  .lab-pane :global(.robot-ide) {
    height: 100%;
    min-height: 0;
  }
  .lab-pane :global(.knowledge-sea) {
    min-height: 0;
  }
  .lab-pane-sim {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .mazecar-frame {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    border: 0;
    background: var(--bg);
  }
</style>
