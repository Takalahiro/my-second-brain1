/** 快速截图：海报 / 壁纸 PLY / MLSharp viewer */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'tmp', 'ply-rotate-test');
const BRAIN = 'http://localhost:4321';
const VIEWER = 'http://localhost:8000';
const SCENE = process.argv[2] || 'shanghai';

fs.mkdirSync(OUT, { recursive: true });

async function dismissUi(page) {
  try {
    const btn = page.getByRole('button', { name: '开始使用' });
    if (await btn.isVisible({ timeout: 4000 })) await btn.click();
  } catch {}
  await page.evaluate(() => {
    document.querySelectorAll('.bg-ply-banner, .widget-drawer, .mac-menu-bar, .onboarding').forEach((el) => {
      el.style.display = 'none';
    });
  });
}

async function brainShot(page, mode, file) {
  const usePly = mode === 'ply';
  await page.goto(BRAIN, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.evaluate(
    ({ sceneId, usePly }) => {
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
    { sceneId: SCENE, usePly },
  );
  await page.reload({ waitUntil: 'networkidle', timeout: 120_000 });
  await dismissUi(page);
  if (usePly) {
    try {
      await page.waitForFunction(
        () => document.querySelector('.ply-layer.is-ready') || document.querySelector('.ply-error'),
        { timeout: 300_000 },
      );
    } catch {
      const txt = await page.evaluate(() => document.body.innerText.slice(0, 500));
      console.warn('PLY wait timeout, body:', txt);
    }
    await page.waitForTimeout(3000);
  } else {
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: file });
  console.log(mode, file);
}

async function viewerShot(page, rotX, file) {
  const plyUrl = `${BRAIN}/ply/${SCENE}.ply`;
  const url = `${VIEWER}/?url=${encodeURIComponent(plyUrl)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForFunction(
    () => {
      const o = document.getElementById('loading-overlay');
      return o && !o.classList.contains('active');
    },
    { timeout: 300_000 },
  );
  if (rotX !== null) {
    await page.evaluate((rx) => {
      if (window.splatMesh) window.splatMesh.rotation.x = rx;
    }, rotX);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: file });
  console.log('viewer rot', rotX, file);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await brainShot(page, 'poster', path.join(OUT, `${SCENE}-poster.png`));
  await brainShot(page, 'ply', path.join(OUT, `${SCENE}-ply.png`));

  // viewer default (Math.PI in viewer.html)
  await viewerShot(page, null, path.join(OUT, `${SCENE}-viewer-default.png`));
  // test rotations
  for (const rx of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
    await viewerShot(page, rx, path.join(OUT, `${SCENE}-viewer-rx-${String(rx).replace(/\./g, '_')}.png`);
  }

  await browser.close();
  console.log('done', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
