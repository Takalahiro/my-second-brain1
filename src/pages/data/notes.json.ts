import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { noteIdToSlug } from '../../lib/slugify';

export const prerender = true;

export const GET: APIRoute = async () => {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const data = notes
    .map((n) => {
      const baseName = n.id.replace(/\.md$/, '').split('/').pop() ?? n.id;
      const title = (n.data.title as string | undefined) || baseName;
      return {
        slug: noteIdToSlug(n.id),
        title,
        description: (n.data.description as string | undefined) || '',
        tags: (n.data.tags as string[] | undefined) || [],
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans'));

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
