#!/usr/bin/env node
/**
 * 从 pixel 组件生成 structural 组件（共享业务逻辑，独立壳层）
 */
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pixelWidgets = path.join(root, 'src/design-system/pixel/widgets');
const outWidgets = path.join(root, 'src/design-system/structural/widgets');
const pixelSettings = path.join(root, 'src/design-system/pixel/settings');
const outSettings = path.join(root, 'src/design-system/structural/settings');

const widgetReplacements = [
  [/from '\.\.\/components\/PixelFloatingShell\.svelte'/g, "from '../components/SkinFloatingShell.svelte'"],
  [/PixelFloatingShell/g, 'SkinFloatingShell'],
  [/from '\.\.\/components\/(Pixel(?!FloatingShell)[^']+\.svelte)'/g, "from '../../pixel/components/$1'"],
  [/from '\.\.\/lib\//g, "from '../../pixel/lib/"],
  [/from '\.\.\/pixel-i18n'/g, "from '../structural-i18n'"],
  [/getPixelUi/g, 'getStructuralUi'],
  [/pixelWidgetTitle/g, 'structuralWidgetTitle'],
  [/layoutKey="second-brain:([^"]+)"/g, 'layoutKey="$1"'],
  [/Pixel(\w+)Widget\.svelte/g, 'Structural$1Widget.svelte'],
  [/export default class Pixel/g, 'export default class Structural'],
];

const settingsReplacements = [
  [/PixelDrawer/g, 'SkinDrawer'],
  [/PixelFcPadButton/g, 'PixelFcPadButton'],
  [/PixelFcSwitch/g, 'PixelFcSwitch'],
  [/PixelIcon/g, 'PixelIcon'],
  [/PixelCloseX/g, 'SkinCloseButton'],
  [/from '\.\.\/components\/PixelCloseX\.svelte'/g, "from '../components/SkinCloseButton.svelte'"],
  [/from '\.\.\/components\/PixelStepBlocks\.svelte'/g, "from '../../pixel/components/PixelStepBlocks.svelte'"],
  [/from '\.\.\/components\/PixelFc/g, "from '../../pixel/components/PixelFc"],
  [/pixel-drawer/g, 'structural-drawer'],
  [/pixel-menu/g, 'structural-menu'],
  [/pixel-fc-pad/g, 'structural-fc-pad'],
  [/pixel-drawer-status/g, 'structural-drawer-status'],
  [/class="pixel-/g, 'class="structural-'],
];

function transform(content, replacements) {
  let out = content;
  for (const [from, to] of replacements) {
    out = out.replace(from, to);
  }
  return out;
}

function copyDir(srcDir, destDir, nameMap, replacements) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (!file.endsWith('.svelte')) continue;
    if (file === 'PixelControlCenter.svelte') continue;
    const base = file.replace(/^Pixel/, 'Structural').replace(/^PixelDrawer/, 'SkinDrawer');
    const mapped = nameMap?.[file] ?? base;
    if (mapped === null) continue;
    const src = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const destName = mapped;
    fs.writeFileSync(path.join(destDir, destName), transform(src, replacements));
    console.log('wrote', destName);
  }
}

// widgets
for (const file of fs.readdirSync(pixelWidgets)) {
  if (!file.startsWith('Pixel') || !file.endsWith('.svelte')) continue;
  const dest = file.replace(/^Pixel/, 'Structural');
  const src = fs.readFileSync(path.join(pixelWidgets, file), 'utf8');
  fs.mkdirSync(outWidgets, { recursive: true });
  fs.writeFileSync(path.join(outWidgets, dest), transform(src, widgetReplacements));
  console.log('widget', dest);
}

// settings (drawer panes only)
const settingFiles = [
  'PixelDrawerChrome.svelte',
  'PixelDrawerHome.svelte',
  'PixelDrawerWidgets.svelte',
  'PixelDrawerWallpaper.svelte',
  'PixelDrawerDesktop.svelte',
  'PixelDrawerUi.svelte',
];
fs.mkdirSync(outSettings, { recursive: true });
for (const file of settingFiles) {
  const dest = file.replace('PixelDrawer', 'SkinDrawer');
  let src = fs.readFileSync(path.join(pixelSettings, file), 'utf8');
  src = transform(src, settingsReplacements);
  // SkinDrawerChrome: fix header class
  if (dest === 'SkinDrawerChrome.svelte') {
    src = src.replace(/class="pixel-nes-drawer-chrome"/, 'class="structural-drawer-chrome"');
    src = src.replace(/pixel-nes-window__titlebar/g, 'structural-drawer-chrome__bar');
    src = src.replace(/pixel-nes-window__icon/g, 'structural-drawer-chrome__icon');
    src = src.replace(/pixel-nes-window__titles/g, 'structural-drawer-chrome__titles');
    src = src.replace(/pixel-nes-window__title/g, 'structural-drawer-chrome__title');
    src = src.replace(/pixel-nes-drawer-back/g, 'structural-drawer-chrome__back');
    src = src.replace(/variant="titlebar"/, '');
  }
  fs.writeFileSync(path.join(outSettings, dest), src);
  console.log('setting', dest);
}

console.log('done');
