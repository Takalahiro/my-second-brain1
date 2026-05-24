/** NASA-punk 壁纸 · Canvas 实时动画引擎 */

import { tickGlitch, tickParallax, type GlitchState } from './hud-wallpaper-input';

export type HudWallpaperTelemetry = {
  raLabel: string;
  decLabel: string;
  utcLabel: string;
  missionLabel: string;
  chartSidereal: string;
};

export type HudWallpaperFx = {
  scanX: number;
  scanY: number;
  plotterX: number;
  plotterY: number;
  bracketPulse: number;
  crosshairScale: number;
  glitchStrength: number;
  parallaxNx: number;
  parallaxNy: number;
};

type ConstellationGroup = {
  points: [number, number][];
  depth: number;
  phase: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  twinkle: number;
  spike: boolean;
  glow: boolean;
  drift: number;
  rot: number;
};

type Particle = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
};

type DustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

type Satellite = {
  angle: number;
  speed: number;
  rx: number;
  ry: number;
  cx: number;
  cy: number;
};

type NebulaWisp = {
  x: number;
  y: number;
  r: number;
  color: string;
  phase: number;
  speed: number;
};

type ChartStar = {
  x: number;
  y: number;
  kind: 'dot' | 'plus' | 'cross' | 'ring';
  phase: number;
};

type InkDrop = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
};

