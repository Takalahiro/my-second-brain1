<script lang="ts">
  import { onMount } from 'svelte';
  import './algorithms-nav.css';
  import PixelIcon from '../PixelIcon.svelte';
  import ThemeToggle from '../ThemeToggle.svelte';
  import TeachingBreadcrumb from './TeachingBreadcrumb.svelte';
  import type { TeachingIsland } from '../../lib/teaching/registry';
  import {
    ALGORITHMS_NAV,
    PATH_TAG_CLASS,
    type AlgoLearningPath,
    type AlgoTopic,
  } from '../../lib/teaching/algorithms-nav-data';
  import { getIslandResourceLinks, teachingHubHrefForIsland } from '../../lib/teaching/routes';
  import {
    getIslandProgress,
    hydrateTeachingProgress,
    markIslandVisited,
    saveIslandProgress,
  } from '../../lib/teaching/progress';

  interface Props {
    island: TeachingIsland;
  }

  let { island }: Props = $props();

  let query = $state('');
  let searchEl = $state<HTMLInputElement | null>(null);
  let selectedPathId = $state<string | null>(ALGORITHMS_NAV.learningPaths[0]?.id ?? null);
  let selectedTopicId = $state<string | null>(null);
  let progressPct = $state(0);

  const resourceLinks = $derived(getIslandResourceLinks(island.id));

  const q = $derived(query.trim().toLowerCase());

  const filteredPaths = $derived(
    ALGORITHMS_NAV.learningPaths.filter((p) => {
      if (!q) return true;
      const hay = [p.title, p.tag, p.description].join(' ').toLowerCase();
      return hay.includes(q);
    }),
  );

  const filteredTopics = $derived(
    ALGORITHMS_NAV.topics.filter((t) => {
      if (!q) return true;
      const hay = [t.title, t.description].join(' ').toLowerCase();
      return hay.includes(q);
    }),
  );

  const filteredRecs = $derived(
    ALGORITHMS_NAV.recommendations.filter((r) => {
      if (!q) return true;
      const hay = [r.title, r.summary, ...r.tags].join(' ').toLowerCase();
      return hay.includes(q);
    }),
  );

  onMount(() => {
    void hydrateTeachingProgress().then(() => {
      const stored = getIslandProgress(island.id);
      progressPct = stored?.percent ?? ALGORITHMS_NAV.learningProgress;
      markIslandVisited(island.id, island.title, progressPct);
    });

    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchEl?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function bumpProgress(delta = 2) {
    progressPct = Math.min(100, progressPct + delta);
    saveIslandProgress(island.id, { title: island.title, percent: progressPct });
  }

  function selectPath(path: AlgoLearningPath) {
    selectedPathId = selectedPathId === path.id ? null : path.id;
    bumpProgress(1);
  }

  function selectTopic(topic: AlgoTopic) {
    if (topic.href) return;
    selectedTopicId = selectedTopicId === topic.id ? null : topic.id;
    bumpProgress(2);
  }
</script>

<div class="algo-nav" style={`--nav-accent: ${island.accent};`}>
  <header class="algo-nav__header">
    <div class="algo-nav__brand">
      <a class="algo-nav__back" href={teachingHubHrefForIsland(island.category)} title="返回知识之海">
        <PixelIcon name="orbit" size={16} />
      </a>
      <div class="algo-nav__brand-copy">
        <TeachingBreadcrumb {island} class="algo-nav__crumb" />
        <h1>{ALGORITHMS_NAV.title}</h1>
        <p>{island.tagline}</p>
      </div>
    </div>

    <label class="algo-nav__search">
      <PixelIcon name="notes" size={16} />
      <input
        bind:this={searchEl}
        type="search"
        placeholder="搜索算法、概念或主题…"
        bind:value={query}
      />
      <kbd>Ctrl K</kbd>
    </label>

    <div class="algo-nav__actions">
      <div class="algo-nav__progress" aria-label="学习进度">
        <svg viewBox="0 0 36 36" aria-hidden="true">
          <circle class="algo-nav__ring-bg" cx="18" cy="18" r="15.5" />
          <circle
            class="algo-nav__ring-fg"
            cx="18"
            cy="18"
            r="15.5"
            style={`stroke-dashoffset: ${97.4 - (97.4 * progressPct) / 100}`}
          />
        </svg>
        <span>{progressPct}%</span>
        <small>学习进度</small>
      </div>
      <ThemeToggle />
      <a class="algo-nav__avatar" href="/notes/" aria-label="笔记" title="笔记">
        <PixelIcon name="notes" size={18} />
      </a>
    </div>
  </header>

  <section class="algo-nav__stats" aria-label="概览统计">
    <article class="algo-stat">
      <strong>{ALGORITHMS_NAV.stats.topics}</strong>
      <span>算法主题</span>
      <small>核心领域</small>
    </article>
    <article class="algo-stat">
      <strong>{ALGORITHMS_NAV.stats.algorithms}</strong>
      <span>核心算法</span>
      <small>经典算法</small>
    </article>
    <article class="algo-stat">
      <strong>{ALGORITHMS_NAV.stats.paths}</strong>
      <span>学习路径</span>
      <small>系统路线</small>
    </article>
    <article class="algo-stat">
      <strong>{ALGORITHMS_NAV.stats.problems}</strong>
      <span>练习题目</span>
      <small>精选习题</small>
    </article>
    <article class="algo-stat">
      <strong>{ALGORITHMS_NAV.stats.hours}h</strong>
      <span>学习时长</span>
      <small>累计学习</small>
    </article>
  </section>

  <div class="algo-nav__main">
    <aside class="algo-panel algo-panel--paths" aria-labelledby="paths-title">
      <h2 id="paths-title">学习路径</h2>
      <ul class="algo-paths">
        {#each filteredPaths as path (path.id)}
          <li>
            <button
              type="button"
              class="algo-path"
              class:is-selected={selectedPathId === path.id}
              onclick={() => selectPath(path)}
            >
              <span
                class="algo-path__icon"
                style={`background: color-mix(in srgb, ${path.accent} 22%, #1a2030); color: ${path.accent};`}
              >
                <PixelIcon name={path.icon} size={18} />
              </span>
              <span class="algo-path__body">
                <span class="algo-path__row">
                  <strong>{path.title}</strong>
                  <span class="algo-tag {PATH_TAG_CLASS[path.tag]}">{path.tag}</span>
                </span>
                <small>{path.description}</small>
              </span>
            </button>
          </li>
        {:else}
          <li class="algo-empty">无匹配路径</li>
        {/each}
      </ul>
    </aside>

    <section class="algo-panel algo-panel--topics" aria-labelledby="topics-title">
      <h2 id="topics-title">算法主题</h2>
      <div class="algo-topics">
        {#each filteredTopics as topic (topic.id)}
          {#if topic.href}
            <a
              class="algo-topic algo-topic--link"
              href={topic.href}
              onclick={() => bumpProgress(3)}
            >
              <span
                class="algo-topic__icon"
                style={`background: color-mix(in srgb, ${topic.accent} 20%, #1a2030); color: ${topic.accent};`}
              >
                <PixelIcon name={topic.icon} size={22} />
              </span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <div class="algo-topic__foot">
                <span>{topic.algorithmCount} 个算法 · 查看笔记</span>
                <div class="algo-topic__bar" aria-hidden="true">
                  <span style={`width: ${topic.progress}%`}></span>
                </div>
              </div>
            </a>
          {:else}
            <button
              type="button"
              class="algo-topic"
              class:is-selected={selectedTopicId === topic.id}
              onclick={() => selectTopic(topic)}
            >
              <span
                class="algo-topic__icon"
                style={`background: color-mix(in srgb, ${topic.accent} 20%, #1a2030); color: ${topic.accent};`}
              >
                <PixelIcon name={topic.icon} size={22} />
              </span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
              <div class="algo-topic__foot">
                <span>{topic.algorithmCount} 个算法</span>
                <div class="algo-topic__bar" aria-hidden="true">
                  <span style={`width: ${topic.progress}%`}></span>
                </div>
              </div>
            </button>
          {/if}
        {:else}
          <p class="algo-empty">无匹配主题</p>
        {/each}
      </div>
    </section>

    <aside class="algo-panel algo-panel--roadmap" aria-labelledby="roadmap-title">
      <h2 id="roadmap-title">学习路线图</h2>
      <ol class="algo-roadmap">
        {#each ALGORITHMS_NAV.roadmap as step (step.id)}
          <li>
            <span class="algo-roadmap__num">{step.step}</span>
            <div class="algo-roadmap__body">
              <strong>{step.title}</strong>
              <p>{step.description}</p>
              <span class="algo-roadmap__time">{step.hours}</span>
            </div>
          </li>
        {/each}
      </ol>
      {#if resourceLinks.length > 0}
        <div class="algo-nav__resources">
          <h3>相关资源</h3>
          <ul>
            {#each resourceLinks as link (link.href)}
              <li><a href={link.href}>{link.label}</a></li>
            {/each}
          </ul>
        </div>
      {/if}
    </aside>
  </div>

  <section class="algo-panel algo-panel--recs" aria-labelledby="recs-title">
    <h2 id="recs-title">推荐学习内容</h2>
    <div class="algo-recs">
      {#each filteredRecs as rec (rec.id)}
        {#if rec.href}
          <a class="algo-rec" href={rec.href}>
            <span class="algo-rec__icon"><PixelIcon name="book" size={18} /></span>
            <div class="algo-rec__body">
              <strong>{rec.title}</strong>
              <div class="algo-rec__tags">
                {#each rec.tags as tag (tag)}
                  <span>{tag}</span>
                {/each}
              </div>
              <p>{rec.summary}</p>
              <span class="algo-rec__meta">阅读时间 {rec.readMinutes} 分钟</span>
            </div>
          </a>
        {:else}
          <article class="algo-rec">
            <span class="algo-rec__icon"><PixelIcon name="book" size={18} /></span>
            <div class="algo-rec__body">
              <strong>{rec.title}</strong>
              <div class="algo-rec__tags">
                {#each rec.tags as tag (tag)}
                  <span>{tag}</span>
                {/each}
              </div>
              <p>{rec.summary}</p>
              <span class="algo-rec__meta">阅读时间 {rec.readMinutes} 分钟</span>
            </div>
          </article>
        {/if}
      {:else}
        <p class="algo-empty">无匹配推荐</p>
      {/each}
    </div>
  </section>
</div>
