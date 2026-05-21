import type { APIRoute } from 'astro';
import wiki from '../../data/wikilinks.json';

export const prerender = true;

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(wiki), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
