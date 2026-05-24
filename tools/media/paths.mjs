import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(HERE, '../..');
export const PUBLIC = resolve(ROOT, 'public');

export function publicUrl(rel) {
  return '/' + rel.split('/').map(encodeURIComponent).join('/');
}
