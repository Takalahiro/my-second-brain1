/** WMO 天气代码 → 中文描述 */
export function wmoWeatherLabel(code: number): string {
  if (code === 0) return '晴';
  if (code === 1 || code === 2) return '少云';
  if (code === 3) return '多云';
  if (code >= 45 && code <= 48) return '雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code >= 61 && code <= 67) return '雨';
  if (code >= 71 && code <= 77) return '雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code === 85 || code === 86) return '阵雪';
  if (code === 95) return '雷阵雨';
  if (code === 96 || code === 99) return '雷暴冰雹';
  return '未知';
}

export function formatWeatherAge(fetchedAt: number): string {
  const diff = Date.now() - fetchedAt;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  return `${Math.floor(diff / 3600_000)} 小时前`;
}
