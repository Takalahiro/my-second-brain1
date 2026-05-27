import type { Component } from 'svelte';

type Loader = () => Promise<{ default: Component }>;

/** 结构换皮小组件 — 与 pixel 同键集，壳层随 data-ui 变化 */
export const structuralWidgetLoaders = {
  background: () => import('./widgets/StructuralBackgroundOverlay.svelte'),
  clock: () => import('./widgets/StructuralClockWidget.svelte'),
  music: () => import('./widgets/StructuralMusicWidget.svelte'),
  notes: () => import('./widgets/StructuralNotesWidget.svelte'),
  todo: () => import('./widgets/StructuralTodoWidget.svelte'),
  calendar: () => import('./widgets/StructuralCalendarWidget.svelte'),
  pomodoro: () => import('./widgets/StructuralPomodoroWidget.svelte'),
  weather: () => import('./widgets/StructuralWeatherWidget.svelte'),
  stats: () => import('./widgets/StructuralStatsWidget.svelte'),
  world: () => import('./widgets/StructuralWorldClockWidget.svelte'),
  whitenoise: () => import('./widgets/StructuralWhiteNoiseWidget.svelte'),
  network: () => import('./widgets/StructuralNetworkWidget.svelte'),
  graph: () => import('./widgets/StructuralGraphWidget.svelte'),
  calculator: () => import('./widgets/StructuralCalculatorWidget.svelte'),
  python: () => import('./widgets/StructuralPythonWidget.svelte'),
  whiteboard: () => import('./widgets/StructuralWhiteboardWidget.svelte'),
  territory: () => import('./widgets/StructuralTerritoryWidget.svelte'),
} satisfies Record<string, Loader>;

export type StructuralWidgetKey = keyof typeof structuralWidgetLoaders;

export function isStructuralWidgetKey(key: string): key is StructuralWidgetKey {
  return key in structuralWidgetLoaders;
}
