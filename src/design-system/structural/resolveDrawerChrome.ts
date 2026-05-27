import type { Component } from 'svelte';
import type { StructuralSkinId } from './registry';
import GenericDrawerChrome from './settings/GenericDrawerChrome.svelte';
import BlueprintDrawerChrome from './settings/BlueprintDrawerChrome.svelte';
import ScholarDrawerChrome from './settings/ScholarDrawerChrome.svelte';
import TerminalDrawerChrome from './settings/TerminalDrawerChrome.svelte';
import CrtDrawerChrome from './settings/CrtDrawerChrome.svelte';
import ObservatoryDrawerChrome from './settings/ObservatoryDrawerChrome.svelte';
import HerbariumDrawerChrome from './settings/HerbariumDrawerChrome.svelte';
import InkDrawerChrome from './settings/InkDrawerChrome.svelte';
import RpgDrawerChrome from './settings/RpgDrawerChrome.svelte';
import SpacecraftDrawerChrome from './settings/SpacecraftDrawerChrome.svelte';

export type DrawerChromeProps = {
  title: string;
  pane?: import('./primitives/controls/types').DrawerPaneId;
  showBack?: boolean;
  backLabel?: string;
  closeLabel?: string;
  onBack?: () => void;
  onClose?: () => void;
};

const CHROMES: Partial<Record<StructuralSkinId, Component<DrawerChromeProps>>> = {
  blueprint: BlueprintDrawerChrome,
  scholar: ScholarDrawerChrome,
  terminal: TerminalDrawerChrome,
  crt: CrtDrawerChrome,
  observatory: ObservatoryDrawerChrome,
  herbarium: HerbariumDrawerChrome,
  ink: InkDrawerChrome,
  rpg: RpgDrawerChrome,
  spacecraft: SpacecraftDrawerChrome,
};

export function getDrawerChromeComponent(skin: StructuralSkinId): Component<DrawerChromeProps> {
  return CHROMES[skin] ?? GenericDrawerChrome;
}
