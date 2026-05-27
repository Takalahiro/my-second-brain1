<script lang="ts">
  import { resolveStructuralSkin } from '../skin-context';
  import { getStructuralShellComponent, type StructuralShellProps } from '../resolveStructuralShell';

  let props: StructuralShellProps = $props();
  const skin = resolveStructuralSkin();
  const Shell = getStructuralShellComponent(skin);
</script>

<Shell {...props} />
