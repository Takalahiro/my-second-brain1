import type { Component } from 'svelte';
import type { StructuralSkinId } from './registry';
import GenericFloatingShell from './shells/GenericFloatingShell.svelte';
import BlueprintFloatingShell from './shells/blueprint/BlueprintFloatingShell.svelte';
import ScholarFloatingShell from './shells/scholar/ScholarFloatingShell.svelte';
import TerminalFloatingShell from './shells/terminal/TerminalFloatingShell.svelte';
import CrtFloatingShell from './shells/crt/CrtFloatingShell.svelte';
import ObservatoryFloatingShell from './shells/observatory/ObservatoryFloatingShell.svelte';
import HerbariumFloatingShell from './shells/herbarium/HerbariumFloatingShell.svelte';
import InkFloatingShell from './shells/ink/InkFloatingShell.svelte';
import RpgFloatingShell from './shells/rpg/RpgFloatingShell.svelte';
import SpacecraftFloatingShell from './shells/spacecraft/SpacecraftFloatingShell.svelte';

/** 已有原生结构设计的皮肤 */
export const NATIVE_SHELL_SKINS = new Set<StructuralSkinId>([
  'blueprint',
  'scholar',
  'terminal',
  'crt',
  'observatory',
  'herbarium',
  'ink',
  'rpg',
  'spacecraft',
]);

export type StructuralShellProps = {
  layoutKey: string;
  title: string;
  subtitle?: string;
  defaultW?: number;
  defaultH?: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  defaultAlpha?: number;
  compact?: boolean;
  onClose?: () => void;
  children?: import('svelte').Snippet;
  settings?: import('svelte').Snippet;
};

const SHELLS: Partial<Record<StructuralSkinId, Component<StructuralShellProps>>> = {
  blueprint: BlueprintFloatingShell,
  scholar: ScholarFloatingShell,
  terminal: TerminalFloatingShell,
  crt: CrtFloatingShell,
  observatory: ObservatoryFloatingShell,
  herbarium: HerbariumFloatingShell,
  ink: InkFloatingShell,
  rpg: RpgFloatingShell,
  spacecraft: SpacecraftFloatingShell,
};

export function getStructuralShellComponent(skin: StructuralSkinId): Component<StructuralShellProps> {
  return SHELLS[skin] ?? GenericFloatingShell;
}
