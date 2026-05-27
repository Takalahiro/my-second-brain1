<script lang="ts">
  import { onMount } from 'svelte';
  import { getStructuralUi } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getClockBodyComponent } from '../resolveWidgetBody';

  interface Props {
    onClose?: () => void;
    pinned?: boolean;
  }

  let { onClose, pinned = true }: Props = $props();
  const ui = $derived(getStructuralUi());
  const skin = resolveStructuralSkin();
  const ClockBody = getClockBodyComponent(skin);

  let now = $state(new Date());

  onMount(() => {
    const id = window.setInterval(() => {
      now = new Date();
    }, 1000);
    return () => window.clearInterval(id);
  });

  const timeStr = $derived(
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
  );
</script>

<ClockBody {ui} {timeStr} {pinned} {onClose} />
