// 背景 / 音乐 / 场景 共享类型和读取入口
// media-manifest.json 是 build 时 scripts/build-media-manifest.mjs 生成的

import manifest from '../data/media-manifest.json';

export interface SceneEntry {
  id: string;
  label: string;
  poster: string | null;
  video: string | null;
  videoRain: string | null;
  hasRain: boolean;
  ply: string | null;
  hasPly: boolean;
  sog: string | null;
  hasSog: boolean;
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
