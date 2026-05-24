import type { UiSkinId } from '../../features/ui/types';
import { createSkinWallpaperEngine, mulberry32, type SkinWallpaperEngine } from './engine-base';

type EngineFactory = (canvas: HTMLCanvasElement) => SkinWallpaperEngine;

/* ── pixel · Game Boy LCD ── */
function pixelEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(42);
  const blocks = Array.from({ length: 48 }, () => ({
    x: rng() * 160,
    y: rng() * 144,
    vx: (rng() > 0.5 ? 1 : -1) * (20 + rng() * 40),
    vy: (rng() > 0.5 ? 1 : -1) * (15 + rng() * 30),
    size: 4 + Math.floor(rng() * 3) * 4,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#9bbc0f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8bac0f';
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        if (((x + y) / 8) % 2 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }
    ctx.fillStyle = '#306230';
    for (const b of blocks) {
      const px = ((b.x + b.vx * t) % (w + 40)) - 20;
      const py = ((b.y + b.vy * t) % (h + 40)) - 20;
      ctx.fillRect(Math.floor(px / 4) * 4, Math.floor(py / 4) * 4, b.size, b.size);
    }
    ctx.fillStyle = 'rgb(48 98 48 / 0.35)';
    ctx.font = '10px monospace';
    ctx.fillText(`LV ${Math.floor(t * 0.3) % 99} · XP ${Math.floor(t * 17) % 9999}`, 12, h - 14);
  });
}

/* ── blueprint · 工程制图 ── */
function blueprintEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  let scanY = 0;
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t, dt) => {
    ctx.fillStyle = '#0e3a5f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgb(255 255 255 / 0.18)';
    ctx.lineWidth = 1;
    const g = 48;
    for (let x = 0; x < w; x += g) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += g) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgb(255 255 255 / 0.08)';
    const sg = 12;
    for (let x = 0; x < w; x += sg) {
      for (let y = 0; y < h; y += sg) {
        if (x % g && y % g) {
          ctx.strokeRect(x, y, sg, sg);
        }
      }
    }
    scanY = (scanY + dt * 60) % h;
    ctx.strokeStyle = 'rgb(230 57 70 / 0.55)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, scanY);
    ctx.lineTo(w, scanY);
    ctx.stroke();
    ctx.setLineDash([]);
    const cx = w * 0.5 + Math.sin(t * 0.4) * 80;
    const cy = h * 0.45 + Math.cos(t * 0.3) * 40;
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 120, cy - 80, 240, 160);
    ctx.fillStyle = '#f4ecd8';
    ctx.font = '11px monospace';
    ctx.fillText(`${(240 / 48).toFixed(1)}m × ${(160 / 48).toFixed(1)}m`, cx - 110, cy + 90);
    ctx.fillStyle = 'rgb(244 236 216 / 0.7)';
    ctx.fillText(`REV ${Math.floor(t) % 9}.${Math.floor(t * 10) % 10}`, w - 100, 24);
  });
}

