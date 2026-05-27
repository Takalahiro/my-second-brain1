import type { UiSkinId } from '../../features/ui/types';
import { createSkinWallpaperEngine, isWallpaperDark, mulberry32, type SkinWallpaperEngine } from './engine-base';

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
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#0e3a5f' : '#e8f2fa';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = dark ? 'rgb(255 255 255 / 0.18)' : 'rgb(14 58 95 / 0.14)';
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
    ctx.strokeStyle = dark ? 'rgb(255 255 255 / 0.08)' : 'rgb(14 58 95 / 0.06)';
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
    ctx.fillStyle = dark ? '#f4ecd8' : '#0e3a5f';
    ctx.font = '11px monospace';
    ctx.fillText(`${(240 / 48).toFixed(1)}m × ${(160 / 48).toFixed(1)}m`, cx - 110, cy + 90);
    ctx.fillStyle = dark ? 'rgb(244 236 216 / 0.7)' : 'rgb(14 58 95 / 0.55)';
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
    const dark = isWallpaperDark();
    const g = ctx.createLinearGradient(0, 0, w, h);
    if (dark) {
      g.addColorStop(0, '#2c1810');
      g.addColorStop(0.5, '#241610');
      g.addColorStop(1, '#1a1008');
    } else {
      g.addColorStop(0, '#f4ecd8');
      g.addColorStop(0.5, '#ebe3cf');
      g.addColorStop(1, '#ddd4bc');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = dark ? 'rgb(201 132 74 / 0.05)' : 'rgb(139 90 43 / 0.06)';
    ctx.beginPath();
    ctx.ellipse(w * 0.72, h * 0.78, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const m of motes) {
      const x = m.x * w + Math.sin(t * m.sp + m.ph) * 20;
      const y = (m.y * h + t * 8 * m.sp) % h;
      ctx.fillStyle = dark
        ? `rgb(232 220 200 / ${0.04 + m.r * 0.03})`
        : `rgb(100 70 40 / ${0.08 + m.r * 0.04})`;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (dark) {
      const moon = ctx.createRadialGradient(w * 0.88, h * 0.12, 0, w * 0.88, h * 0.12, 100);
      moon.addColorStop(0, 'rgb(200 210 230 / 0.12)');
      moon.addColorStop(1, 'transparent');
      ctx.fillStyle = moon;
      ctx.fillRect(0, 0, w, h);
    } else {
      const flicker = 0.85 + Math.sin(t * 3.7) * 0.08 + Math.sin(t * 11.3) * 0.04;
      const cg = ctx.createRadialGradient(w * 0.12, h * 0.88, 0, w * 0.12, h * 0.88, 120);
      cg.addColorStop(0, `rgb(255 180 80 / ${0.25 * flicker})`);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.strokeStyle = dark ? 'rgb(232 220 200 / 0.08)' : 'rgb(80 50 30 / 0.15)';
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
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#0a0a0a' : '#f0faf2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = dark ? 'rgb(189 147 249 / 0.04)' : 'rgb(26 153 64 / 0.04)';
    ctx.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    ctx.font = `${Math.floor(ch * 0.85)}px monospace`;
    const fg = dark ? '189 147 249' : '26 153 64';
    for (let i = 0; i < cols; i++) {
      const col = colData[i];
      col.y += col.speed * dt;
      if (col.y > rows + 5) col.y = -5;
      for (let j = 0; j < rows; j++) {
        const row = Math.floor(col.y + j) % rows;
        const alpha = Math.max(0, 1 - j / rows) * (dark ? 0.65 : 0.45);
        if (Math.random() < 0.002) {
          col.chars[row] = String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }
        ctx.fillStyle = `rgb(${fg} / ${alpha})`;
        ctx.fillText(col.chars[row], i * cw + 2, (j + 1) * ch);
      }
    }
    ctx.fillStyle = dark ? 'rgb(255 121 198 / 0.9)' : 'rgb(26 153 64 / 0.85)';
    ctx.fillText('user@msb:~$ _', 12, h - 20);
    const scan = (t * 40) % h;
    ctx.fillStyle = dark ? 'rgb(189 147 249 / 0.03)' : 'rgb(26 153 64 / 0.03)';
    ctx.fillRect(0, scan, w, 3);
  });
}

