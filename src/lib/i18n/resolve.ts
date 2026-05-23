import type { Messages } from './messages/zh';

/** Resolve dot path e.g. `notes.outline` from messages object. */
export function resolveMessageKey(messages: Messages, key: string): string {
  const parts = key.split('.');
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : key;
}
