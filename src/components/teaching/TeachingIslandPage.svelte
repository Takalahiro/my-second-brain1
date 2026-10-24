<script lang="ts">
  import './island-page.css';
  import PixelIcon from '../PixelIcon.svelte';
  import TeachingIslandScene from './TeachingIslandScene.svelte';
  import TeachingBreadcrumb from './TeachingBreadcrumb.svelte';
  import AlgorithmsNavPage from './AlgorithmsNavPage.svelte';
  import {
    type TeachingIsland,
    type TeachingIslandId,
  } from '../../lib/teaching/registry';
  import {
    getIslandPageKind,
    getIslandResourceLinks,
    teachingHubHrefForIsland,
  } from '../../lib/teaching/routes';
  import { hydrateTeachingProgress, markIslandVisited } from '../../lib/teaching/progress';

  interface Props {
    island: TeachingIsland;
  }

  let { island }: Props = $props();

  const pageKind = $derived(getIslandPageKind(island.id));
  const resourceLinks = $derived(getIslandResourceLinks(island.id));

  $effect(() => {
    void hydrateTeachingProgress().then(() => {
      markIslandVisited(island.id, island.title);
    });
  });
</script>

{#if pageKind === 'catalog-algorithms'}
  <AlgorithmsNavPage {island} />
{:else}
  <div
    class="island-page"
    style={`--island-accent: ${island.accent}; --island-glow: ${island.glow};`}
  >
    <header class="island-page__top">
      <a class="island-page__back" href={teachingHubHrefForIsland(island.category)}>
        <PixelIcon name="orbit" size={16} />
        <span>知识之海</span>
      </a>
      <TeachingBreadcrumb {island} />
    </header>

    <section class="island-page__placeholder">
      <TeachingIslandScene building={island.building} accent={island.accent} />
      <h1>{island.title}</h1>
      <p>{island.tagline}</p>
      <p class="island-page__intro island-page__intro--muted">
        该方向的学习界面正在建设中。你可以先从相关笔记开始。
      </p>
      {#if resourceLinks.length > 0}
        <ul class="island-page__resources">
          {#each resourceLinks as link (link.href)}
            <li><a href={link.href}>{link.label}</a></li>
          {/each}
        </ul>
      {/if}
      <a class="island-page__back island-page__back--cta" href={teachingHubHrefForIsland(island.category)}>
        返回地图
      </a>
    </section>
  </div>
{/if}