/* ── scholar · 羊皮纸手稿 ── */
function scholarEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(7);
  const motes = Array.from({ length: 60 }, () => ({
    x: rng(),
    y: rng(),
    r: 0.5 + rng() * 2,
    sp: 0.02 + rng() * 0.04,
    ph: rng() * Math.PI * 2,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f4ecd8');
    g.addColorStop(0.5, '#ebe3cf');
    g.addColorStop(1, '#ddd4bc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(139 90 43 / 0.06)';
    ctx.beginPath();
    ctx.ellipse(w * 0.72, h * 0.78, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const m of motes) {
      const x = m.x * w + Math.sin(t * m.sp + m.ph) * 20;
      const y = (m.y * h + t * 8 * m.sp) % h;
      ctx.fillStyle = `rgb(100 70 40 / ${0.08 + m.r * 0.04})`;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    const flicker = 0.85 + Math.sin(t * 3.7) * 0.08 + Math.sin(t * 11.3) * 0.04;
    const cg = ctx.createRadialGradient(w * 0.12, h * 0.88, 0, w * 0.12, h * 0.88, 120);
    cg.addColorStop(0, `rgb(255 180 80 / ${0.25 * flicker})`);
    cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgb(80 50 30 / 0.15)';
    ctx.lineWidth = 48;
    ctx.beginPath();
    ctx.moveTo(36, 0);
    ctx.lineTo(36, h);
    ctx.stroke();
  });
}

/* ── terminal · 磷光 CLI ── */
function terminalEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const cols = 80;
  const rows = 40;
  const rng = mulberry32(13);
  const colData = Array.from({ length: cols }, () => ({
    y: rng() * rows,
    speed: 2 + rng() * 6,
    chars: Array.from({ length: rows }, () =>
      String.fromCharCode(33 + Math.floor(rng() * 94)),
    ),
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t, dt) => {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(0 255 65 / 0.04)';
    ctx.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    ctx.font = `${Math.floor(ch * 0.85)}px monospace`;
    for (let i = 0; i < cols; i++) {
      const col = colData[i];
      col.y += col.speed * dt;
      if (col.y > rows + 5) col.y = -5;
      for (let j = 0; j < rows; j++) {
        const row = Math.floor(col.y + j) % rows;
        const alpha = Math.max(0, 1 - j / rows) * 0.7;
        if (Math.random() < 0.002) {
          col.chars[row] = String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }
        ctx.fillStyle = `rgb(0 255 65 / ${alpha})`;
        ctx.fillText(col.chars[row], i * cw + 2, (j + 1) * ch);
      }
    }
    ctx.fillStyle = 'rgb(0 255 65 / 0.9)';
    ctx.fillText('user@msb:~$ _', 12, h - 20);
    const scan = (t * 40) % h;
    ctx.fillStyle = 'rgb(0 255 65 / 0.03)';
    ctx.fillRect(0, scan, w, 3);
  });
}

/* ── crt · 琥珀扫描线 ── */
function crtEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(99);
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#1a1200';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(255 176 0 / 0.08)';
    for (let i = 0; i < 400; i++) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.fillRect(x, y, 1, 1);
    }
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgb(0 0 0 / 0.25)' : 'transparent';
      ctx.fillRect(0, y, w, 1);
    }
    const scanY = (t * 90) % (h + 40) - 20;
    ctx.fillStyle = 'rgb(255 176 0 / 0.12)';
    ctx.fillRect(0, scanY, w, 8);
    ctx.fillStyle = 'rgb(255 176 0 / 0.85)';
    ctx.font = '14px monospace';
    ctx.fillText('> SYSTEM READY · MEM OK', 20, 40);
    if (Math.sin(t * 20) > 0.95) {
      ctx.fillStyle = 'rgb(255 176 0 / 0.15)';
      ctx.fillRect(0, 0, w, h);
    }
  });
}

/* ── observatory · 星图 ── */
function observatoryEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(2024);
  const stars = Array.from({ length: 220 }, () => ({
    x: rng(),
    y: rng(),
    r: 0.4 + rng() * 1.8,
    ph: rng() * Math.PI * 2,
    br: 0.3 + rng() * 0.7,
  }));
  const lines = [
    [0, 1, 2], [2, 3, 4], [4, 5], [1, 6], [6, 7],
  ];
  const constellation = Array.from({ length: 8 }, () => ({
    x: 0.3 + rng() * 0.4,
    y: 0.2 + rng() * 0.35,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, w, h);
    const mg = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.6);
    mg.addColorStop(0, 'rgb(60 40 100 / 0.25)');
    mg.addColorStop(1, 'transparent');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, w, h);
    for (const s of stars) {
      const tw = s.br * (0.6 + Math.sin(t * 2 + s.ph) * 0.4);
      ctx.fillStyle = `rgb(232 196 71 / ${tw})`;
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgb(232 196 71 / 0.35)';
    ctx.lineWidth = 1;
    for (const seg of lines) {
      ctx.beginPath();
      for (let i = 0; i < seg.length; i++) {
        const p = constellation[seg[i]];
        const px = p.x * w + Math.sin(t * 0.1) * 6;
        const py = p.y * h + Math.cos(t * 0.08) * 4;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgb(196 160 255 / 0.7)';
    ctx.font = '10px monospace';
    ctx.fillText(`RA ${(t * 0.01 % 24).toFixed(2)}h · DEC +${(42 + Math.sin(t * 0.2) * 3).toFixed(1)}°`, 14, h - 16);
  });
}

