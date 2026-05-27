<script lang="ts">
  import PythonIDE from '../../../../components/PythonIDE.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { PythonBodyProps } from './python-types';

  let { ui }: PythonBodyProps = $props();
  const skin = resolveStructuralSkin();
  void ui;
</script>

<div class="skin-python skin-python--{skin}">
  <PythonIDE compact />
</div>

<style>
  .skin-python {
    height: 100%;
    min-height: 260px;
    padding: 4px;
  }
  .skin-python :global(.python-ide.compact) {
    height: 100%;
    min-height: 240px;
  }
</style>
