<script lang="ts">

  import type { Component } from 'svelte';



  type Loader = () => Promise<{ default: Component }>;



  interface Props {

    show: boolean;

    loader: Loader;

    props?: Record<string, unknown>;

    [key: string]: unknown;

  }



  let { show, loader, props: propsBag, ...rest }: Props = $props();



  let Comp = $state<Component | null>(null);

  let loadError = $state('');

  let loadGen = 0;



  const widgetProps = $derived({ ...(propsBag ?? {}), ...rest });



  $effect(() => {

    if (!show) {

      Comp = null;

      loadError = '';

      return;

    }



    const gen = ++loadGen;

    loadError = '';

    void loader()

      .then((mod) => {

        if (gen === loadGen) Comp = mod.default;

      })

      .catch((e) => {

        if (gen !== loadGen) return;

        Comp = null;

        const msg = e instanceof Error ? e.message : String(e);

        loadError = msg.includes('fetch') || msg.includes('Importing a module')

          ? '组件脚本加载失败，请硬刷新 (Ctrl+Shift+R)'

          : `组件加载失败：${msg}`;

      });

  });

</script>



{#if show && loadError}

  <div class="lazy-widget-error" role="alert">{loadError}</div>

{:else if show && Comp}

  <Comp {...widgetProps} />

{/if}



<style>

  .lazy-widget-error {

    position: fixed;

    left: 50%;

    bottom: 12%;

    transform: translateX(-50%);

    z-index: 5;

    max-width: min(92vw, 420px);

    padding: 10px 14px;

    border-radius: 10px;

    font-size: 0.75rem;

    line-height: 1.45;

    text-align: center;

    color: #fff;

    background-color: rgba(120, 40, 50, 0.82);

    backdrop-filter: blur(8px);

    pointer-events: none;

  }

</style>

