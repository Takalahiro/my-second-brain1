<script lang="ts">
  import PythonIDE from './PythonIDE.svelte';
  import AvrIDE from './AvrIDE.svelte';

  type Lang = 'python' | 'avr';

  function initialLang(): Lang {
    const q = new URLSearchParams(window.location.search).get('lang');
    return q === 'avr' ? 'avr' : 'python';
  }

  let lang = $state<Lang>(initialLang());
  let opened = $state<Record<Lang, boolean>>({
    python: initialLang() === 'python',
    avr: initialLang() === 'avr',
  });

  const tabs: { id: Lang; label: string; hint: string }[] = [
    { id: 'python', label: 'Python', hint: 'Pyodide 逐步追踪' },
    { id: 'avr', label: 'AVR 汇编', hint: '完整指令集模拟' },
  ];

  function select(next: Lang) {
    lang = next;
    opened[next] = true;
    const url = new URL(window.location.href);
    url.pathname = '/compilers/';
    url.searchParams.set('lang', next);
    history.replaceState({}, '', url);
  }
</script>

<div class="compiler-lab">
  <div class="compiler-tabs" role="tablist" aria-label="编译器">
    {#each tabs as tab}
      <button
        type="button"
        role="tab"
        class:active={lang === tab.id}
        aria-selected={lang === tab.id}
        onclick={() => select(tab.id)}
      >
        <span class="compiler-tab-label">{tab.label}</span>
        <span class="compiler-tab-hint">{tab.hint}</span>
      </button>
    {/each}
  </div>

  <div class="compiler-stage">
    {#if opened.python}
      <div class="compiler-pane" role="tabpanel" hidden={lang !== 'python'}>
        <PythonIDE />
      </div>
    {/if}
    {#if opened.avr}
      <div class="compiler-pane" role="tabpanel" hidden={lang !== 'avr'}>
        <AvrIDE />
      </div>
    {/if}
  </div>
</div>

<style>
  .compiler-lab {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--site-nav-offset, 88px));
    min-height: 0;
    overflow: hidden;
  }
  .compiler-tabs {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4) 0;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .compiler-tabs button {
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
  .compiler-tabs button.active {
    color: var(--text);
    background: var(--bg);
    border-color: var(--border);
  }
  .compiler-tab-label { font-size: var(--text-sm); font-weight: var(--weight-semibold); }
  .compiler-tab-hint { font-size: var(--text-xs); }
  .compiler-stage { flex: 1; min-height: 0; position: relative; overflow: hidden; }
  .compiler-pane { height: 100%; min-height: 0; }
  .compiler-pane[hidden] { display: none; }
  .compiler-pane :global(.py-ide),
  .compiler-pane :global(.avr-ide) {
    height: 100%;
  }
</style>
