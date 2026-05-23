/** 移动端 UA 检测 — 点云壁纸退化为静态 poster */
export function isMobileUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}
