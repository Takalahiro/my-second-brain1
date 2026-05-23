/**
 * 比对海报 vs 点云壁纸，并截图 MLSharp viewer (8000)
 * 用法: node scripts/compare-ply-wallpaper.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'ply-compare');
const BRAIN = process.env.BRAIN_URL || 'http://localhost:4321';
const VIEWER = process.env.VIEWER_URL || 'http://localhost:8000';
const SCENES = ['shanghai', 'tokyo', 'kyoto', 'sydney', 'usyd'];

fs.mkdirSync(OUT, { recursive: true });

function widgetState(sceneId, mode) {
  const usePly = mode === 'ply';
  return {
    enabled: { background: true },
    bg: {
      sceneId,
      useVideo: !usePly,
      usePly,
      rain: false,
      rainDrops: false,
      rainDropsLinked: true,
      sakura: false,
      brightness: 1,
      speed: 1,
      mobileIndex: 0,
    },
  };
}

async function dismissUi(page) {
  try {
    const btn = page.getByRole('button', { name: '开始使用' });
    if (await btn.isVisible({ timeout: 3000 })) await btn.click();
    await page.waitForTimeout(400);
  } catch {}
  await page.evaluate(() => {
    document.querySelectorAll('.bg-ply-banner, .widget-drawer, .mac-menu-bar, .onboarding').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });
}

async function shotBrain(page, sceneId, mode, file) {
  await page.goto(BRAIN, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.evaluate(
    ({ sceneId, mode }) => {
      const usePly = mode === 'ply';
      localStorage.setItem(
        'second-brain:widgets',
        JSON.stringify({
          enabled: { background: true },
          bg: {
            sceneId,
            useVideo: !usePly,
            usePly,
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
    },
    { sceneId, mode },
  );
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 });
  await dismissUi(page);
  if (mode === 'ply') {
    await page.waitForFunction(
      () => document.querySelector('.ply-layer.is-ready'),
      { timeout: 180_000 },
    );
    await page.waitForTimeout(2500);
  } else {
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: file, fullPage: false, timeout: 60_000 });
}

async function shotViewer(page, plyUrl, file) {
  const url = `${VIEWER}/?url=${encodeURIComponent(plyUrl)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    () => {
      const o = document.getElementById('loading-overlay');
      return o && !o.classList.contains('active');
    },
    { timeout: 300_000 },
  );
  await page.waitForTimeout(3000);
  await page.screenshot({ path: file, fullPage: false, timeout: 60_000 });
  console.log('viewer', file);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const scene of SCENES) {
    const posterPath = path.join(OUT, `${scene}-poster.png`);
    const plyPath = path.join(OUT, `${scene}-ply.png`);
    await shotBrain(page, scene, 'poster', posterPath);
    console.log('poster', scene, posterPath);
    await shotBrain(page, scene, 'ply', plyPath);
    console.log('ply', scene, plyPath);
  }

  const plyUrl = `${BRAIN}/ply/shanghai.ply`;
  await shotViewer(page, plyUrl, path.join(OUT, 'viewer-shanghai.png'));

  await browser.close();
  console.log('done ->', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
