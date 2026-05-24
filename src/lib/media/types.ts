// media-manifest 的结构，build 脚本和前端共用这份类型

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
  compressedPly: string | null;
  hasCompressedPly: boolean;
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
