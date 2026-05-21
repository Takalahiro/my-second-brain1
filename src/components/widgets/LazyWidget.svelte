<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    show: boolean;
    loader: () => Promise<{ default: Component }>;
    props?: Record<string, unknown>;
  }

  let { show, loader, props = {} }: Props = $props();

  let Comp = $state<Component | null>(null);
  let loadGen = 0;

  $effect(() => {
    if (!show) {
      Comp = null;
      return;
    }

    const gen = ++loadGen;
    void loader().then((mod) => {
      if (gen === loadGen) Comp = mod.default;
    });
  });
</script>

{#if show && Comp}
  <Comp {...props} />
{/if}
