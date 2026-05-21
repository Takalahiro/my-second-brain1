/**
 * 基础自检：build 后可用 `node scripts/self-check.mjs [baseUrl]`
 */
const base = (process.argv[2] || 'http://localhost:4323').replace(/\/$/, '');

const routes = [
  '/',
  '/notes/',
  '/graph/',
  '/python/',
  '/matlab/',
  '/whiteboard/',
  '/data/notes.json',
  '/data/wikilinks.json',
];

async function checkRoute(path) {
  const url = `${base}${path}`;
  const res = await fetch(url);
  const ok = res.ok;
  let extra = '';
  if (path.endsWith('.json')) {
    const data = await res.json();
    if (path.includes('wikilinks')) {
      extra = ` nodes=${data.nodes?.length ?? 0} links=${data.links?.length ?? 0}`;
    } else {
      extra = ` items=${Array.isArray(data) ? data.length : '?'}`;
    }
  }
  return { path, ok, status: res.status, extra };
}

async function main() {
  console.log(`Self-check @ ${base}\n`);
  let failed = 0;
  for (const path of routes) {
    try {
      const r = await checkRoute(path);
      const mark = r.ok ? 'OK' : 'FAIL';
      if (!r.ok) failed++;
      console.log(`${mark} ${r.status} ${path}${r.extra}`);
    } catch (e) {
      failed++;
      console.log(`FAIL --- ${path} (${e.message})`);
    }
  }
  if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('\nAll checks passed.');
}

main();
