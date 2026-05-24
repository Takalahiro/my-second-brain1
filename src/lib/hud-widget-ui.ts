/** NASA-punk 桌面小组件 · 共享 UI 符号与格式 */

export const HUD_SEP = '─────────────────';

export function hudBlockBar(ratio: number, width = 8): string {
  const f = Math.round(Math.max(0, Math.min(1, ratio)) * width);
  return '▓'.repeat(f) + '░'.repeat(Math.max(0, width - f));
}

export function hudSolidBar(ratio: number, width = 8): string {
  const f = Math.round(Math.max(0, Math.min(1, ratio)) * width);
  return '█'.repeat(f) + '░'.repeat(Math.max(0, width - f));
}

export function hudCountdown(startMs: number, now = Date.now()): string {
  const diff = startMs - now;
  if (diff <= 0) return 'T-0D';
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 1) {
    const hours = Math.ceil(diff / 3_600_000);
    return hours <= 1 ? 'T-1H' : `T-${hours}H`;
  }
  return `T-${days}D`;
}

export function isUrgentEvent(startMs: number, now = Date.now()): boolean {
  const diff = startMs - now;
  return diff >= 0 && diff <= 86_400_000;
}

export function channelLed(on: boolean): string {
  return on ? '◉' : '○';
}

/** 行星遥测代号（天气） */
export function planetTelemetry(code: number, isDay: 0 | 1): {
  planet: string;
  sector: string;
  atmo: string;
} {
  if (code === 0) return { planet: 'TERRA-Prime', sector: 'ALPHA', atmo: isDay ? 'CLEAR SKY' : 'NIGHT WINDOW' };
  if (code <= 3) return { planet: 'TERRA-Prime', sector: 'BETA', atmo: 'PARTIAL CLOUD' };
  if (code <= 48) return { planet: 'NIMBUS-IV', sector: 'GAMMA', atmo: 'PRECIP BAND' };
  if (code <= 67) return { planet: 'CRYO-7', sector: 'DELTA', atmo: 'SNOW FIELD' };
  if (code <= 82) return { planet: 'AERO-3', sector: 'EPSILON', atmo: 'SHEAR LAYER' };
  if (code >= 95) return { planet: 'STORM-9', sector: 'ZETA', atmo: 'THUNDER CELL' };
  return { planet: 'OBS-Station', sector: 'THETA', atmo: 'MIXED REGIME' };
}

/** 伪随机波形条（通讯/信号） */
export function signalWaveBars(seed: number, count = 16): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    out.push(0.15 + (s % 100) / 100 * 0.85);
  }
  return out;
}

export function starCoords(seed: number): { ra: string; dec: string; sector: string } {
  const s = Math.abs(seed) % 36000;
  const raH = Math.floor(s / 1500) % 24;
  const raM = Math.floor((s % 1500) / 25) % 60;
  const dec = ((s % 9000) / 100 - 45).toFixed(1);
  const sector = ['ORION', 'CYGNUS', 'LYRA', 'DRACO', 'PAVO'][s % 5];
  return {
    ra: `${String(raH).padStart(2, '0')}h ${String(raM).padStart(2, '0')}m`,
    dec: `${dec}°`,
    sector,
  };
}