const DEEP_COLORS = ['#FFFFFF', '#B8C8E0', '#FFD89B'] as const;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatRa(hours: number): string {
  const h = Math.floor(hours) % 24;
  const m = Math.floor((hours % 1) * 60);
  const s = Math.floor((((hours % 1) * 60) % 1) * 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function formatDec(deg: number): string {
  const sign = deg >= 0 ? '+' : '-';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs % 1) * 60);
  const s = Math.floor((((abs % 1) * 60) % 1) * 60);
  return `${sign}${String(d).padStart(2, '0')}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

function gmstHours(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  const min = date.getUTCMinutes();
  const s = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  let yr = y;
  let mo = m;
  if (mo <= 2) {
    yr -= 1;
    mo += 12;
  }
  const a = Math.floor(yr / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd =
    Math.floor(365.25 * (yr + 4716)) +
    Math.floor(30.6001 * (mo + 1)) +
    d +
    b -
    1524.5 +
    (h + min / 60 + (s + ms / 1000) / 3600) / 24;

  const t = (jd - 2451545.0) / 36525;
  let gst = 6.697374558 + 2400.051336 * t + 0.000025862 * t * t;
  gst = ((gst % 24) + 24) % 24;
  return gst;
}

export function computeTelemetry(now = new Date(), missionStartMs = 0): HudWallpaperTelemetry {
  const gst = gmstHours(now);
  const ra = (gst + 5.58) % 24;
  const dec = -5.38 + Math.sin(now.getTime() / 90000) * 0.35;
  const utc = now.toISOString().slice(11, 19);
  const elapsed = Math.max(0, now.getTime() - missionStartMs);
  const eh = Math.floor(elapsed / 3600000);
  const em = Math.floor((elapsed % 3600000) / 60000);
  const es = Math.floor((elapsed % 60000) / 1000);
  const sidereal = `${String(Math.floor(gst)).padStart(2, '0')}:${String(Math.floor((gst % 1) * 60)).padStart(2, '0')}`;

  return {
    raLabel: formatRa(ra),
    decLabel: formatDec(dec),
    utcLabel: utc,
    missionLabel: `T+ ${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:${String(es).padStart(2, '0')}`,
    chartSidereal: sidereal,
  };
}

function genDeepStars(w: number, h: number, count: number): Star[] {
  const rand = mulberry32(0x4e4153);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const color = DEEP_COLORS[Math.floor(rand() * DEEP_COLORS.length)];
    const r = 0.4 + rand() * 2.2;
    stars.push({
      x: rand() * w,
      y: rand() * h,
      r,
      color,
      phase: rand() * Math.PI * 2,
      twinkle: 0.6 + rand() * 2.4,
      spike: r > 1.2 && rand() > 0.45,
      glow: r > 1.4,
      drift: 0.5 + rand() * 1.8,
      rot: rand() * Math.PI,
    });
  }
  return stars;
}

function genDust(w: number, h: number, count: number): DustParticle[] {
  const rand = mulberry32(0x647573);
  const dust: DustParticle[] = [];
  for (let i = 0; i < count; i++) {
    dust.push({
      x: rand() * w,
      y: rand() * h,
      vx: 8 + rand() * 28,
      vy: (rand() - 0.5) * 6,
      size: 0.4 + rand() * 1.2,
      alpha: 0.04 + rand() * 0.12,
    });
  }
  return dust;
}

function genNebulaWisps(w: number, h: number): NebulaWisp[] {
  const rand = mulberry32(0x6e6562);
  return Array.from({ length: 5 }, (_, i) => ({
    x: rand() * w,
    y: rand() * h,
    r: 80 + rand() * 160,
    color: i % 2 === 0 ? '42,31,74' : '26,58,90',
    phase: rand() * Math.PI * 2,
    speed: 0.15 + rand() * 0.25,
  }));
}

function genMilkyParticles(w: number, h: number): Particle[] {
  const rand = mulberry32(0x6d696c6b);
  const pts: Particle[] = [];
  for (let i = 0; i < 900; i++) {
    const t = rand();
    const along = t * w * 1.4 - w * 0.2;
    const cross = (rand() - 0.5) * h * 0.18;
    const angle = Math.PI * 0.22;
    const x = along * Math.cos(angle) - cross * Math.sin(angle) + w * 0.05;
    const y = along * Math.sin(angle) + cross * Math.cos(angle) + h * 0.05;
    pts.push({ x, y, size: 0.3 + rand() * 1.2, alpha: 0.02 + rand() * 0.08, phase: rand() * Math.PI * 2 });
  }
  return pts;
}

function genChartStars(): ChartStar[] {
  const rand = mulberry32(0x63686172);
  const stars: ChartStar[] = [
    { x: 720, y: 280, kind: 'ring', phase: 0 },
    { x: 1020, y: 340, kind: 'cross', phase: 1 },
    { x: 920, y: 280, kind: 'plus', phase: 2 },
    { x: 820, y: 320, kind: 'dot', phase: 0.5 },
    { x: 820, y: 480, kind: 'dot', phase: 1.2 },
    { x: 720, y: 420, kind: 'dot', phase: 2.1 },
    { x: 920, y: 420, kind: 'plus', phase: 0.8 },
  ];
  const extras: [number, number, ChartStar['kind']][] = [
    [640, 200, 'dot'], [580, 360, 'dot'], [1100, 220, 'plus'], [480, 520, 'dot'],
    [1180, 480, 'plus'], [360, 380, 'dot'], [1280, 560, 'dot'], [540, 180, 'plus'],
    [1340, 300, 'dot'], [420, 620, 'dot'], [1460, 420, 'plus'], [300, 500, 'dot'],
    [760, 600, 'plus'], [980, 580, 'dot'], [1120, 640, 'dot'], [860, 180, 'dot'],
    [1050, 520, 'dot'], [390, 240, 'dot'], [1220, 380, 'plus'], [680, 160, 'dot'],
  ];
  for (const [x, y, kind] of extras) {
    stars.push({ x, y, kind, phase: rand() * Math.PI * 2 });
  }
  return stars;
}

function genInkDrops(): InkDrop[] {
  const rand = mulberry32(0x696e6b);
  return [
    { x: 740, y: 248, r: 18, phase: 0, speed: 0.7 },
    { x: 820, y: 318, r: 12, phase: 1.2, speed: 0.9 },
    { x: 1020, y: 338, r: 14, phase: 2.4, speed: 0.65 },
    { x: 680, y: 420, r: 10, phase: 0.8, speed: 1.1 },
    { x: 1180, y: 480, r: 11, phase: 1.8, speed: 0.85 },
  ].map((d) => ({ ...d, phase: d.phase + rand() * 0.5 }));
}

function drawDeepStar(
  ctx: CanvasRenderingContext2D,
  star: Star,
  t: number,
  w: number,
  h: number,
  parallaxX: number,
  parallaxY: number,
  mouseX: number,
  mouseY: number,
) {
  const depth = 0.35 + (star.r / 2.8) * 0.65;
  const mx = mouseX * depth;
  const my = mouseY * depth;
  const tw = 0.45 + Math.sin(t * star.twinkle + star.phase) * 0.55;
  const dx = Math.sin(t * 0.028 * star.drift + star.phase) * 2.2 + parallaxX + mx;
  const dy = Math.cos(t * 0.022 * star.drift + star.phase) * 1.6 + parallaxY + my;
  const x = ((star.x + dx) % w + w) % w;
  const y = ((star.y + dy) % h + h) % h;

  if (star.glow) {
    ctx.beginPath();
    ctx.arc(x, y, star.r * (3.2 + Math.sin(t * 1.2 + star.phase) * 0.6), 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.globalAlpha = 0.06 + tw * 0.06;
    ctx.fill();
  }

  if (star.spike) {
    const len = star.r * (4.5 + Math.sin(t * 1.4 + star.phase) * 1.4);
    const rot = star.rot + t * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = star.color;
    ctx.lineWidth = 0.45;
    ctx.globalAlpha = 0.25 + tw * 0.45;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(len, 0);
    ctx.moveTo(0, -len);
    ctx.lineTo(0, len);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(x, y, star.r * (0.85 + tw * 0.25), 0, Math.PI * 2);
  ctx.fillStyle = star.color;
  ctx.globalAlpha = 0.3 + tw * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawChartStar(
  ctx: CanvasRenderingContext2D,
  s: ChartStar,
  t: number,
  x: number,
  y: number,
  scale: number,
) {
  const pulse = 0.85 + Math.sin(t * 1.4 + s.phase) * 0.15;
  ctx.strokeStyle = '#1A2F4A';
  ctx.fillStyle = '#1A2F4A';
  ctx.lineWidth = 0.9;
  ctx.globalAlpha = pulse;

  if (s.kind === 'dot') {
    ctx.beginPath();
    ctx.arc(x, y, 1.4 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === 'plus') {
    const d = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(x - d, y);
    ctx.lineTo(x + d, y);
    ctx.moveTo(x, y - d);
    ctx.lineTo(x, y + d);
    ctx.stroke();
  } else if (s.kind === 'cross') {
    ctx.font = `${14 * scale}px serif`;
    ctx.fillText('✦', x - 6 * scale, y + 5 * scale);
  } else {
    ctx.beginPath();
    ctx.arc(x, y, 14 * scale * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 8 * scale * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawConstellationGroups(
  ctx: CanvasRenderingContext2D,
  groups: ConstellationGroup[],
  t: number,
  w: number,
  h: number,
  parallaxX: number,
  parallaxY: number,
  mouseX: number,
  mouseY: number,
  strokeStyle: string,
) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 0.5;
  for (const group of groups) {
    const depth = group.depth;
    const mx = mouseX * depth;
    const my = mouseY * depth;
    const breathe = 0.08 + Math.sin(t * 0.35 + group.phase) * 0.09;
    ctx.globalAlpha = breathe;
    ctx.beginPath();
    group.points.forEach(([px, py], i) => {
      const x = px * w + Math.sin(t * 0.018 + i + group.phase) * 4 + parallaxX * depth + mx;
      const y = py * h + Math.cos(t * 0.02 + i + group.phase) * 4 + parallaxY * depth + my;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawSignalGlitch(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  glitch: GlitchState,
  dark: boolean,
) {
  if (!glitch.active || glitch.strength <= 0.01) return;

  const s = glitch.strength;
  const bandTop = glitch.bandY * h;
  const bandH = glitch.bandH * h;
  const canvas = ctx.canvas as HTMLCanvasElement;

  ctx.save();
  ctx.globalAlpha = 0.1 * s;
  ctx.fillStyle = dark ? '#fff' : '#1A2F4A';
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.4 * s;
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(244,237,224,0.9)';
  ctx.fillRect(0, bandTop, w, bandH);

  const slices = 4 + Math.floor(s * 6);
  for (let i = 0; i < slices; i++) {
    const sy = ((glitch.seed + i * 73) % 100) / 100 * h;
    const sh = 2 + (i % 3) * 3;
    const shift = glitch.offsetX * s * (i % 2 === 0 ? 1 : -1);
    ctx.globalAlpha = 0.14 * s;
    ctx.drawImage(canvas, 0, sy, w, sh, shift, sy, w, sh);
  }

  ctx.globalAlpha = 0.18 * s;
  ctx.strokeStyle = dark ? '#E8A040' : '#C8392E';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const ly = ((glitch.seed * 1.7 + i * 47) % 100) / 100 * h;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(w, ly);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.08 * s;
  for (let i = 0; i < 40; i++) {
    const gx = ((glitch.seed + i * 31) % 1000) / 1000 * w;
    const gy = ((glitch.seed + i * 59) % 1000) / 1000 * h;
    ctx.fillStyle = i % 2 === 0 ? (dark ? '#B8C8E0' : '#6B8AB8') : (dark ? '#E8A040' : '#C8392E');
    ctx.fillRect(gx, gy, 2, 1);
  }

  ctx.restore();
}

export type DeepSpaceEngine = {
  resize: () => void;
  stop: () => void;
  getFx: () => HudWallpaperFx;
};

export function startDeepSpaceEngine(
  canvas: HTMLCanvasElement,
  onTelemetry?: (t: HudWallpaperTelemetry) => void,
): DeepSpaceEngine {
  const ctx = canvas.getContext('2d', { alpha: false });
  const noopFx: HudWallpaperFx = {
    scanX: 0, scanY: 0, plotterX: 0, plotterY: 0, bracketPulse: 0, crosshairScale: 1,
    glitchStrength: 0, parallaxNx: 0, parallaxNy: 0,
  };
  if (!ctx) return { resize: () => {}, stop: () => {}, getFx: () => noopFx };

  const missionStart = performance.now();
  let w = 1;
  let h = 1;
  let dpr = 1;
  let stars: Star[] = [];
  let milky: Particle[] = [];
  let dust: DustParticle[] = [];
  let wisps: NebulaWisp[] = [];
  const shootings: ShootingStar[] = [];
  let nextShoot = 2 + Math.random() * 4;
  let scanProgress = 0;
  let scanYProgress = 0;
  let fx: HudWallpaperFx = { ...noopFx };
  let raf = 0;
  let lastTelemetry = 0;
  let grainOffset = 0;

  const satellite: Satellite = { angle: 0, speed: 0.18, rx: 0.38, ry: 0.12, cx: 0.55, cy: 0.42 };

  const constellations: ConstellationGroup[] = [
    { points: [[0.18, 0.16], [0.26, 0.2], [0.34, 0.16], [0.4, 0.24], [0.48, 0.19]], depth: 0.85, phase: 0 },
    { points: [[0.61, 0.42], [0.7, 0.36], [0.78, 0.42], [0.74, 0.5], [0.82, 0.46]], depth: 0.7, phase: 1.2 },
    { points: [[0.08, 0.62], [0.14, 0.58], [0.2, 0.64], [0.16, 0.72]], depth: 0.55, phase: 2.1 },
    { points: [[0.52, 0.12], [0.58, 0.08], [0.64, 0.14], [0.6, 0.2]], depth: 0.95, phase: 0.6 },
    { points: [[0.85, 0.55], [0.9, 0.48], [0.95, 0.52], [0.92, 0.6], [0.88, 0.58]], depth: 0.75, phase: 1.8 },
    { points: [[0.32, 0.48], [0.38, 0.44], [0.42, 0.5], [0.36, 0.56]], depth: 0.65, phase: 2.7 },
    { points: [[0.68, 0.72], [0.74, 0.68], [0.8, 0.74], [0.76, 0.8], [0.7, 0.78]], depth: 0.5, phase: 3.2 },
    { points: [[0.02, 0.28], [0.06, 0.22], [0.1, 0.28], [0.08, 0.34]], depth: 0.9, phase: 4.1 },
    { points: [[0.44, 0.78], [0.5, 0.74], [0.54, 0.8], [0.48, 0.86]], depth: 0.45, phase: 1.5 },
    { points: [[0.22, 0.38], [0.28, 0.34], [0.3, 0.4], [0.26, 0.46], [0.24, 0.42]], depth: 0.8, phase: 2.9 },
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = genDeepStars(w, h, Math.floor((w * h) / 1800));
    milky = genMilkyParticles(w, h);
    dust = genDust(w, h, Math.floor((w * h) / 12000) + 40);
    wisps = genNebulaWisps(w, h);
  }

  function drawNebula(t: number, mouseX: number, mouseY: number) {
    const p1x = 0.18 + Math.sin(t * 0.06) * 0.04 + mouseX * 0.0008;
    const p1y = 0.82 + Math.cos(t * 0.055) * 0.035 + mouseY * 0.0008;
    const p2x = 0.88 + Math.sin(t * 0.045 + 1) * 0.03 + mouseX * 0.0005;
    const p2y = 0.12 + Math.cos(t * 0.042 + 0.5) * 0.028 + mouseY * 0.0005;

    ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(0, 0, w, h);

    for (const wisp of wisps) {
      const wx = wisp.x + Math.sin(t * wisp.speed + wisp.phase) * 40 + mouseX * 0.15;
      const wy = wisp.y + Math.cos(t * wisp.speed * 0.8 + wisp.phase) * 30 + mouseY * 0.15;
      const pulse = 0.18 + Math.sin(t * 0.4 + wisp.phase) * 0.1;
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, wisp.r);
      g.addColorStop(0, `rgba(${wisp.color},${pulse})`);
      g.addColorStop(1, `rgba(${wisp.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    const g1 = ctx.createRadialGradient(p1x * w, p1y * h, 0, p1x * w, p1y * h, w * 0.58);
    g1.addColorStop(0, `rgba(42,31,74,${0.48 + Math.sin(t * 0.08) * 0.12})`);
    g1.addColorStop(1, 'rgba(42,31,74,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    const g2 = ctx.createRadialGradient(p2x * w, p2y * h, 0, p2x * w, p2y * h, w * 0.52);
    g2.addColorStop(0, `rgba(26,58,90,${0.42 + Math.cos(t * 0.07) * 0.1})`);
    g2.addColorStop(1, 'rgba(26,58,90,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
  }

  function drawMilky(t: number, parallaxX: number, parallaxY: number) {
    for (const p of milky) {
      const shimmer = 0.45 + Math.sin(t * 0.9 + p.phase + p.x * 0.008) * 0.55;
      const px = ((p.x + parallaxX * 0.5 + Math.sin(t * 0.035 + p.y) * 4) % w + w) % w;
      const py = ((p.y + parallaxY * 0.5) % h + h) % h;
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = p.alpha * shimmer;
      ctx.fillRect(px, py, p.size, p.size * 0.35);
    }
    ctx.globalAlpha = 1;
  }

  function drawDust(dt: number) {
    for (const d of dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.x > w + 10) {
        d.x = -10;
        d.y = Math.random() * h;
      }
      ctx.fillStyle = '#B8C8E0';
      ctx.globalAlpha = d.alpha;
      ctx.fillRect(d.x, d.y, d.size, d.size * 0.4);
    }
    ctx.globalAlpha = 1;
  }

  function drawConstellations(
    t: number,
    parallaxX: number,
    parallaxY: number,
    mouseX: number,
    mouseY: number,
  ) {
    drawConstellationGroups(ctx, constellations, t, w, h, parallaxX, parallaxY, mouseX, mouseY, '#fff');
  }

  function drawSatellite(t: number, mouseX: number, mouseY: number) {
    satellite.angle += satellite.speed * 0.016;
    const cx = satellite.cx * w + mouseX * 0.2;
    const cy = satellite.cy * h + mouseY * 0.2;
    const rx = satellite.rx * w;
    const ry = satellite.ry * h;
    ctx.strokeStyle = 'rgba(184,200,224,0.22)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 10]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const sx = cx + Math.cos(satellite.angle) * rx;
    const sy = cy + Math.sin(satellite.angle) * ry;
    ctx.fillStyle = '#E8A040';
    ctx.globalAlpha = 0.75 + Math.sin(t * 3) * 0.2;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMarkStar(t: number, mouseX: number, mouseY: number) {
    const mx = w * 0.05 + Math.sin(t * 0.012) * 8 + mouseX * 0.35;
    const my = h * 0.06 + Math.cos(t * 0.015) * 6 + mouseY * 0.35;
    for (let i = 0; i < 3; i++) {
      const pulse = 4 + i * 5 + Math.sin(t * (2.2 - i * 0.3) + i) * 2;
      ctx.strokeStyle = '#E8A040';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = (0.35 - i * 0.08) + Math.sin(t * 2 + i) * 0.15;
      ctx.beginPath();
      ctx.arc(mx, my, pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#E8A040';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function spawnShooting() {
    shootings.push({
      x: Math.random() * w * 0.85,
      y: Math.random() * h * 0.45,
      vx: 220 + Math.random() * 180,
      vy: 60 + Math.random() * 100,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.45,
    });
  }

  function drawShootings(dt: number) {
    nextShoot -= dt;
    if (nextShoot <= 0) {
      spawnShooting();
      if (Math.random() > 0.4) spawnShooting();
      nextShoot = 2.5 + Math.random() * 6;
    }

    for (let i = shootings.length - 1; i >= 0; i--) {
      const s = shootings[i];
      s.life += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const fade = 1 - s.life / s.maxLife;
      if (fade <= 0) {
        shootings.splice(i, 1);
        continue;
      }
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.1, s.y - s.vy * 0.1);
      grad.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
      grad.addColorStop(0.4, `rgba(184,200,224,${0.5 * fade})`);
      grad.addColorStop(1, 'rgba(184,200,224,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2 + fade;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 0.08, s.y - s.vy * 0.08);
      ctx.stroke();
    }
  }

  function drawScanSweeps(t: number) {
    const sx = scanProgress * w;
    const sy = scanYProgress * h;
    ctx.strokeStyle = 'rgba(184,200,224,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232,160,64,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232,160,64,0.25)';
    ctx.fillRect(0, sy - 0.5, w, 1);
  }

  function drawHorizonGlow(t: number) {
    const gy = h * (0.72 + Math.sin(t * 0.025) * 0.02);
    const g = ctx.createLinearGradient(0, gy - 80, 0, gy + 120);
    g.addColorStop(0, 'rgba(26,58,90,0)');
    g.addColorStop(0.5, `rgba(42,31,74,${0.08 + Math.sin(t * 0.05) * 0.04})`);
    g.addColorStop(1, 'rgba(10,14,26,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, gy - 80, w, 200);
  }

  function drawVignette(t: number) {
    const pulse = 0.58 + Math.sin(t * 0.08) * 0.06;
    const g = ctx.createRadialGradient(w * 0.5, h * 0.48, h * 0.18, w * 0.5, h * 0.48, Math.max(w, h) * 0.74);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGrain() {
    grainOffset = (grainOffset + 2.4) % 256;
    ctx.globalAlpha = 0.075;
    for (let i = 0; i < 180; i++) {
      const gx = (i * 97 + grainOffset * 3) % w;
      const gy = (i * 53 + grainOffset * 5) % h;
      ctx.fillStyle = i % 3 === 0 ? '#B8C8E0' : '#fff';
      ctx.fillRect(gx, gy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    scanProgress = (scanProgress + dt * 0.1) % 1;
    scanYProgress = (scanYProgress + dt * 0.045) % 1;

    const parallaxX = Math.sin(t * 0.018) * 12 + Math.sin(t * 0.007) * 6;
    const parallaxY = Math.cos(t * 0.015) * 10 + Math.cos(t * 0.009) * 5;
    const mouse = tickParallax(1);
    const glitchState = tickGlitch(dt);

    fx = {
      scanX: scanProgress * 100,
      scanY: scanYProgress * 100,
      plotterX: 0,
      plotterY: 0,
      bracketPulse: 0.55 + Math.sin(t * 1.8) * 0.25,
      crosshairScale: 1 + Math.sin(t * 2.5) * 0.08,
      glitchStrength: glitchState.strength,
      parallaxNx: mouse.nx,
      parallaxNy: mouse.ny,
    };

    drawNebula(t, mouse.x, mouse.y);
    drawHorizonGlow(t);
    drawMilky(t, parallaxX + mouse.x * 0.4, parallaxY + mouse.y * 0.4);
    drawDust(dt);
    for (const star of stars) {
      drawDeepStar(ctx, star, t, w, h, parallaxX, parallaxY, mouse.x, mouse.y);
    }
    drawConstellations(t, parallaxX, parallaxY, mouse.x, mouse.y);
    drawSatellite(t, mouse.x, mouse.y);
    drawShootings(dt);
    drawMarkStar(t, mouse.x, mouse.y);
    drawScanSweeps(t);
    drawVignette(t);
    drawGrain();
    drawSignalGlitch(ctx, w, h, glitchState, true);

    if (onTelemetry && now - lastTelemetry > 200) {
      lastTelemetry = now;
      onTelemetry(computeTelemetry(new Date(), missionStart));
    }

    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);

  return {
    resize,
    stop: () => cancelAnimationFrame(raf),
    getFx: () => fx,
  };
}

export type ChartEngine = {
  resize: () => void;
  stop: () => void;
  getFx: () => HudWallpaperFx;
};

export function startChartEngine(
  canvas: HTMLCanvasElement,
  onTelemetry?: (t: HudWallpaperTelemetry) => void,
): ChartEngine {
  const ctx = canvas.getContext('2d', { alpha: false });
  const noopFx: HudWallpaperFx = {
    scanX: 0, scanY: 0, plotterX: 0, plotterY: 0, bracketPulse: 0, crosshairScale: 1,
    glitchStrength: 0, parallaxNx: 0, parallaxNy: 0,
  };
  if (!ctx) return { resize: () => {}, stop: () => {}, getFx: () => noopFx };

  const missionStart = performance.now();
  let w = 1;
  let h = 1;
  let dpr = 1;
  let stars = genChartStars();
  const inkDrops = genInkDrops();
  let plotterY = 0;
  let plotterX = 0;
  let fx: HudWallpaperFx = { ...noopFx };
  let raf = 0;
  let lastTelemetry = 0;
  let grainPhase = 0;
  let compassAngle = 0;

  const VB_W = 1600;
  const VB_H = 900;

  const chartConstellations: [number, number][][] = [
    [[640, 200], [680, 180], [720, 200], [700, 220]],
    [[480, 520], [520, 500], [540, 540], [500, 560]],
    [[1180, 480], [1220, 460], [1260, 490], [1240, 520]],
    [[360, 380], [400, 360], [420, 400]],
    [[1340, 300], [1380, 280], [1420, 310], [1400, 340]],
    [[300, 500], [340, 480], [360, 520]],
    [[1050, 520], [1090, 500], [1120, 530]],
    [[860, 180], [900, 160], [920, 190]],
  ];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function toScreen(x: number, y: number, ox: number, oy: number) {
    const scale = Math.max(w / VB_W, h / VB_H);
    const dw = VB_W * scale;
    const dh = VB_H * scale;
    const left = (w - dw) / 2;
    const top = (h - dh) / 2;
    return { x: left + x * scale + ox, y: top + y * scale + oy };
  }

  function drawPaper(t: number) {
    ctx.fillStyle = '#F4EDE0';
    ctx.fillRect(0, 0, w, h);
    const flicker = 0.025 + Math.sin(t * 0.45) * 0.012;
    ctx.fillStyle = `rgba(235,226,210,${flicker})`;
    ctx.fillRect(0, 0, w, h);
    const warm = 0.012 + Math.sin(t * 0.18 + 1) * 0.008;
    ctx.fillStyle = `rgba(200,57,46,${warm})`;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGrid(ox: number, oy: number, t: number) {
    const gridOx = ox * 0.35 + Math.sin(t * 0.07) * 3;
    const gridOy = oy * 0.35 + Math.cos(t * 0.06) * 3;
    ctx.strokeStyle = `rgba(107,138,184,${0.1 + Math.sin(t * 0.5) * 0.03})`;
    ctx.lineWidth = 0.5;
    const scale = Math.max(w / VB_W, h / VB_H);
    const step = 50 * scale;
    const dw = VB_W * scale;
    const dh = VB_H * scale;
    const left = (w - dw) / 2 + gridOx;
    const top = (h - dh) / 2 + gridOy;

    for (let x = left; x <= left + dw; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, top + dh);
      ctx.stroke();
    }
    for (let y = top; y <= top + dh; y += step) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + dw, y);
      ctx.stroke();
    }
  }

  function drawRegisterShift(t: number) {
    const dx = Math.sin(t * 0.9) * 2.5;
    const dy = Math.cos(t * 0.7) * 1.5;
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#6B8AB8';
    ctx.fillRect(dx, dy, w, h);
    ctx.fillStyle = '#C8392E';
    ctx.fillRect(-dx * 0.6, -dy * 0.6, w, h);
    ctx.globalAlpha = 1;
  }

  function drawOrion(ox: number, oy: number, t: number) {
    const wobble = Math.sin(t * 0.55) * 0.04;
    const pts = [
      [720, 280], [820, 320], [920, 280], [1020, 340],
      [920, 420], [820, 480], [720, 420], [820, 320],
    ].map(([x, y]) => toScreen(x + Math.sin(t + x * 0.01) * 2, y + Math.cos(t + y * 0.01) * 2, ox, oy));

    ctx.strokeStyle = '#1A2F4A';
    ctx.lineWidth = 1 + wobble;
    ctx.globalAlpha = 0.8 + Math.sin(t * 0.6) * 0.12;
    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    const belt = toScreen(720, 280, ox, oy);
    const rigel = toScreen(1020, 340, ox, oy);
    ctx.beginPath();
    ctx.moveTo(belt.x, belt.y);
    ctx.lineTo(rigel.x, rigel.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawInkBleed(ox: number, oy: number, t: number) {
    const scale = Math.max(w / VB_W, h / VB_H);
    for (const drop of inkDrops) {
      const p = toScreen(drop.x, drop.y, ox, oy);
      const bleed = drop.r * scale * (0.6 + Math.sin(t * drop.speed + drop.phase) * 0.35);
      ctx.fillStyle = 'rgba(26,47,74,0.06)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, bleed, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAnnotation(ox: number, oy: number, t: number) {
    const p = toScreen(740, 250, ox, oy);
    const scale = Math.max(w / VB_W, h / VB_H);
    const blink = Math.floor(t * 2.2) % 2 === 0;
    ctx.font = `${10 * scale}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#1A2F4A';
    ctx.globalAlpha = 0.75 + Math.sin(t * 0.8) * 0.15;
    ctx.fillText('[BETELGEUSE / mag 0.5 / 642 ly]', p.x, p.y);
    if (blink) {
      ctx.fillStyle = '#C8392E';
      ctx.fillRect(p.x + 198 * scale, p.y - 8 * scale, 4 * scale, 10 * scale);
    }
    ctx.globalAlpha = 1;
  }

  function drawGreekLabels(ox: number, oy: number, t: number) {
    const scale = Math.max(w / VB_W, h / VB_H);
    const labels: [number, number, string][] = [
      [732, 268, 'α'], [1032, 328, 'β'], [932, 268, 'γ'], [832, 312, 'δ'],
    ];
    ctx.font = `${11 * scale}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#1A2F4A';
    for (const [x, y, label] of labels) {
      const p = toScreen(x, y, ox, oy);
      ctx.globalAlpha = 0.7 + Math.sin(t * 1.6 + x) * 0.3;
      ctx.fillText(label, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawEcliptic(ox: number, oy: number, t: number) {
    const a = toScreen(80, 460, ox, oy);
    const b = toScreen(1520, 460, ox, oy);
    const wave = Math.sin(t * 0.08) * 4;
    ctx.setLineDash([8 * (w / VB_W), 6 * (w / VB_W)]);
    ctx.strokeStyle = 'rgba(26,47,74,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x + Math.sin(t * 0.05) * 2, a.y + wave);
    ctx.lineTo(b.x, b.y - wave * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    const scale = Math.max(w / VB_W, h / VB_H);
    ctx.font = `${9 * scale}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = 'rgba(26,47,74,0.55)';
    for (let i = 0; i < 6; i++) {
      const p = toScreen(180 + i * 220, 448, ox, oy);
      ctx.globalAlpha = 0.5 + Math.sin(t * 0.7 + i) * 0.35;
      ctx.fillText(`${i * 30}°`, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawCompass(ox: number, oy: number, t: number) {
    const c = toScreen(1480, 120, ox, oy);
    compassAngle += 0.004 + Math.sin(t * 0.04) * 0.002;
    const scale = w / VB_W;
    ctx.strokeStyle = '#1A2F4A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 36 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(compassAngle);
    ctx.beginPath();
    ctx.moveTo(0, -28 * scale);
    ctx.lineTo(0, 28 * scale);
    ctx.moveTo(-28 * scale, 0);
    ctx.lineTo(28 * scale, 0);
    ctx.stroke();
    ctx.fillStyle = '#C8392E';
    ctx.beginPath();
    ctx.moveTo(0, -22 * scale);
    ctx.lineTo(4 * scale, -10 * scale);
    ctx.lineTo(-4 * scale, -10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.font = `${10 * scale}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#1A2F4A';
    ctx.textAlign = 'center';
    ctx.fillText('N', c.x, c.y - 38 * scale);
    ctx.fillText('S', c.x, c.y + 48 * scale);
    ctx.fillText('E', c.x + 32 * scale, c.y + 4);
    ctx.fillText('W', c.x - 40 * scale, c.y + 4);
  }

  function drawScaleBar(ox: number, oy: number, t: number) {
    const origin = toScreen(120, 780, ox, oy);
    const scale = Math.max(w / VB_W, h / VB_H);
    const len = 80 * scale * (0.95 + Math.sin(t * 1.2) * 0.05);
    ctx.strokeStyle = '#1A2F4A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x + len, origin.y);
    ctx.moveTo(origin.x, origin.y - 4 * scale);
    ctx.lineTo(origin.x, origin.y + 4 * scale);
    ctx.moveTo(origin.x + len, origin.y - 4 * scale);
    ctx.lineTo(origin.x + len, origin.y + 4 * scale);
    ctx.stroke();
    ctx.font = `${9 * scale}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#1A2F4A';
    ctx.fillText('5° ARC', origin.x, origin.y + 16 * scale);
  }

  function drawLegend(ox: number, oy: number, t: number) {
    const o = toScreen(120, 680, ox, oy);
    const s = Math.max(w / VB_W, h / VB_H);
    ctx.font = `${9 * s}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = '#1A2F4A';
    ctx.globalAlpha = 0.65 + Math.sin(t * 0.5) * 0.2;
    ctx.fillText('LEGEND', o.x, o.y);
    ctx.globalAlpha = 1;
  }

  function drawPlotterSweep(y: number, x: number, t: number) {
    ctx.strokeStyle = `rgba(200,57,46,${0.28 + Math.sin(t * 2) * 0.12})`;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,57,46,0.85)';
    ctx.beginPath();
    ctx.arc(24, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, 24, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,57,46,0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 6 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawHalftone(t: number) {
    ctx.globalAlpha = 0.05;
    const step = 5;
    for (let x = (grainPhase % step); x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        if ((x + y + Math.floor(t * 2)) % 7 === 0) {
          ctx.fillStyle = '#1A2F4A';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawCoffeeRing(t: number) {
    const cx = w * 0.92 + Math.sin(t * 0.05) * 4;
    const cy = h * 0.1 + Math.cos(t * 0.04) * 3;
    const r = Math.min(w, h) * (0.09 + Math.sin(t * 0.15) * 0.008);
    ctx.strokeStyle = `rgba(180,150,110,${0.14 + Math.sin(t * 0.25) * 0.05})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = 'rgba(180,150,110,0.5)';
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 6, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawChartConstellations(ox: number, oy: number, t: number, mouseX: number, mouseY: number) {
    ctx.strokeStyle = 'rgba(26,47,74,0.32)';
    ctx.lineWidth = 0.8;
    chartConstellations.forEach((group, gi) => {
      const depth = 0.45 + (gi % 4) * 0.15;
      const breathe = 0.55 + Math.sin(t * 0.5 + gi) * 0.25;
      ctx.globalAlpha = breathe;
      ctx.beginPath();
      group.forEach(([x, y], i) => {
        const p = toScreen(
          x + Math.sin(t * 0.02 + i + gi) * 1.5,
          y + Math.cos(t * 0.018 + i + gi) * 1.5,
          ox + mouseX * depth * 0.08,
          oy + mouseY * depth * 0.08,
        );
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawFold(t: number) {
    const shift = Math.sin(t * 0.03) * 2;
    ctx.strokeStyle = 'rgba(26,47,74,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.48 + shift, 0);
    ctx.lineTo(w * 0.52 + shift, h);
    ctx.stroke();
  }

  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    grainPhase += 1.2;

    const mouse = tickParallax(0.9);
    const glitchState = tickGlitch(dt);

    const ox = Math.sin(t * 0.065) * 28 + Math.sin(t * 0.019) * 10 + mouse.x * 0.65;
    const oy = Math.cos(t * 0.055) * 22 + Math.cos(t * 0.023) * 8 + mouse.y * 0.65;
    plotterY = (plotterY + 0.55 + Math.sin(t * 0.08) * 0.08) % h;
    plotterX = (plotterX + 0.32 + Math.cos(t * 0.06) * 0.05) % w;

    fx = {
      scanX: (plotterX / w) * 100,
      scanY: (plotterY / h) * 100,
      plotterX: plotterX,
      plotterY: plotterY,
      bracketPulse: 0.55 + Math.sin(t * 2.2) * 0.3,
      crosshairScale: 1,
      glitchStrength: glitchState.strength,
      parallaxNx: mouse.nx,
      parallaxNy: mouse.ny,
    };

    drawPaper(t);
    drawRegisterShift(t);
    drawGrid(ox, oy, t);
    drawEcliptic(ox, oy, t);
    drawChartConstellations(ox, oy, t, mouse.x, mouse.y);
    drawInkBleed(ox, oy, t);
    drawOrion(ox, oy, t);
    const scale = Math.max(w / VB_W, h / VB_H);
    for (const s of stars) {
      const depth = 0.5 + (s.kind === 'ring' ? 0.4 : s.kind === 'cross' ? 0.3 : 0.15);
      const p = toScreen(s.x, s.y, ox + mouse.x * depth * 0.06, oy + mouse.y * depth * 0.06);
      drawChartStar(ctx, s, t, p.x, p.y, scale);
    }
    drawGreekLabels(ox, oy, t);
    drawAnnotation(ox, oy, t);
    drawCompass(ox, oy, t);
    drawScaleBar(ox, oy, t);
    drawLegend(ox, oy, t);
    drawCoffeeRing(t);
    drawFold(t);
    drawPlotterSweep(plotterY, plotterX, t);
    drawHalftone(t);
    drawSignalGlitch(ctx, w, h, glitchState, false);

    if (onTelemetry && now - lastTelemetry > 200) {
      lastTelemetry = now;
      onTelemetry(computeTelemetry(new Date(), missionStart));
    }

    raf = requestAnimationFrame(frame);
  }

  resize();
  raf = requestAnimationFrame(frame);

  return {
    resize,
    stop: () => cancelAnimationFrame(raf),
    getFx: () => fx,
  };
}
