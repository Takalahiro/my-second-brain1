import type { UiSkinId } from './types';

const DIM_SELECTOR =
  'button, a, input, textarea, select, .floating-widget, .mac-menu-bar, .mac-settings, .glass-container, .pixel-card, .site-nav-shell, .ui-skin-card, .notes-tool-drawer';

let activeSkin: UiSkinId | null = null;
let tipEl: HTMLDivElement | null = null;
let moveHandler: ((e: MouseEvent) => void) | null = null;
let leaveHandler: (() => void) | null = null;

function ensureTip(): HTMLDivElement {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'blueprint-dim-tip';
    tipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

function hideTip() {
  tipEl?.classList.remove('is-visible');
}

function showTip(label: string, x: number, y: number) {
  const tip = ensureTip();
  tip.textContent = label;
  tip.style.left = `${Math.min(x + 14, window.innerWidth - 120)}px`;
  tip.style.top = `${Math.max(y - 28, 8)}px`;
  tip.classList.add('is-visible');
}

function initBlueprintDimensions() {
  moveHandler = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest(DIM_SELECTOR) as HTMLElement | null;
    if (!el) {
      hideTip();
      return;
    }
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    showTip(`↔ ${w}px  ↕ ${h}px`, e.clientX, e.clientY);
  };
  leaveHandler = () => hideTip();
  document.addEventListener('mousemove', moveHandler, { passive: true });
  document.addEventListener('mouseleave', leaveHandler);
}

export function initSkinEffects(id: UiSkinId): void {
  if (typeof document === 'undefined') return;
  activeSkin = id;
  document.documentElement.dataset.skinFx = id;
  if (id === 'blueprint') initBlueprintDimensions();
}

export function teardownSkinEffects(): void {
  if (moveHandler) {
    document.removeEventListener('mousemove', moveHandler);
    moveHandler = null;
  }
  if (leaveHandler) {
    document.removeEventListener('mouseleave', leaveHandler);
    leaveHandler = null;
  }
  hideTip();
  tipEl?.remove();
  tipEl = null;
  if (typeof document !== 'undefined') {
    delete document.documentElement.dataset.skinFx;
  }
  activeSkin = null;
}

export function getActiveSkinEffects(): UiSkinId | null {
  return activeSkin;
}
