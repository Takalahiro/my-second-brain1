import type { Locale } from './types';
import { getNextSyncAt } from '../vault-sync';

export function localeTag(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'zh-CN';
}

export function formatNextSyncLabel(
  locale: Locale,
  lastSyncedAt: string,
  intervalMinutes: number,
): string {
  const next = getNextSyncAt(lastSyncedAt, intervalMinutes);
  const text = next.toLocaleString(localeTag(locale), {
    month: locale === 'en' ? 'short' : 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return locale === 'en' ? `Next sync: ${text}` : `下次同步：${text}`;
}

export function formatNoteCount(locale: Locale, count: number): string {
  return locale === 'en' ? `${count} notes` : `${count} 篇`;
}

export function formatTotalNotes(locale: Locale, count: number): string {
  return locale === 'en' ? `${count} notes total` : `共 ${count} 篇`;
}

export function formatLastUpdatedLine(locale: Locale, formatted: string): string {
  return locale === 'en' ? `Last updated · ${formatted}` : `最后更新 · ${formatted}`;
}

export function formatLocaleDate(locale: Locale, date: Date): string {
  return date.toLocaleDateString(localeTag(locale));
}
