/** Mobile / memory-constrained device heuristics for FormulaNet + Pyodide */

export type FormulaDeviceProfile = {
  /** iOS Safari or other low-memory mobile browsers */
  constrained: boolean;
  highAccuracyDefault: boolean;
  autoSolveDefault: boolean;
  preloadModel: boolean;
  /** PNG export multiplier (1 avoids 768×768 offscreen on mobile) */
  exportScale: number;
  /** Skip WebGPU attempt (iOS Safari often fails and wastes memory) */
  preferWasm: boolean;
  /** Lower beam width / token cap during generation */
  liteGeneration: boolean;
  /** Terminate OCR worker when formula tab hidden */
  disposeOnInactive: boolean;
  /** Recycle OCR worker every N recognitions (0 = keep loaded) */
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

/** iOS Safari has strict per-tab memory limits (~1–1.5 GB) */
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
