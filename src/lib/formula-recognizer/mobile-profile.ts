// 移动端 / 低内存设备的启发式配置，FormulaNet + Pyodide 用

export type FormulaDeviceProfile = {
  // iOS Safari 或其他低内存移动浏览器
  constrained: boolean;
  highAccuracyDefault: boolean;
  autoSolveDefault: boolean;
  preloadModel: boolean;
  // PNG 导出倍率（1 避免移动端开 768×768 offscreen）
  exportScale: number;
  // 跳过 WebGPU 尝试（iOS Safari 经常失败还白占内存）
  preferWasm: boolean;
  // 生成时压低 beam 宽度和 token 上限
  liteGeneration: boolean;
  // 公式 tab 藏了就把 OCR worker 干掉
  disposeOnInactive: boolean;
  // 每 N 次识别回收一次 worker（0 = 一直挂着）
  recycleWorkerEvery: number;
};

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

// iOS Safari 单 tab 内存很紧，大概 1–1.5 GB
export function isMemoryConstrainedDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isIOS()) return true;
  const ua = navigator.userAgent;
  return /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) || isMobileViewport();
}

let cached: FormulaDeviceProfile | null = null;

export function getFormulaDeviceProfile(): FormulaDeviceProfile {
  if (cached) return cached;
  const constrained = isMemoryConstrainedDevice();
  cached = {
    constrained,
    highAccuracyDefault: !constrained,
    autoSolveDefault: !constrained,
    preloadModel: !constrained,
    exportScale: constrained ? 1 : 2,
    preferWasm: isIOS() || constrained,
    liteGeneration: constrained,
    disposeOnInactive: constrained,
    recycleWorkerEvery: constrained ? 2 : 0,
  };
  return cached;
}
