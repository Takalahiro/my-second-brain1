import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify, noteIdToSlug } from './slugify';

export { noteIdToSlug };

export type Note = CollectionEntry<'notes'>;

// 从笔记 body 抽出所有 [[wiki link]] 目标
function extractWikiLinks(body: string): string[] {
  const re = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
  const links: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    links.push(slugify(m[1].trim()));
  }
  return links;
}

// 取得某篇笔记的所有反向链接
export async function getBacklinks(currentSlug: string): Promise<Note[]> {
  const all = await getCollection('notes', ({ data }) => !data.draft);
  const backlinks: Note[] = [];
  for (const note of all) {
    if (noteIdToSlug(note.id) === currentSlug) continue;
    const body = (note as unknown as { body?: string }).body ?? '';
    const targets = extractWikiLinks(body);
    if (targets.includes(currentSlug)) {
      backlinks.push(note);
    }
  }
  return backlinks;
}
