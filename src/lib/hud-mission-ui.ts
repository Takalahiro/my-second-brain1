/** NASA-punk 任务 HUD · 计时 / 信号 / 打字机 */

export function formatMissionElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `T+ ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function jitterSignalBars(count = 5): boolean[] {
  const base = 0.55 + Math.random() * 0.35;
  return Array.from({ length: count }, (_, i) => Math.random() < base - i * 0.08);
}

export function signalBarsText(bars: boolean[]): string {
  const glyphs = bars.map((on) => (on ? '▮' : '▯')).join('');
  const pct = Math.round((bars.filter(Boolean).length / bars.length) * 100);
  return `${glyphs} SIG ${pct}%`;
}

export function buildMissionStatusLine(
  elapsed: string,
  signal: string,
  ra: string,
  dec: string,
): string {
  return `[ ${elapsed} / ${signal} / RA ${ra} · DEC ${dec} ]`;
}
