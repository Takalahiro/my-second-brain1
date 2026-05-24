import type { UiSkinId } from '../features/ui/types';
import { computeTelemetry } from './hud-wallpaper-engine';
import {
  buildMissionStatusLine,
  formatMissionElapsed,
  jitterSignalBars,
  signalBarsText,
} from './hud-mission-ui';

export function buildSkinStatusLine(skin: UiSkinId, nowMs: number, missionStart: number): string {
  const elapsed = formatMissionElapsed(nowMs - missionStart);
  const tel = computeTelemetry(new Date(nowMs), missionStart);
  const sig = signalBarsText(jitterSignalBars());

  switch (skin) {
    case 'hud':
      return buildMissionStatusLine(elapsed, sig, tel.raLabel, tel.decLabel);
    case 'blueprint':
      return `[ ${elapsed.replace('T+', 'DRAFT')} / SCALE 1:50 / SHEET A1 / REV ${tel.raLabel} ]`;
    case 'scholar':
      return `[ ${elapsed.replace('T+', 'Ink')} / Folio XII / Margin notes / ${tel.decLabel} ]`;
    case 'terminal':
      return `[ ${elapsed.replace('T+', 'UP')} / load 0.${Math.floor((nowMs / 1000) % 99)} / ${sig} / zsh ]`;
    case 'crt':
      return `[ MEM 640K OK / ${elapsed} / ${sig.replace('SIG', 'LINK')} / READY ]`;
    case 'observatory':
      return `[ LST ${tel.raLabel} / RA ${tel.raLabel} · DEC ${tel.decLabel} / ${sig} ]`;
    case 'herbarium':
      return `[ Specimen №${Math.floor((nowMs / 1000) % 900) + 100} / ${sig} / Field log / ${tel.decLabel} ]`;
    case 'ink':
      return `[ 卷 ${tel.raLabel} / 章 ${tel.decLabel} / ${elapsed.replace('T+', '刻')} / 朱批 ]`;
    case 'rpg':
      return `[ LVL ${Math.min(99, Math.floor((nowMs - missionStart) / 60000) + 1)} / ${elapsed.replace('T+', 'XP')} / ${sig} / QUEST ]`;
    case 'spacecraft':
      return `[ ${elapsed} / PRESS NOM / O₂ 98% / ${tel.raLabel} ]`;
    case 'pixel':
      return `[ ${elapsed.replace('T+', 'PLAY')} / ${sig} / STAGE 1-1 / COIN×${Math.floor((nowMs / 1000) % 99)} ]`;
    default:
      return `[ ${elapsed} / ${sig} ]`;
  }
}
