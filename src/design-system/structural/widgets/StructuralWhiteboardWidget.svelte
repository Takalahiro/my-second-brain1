<script lang="ts">
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getWhiteboardBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('whiteboard'));
  const skin = resolveStructuralSkin();
  const WhiteboardBody = getWhiteboardBodyComponent(skin);

  let loaded = $state(false);
</script>

<SkinFloatingShell
  layoutKey="whiteboard-layout"
  {title}
  defaultW={640}
  defaultH={520}
  minW={400}
  minH={300}
  maxW={1200}
  maxH={900}
  {onClose}
>
  <WhiteboardBody {ui} {loaded} onLoad={() => (loaded = true)} />
</SkinFloatingShell>
