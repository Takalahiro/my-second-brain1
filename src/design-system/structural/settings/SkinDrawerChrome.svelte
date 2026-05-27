<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import { getDrawerChromeComponent } from '../resolveDrawerChrome';
  import type { DrawerChromeProps } from '../resolveDrawerChrome';

  let props: DrawerChromeProps = $props();
  const skin = resolveStructuralSkin();
  const Chrome = getDrawerChromeComponent(skin);
</script>

<Chrome {...props} />
