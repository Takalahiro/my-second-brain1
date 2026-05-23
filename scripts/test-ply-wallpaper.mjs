#!/usr/bin/env node
/**
 * 诊断点云墙纸：打开首页、写入 localStorage 开启 usePly、截图并输出 console。
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.evaluate(() => {
    const raw = localStorage.getItem('second-brain:widgets');
    const s = raw ? JSON.parse(raw) : { enabled: {}, bg: {} };
    s.bg = {
      ...(s.bg || {}),
      sceneId: 'kyoto',
      usePly: true,
      useVideo: false,
      rain: false,
      rainDrops: false,
      rainDropsLinked: true,
      sakura: false,
      brightness: 1,
      speed: 1,
      mobileIndex: 0,
    };
    s.enabled = { ...(s.enabled || {}), background: true };
    localStorage.setItem('second-brain:widgets', JSON.stringify(s));
  });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  page.setDefaultTimeout(180_000);

  // wait for am15 PLY parse + first sort (full 1.18M gaussians)
  await page.waitForFunction(
    () =>
      document.querySelector('.ply-layer.is-ready') ||
      document.querySelector('.ply-error'),
    { timeout: 180_000 },
  ).catch(() => {});
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => {
    const banner = document.querySelector('.bg-ply-banner')?.textContent?.trim() ?? null;
    const canvas = document.querySelector('.ply-layer canvas, .gs-wallpaper canvas');
    const layer = document.querySelector('.ply-layer, .gs-wallpaper');
    const err = document.querySelector('.gs-error')?.textContent?.trim() ?? null;
    return {
      banner,
      err,
      hasCanvas: !!canvas,
      plyReady: layer?.classList.contains('is-ready') ?? false,
      plyFailed: layer?.classList.contains('is-failed') ?? false,
      canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    };
  });

  const plyFetch = await page.evaluate(async () => {
    try {
      const r = await fetch('/ply/kyoto.compressed.ply', { method: 'HEAD' });
      return { status: r.status, len: r.headers.get('content-length') };
    } catch (e) {
      return { error: String(e) };
    }
  });

  console.log('STATE:', JSON.stringify(state, null, 2));
  console.log('PLY HEAD:', JSON.stringify(plyFetch, null, 2));
  console.log('CONSOLE (last 30):');
  for (const line of logs.slice(-30)) console.log(line);

  await browser.close();
  process.exit(state.plyReady ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
