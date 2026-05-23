#!/usr/bin/env node
/** 诊断首页 + 点云壁纸 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4326';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem(
      'second-brain:widgets',
      JSON.stringify({
        enabled: { background: true },
        bg: {
          sceneId: 'shanghai',
          usePly: true,
          useVideo: false,
          rain: false,
          rainDrops: false,
          rainDropsLinked: true,
          sakura: false,
          brightness: 1,
          speed: 1,
          mobileIndex: 0,
        },
      }),
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  page.setDefaultTimeout(180_000);
  await page.waitForFunction(
    () =>
      document.querySelector('.ply-layer.is-ready') ||
      document.querySelector('.ply-error') ||
      document.querySelector('.bg-ply-banner.is-error'),
    { timeout: 180_000 },
  ).catch(() => {});
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => ({
    url: location.href,
    menu: !!document.querySelector('.mac-menu-bar'),
    banner: document.querySelector('.bg-ply-banner')?.textContent?.trim(),
    err: document.querySelector('.ply-error')?.textContent?.trim(),
    canvas: !!document.querySelector('.ply-layer canvas'),
    ready: document.querySelector('.ply-layer')?.classList.contains('is-ready'),
  }));

  await page.screenshot({ path: 'tmp/gs3-diagnose.png' });
  console.log('BASE', BASE);
  console.log('STATE', JSON.stringify(state, null, 2));
  console.log('LOGS\n', logs.slice(-20).join('\n'));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
