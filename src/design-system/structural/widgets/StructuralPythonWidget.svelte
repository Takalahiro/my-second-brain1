<script lang="ts">
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getPythonBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('python'));
  const skin = resolveStructuralSkin();
  const PythonBody = getPythonBodyComponent(skin);
</script>

<SkinFloatingShell
  layoutKey="python-layout"
  {title}
  defaultW={520}
  defaultH={560}
  minW={360}
  minH={320}
  maxW={960}
  maxH={900}
  {onClose}
>
  <PythonBody {ui} />
</SkinFloatingShell>
