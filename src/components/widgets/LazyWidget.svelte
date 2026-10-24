<script lang="ts">
  import type { Component } from 'svelte';

  type Loader = () => Promise<{ default: Component }>;

  interface Props {
    show: boolean;
    loader: Loader;
    props?: Record<string, unknown>;
    /** 可选：加载提示（重型模块） */
    loadingHint?: string;
    [key: string]: unknown;
  }

  let { show, loader, props: propsBag, loadingHint, ...rest }: Props = $props();

  let Comp = $state<Component | null>(null);
  let loadError = $state('');
  let loading = $state(false);
  let loadGen = 0;

  const widgetProps = $derived({ ...(propsBag ?? {}), ...rest });

  async function runLoad() {
    if (!show) return;
    const gen = ++loadGen;
    loadError = '';
    loading = true;
    Comp = null;
    try {
      const mod = await loader();
      if (gen !== loadGen) return;
      Comp = mod.default;
    } catch (e) {
      if (gen !== loadGen) return;
      Comp = null;
      const msg = e instanceof Error ? e.message : String(e);
      loadError =
        msg.includes('fetch') || msg.includes('Importing a module') || msg.includes('Failed to fetch')
          ? '组件脚本加载失败，请重试或硬刷新 (Ctrl+Shift+R)'
          : `组件加载失败：${msg}`;
    } finally {
      if (gen === loadGen) loading = false;
    }
  }

  $effect(() => {
    if (!show) {
      Comp = null;
      loadError = '';
      loading = false;
      return;
    }
    void runLoad();
  });
</script>

{#if show && loadError}
  <div class="lazy-widget-error" role="alert">
    <p>{loadError}</p>
    <button type="button" class="lazy-retry" onclick={() => void runLoad()}>重试</button>
  </div>
{:else if show && loading && !Comp}
  <div class="lazy-widget-loading" role="status" aria-live="polite">
    {loadingHint ?? '加载组件…'}
  </div>
{:else if show && Comp}
  <Comp {...widgetProps} />
{/if}

<style>
  .lazy-widget-error,
  .lazy-widget-loading {
    position: fixed;
    left: 50%;
    bottom: 12%;
    transform: translateX(-50%);
    z-index: 5;
    max-width: min(92vw, 420px);
    padding: 10px 14px;
    border-radius: var(--radius-card, 10px);
    font-size: var(--text-xs, 0.75rem);
    line-height: 1.45;
    text-align: center;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm, 0 4px 16px var(--overlay-medium, rgba(0, 0, 0, 0.25)));
  }
  .lazy-widget-error {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  .lazy-widget-error p {
    margin: 0;
    color: var(--color-error, var(--text));
  }
  .lazy-retry {
    border: 1px solid var(--border);
    background: var(--accent);
    color: var(--on-accent);
    border-radius: var(--radius-button, 8px);
    padding: 4px 12px;
    font-size: var(--text-xs, 0.75rem);
    cursor: pointer;
  }
  .lazy-widget-loading {
    pointer-events: none;
    color: var(--text-muted);
  }
</style>
