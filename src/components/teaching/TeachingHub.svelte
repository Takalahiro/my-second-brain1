<script lang="ts">
  import './teaching-sea.css';
  import PixelIcon from '../PixelIcon.svelte';
  import TeachingIslandScene from './TeachingIslandScene.svelte';
  import {
    TEACHING_CATEGORY_FILTERS,
    filterIslands,
    type TeachingCategory,
    type TeachingIsland,
    type TeachingIslandId,
  } from '../../lib/teaching/registry';

  let query = $state('');
  let category = $state<'all' | TeachingCategory>('all');
  let activeId = $state<TeachingIslandId | null>(null);

  const islands = $derived(filterIslands(query, category));

  const csLinks = $derived.by(() => {
    const cs = islands.filter((i) => i.category === 'cs');
    if (cs.length < 2) return [];
    const hub = cs.find((i) => i.id === 'cs-network') ?? cs[Math.floor(cs.length / 2)];
    return cs
      .filter((i) => i.id !== hub.id)
      .map((i) => ({ from: hub, to: i }));
  });

  function courseLabel(n: TeachingIsland['courseCount']) {
    return n === '∞' ? '∞ 门课程' : `${n} 门课程`;
  }

  function selectIsland(id: TeachingIslandId) {
    activeId = activeId === id ? null : id;
  }

  function cardAnchorClass(island: TeachingIsland) {
    return `sea-island__card--${island.cardAnchor ?? 'bl'}`;
  }

  function linkPath(from: TeachingIsland, to: TeachingIsland) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 - 4;
    return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  }
</script>

<div class="knowledge-sea">
  <header class="knowledge-sea__header">
    <div class="knowledge-sea__brand">
      <h1>教学</h1>
      <p>数学与计算机科学 · 每座岛屿对应一门方向</p>
    </div>

    <nav class="knowledge-sea__nav" aria-label="学科筛选">
      {#each TEACHING_CATEGORY_FILTERS as f (f.id)}
        <button
          type="button"
          class="knowledge-sea__nav-btn"
          aria-pressed={category === f.id}
          onclick={() => (category = f.id)}
        >
          <PixelIcon name={f.icon} size={14} />
          <span>{f.label}</span>
        </button>
      {/each}
    </nav>

    <label class="knowledge-sea__search">
      <PixelIcon name="notes" size={16} />
      <input type="search" placeholder="搜索课程、知识点…" bind:value={query} />
    </label>
  </header>

  <main class="knowledge-sea__stage">
    <div class="knowledge-sea__title">
      <h2><span class="deco">✦</span> 知识之海 <span class="deco">✦</span></h2>
      <p>选择一座岛屿，开始探索你的学习之旅</p>
    </div>

    <section class="knowledge-sea__canvas" aria-label="知识之海">
      <div class="sea-bg sea-bg--stars" aria-hidden="true"></div>
      <div class="sea-bg sea-bg--horizon" aria-hidden="true"></div>
      <div class="sea-bg sea-bg--waves" aria-hidden="true"></div>
      <div class="sea-bg sea-bg--vignette" aria-hidden="true"></div>

      {#if csLinks.length > 0 && (category === 'all' || category === 'cs')}
        <svg class="sea-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {#each csLinks as link (link.to.id)}
            <path d={linkPath(link.from, link.to)} />
          {/each}
        </svg>
      {/if}

      {#each islands as island (island.id)}
        <article
          class="sea-island"
          class:is-active={activeId === island.id}
          class:is-math={island.category === 'math'}
          class:is-cs={island.category === 'cs'}
          style={`--island-x: ${island.x}%; --island-y: ${island.y}%; --island-accent: ${island.accent}; --island-glow: ${island.glow}; --island-scale: ${island.scale ?? 1};`}
        >
          <button
            type="button"
            class="sea-island__hit"
            aria-label={island.title}
            aria-expanded={activeId === island.id}
            onclick={() => selectIsland(island.id)}
          >
            <TeachingIslandScene
              building={island.building}
              accent={island.accent}
              active={activeId === island.id}
            />
          </button>
          <div class="sea-island__halo" aria-hidden="true"></div>
          <div class="sea-island__card {cardAnchorClass(island)}">
            <div class="sea-island__icon">
              <PixelIcon name={island.icon} size={18} />
            </div>
            <h3>{island.title}</h3>
            <p>{island.tagline}</p>
            <span class="sea-island__count">{courseLabel(island.courseCount)}</span>
          </div>
        </article>
      {/each}

      {#if islands.length === 0}
        <p class="sea-empty">没有匹配的岛屿，试试换个关键词或分类。</p>
      {/if}
    </section>
  </main>

  <footer class="knowledge-sea__footer">
    <div class="sea-progress">
      <div class="sea-progress__ring" style="--pct: 75">
        <span>75%</span>
      </div>
      <div>
        <strong>学习进度</strong>
        <p>持续学习 128 天</p>
      </div>
    </div>

    <nav class="sea-dock" aria-label="快捷导航">
      <a href="/" title="首页"><PixelIcon name="puzzle" size={18} /></a>
      <a href="/graph/" title="图谱"><PixelIcon name="orbit" size={18} /></a>
      <a href="/notes/" title="笔记"><PixelIcon name="notes" size={18} /></a>
      <a href="/teaching/" title="教学" class="is-current"><PixelIcon name="matlab" size={18} /></a>
      <a href="/" title="设置"><PixelIcon name="gear" size={18} /></a>
    </nav>

    <button type="button" class="sea-expand" aria-label="全屏" title="全屏">
      <PixelIcon name="palette" size={16} />
    </button>
  </footer>
</div>
