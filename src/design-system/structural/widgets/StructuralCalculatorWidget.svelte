<script lang="ts">
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getCalculatorBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('calculator'));
  const skin = resolveStructuralSkin();
  const CalculatorBody = getCalculatorBodyComponent(skin);
</script>

<SkinFloatingShell
  layoutKey="calc-layout"
  {title}
  defaultW={420}
  defaultH={520}
  minW={320}
  minH={360}
  maxW={900}
  maxH={900}
  {onClose}
>
  <CalculatorBody {ui} />
</SkinFloatingShell>
