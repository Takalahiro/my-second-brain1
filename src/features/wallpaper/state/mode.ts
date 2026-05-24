// 背景三选一：视频 / 海报 / 点云
export type WallpaperMode = 'video' | 'poster' | 'ply';

export function modeFromBg(bg: { useVideo: boolean; usePly: boolean }): WallpaperMode {
  if (bg.usePly) return 'ply';
  if (bg.useVideo) return 'video';
  return 'poster';
}

export function patchFromMode(mode: WallpaperMode): { useVideo: boolean; usePly: boolean } {
  switch (mode) {
    case 'ply':
      return { usePly: true, useVideo: false };
    case 'video':
      return { usePly: false, useVideo: true };
    case 'poster':
      return { usePly: false, useVideo: false };
  }
}
