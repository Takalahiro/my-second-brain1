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

/** 笔记页小字：下次同步时间（本地时区） */
export function formatNextSyncLabel(lastSyncedAt: string, intervalMinutes: number): string {
  const next = getNextSyncAt(lastSyncedAt, intervalMinutes);
  const text = next.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `下次同步：${text}`;
}
