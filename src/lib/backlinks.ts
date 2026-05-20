import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

// 从笔记 body 抽出所有 [[wiki link]] 目标
function extractWikiLinks(body: string): string[] {
  const re = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
  const links: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    links.push(m[1].trim().replace(/ /g, '-').toLowerCase());
  }
  return links;
}

// 把笔记的 id（含子路径）规范化为 slug：只取文件名（不含 .md），小写，空格转 -
export function noteIdToSlug(id: string): string {
  return id
    .replace(/\.md$/, '')
    .split('/')
    .pop()!
    .replace(/ /g, '-')
    .toLowerCase();
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
