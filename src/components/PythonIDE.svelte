<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** 小组件模式：隐藏大标题，紧凑布局 */
    compact?: boolean;
  }
  let { compact = false }: Props = $props();

  let pyodideReady = $state(false);
  let loading = $state(true);
  let loadErr = $state<string | null>(null);
  let code = $state(`# 在线 Python（Pyodide）
import math

def greet(name):
    return f"Hello, {name}!"

print(greet("Second Brain"))
print("π =", math.pi)
print("2**10 =", 2**10)
`);
  let stdout = $state('');
  let running = $state(false);
  let pyodide: { runPythonAsync: (c: string) => Promise<unknown>; setStdout: (o: { batched: (t: string) => void }) => void } | null = null;

  onMount(() => {
    void initPyodide();
  });

  async function initPyodide() {
    loading = true;
    loadErr = null;
    try {
      // @ts-expect-error CDN global
      if (!window.loadPyodide) {
        await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
      }
      // @ts-expect-error CDN
      pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
      });
      pyodide.setStdout({
        batched: (text: string) => {
          stdout += text;
        },
      });
      pyodideReady = true;
    } catch (e) {
      loadErr = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function loadScript(src: string) {
    return new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function runCode() {
    if (!pyodide || running) return;
    running = true;
    stdout = '';
    try {
      await pyodide.runPythonAsync(code);
    } catch (e) {
      stdout += '\n' + (e instanceof Error ? e.message : String(e));
    } finally {
      running = false;
    }
  }

  function clearOutput() { stdout = ''; }
</script>

<div class="py-ide" class:compact>
  <header class="py-head">
    {#if !compact}
    <div>
      <h1>Python 在线编译器</h1>
      <p class="py-sub">基于 Pyodide · 浏览器内运行 Python 3</p>
    </div>
    {:else}
    <span class="py-compact-title">Pyodide</span>
    {/if}
    <div class="py-actions">
      {#if loading}
        <span class="py-badge">加载运行时…</span>
      {:else if loadErr}
        <button type="button" class="py-btn" onclick={() => initPyodide()}>重试加载</button>
      {:else}
        <span class="py-badge ok">就绪</span>
        <button type="button" class="py-btn primary" onclick={runCode} disabled={running || !pyodideReady}>
          {running ? '运行中…' : '▶ 运行'}
        </button>
        <button type="button" class="py-btn" onclick={clearOutput}>清空输出</button>
      {/if}
    </div>
  </header>

  {#if loadErr}
    <p class="py-err">{loadErr}</p>
  {/if}

  <div class="py-panels">
    <section class="py-editor">
      <label class="py-lbl" for="py-code">代码</label>
      <textarea id="py-code" bind:value={code} spellcheck="false" disabled={!pyodideReady}></textarea>
    </section>
    <section class="py-output">
      <label class="py-lbl">输出</label>
      <pre class="py-stdout">{stdout || (pyodideReady ? '（无输出）' : '等待 Pyodide 加载…')}</pre>
    </section>
  </div>
</div>

<style>
  .py-ide {
    display: flex; flex-direction: column;
    gap: 12px;
    height: calc(100vh - 88px);
    padding: 12px 16px 16px;
    color: var(--text-primary);
  }
  .py-ide.compact {
    height: 100%;
    min-height: 0;
    padding: 0;
    gap: 8px;
  }
  .py-compact-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .py-ide.compact .py-panels {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 0.45fr;
  }
  .py-ide.compact #py-code,
  .py-ide.compact .py-stdout {
    min-height: 120px;
  }
  .py-head {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px;
  }
  .py-head h1 { margin: 0; font-size: 1.35rem; }
  .py-sub { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.84rem; }
  .py-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .py-badge {
    font-size: 0.75rem; padding: 4px 10px; border-radius: 999px;
    background: var(--bg-secondary); border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }
  .py-badge.ok { color: #7fe6c4; border-color: rgba(127, 230, 196, 0.4); }
  .py-btn {
    padding: 6px 14px; border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary); cursor: pointer; font-size: 0.84rem;
  }
  .py-btn.primary {
    background: linear-gradient(135deg, #ffd0e6, #b48cff);
    color: #1c0f30; border-color: transparent; font-weight: 600;
  }
  .py-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .py-err { color: #ff9d9d; padding: 8px 12px; background: rgb(255 0 0 / 0.08); border-radius: 8px; }
  .py-panels {
    flex: 1; min-height: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 900px) {
    .py-panels { grid-template-columns: 1fr; }
    .py-ide { height: auto; min-height: calc(100vh - 88px); }
  }
  .py-editor, .py-output {
    display: flex; flex-direction: column; min-height: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
  }
  .py-lbl {
    padding: 8px 12px; font-size: 0.72rem;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    text-transform: uppercase; letter-spacing: 1px;
  }
  #py-code {
    flex: 1; min-height: 280px;
    padding: 12px 14px;
    border: 0; resize: none;
    font-family: 'IBM Plex Mono', 'Consolas', monospace;
    font-size: 0.85rem; line-height: 1.5;
    background: rgb(12 8 22 / 0.6);
    color: #e8e0ff;
    outline: none;
  }
  :global(.dark) #py-code { background: #0e0816; }
  .py-stdout {
    flex: 1; min-height: 280px; margin: 0;
    padding: 12px 14px; overflow: auto;
    font-family: 'IBM Plex Mono', 'Consolas', monospace;
    font-size: 0.82rem; line-height: 1.45;
    background: rgb(8 6 14 / 0.5);
    color: #d6cae6;
    white-space: pre-wrap; word-break: break-word;
  }
</style>
