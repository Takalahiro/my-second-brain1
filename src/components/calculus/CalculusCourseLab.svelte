<script lang="ts">
  import { onMount } from 'svelte';
  import CalcStepPlayer from './CalcStepPlayer.svelte';
  import { ALL_PARTS, buildCurriculumSteps } from '../../lib/calculus/curriculum';
  import type { CalcStepSequence } from '../../lib/calculus/types';

  let partId = $state(ALL_PARTS[0]?.id ?? 'functions');
  let topicId = $state(ALL_PARTS[0]?.topics[0]?.id ?? 'domain');
  let sequence = $state<CalcStepSequence | null>(null);
  let playerStep = $state(0);
  let search = $state('');

  const currentPart = $derived(ALL_PARTS.find((p) => p.id === partId) ?? ALL_PARTS[0]);
  const currentTopic = $derived(currentPart?.topics.find((t) => t.id === topicId) ?? currentPart?.topics[0]);

  const filteredParts = $derived.by(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_PARTS;
    return ALL_PARTS.map((p) => ({
      ...p,
      topics: p.topics.filter(
        (t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      ),
    })).filter((p) => p.topics.length > 0 || p.title.toLowerCase().includes(q));
  });

  function runLesson() {
    if (!currentTopic) return;
    sequence = buildCurriculumSteps(currentTopic.id);
    playerStep = 0;
  }

  function selectTopic(pid: string, tid: string) {
    partId = pid;
    topicId = tid;
    runLesson();
  }

  onMount(() => {
    runLesson();
  });
</script>

<div class="course-lab">
  <aside class="cl-nav">
    <div class="cl-nav-head">
      <input type="search" class="cl-search" placeholder="搜索知识点…" bind:value={search} />
    </div>
    <div class="cl-parts">
      {#each filteredParts as part (part.id)}
        <details class="cl-part" open={part.id === partId}>
          <summary>{part.title}</summary>
          <ul>
            {#each part.topics as topic (topic.id)}
              <li>
                <button
                  type="button"
                  class:active={partId === part.id && topicId === topic.id}
                  onclick={() => selectTopic(part.id, topic.id)}
                >
                  {topic.title}
                </button>
              </li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>
  </aside>

  <section class="cl-player-area">
    {#if currentTopic}
      <header class="cl-topic-head">
        <h2>{currentTopic.title}</h2>
        <p>{currentPart?.title}</p>
      </header>
    {/if}
    <div class="cl-player-wrap">
      <CalcStepPlayer {sequence} bind:playerStep />
    </div>
  </section>
</div>

<style>
  .course-lab {
    display: grid;
    grid-template-columns: minmax(220px, 280px) 1fr;
    gap: 14px;
    flex: 1;
    min-height: calc(100vh - 160px);
  }
  .cl-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: auto;
    max-height: calc(100vh - 160px);
    padding: 10px;
    border-radius: 14px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
  }
  .cl-nav-head {
    flex-shrink: 0;
  }
  .cl-search {
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: inherit;
    font-size: 0.78rem;
  }
  .cl-parts {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cl-part {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--bg-primary);
    padding: 0 6px 6px;
  }
  .cl-part summary {
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 8px 4px;
  }
  .cl-part ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .cl-part button {
    width: 100%;
    text-align: left;
    padding: 6px 8px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.7rem;
    line-height: 1.35;
  }
  .cl-part button.active {
    border-color: rgb(126 200 255 / 0.45);
    background: rgb(126 200 255 / 0.12);
  }
  .cl-player-area {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgb(126 200 255 / 0.2);
    background: rgb(126 200 255 / 0.04);
  }
  .cl-topic-head {
    flex-shrink: 0;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);
  }
  .cl-topic-head h2 {
    margin: 0 0 4px;
    font-size: 1.05rem;
    line-height: 1.35;
  }
  .cl-topic-head p {
    margin: 0;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .cl-player-wrap {
    flex: 1;
    min-height: min(520px, calc(100vh - 280px));
    overflow: auto;
    padding: 4px 2px;
  }
  .cl-player-wrap :global(.csp) {
    min-height: 100%;
  }
  .cl-player-wrap :global(.csp-body) {
    font-size: 0.92rem;
  }
  .cl-player-wrap :global(.csp-body h4) {
    font-size: 1.05rem;
  }
  .cl-player-wrap :global(.csp-body p) {
    font-size: 0.88rem;
    line-height: 1.65;
  }
  @media (max-width: 900px) {
    .course-lab {
      grid-template-columns: 1fr;
      min-height: auto;
    }
    .cl-nav {
      max-height: 240px;
    }
    .cl-player-wrap {
      min-height: 420px;
    }
  }
</style>
