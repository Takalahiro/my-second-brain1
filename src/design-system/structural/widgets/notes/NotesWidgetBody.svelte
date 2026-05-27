<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { NotesBodyProps } from './notes-types';

  let { ui, notes, index, contentText, onPick, onPrev, onNext }: NotesBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-notes skin-notes--{skin}">
  <div class="skin-notes__layout">
    <nav class="skin-notes__sidebar" aria-label={ui.notes}>
      {#each notes.slice(0, 12) as n, i (n.slug)}
        <button type="button" class="skin-notes__tab" class:is-active={i === index} onclick={() => onPick(i)}>
          {n.title.slice(0, 10)}
        </button>
      {/each}
    </nav>
    <article class="skin-notes__body">{contentText}</article>
  </div>
  <div class="skin-notes__nav">
    <button type="button" class="skin-notes__btn" onclick={onPrev}>{ui.prevNote}</button>
    <button type="button" class="skin-notes__btn" onclick={onNext}>{ui.nextNote}</button>
  </div>
</div>
