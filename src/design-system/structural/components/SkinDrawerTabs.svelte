<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import type { SkinDrawerTabsProps } from '../primitives/controls/types';

  let { pane, tabs, onchange }: SkinDrawerTabsProps = $props();
  const skin = resolveStructuralSkin();

  function tabLabel(tab: (typeof tabs)[number], index: number): string {
    if (skin === 'terminal') {
      const active = pane === tab.id;
      return `[${index}:${tab.label}${active ? '*' : ''}]`;
    }
    if (skin === 'crt') return tab.label;
    return tab.label;
  }
</script>

<nav class="ctl-tabs ctl-tabs--{skin}" aria-label="控制中心">
  {#each tabs as tab, i (tab.id)}
    <button
      type="button"
      class="ctl-tabs__item"
      class:is-active={pane === tab.id}
      aria-current={pane === tab.id ? 'page' : undefined}
      onclick={() => onchange(tab.id)}
    >
      {#if skin === 'blueprint' && pane === tab.id}
        <span class="ctl-tabs__fold" aria-hidden="true"></span>
      {/if}
      {#if skin === 'terminal' && pane === tab.id}
        <span class="ctl-tabs__tmux" aria-hidden="true"></span>
      {/if}
      {#if skin === 'rpg' && pane === tab.id}
        <span class="ctl-tabs__arrow" aria-hidden="true">▶</span>
      {/if}
      {tabLabel(tab, i)}
    </button>
  {/each}
</nav>