/* ── crt · 琥珀扫描线 ── */
function crtEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  const rng = mulberry32(99);
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#1a1200' : '#faf0dc';
    ctx.fillRect(0, 0, w, h);
    const dust = dark ? '255 176 0' : '184 120 0';
    ctx.fillStyle = `rgb(${dust} / 0.08)`;
    for (let i = 0; i < 400; i++) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.fillRect(x, y, 1, 1);
    }
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = dark
        ? y % 6 === 0 ? 'rgb(0 0 0 / 0.25)' : 'transparent'
        : y % 6 === 0 ? 'rgb(184 120 0 / 0.06)' : 'transparent';
      ctx.fillRect(0, y, w, 1);
    }
    const scanY = (t * 90) % (h + 40) - 20;
    ctx.fillStyle = `rgb(${dust} / 0.12)`;
    ctx.fillRect(0, scanY, w, 8);
    ctx.fillStyle = dark ? 'rgb(255 176 0 / 0.85)' : 'rgb(128 88 0 / 0.85)';
    ctx.font = '14px monospace';
    ctx.fillText('> SYSTEM READY · MEM OK', 20, 40);
    if (dark && Math.sin(t * 20) > 0.95) {
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
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#0a0e27' : '#dce4f0';
    ctx.fillRect(0, 0, w, h);
    const mg = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.6);
    if (dark) {
      mg.addColorStop(0, 'rgb(60 40 100 / 0.25)');
      mg.addColorStop(1, 'transparent');
    } else {
      mg.addColorStop(0, 'rgb(255 255 255 / 0.45)');
      mg.addColorStop(1, 'transparent');
    }
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, w, h);
    for (const s of stars) {
      const tw = s.br * (0.6 + Math.sin(t * 2 + s.ph) * 0.4);
      if (dark) {
        ctx.fillStyle = `rgb(232 196 71 / ${tw})`;
      } else {
        ctx.fillStyle = `rgb(26 40 72 / ${tw * 0.35})`;
      }
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark ? 'rgb(232 196 71 / 0.35)' : 'rgb(26 40 72 / 0.2)';
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
    ctx.fillStyle = dark ? 'rgb(196 160 255 / 0.7)' : 'rgb(26 40 72 / 0.55)';
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
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#1a2e1a' : '#e8efe4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = dark ? 'rgb(200 224 200 / 0.06)' : 'rgb(45 90 61 / 0.08)';
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
      ctx.fillStyle = dark ? 'rgb(200 224 200 / 0.08)' : 'rgb(45 90 61 / 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = dark ? 'rgb(200 224 200 / 0.18)' : 'rgb(45 90 61 / 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = dark ? 'rgb(200 224 200 / 0.45)' : 'rgb(45 90 61 / 0.5)';
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
    const dark = isWallpaperDark();
    ctx.fillStyle = dark ? '#141414' : '#f7f3ea';
    ctx.fillRect(0, 0, w, h);
    for (const d of drops) {
      const cx = d.x * w + Math.sin(t * d.sp + d.ph) * 15;
      const cy = d.y * h + Math.cos(t * d.sp * 0.7 + d.ph) * 10;
      const rad = d.r * (0.9 + Math.sin(t * 0.5 + d.ph) * 0.1);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      if (dark) {
        g.addColorStop(0, 'rgb(232 224 212 / 0.14)');
        g.addColorStop(0.6, 'rgb(232 224 212 / 0.05)');
      } else {
        g.addColorStop(0, 'rgb(26 26 26 / 0.18)');
        g.addColorStop(0.6, 'rgb(26 26 26 / 0.06)');
      }
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = dark ? 'rgb(232 224 212 / 0.06)' : 'rgb(26 26 26 / 0.08)';
    for (let x = w * 0.85; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = dark ? 'rgb(231 76 60 / 0.85)' : 'rgb(192 57 43 / 0.75)';
    ctx.beginPath();
    ctx.arc(w - 36, 36, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dark ? 'rgb(255 255 255 / 0.75)' : 'rgb(192 57 43 / 0.4)';
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
    const dark = isWallpaperDark();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    if (dark) {
      g.addColorStop(0, '#1a0f2e');
      g.addColorStop(0.5, '#2d1b4e');
      g.addColorStop(1, '#1a0f2e');
    } else {
      g.addColorStop(0, '#f4ecfc');
      g.addColorStop(0.5, '#e8dcf8');
      g.addColorStop(1, '#f0e8f8');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const gold = dark ? '212 175 55' : '184 120 0';
    ctx.strokeStyle = `rgb(${gold} / 0.12)`;
    const tile = 32;
    for (let x = 0; x < w; x += tile) {
      for (let y = 0; y < h; y += tile) {
        ctx.strokeRect(x, y, tile, tile);
      }
    }
    for (const s of sparks) {
      const a = 0.3 + Math.sin(t * 3 + s.ph) * 0.3;
      ctx.fillStyle = `rgb(${gold} / ${a})`;
      ctx.fillRect(s.x * w, s.y * h, 2, 2);
    }
    ctx.strokeStyle = `rgb(${gold} / 0.6)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.1, h * 0.15, w * 0.35, h * 0.5);
    ctx.fillStyle = dark ? 'rgb(212 175 55 / 0.85)' : 'rgb(128 88 0 / 0.75)';
    ctx.font = '12px Cinzel, serif';
    ctx.fillText(`QUEST · LVL ${Math.floor(t * 0.05) % 50 + 1}`, 20, h - 20);
    const xp = (t * 8) % 100;
    ctx.fillStyle = dark ? 'rgb(0 0 0 / 0.4)' : 'rgb(255 255 255 / 0.45)';
    ctx.fillRect(20, h - 42, 120, 8);
    ctx.fillStyle = `rgb(${gold} / 0.8)`;
    ctx.fillRect(20, h - 42, xp * 1.2, 8);
  });
}

/* ── spacecraft · 舷窗地球 ── */
function spacecraftEngine(canvas: HTMLCanvasElement): SkinWallpaperEngine {
  return createSkinWallpaperEngine(canvas, (ctx, w, h, t) => {
    const dark = isWallpaperDark();
    if (dark) {
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 100; i++) {
        const x = (i * 137.5) % w;
        const y = (i * 97.3 + t * 12) % h;
        ctx.fillStyle = `rgb(255 255 255 / ${0.2 + (i % 5) * 0.1})`;
        ctx.fillRect(x, y, 1, 1);
      }
    } else {
      const cabin = ctx.createLinearGradient(0, 0, w, h);
      cabin.addColorStop(0, '#e8f0f8');
      cabin.addColorStop(0.55, '#dce8f4');
      cabin.addColorStop(1, '#c8d8e8');
      ctx.fillStyle = cabin;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgb(104 136 168 / 0.08)';
      for (let x = 0; x < w; x += 48) {
        ctx.fillRect(x, 0, 1, h);
      }
      for (let y = 0; y < h; y += 48) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.fillStyle = 'rgb(255 255 255 / 0.35)';
      ctx.fillRect(0, 0, w, h * 0.08);
    }
    const cx = dark ? w * 0.62 : w * 0.72;
    const cy = dark ? h * 0.55 : h * 0.48;
    const earthR = Math.min(w, h) * (dark ? 0.28 : 0.22);
    const eg = ctx.createRadialGradient(cx - earthR * 0.3, cy - earthR * 0.3, 0, cx, cy, earthR);
    eg.addColorStop(0, dark ? '#4a90d9' : '#6aacf0');
    eg.addColorStop(0.5, dark ? '#2a6090' : '#4888c0');
    eg.addColorStop(1, dark ? '#0a2040' : '#2868a0');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark ? 'rgb(74 144 217 / 0.4)' : 'rgb(104 136 168 / 0.45)';
    ctx.lineWidth = dark ? 2 : 3;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + (dark ? 8 : 12), 0, Math.PI * 2);
    ctx.stroke();
    if (!dark) {
      ctx.strokeStyle = 'rgb(104 136 168 / 0.25)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, earthR + 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = dark ? 'rgb(74 144 217 / 0.25)' : 'rgb(104 136 168 / 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = t * 0.2 + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * earthR * 1.4, cy + Math.sin(a) * earthR * 1.4);
      ctx.stroke();
    }
    ctx.fillStyle = dark ? 'rgb(255 140 60 / 0.9)' : 'rgb(216 136 0 / 0.85)';
    const blink = Math.sin(t * 4) > 0 ? 1 : 0.3;
    ctx.globalAlpha = blink;
    ctx.fillRect(20, 20, 8, 8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = dark ? 'rgb(74 144 217 / 0.7)' : 'rgb(40 80 128 / 0.65)';
    ctx.font = '10px monospace';
    ctx.fillText(
      dark
        ? `ALT ${Math.floor(400 - earthR + Math.sin(t) * 2)}km · ORBIT STABLE`
        : `CABIN PRESS OK · VIEWPORT ${Math.floor(18 + Math.sin(t) * 0.5)}°C`,
      20,
      h - 16,
    );
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
