/** HUD 壁纸 · 鼠标视差 + 信号干扰状态（全局单例） */

export type ParallaxOffset = { x: number; y: number; nx: number; ny: number };

export type GlitchState = {
  active: boolean;
  strength: number;
  offsetX: number;
  bandY: number;
  bandH: number;
  seed: number;
};

const target = { nx: 0, ny: 0 };
const current = { nx: 0, ny: 0 };

let bound = false;
let reducedMotion = false;
let onMove: ((e: PointerEvent) => void) | null = null;
let onLeave: (() => void) | null = null;

const glitch: GlitchState = {
  active: false,
  strength: 0,
  offsetX: 0,
  bandY: 0,
  bandH: 0,
  seed: 0,
};
let glitchLife = 0;
let glitchMax = 0;
let nextGlitch = 6 + Math.random() * 10;

export function setHudWallpaperReducedMotion(value: boolean) {
  reducedMotion = value;
}

export function bindHudWallpaperInput(): () => void {
  if (bound) return unbindHudWallpaperInput;

  onMove = (e: PointerEvent) => {
    const ww = Math.max(window.innerWidth, 1);
    const wh = Math.max(window.innerHeight, 1);
    target.nx = (e.clientX / ww) * 2 - 1;
    target.ny = (e.clientY / wh) * 2 - 1;
  };
  onLeave = () => {
    target.nx = 0;
    target.ny = 0;
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  bound = true;

  return unbindHudWallpaperInput;
}

export function unbindHudWallpaperInput() {
  if (onMove) window.removeEventListener('pointermove', onMove);
  if (onLeave) document.documentElement.removeEventListener('mouseleave', onLeave);
  onMove = null;
  onLeave = null;
  bound = false;
  target.nx = 0;
  target.ny = 0;
  current.nx = 0;
  current.ny = 0;
}

export function tickParallax(strength = 1): ParallaxOffset {
  current.nx += (target.nx - current.nx) * 0.07;
  current.ny += (target.ny - current.ny) * 0.07;
  return {
    nx: current.nx,
    ny: current.ny,
    x: current.nx * 32 * strength,
    y: current.ny * 26 * strength,
  };
}

export function tickGlitch(dt: number): GlitchState {
  if (reducedMotion) {
    glitch.active = false;
    glitch.strength = 0;
    return glitch;
  }

  if (glitch.active) {
    glitchLife -= dt;
    glitch.strength = Math.max(0, glitchLife / glitchMax);
    if (glitchLife <= 0) {
      glitch.active = false;
      glitch.strength = 0;
      nextGlitch = 7 + Math.random() * 16;
    }
    return glitch;
  }

  nextGlitch -= dt;
  if (nextGlitch <= 0) {
    glitch.active = true;
    glitchMax = 0.12 + Math.random() * 0.35;
    glitchLife = glitchMax;
    glitch.strength = 1;
    glitch.offsetX = (Math.random() - 0.5) * 24;
    glitch.bandY = Math.random() * 0.75 + 0.08;
    glitch.bandH = 0.04 + Math.random() * 0.14;
    glitch.seed = Math.random() * 1000;
    if (Math.random() > 0.55) {
      nextGlitch = 0.4 + Math.random() * 0.8;
    }
  }

  return glitch;
}
