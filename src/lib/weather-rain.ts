/** WMO weather codes that imply rain, drizzle, showers, or thunderstorms. */
export function weatherImpliesRain(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code === 95 ||
    code === 96 ||
    code === 99
  );
}

export function readCachedWeatherCode(): number | null {
  try {
    const raw = localStorage.getItem('second-brain:weather-state');
    if (!raw) return null;
    const s = JSON.parse(raw) as { forecast?: { current?: { weatherCode?: number } } };
    const code = s.forecast?.current?.weatherCode;
    return typeof code === 'number' ? code : null;
  } catch {
    return null;
  }
}

export function computeLinkedRainDrops(
  weatherCode: number | null,
  rainVideo: boolean,
  sceneHasRain: boolean,
): boolean {
  if (rainVideo && sceneHasRain) return true;
  if (weatherCode === null) return false;
  return weatherImpliesRain(weatherCode);
}
