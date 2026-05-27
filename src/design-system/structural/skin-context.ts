import { getContext } from 'svelte';
import type { StructuralSkinId } from './registry';
import { isStructuralSkinId } from './registry';

const SKIN_CTX = Symbol('structural-skin');

export function setStructuralSkinContext(skin: StructuralSkinId) {
  setContext(SKIN_CTX, skin);
}

export function getStructuralSkinContext(): StructuralSkinId {
  return resolveStructuralSkin();
}

/** 优先 context，否则读 html[data-ui]（与 applyUiSkin 同步） */
export function resolveStructuralSkin(): StructuralSkinId {
  const ctx = getContext<StructuralSkinId | undefined>(SKIN_CTX);
  if (ctx) return ctx;
  if (typeof document !== 'undefined') {
    const id = document.documentElement.getAttribute('data-ui') ?? '';
    if (isStructuralSkinId(id)) return id;
  }
  throw new Error('Structural skin not active');
}

export function layoutKeyForSkin(skin: StructuralSkinId, key: string): string {
  return `second-brain:${skin}:${key}`;
}
