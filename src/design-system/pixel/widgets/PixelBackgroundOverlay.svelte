<script lang="ts">
  import { media } from '../../../lib/media';
  import { getPixelUi } from '../pixel-i18n';

  interface Props {
    sceneId: string;
    onSceneChange?: (id: string) => void;
    scenes?: Array<{ id: string; label: string; poster?: string | null }>;
  }

  let { sceneId, onSceneChange, scenes = media.scenes.map((s) => ({ id: s.id, label: s.label, poster: s.poster })) }: Props =
    $props();

  let cursor = $state(0);

  $effect(() => {
    const idx = scenes.findIndex((s) => s.id === sceneId);
    if (idx >= 0) cursor = idx;
  });

  function pick(i: number) {
    cursor = i;
    onSceneChange?.(scenes[i]?.id ?? sceneId);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') pick(Math.max(0, cursor - 1));
    if (e.key === 'ArrowRight') pick(Math.min(scenes.length - 1, cursor + 1));
  }
</script>

<svelte:window onkeydown={onKey} />

<nav class="pixel-bg-world-strip" aria-label={getPixelUi().selectBackground}>
  {#each scenes.slice(0, 6) as s, i (s.id)}
    <button
      type="button"
      class="pixel-world-tile"
      data-active={s.id === sceneId}
      onclick={() => pick(i)}
    >
      <span>{getPixelUi().scene} {i + 1}</span>
      {#if s.poster}
        <img src={s.poster} alt="" loading="lazy" />
      {/if}
      <span>{s.label}</span>
    </button>
  {/each}
</nav>
