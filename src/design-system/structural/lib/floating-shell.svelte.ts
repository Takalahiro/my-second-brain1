import { onMount } from 'svelte';
import { clampPosition } from '../../../lib/floating-widget-layout';
import { rotationStyle } from '../../../lib/widget-rotation';
import { clampSkinAlpha, loadSkinLayout, saveSkinLayout } from './skin-floating-layout';
import {
  bringSkinToFront,
  getSkinZIndex,
  registerSkinWidget,
  subscribeSkinStack,
  unregisterSkinWidget,
} from './skin-widget-stack';
import { layoutKeyForSkin, resolveStructuralSkin } from '../skin-context';
import type { StructuralSkinId } from '../registry';

export type FloatingShellOptions = {
  layoutKey: string;
  defaultW?: number;
  defaultH?: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  defaultAlpha?: number;
};

export function useFloatingShell(opts: () => FloatingShellOptions) {
  const skin = resolveStructuralSkin();
  const storageKey = $derived(layoutKeyForSkin(skin, opts().layoutKey));

  let posX = $state(0);
  let posY = $state(0);
  let width = $state(opts().defaultW ?? 360);
  let height = $state(opts().defaultH ?? 420);
  let rotation = $state(0);
  let bgAlpha = $state(opts().defaultAlpha ?? 0.88);
  let zIndex = $state(90);
  let dragging = $state(false);
  let showSettings = $state(false);
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };
  let rootEl = $state<HTMLDivElement | null>(null);
  let isResizing = false;
  let isRotating = false;

  const minW = $derived(opts().minW ?? 240);
  const minH = $derived(opts().minH ?? 180);
  const maxW = $derived(opts().maxW ?? 1100);
  const maxH = $derived(opts().maxH ?? 900);
  const frameTransform = $derived(rotationStyle(rotation));

  function syncZ() {
    zIndex = getSkinZIndex(skin, storageKey);
  }

  function clampPos() {
    const p = clampPosition(posX, posY, width, height);
    posX = p.x;
    posY = p.y;
  }

  function persist() {
    saveSkinLayout(storageKey, { x: posX, y: posY, w: width, h: height, r: rotation, a: bgAlpha });
  }

  function onAlphaInput(e: Event) {
    bgAlpha = clampSkinAlpha(Number((e.currentTarget as HTMLInputElement).value));
    persist();
  }

  function onHeaderDown(e: PointerEvent) {
    const t = e.target as HTMLElement;
    if (
      t.closest(
        '[data-no-drag], button, input, select, textarea, label, a, .ctl-switch, .ctl-slider, .structural-frame__settings, .bp-revision, .folio-margin, .crt-setup, .term-config, .obs-panel, .rpg-config',
      )
    ) {
      return;
    }
    bringSkinToFront(skin, storageKey);
    syncZ();
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY, px: posX, py: posY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHeaderMove(e: PointerEvent) {
    if (!dragging) return;
    posX = dragStart.px + (e.clientX - dragStart.x);
    posY = dragStart.py + (e.clientY - dragStart.y);
    clampPos();
  }

  function onHeaderUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    persist();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onResize(next: { x: number; y: number; w: number; h: number }) {
    if (!isResizing) {
      isResizing = true;
      bringSkinToFront(skin, storageKey);
      syncZ();
    }
    posX = next.x;
    posY = next.y;
    width = next.w;
    height = next.h;
    clampPos();
  }

  function onResizeEnd() {
    isResizing = false;
    persist();
  }

  function widgetCenter() {
    if (!rootEl) return { x: 0, y: 0 };
    const r = rootEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function onRotate(deg: number) {
    if (!isRotating) {
      isRotating = true;
      bringSkinToFront(skin, storageKey);
      syncZ();
    }
    rotation = deg;
  }

  function onRotateEnd() {
    isRotating = false;
    persist();
  }

  const touchOpts = $derived({
    disabled: () => false,
    minWidth: minW,
    minHeight: minH,
    maxWidth: maxW,
    maxHeight: maxH,
    getLayout: () => ({ x: posX, y: posY, w: width, h: height, r: rotation }),
    setLayout: (p: Partial<{ x: number; y: number; w: number; h: number; r: number }>) => {
      if (p.x !== undefined) posX = p.x;
      if (p.y !== undefined) posY = p.y;
      if (p.w !== undefined) width = p.w;
      if (p.h !== undefined) height = p.h;
      if (p.r !== undefined) rotation = p.r;
      clampPos();
    },
    onEnd: persist,
  });

  onMount(() => {
    const o = opts();
    registerSkinWidget(skin, storageKey);
    const l = loadSkinLayout(
      storageKey,
      o.defaultW ?? 360,
      o.defaultH ?? 420,
      o.minW ?? 240,
      o.minH ?? 180,
      o.maxW ?? 1100,
      o.maxH ?? 900,
      o.defaultAlpha ?? 0.88,
    );
    posX = l.x;
    posY = l.y;
    width = l.w;
    height = l.h;
    rotation = l.r ?? 0;
    bgAlpha = l.a ?? (o.defaultAlpha ?? 0.88);
    syncZ();

    const offStack = subscribeSkinStack(skin, syncZ);
    const onWinResize = () => clampPos();
    window.addEventListener('resize', onWinResize);

    return () => {
      offStack();
      window.removeEventListener('resize', onWinResize);
      unregisterSkinWidget(skin, storageKey);
    };
  });

  return {
    get skin() {
      return skin as StructuralSkinId;
    },
    get storageKey() {
      return storageKey;
    },
    get posX() {
      return posX;
    },
    get posY() {
      return posY;
    },
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    get rotation() {
      return rotation;
    },
    get bgAlpha() {
      return bgAlpha;
    },
    get zIndex() {
      return zIndex;
    },
    get dragging() {
      return dragging;
    },
    get showSettings() {
      return showSettings;
    },
    set showSettings(v: boolean) {
      showSettings = v;
    },
    get rootEl() {
      return rootEl;
    },
    set rootEl(v: HTMLDivElement | null) {
      rootEl = v;
    },
    get minW() {
      return minW;
    },
    get minH() {
      return minH;
    },
    get maxW() {
      return maxW;
    },
    get maxH() {
      return maxH;
    },
    get frameTransform() {
      return frameTransform;
    },
    get touchOpts() {
      return touchOpts;
    },
    onAlphaInput,
    onHeaderDown,
    onHeaderMove,
    onHeaderUp,
    onResize,
    onResizeEnd,
    widgetCenter,
    onRotate,
    onRotateEnd,
    toggleSettings: () => {
      showSettings = !showSettings;
    },
  };
}
