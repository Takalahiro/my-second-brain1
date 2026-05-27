<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { StructuralSkinId } from './registry';
  import { setStructuralSkinContext } from './skin-context';

  interface Props {
    skin: StructuralSkinId;
    children?: Snippet;
  }

  let { skin, children }: Props = $props();
  setStructuralSkinContext(skin);
</script>

{@render children?.()}
