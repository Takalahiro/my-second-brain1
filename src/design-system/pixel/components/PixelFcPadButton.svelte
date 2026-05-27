<script lang="ts">
  interface Props {
    face?: 'a' | 'b' | 'start' | 'select';
    label?: string;
    disabled?: boolean;
    active?: boolean;
    onclick?: () => void;
  }
  let { face = 'a', label = '', disabled = false, active = false, onclick }: Props = $props();

  const isRound = $derived(face === 'a' || face === 'b');
  const ariaLabel = $derived(label || (face === 'a' ? 'A 键' : face === 'b' ? 'B 键' : face === 'start' ? 'Start' : 'Select'));
</script>

<button
  type="button"
  class="pixel-fc-pad-btn"
  class:pixel-fc-pad-btn--round={isRound}
  class:pixel-fc-pad-btn--pill={!isRound}
  class:pixel-fc-pad-btn--with-caption={isRound && !!label}
  data-face={face}
  data-active={active}
  aria-label={ariaLabel}
  {disabled}
  {onclick}
>
  {#if isRound}
    <span class="pixel-fc-pad-btn__glyph">{face.toUpperCase()}</span>
    {#if label}
      <span class="pixel-fc-pad-btn__caption">{label}</span>
    {/if}
  {:else}
    <span class="pixel-fc-pad-btn__pill-text">{label}</span>
  {/if}
</button>
