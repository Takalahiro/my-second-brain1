/** 根据上次同步时间和间隔，算出下一次自动同步时刻 */
export function getNextSyncAt(lastSyncedAt: string, intervalMinutes: number): Date {
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
  const anchor = new Date(lastSyncedAt).getTime();
  if (Number.isNaN(anchor)) return new Date(Date.now() + intervalMs);

  let next = anchor + intervalMs;
  const now = Date.now();
  while (next <= now) next += intervalMs;
  return new Date(next);
}

import { formatNextSyncLabel as formatNextSyncLabelForLocale } from './i18n/format';

/** @deprecated Use formatNextSyncLabel from i18n/format.ts with locale */
export function formatNextSyncLabel(lastSyncedAt: string, intervalMinutes: number): string {
  return formatNextSyncLabelForLocale('zh', lastSyncedAt, intervalMinutes);
}
