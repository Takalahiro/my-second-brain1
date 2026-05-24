import type { APIRoute } from 'astro';
import manifest from '../../data/media-manifest.json';

export const prerender = true;

// 和 notes.json 一样，先静态导出；以后可以换成真后端
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
