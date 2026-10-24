<script lang="ts">
  import type { TeachingIsland } from '../../lib/teaching/registry';
  import { isComputerCategory } from '../../lib/teaching/registry';
  import {
    getCategoryLabel,
    teachingHubHref,
    teachingHubHrefForIsland,
  } from '../../lib/teaching/routes';

  interface Props {
    island: TeachingIsland;
    class?: string;
  }

  let { island, class: className = '' }: Props = $props();

  const isComputer = $derived(isComputerCategory(island.category));
</script>

<nav class="teaching-crumb {className}" aria-label="教学导航">
  <a href="/lab/?tab=teaching">知识之海</a>
  {#if isComputer}
    <span class="teaching-crumb__sep" aria-hidden="true">/</span>
    <a href={teachingHubHref('cs')}>计算机</a>
    <span class="teaching-crumb__sep" aria-hidden="true">/</span>
    <a href={teachingHubHrefForIsland(island.category)}>{getCategoryLabel(island.category)}</a>
  {:else}
    <span class="teaching-crumb__sep" aria-hidden="true">/</span>
    <a href={teachingHubHref('math')}>数学</a>
  {/if}
  <span class="teaching-crumb__sep" aria-hidden="true">/</span>
  <span class="teaching-crumb__current" aria-current="page">{island.title}</span>
</nav>

<style>
  .teaching-crumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    color: rgb(160 175 205 / 0.78);
  }

  .teaching-crumb a {
    color: rgb(200 210 230 / 0.88);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .teaching-crumb a:hover {
    color: #fff;
  }

  .teaching-crumb__sep {
    opacity: 0.45;
    user-select: none;
  }

  .teaching-crumb__current {
    color: rgb(230 236 250 / 0.95);
    font-weight: 500;
  }
</style>
