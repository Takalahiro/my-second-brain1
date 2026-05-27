<script lang="ts">
  import MatlabCalculator from '../../../../components/MatlabCalculator.svelte';
  import { resolveStructuralSkin } from '../../skin-context';
  import type { CalculatorBodyProps } from './calculator-types';

  let { ui }: CalculatorBodyProps = $props();
  const skin = resolveStructuralSkin();
  void ui;
</script>

<div class="skin-calc skin-calc--{skin}">
  <MatlabCalculator compact />
</div>

<style>
  .skin-calc {
    height: 100%;
    min-height: 280px;
    padding: 4px;
  }
  .skin-calc :global(.matlab-calc.compact) {
    height: 100%;
    min-height: 260px;
  }
</style>
