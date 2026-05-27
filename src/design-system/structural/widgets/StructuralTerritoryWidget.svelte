<script lang="ts">
  import { onMount } from 'svelte';
  import SkinFloatingShell from '../components/SkinFloatingShell.svelte';
  import { getStructuralUi, structuralWidgetTitle } from '../structural-i18n';
  import { resolveStructuralSkin } from '../skin-context';
  import { getTerritoryBodyComponent } from '../resolveWidgetBody';
  import { loadWiki, watchWikiRefresh, type WikiData } from '../../../components/graph/graph-data';
  import { starCoords } from '../../../lib/hud-widget-ui';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
  const ui = $derived(getStructuralUi());
  const title = $derived(structuralWidgetTitle('territory'));
  const skin = resolveStructuralSkin();
  const TerritoryBody = getTerritoryBodyComponent(skin);

  let data = $state<WikiData | null>(null);
  let loadErr = $state<string | null>(null);
  let selectedPath = $state<string | null>(null);

  const starHud = $derived(
    starCoords((selectedPath ?? 'vault').split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
  );

  onMount(() => {
    void load();
    const stopWatch = watchWikiRefresh((d) => {
      data = d;
    });
    return stopWatch;
  });

  async function load() {
    try {
      data = await loadWiki();
    } catch {
      loadErr = '尚未生成 wikilinks.json，请运行 pnpm prepare:vault';
    }
  }
</script>

<SkinFloatingShell
  layoutKey="territory-layout"
  {title}
  defaultW={720}
  defaultH={520}
  minW={380}
  minH={320}
  maxW={1400}
  maxH={1100}
  {onClose}
>
  <TerritoryBody {ui} {data} {loadErr} {selectedPath} {starHud} onSelectPath={(p) => (selectedPath = p)} />
</SkinFloatingShell>
