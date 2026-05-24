export function isMobileUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

/** 壁纸层：UA 手机/平板，或窄屏（与 BackgroundLayer 一致） */
export function isMobileWallpaperDevice(): boolean {
  if (typeof window === 'undefined') return false;
  if (isMobileUa()) return true;
  return window.matchMedia('(max-width: 768px)').matches;
}
