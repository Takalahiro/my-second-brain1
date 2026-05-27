import type { Component } from 'svelte';

type Loader = () => Promise<{ default: Component }>;

/** pixel 风格独立小组件加载表 — 禁止回退通用 WindowChrome 组件 */
export const pixelWidgetLoaders = {
  background: () => import('./widgets/PixelBackgroundOverlay.svelte'),
  clock: () => import('./widgets/PixelClockWidget.svelte'),
  music: () => import('./widgets/PixelMusicWidget.svelte'),
  notes: () => import('./widgets/PixelNotesWidget.svelte'),
  todo: () => import('./widgets/PixelTodoWidget.svelte'),
  calendar: () => import('./widgets/PixelCalendarWidget.svelte'),
  pomodoro: () => import('./widgets/PixelPomodoroWidget.svelte'),
  weather: () => import('./widgets/PixelWeatherWidget.svelte'),
  stats: () => import('./widgets/PixelStatsWidget.svelte'),
  world: () => import('./widgets/PixelWorldClockWidget.svelte'),
  whitenoise: () => import('./widgets/PixelWhiteNoiseWidget.svelte'),
  network: () => import('./widgets/PixelNetworkWidget.svelte'),
} satisfies Record<string, Loader>;

export type PixelWidgetKey = keyof typeof pixelWidgetLoaders;

export function isPixelWidgetKey(key: string): key is PixelWidgetKey {
  return key in pixelWidgetLoaders;
}