/* ── herbarium · 标本图鉴 ── */
function herbariumEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(55);
  const leaves = Array.from({ length: 12 }, () => ({
    x: rng(),
    y: rng(),
    rot: rng() * Math.PI,
    scale: 0.6 + rng() * 0.8,
    ph: rng() * Math.PI * 2,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#e8efe4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgb(45 90 61 / 0.08)';
    for (let x = 0; x < w; x += 24) {
      for (let y = 0; y < h; y += 24) {
        ctx.strokeRect(x + 1, y + 1, 22, 22);
      }
    }
    for (const leaf of leaves) {
      const x = leaf.x * w;
      const y = leaf.y * h + Math.sin(t * 0.3 + leaf.ph) * 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(leaf.rot + Math.sin(t * 0.15 + leaf.ph) * 0.05);
      ctx.scale(leaf.scale, leaf.scale);
      ctx.fillStyle = 'rgb(45 90 61 / 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgb(45 90 61 / 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgb(45 90 61 / 0.5)';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.fillText('Specimen No. ' + (Math.floor(t * 0.1) % 900 + 100), 16, h - 18);
  });
}

/* ── ink · 水墨晕染 ── */
function inkEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(888);
  const drops = Array.from({ length: 8 }, () => ({
    x: rng(),
    y: rng(),
    r: 30 + rng() * 80,
    sp: 0.15 + rng() * 0.2,
    ph: rng() * Math.PI * 2,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#f7f3ea';
    ctx.fillRect(0, 0, w, h);
    for (const d of drops) {
      const cx = d.x * w + Math.sin(t * d.sp + d.ph) * 15;
      const cy = d.y * h + Math.cos(t * d.sp * 0.7 + d.ph) * 10;
      const rad = d.r * (0.9 + Math.sin(t * 0.5 + d.ph) * 0.1);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, 'rgb(26 26 26 / 0.18)');
      g.addColorStop(0.6, 'rgb(26 26 26 / 0.06)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgb(26 26 26 / 0.08)';
    for (let x = w * 0.85; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgb(192 57 43 / 0.75)';
    ctx.beginPath();
    ctx.arc(w - 36, 36, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgb(192 57 43 / 0.4)';
    ctx.font = '9px serif';
    ctx.fillText('印', w - 41, 40);
  });
}

/* ── rpg · 地下城地图 ── */
function rpgEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(777);
  const sparks = Array.from({ length: 30 }, () => ({
    x: rng(),
    y: rng(),
    ph: rng() * Math.PI * 2,
  }));
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1a0f2e');
    g.addColorStop(0.5, '#2d1b4e');
    g.addColorStop(1, '#1a0f2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgb(212 175 55 / 0.12)';
    const tile = 32;
    for (let x = 0; x < w; x += tile) {
      for (let y = 0; y < h; y += tile) {
        ctx.strokeRect(x, y, tile, tile);
      }
    }
    for (const s of sparks) {
      const a = 0.3 + Math.sin(t * 3 + s.ph) * 0.3;
      ctx.fillStyle = `rgb(212 175 55 / ${a})`;
      ctx.fillRect(s.x * w, s.y * h, 2, 2);
    }
    ctx.strokeStyle = 'rgb(212 175 55 / 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.1, h * 0.15, w * 0.35, h * 0.5);
    ctx.fillStyle = 'rgb(212 175 55 / 0.85)';
    ctx.font = '12px Cinzel, serif';
    ctx.fillText(`QUEST · LVL ${Math.floor(t * 0.05) % 50 + 1}`, 20, h - 20);
    const xp = (t * 8) % 100;
    ctx.fillStyle = 'rgb(0 0 0 / 0.4)';
    ctx.fillRect(20, h - 42, 120, 8);
    ctx.fillStyle = 'rgb(212 175 55 / 0.8)';
    ctx.fillRect(20, h - 42, xp * 1.2, 8);
  });
}

/* ── spacecraft · 舷窗地球 ── */
function spacecraftEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    ctx.fillStyle = '#050810';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 97.3 + t * 12) % h;
      ctx.fillStyle = `rgb(255 255 255 / ${0.2 + (i % 5) * 0.1})`;
      ctx.fillRect(x, y, 1, 1);
    }
    const cx = w * 0.62;
    const cy = h * 0.55;
    const earthR = Math.min(w, h) * 0.28;
    const eg = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, 0, cx, cy, earthR);
    eg.addColorStop(0, '#4a90d9');
    eg.addColorStop(0.5, '#2a6090');
    eg.addColorStop(1, '#0a2040');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgb(74 144 217 / 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgb(74 144 217 / 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = t * 0.2 + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * earthR * 1.4, cy + Math.sin(a) * earthR * 1.4);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgb(255 140 60 / 0.9)';
    const blink = Math.sin(t * 4) > 0 ? 1 : 0.3;
    ctx.globalAlpha = blink;
    ctx.fillRect(20, 20, 8, 8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgb(74 144 217 / 0.7)';
    ctx.font = '10px monospace';
    ctx.fillText(`ALT ${Math.floor(400 - earthR + Math.sin(t) * 2)}km · ORBIT STABLE`, 20, h - 16);
  });
}

const ENGINE_MAP: Partial<Record<UiSkinId, EngineFactory>> = {
  pixel: pixelEngine,
  blueprint: blueprintEngine,
  scholar: scholarEngine,
  terminal: terminalEngine,
  crt: crtEngine,
  observatory: observatoryEngine,
  herbarium: herbariumEngine,
  ink: inkEngine,
  rpg: rpgEngine,
  spacecraft: spacecraftEngine,
};

export function startSkinWallpaperEngine(
  skinId: UiSkinId,
  canvas: HTMLCanvasElement,
): SkinWallpaperEngine | null {
  const factory = ENGINE_MAP[skinId];
  if (!factory) return null;
  return factory(canvas);
}

export function hasSkinCanvasEngine(skinId: UiSkinId): boolean {
  return skinId === 'hud' || skinId in ENGINE_MAP;
}
