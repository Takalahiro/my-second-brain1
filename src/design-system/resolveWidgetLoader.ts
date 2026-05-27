import type { UiSkinId } from '../features/ui/types';
import { widgetLoaders } from '../components/widgets/widgetLoaders';
import { pixelWidgetLoaders, isPixelWidgetKey } from './pixel/pixelLoaders';
import { structuralWidgetLoaders, isStructuralWidgetKey } from './structural/structuralLoaders';
import { isStructuralSkinId } from './structural/registry';

type Loader = () => Promise<{ default: import('svelte').Component }>;

export function resolveWidgetLoader(skinId: UiSkinId, key: string): Loader {
  if (skinId === 'pixel' && isPixelWidgetKey(key)) {
    return pixelWidgetLoaders[key];
  }
  if (isStructuralSkinId(skinId) && isStructuralWidgetKey(key)) {
    return structuralWidgetLoaders[key];
  }
  const loaders = widgetLoaders as Record<string, Loader>;
  return loaders[key];
}

export { pixelWidgetLoaders, structuralWidgetLoaders };
