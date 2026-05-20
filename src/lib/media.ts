/**
 * Phase 3：背景 / 音乐 / 场景 共享类型与读取入口。
 *
 * media-manifest.json 在 build 期由 scripts/build-media-manifest.mjs 生成。
 */

import manifest from '../data/media-manifest.json';

export interface SceneEntry {
  id: string;
  label: string;
  poster: string | null;
  video: string | null;
  videoRain: string | null;
  hasRain: boolean;
}

export interface MobileSceneEntry {
  id: string;
  label: string;
  src: string;
}

export interface TrackEntry {
  id: string;
  src: string;
  title: string;
  artist: string;
}

export interface MediaManifest {
  generatedAt: string;
  scenes: SceneEntry[];
  mobile: MobileSceneEntry[];
  tracks: TrackEntry[];
}

export const media: MediaManifest = manifest as MediaManifest;
