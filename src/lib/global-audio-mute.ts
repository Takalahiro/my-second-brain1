// 壁纸层一键静音——音乐播放器、白噪音等站点音频一起管
export const GLOBAL_MUTE_KEY = 'second-brain:global-muted';

export function readGlobalMuted(): boolean {
  try {
    return localStorage.getItem(GLOBAL_MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeGlobalMuted(muted: boolean) {
  try {
    localStorage.setItem(GLOBAL_MUTE_KEY, muted ? '1' : '0');
  } catch {}
}
