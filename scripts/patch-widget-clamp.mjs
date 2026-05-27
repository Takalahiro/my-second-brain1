import fs from 'fs';

const files = [
  'src/components/widgets/TodoWidget.svelte',
  'src/components/widgets/StatsWidget.svelte',
  'src/components/widgets/NotesWidget.svelte',
  'src/components/widgets/NetworkWidget.svelte',
  'src/components/widgets/WorldClockWidget.svelte',
  'src/components/widgets/WeatherWidget.svelte',
  'src/components/widgets/GraphWidget.svelte',
  'src/components/widgets/PomodoroWidget.svelte',
  'src/components/widgets/CalendarWidget.svelte',
  'src/components/widgets/TerritoryMapWidget.svelte',
  'src/components/widgets/WhiteNoiseWidget.svelte',
  'src/components/widgets/PixelClock.svelte',
];

const clampBlock = /function clampPos\(\) \{[\s\S]*?\n  \}/g;
const clampReplace = `function clampPos() {
    const p = clampPosition(posX, posY, width, minimized ? 48 : height);
    posX = p.x;
    posY = p.y;
  }`;

const initBlock = /if \(posX < 0 \|\| posY < 0\) \{[\s\S]*?\n    \}/g;

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes('clampPosition')) {
    s = s.replace(
      /(<script lang="ts">\s*\n)/,
      `$1  import { clampPosition, spawnPosition${f.includes('NetworkWidget') ? ', getWidgetSafeTop' : ''} } from '../../lib/floating-widget-layout';\n`,
    );
  }
  s = s.replace(clampBlock, clampReplace);
  s = s.replace(initBlock, () => `if (posX < 0 || posY < 0) {
      const sp = spawnPosition(width, height);
      posX = sp.x;
      posY = sp.y;
    }`);
  s = s.replace(/const MENU_BAR_SAFE_TOP = 52;\s*\n/, '');
  s = s.replace(/posY = clamp\(posY, MENU_BAR_SAFE_TOP,/g, 'posY = clamp(posY, getWidgetSafeTop(),');
  s = s.replace(/discY = clamp\(discY, MENU_BAR_SAFE_TOP,/g, 'discY = clamp(discY, getWidgetSafeTop(),');
  fs.writeFileSync(f, s);
  console.log('updated', f);
}
