<script lang="ts">
  import { resolveStructuralSkin } from '../../skin-context';
  import type { WhiteboardBodyProps } from './whiteboard-types';

  let { ui, loaded, onLoad }: WhiteboardBodyProps = $props();
  const skin = resolveStructuralSkin();
</script>

<div class="skin-whiteboard skin-whiteboard--{skin}">
  {#if !loaded}
    <p class="skin-whiteboard__loading">{ui.loading}</p>
  {/if}
  <iframe
    class="skin-whiteboard__frame"
    src="https://excalidraw.com"
    title="Excalidraw 白板"
    allow="clipboard-read; clipboard-write"
    onload={onLoad}
  ></iframe>
</div>
