import manifest from '../../data/media-manifest.json';
import type { MediaManifest } from './types';

// 以后换后端就改这里，组件别直接 import json
const API_PATH = '/data/media.json';

let fetched: MediaManifest | null = null;

export function getMediaSync(): MediaManifest {
  return manifest as MediaManifest;
}

export async function loadMedia(preferApi = false): Promise<MediaManifest> {
  if (fetched) return fetched;

  if (preferApi && typeof fetch !== 'undefined') {
    try {
      const res = await fetch(API_PATH);
      if (res.ok) {
        fetched = (await res.json()) as MediaManifest;
        return fetched;
      }
    } catch {
      // 没后端就还是用 build 产物
    }
  }

  fetched = manifest as MediaManifest;
  return fetched;
}

// 现在还是同步读 json，老组件不用改
export const media = getMediaSync();
